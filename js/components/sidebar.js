import { getSession } from "../utils/session.js";

/**
 * Génère le menu latéral gauche (Sidebar) de manière dynamique.
 * Injecte les onglets spécifiques requis pour l'Admin, l'Artisan, le Client et le Livreur.
 */

export function renderSidebar() {
  const user = getSession();
  const role = user?.role || "";

  // 1. Définition des onglets par acteur selon votre db.json épuré
  let onglets = [];

  if (role === "admin") {
    onglets = [
      { page: "admin/dashboard", label: "Dashboard", icon: "fa-chart-pie" },
      { page: "admin/utilisateurs", label: "Utilisateurs", icon: "fa-users-gear" },
      { page: "admin/artisans", label: "Artisans", icon: "fa-id-card-clip" },
      { page: "admin/produits", label: "Produits", icon: "fa-couch" },
      { page: "admin/categories", label: "Catégories", icon: "fa-tags" },
      { page: "admin/commandes", label: "Commandes", icon: "fa-boxes-packing" },
      { page: "admin/livraison", label: "Livraison", icon: "fa-user-truck" },
      { page: "admin/sur-mesure", label: "Fabrication sur mesure", icon: "fa-compass-drafting" },
      { page: "admin/avis", label: "Avis", icon: "fa-star" }
    ];
  } else if (role === "artisan") {
    onglets = [
      { page: "artisan/dashboard", label: "Dashboard", icon: "fa-chart-pie" },
      { page: "artisan/produits", label: "Mes Produits", icon: "fa-couch" },
      { page: "artisan/commandes", label: "Mes Commandes", icon: "fa-basket-shopping" },
      { page: "artisan/sur-mesure", label: "Fabrication sur mesure", icon: "fa-compass-drafting" },
      { page: "artisan/propositions", label: "Mes Propositions", icon: "fa-file-invoice-dollar" },
      { page: "artisan/avis", label: "Avis Reçus", icon: "fa-star-half-stroke" }
    ];
  } else if (role === "client") {
    onglets = [
      { page: "client/dashboard", label: "Dashboard", icon: "fa-chart-pie" },
      { page: "client/commandes", label: "Mes Commandes", icon: "fa-bag-shopping" },
      { page: "client/livraisons", label: "Suivi des Livraisons", icon: "fa-truck-ramp-box" },
      { page: "client/propositions", label: "Propositions des artisans", icon: "fa-tags" },
      { page: "client/favoris", label: "Mes Favoris", icon: "fa-heart" },
      { page: "client/avis", label: "Mes Avis", icon: "fa-comment-dots" }
    ];
  } else if (role === "livreur") {
    onglets = [
      { page: "livreur/dashboard", label: "Dashboard", icon: "fa-chart-pie" },
      { page: "livreur/mes-livraisons", label: "Mes Livraisons", icon: "fa-truck-loading" },
      { page: "livreur/suivi", label: "Suivi des livraisons", icon: "fa-map-location-dot" },
      { page: "livreur/historique", label: "Historique", icon: "fa-clock-rotate-left" }
    ];
  }

  // Détection de la page SPA active pour la mise en surbrillance
  const pageActuelle = window.location.hash.replace("#", "") || `${role}/dashboard`;

  // 2. Génération du HTML des boutons (Recentrés avec mx-auto pour des marges Gauche/Droite égales)
  const itemsHtml = onglets.map(o => {
    const estActif = pageActuelle === o.page || (pageActuelle === "login" && o.page.includes("dashboard"));
    
    // w-[88%] mx-auto permet de centrer parfaitement l'onglet dans la sidebar blanche
    const classeBouton = estActif 
      ? "flex items-center gap-3 w-[88%] mx-auto rounded-2xl px-4 py-3 text-left text-xs font-black bg-[#0B132B] text-white shadow-md animate-in fade-in duration-200"
      : "flex items-center gap-3 w-[88%] mx-auto rounded-2xl px-4 py-3 text-left text-xs font-extrabold text-slate-950 transition duration-150 hover:bg-slate-50 hover:text-slate-950";

    const classeIcone = estActif ? "text-white" : "text-slate-950";

    return `
      <button class="${classeBouton}" data-page="${o.page}">
        <i class="fa-solid ${o.icon} w-5 text-center text-sm ${classeIcone}"></i>
        <span>${o.label}</span>
      </button>
    `;
  }).join("");

  // 3. Structure globale : top-16 abaisse la barre sous le nav, rounded-tr-[2.5rem] dessine l'arrondi visible
  return `
    <aside id="sidebar" class="fixed top-16 bottom-0 left-0 z-40 w-72 bg-white pt-6 border-r border-[#0B132B] flex flex-col justify-between shadow-sm rounded-tr-[2rem]">
      
      <!-- Liste des onglets centrés en haut -->
      <div class="overflow-y-auto pr-0 flex-1">
        <nav class="grid gap-1">
          ${itemsHtml}
        </nav>
      </div>

      <!-- Bouton Déconnexion centré tout en bas -->
      <div class="p-4 border-t border-slate-50 flex justify-center">
        <button id="logoutBtn" class="flex items-center gap-3 w-[88%] mx-auto rounded-2xl px-4 py-3 text-left text-xs font-extrabold transition duration-150 hover:bg-rose-50 hover:text-rose-600">
          <i class="fa-solid fa-arrow-right-from-bracket w-5 text-center text-sm"></i>
          <span>Déconnexion</span>
        </button>
      </div>

    </aside>
  `;
}



