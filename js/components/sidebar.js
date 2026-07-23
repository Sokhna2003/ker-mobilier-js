import { getSession } from "../utils/session.js";
import { escapeHtml } from "../utils/html.js";

/**
 * Génère le menu latéral gauche (Sidebar) dynamique.
 * Intègre le bloc Profil utilisateur tout en haut sur Mobile uniquement.
 */
export function renderSidebar() {
  const user = getSession();
  const role = user?.role || "";

  // 1. Définition des listes d'onglets métiers
  let onglets = [];

  if (role === "admin") {
    onglets = [
      { page: "admin/dashboard", label: "Dashboard", icon: "fa-chart-pie" },
      { page: "admin/utilisateurs", label: "Utilisateurs", icon: "fa-users-gear" },
      { page: "admin/produits", label: "Produits", icon: "fa-couch" },
      { page: "admin/categories", label: "Catégories", icon: "fa-tags" },
      { page: "admin/commandes", label: "Commandes", icon: "fa-boxes-packing" },
      { page: "admin/livraison", label: "Livraison", icon: "fa-user-truck" },
      { page: "admin/sur-mesure", label: "Fabrication sur mesure", icon: "fa-compass-drafting" },
      { page: "admin/avis", label: "Avis", icon: "fa-star" },
      { page: "admin/corbeille", label: "Corbeille", icon: "fa-trash-can" }
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

  const pageActuelle = window.location.hash.replace("#", "") || `${role}/dashboard`;

  // 2. Rendu des boutons de navigation (Parfaitement centrés avec mx-auto)
  const itemsHtml = onglets.map(o => {
    const estActif = pageActuelle === o.page || (pageActuelle === "login" && o.page.includes("dashboard"));

    const classeBouton = estActif
      ? "flex items-center gap-3 w-[88%] mx-auto rounded-2xl px-4 py-3 text-left text-xs font-black bg-[#0B132B] text-white shadow-md"
      : "flex items-center gap-3 w-[88%] mx-auto rounded-2xl px-4 py-3 text-left text-xs font-black text-slate-950 transition duration-150 hover:bg-slate-50";

    const classeIcone = estActif ? "text-white" : "text-slate-950";

    return `
      <button class="${classeBouton}" data-page="${o.page}">
        <i class="fa-solid ${o.icon} w-5 text-center text-sm ${classeIcone}"></i>
        <span>${o.label}</span>
      </button>
    `;
  }).join("");

  // Bloc Profil Mobile haut de Sidebar
  const prenomAafficher = user?.prenom || user?.atelier || "Utilisateur";
  let roleLibelle = "Client";
  if (role === "admin") roleLibelle = "Admin";
  if (role === "artisan") roleLibelle = "Artisan";
  if (role === "livreur") roleLibelle = "Livreur";

  const profilMobileHtml = `
    <div class="flex items-center gap-3 bg-slate-50 p-3 mx-4 mb-4 rounded-2xl border border-slate-100 lg:hidden">
      <div class="h-9 w-9 rounded-full bg-[#0B132B] text-white flex items-center justify-center font-bold shadow-inner">
        <i class="fa-solid fa-user text-xs"></i>
      </div>
      <div class="text-left leading-none">
        <p class="text-xs font-black text-slate-950">${escapeHtml(prenomAafficher)}</p>
        <p class="text-[10px] font-black text-amber-700 mt-1 uppercase tracking-wider">${escapeHtml(roleLibelle)}</p>
      </div>
    </div>
  `;

  // 3. RETOUR STRUCTUREL RESPONSIVE (Abaissement top-16, caché à gauche sur mobile -translate-x-full)
  return `
    <aside id="sidebar" class="fixed top-16 bottom-0 left-0 z-40 w-72 bg-white pt-5 border-r border-[#0B132B] flex flex-col justify-between shadow-xl rounded-tr-[2rem] transform -translate-x-full transition-transform duration-200 lg:translate-x-0">

      <!-- Partie haute : Profil mobile + Liste des menus -->
      <div class="overflow-y-auto pr-0 flex-1">
        ${profilMobileHtml}
        <nav class="grid gap-1">
          ${itemsHtml}
        </nav>
      </div>

      <!-- Partie basse : Déconnexion -->
      <div class="p-4 border-t border-slate-50 flex justify-center">
        <button id="logoutBtn" class="flex items-center gap-3 w-[88%] mx-auto rounded-2xl px-4 py-3 text-left text-xs font-black text-slate-950 transition duration-150 hover:bg-rose-50 hover:text-rose-600">
          <i class="fa-solid fa-arrow-right-from-bracket w-5 text-center text-sm text-slate-950"></i>
          <span>Déconnexion</span>
        </button>
      </div>

    </aside>
  `;
}