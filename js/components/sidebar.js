// components/sidebar.js
import { getSession, clearSession } from "../utils/session.js";
import { escapeHtml } from "../utils/html.js";

/**
 * Génère le menu latéral pour les rôles admin / artisan.
 * (Caché automatiquement par app.js pour les clients non connectés.)
 */
export function renderSidebar() {
  const user = getSession();
  const role = user?.role;

  const linksParRole = {
    admin: [
      { label: "Tableau de bord", icon: "fa-gauge", page: "admin/dashboard" },
      { label: "Produits à valider", icon: "fa-clipboard-check", page: "admin/produits" },
      { label: "Artisans", icon: "fa-user-gear", page: "admin/artisans" },
      { label: "Commandes", icon: "fa-box", page: "admin/commandes" },
      { label: "Livreurs", icon: "fa-truck", page: "admin/livreurs" }
    ],
    artisan: [
      { label: "Mes produits", icon: "fa-chair", page: "artisan/produits" },
      { label: "Mes commandes", icon: "fa-box", page: "artisan/commandes" },
      { label: "Demandes sur mesure", icon: "fa-ruler-combined", page: "artisan/demandes" }
    ]
  };

  const liens = linksParRole[role] || [];

  const liensHtml = liens.map(l => `
    <a href="#" data-page="${l.page}" class="sidebar-link flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold text-slate-300 transition hover:bg-white/5 hover:text-white">
      <i class="fa-solid ${l.icon} w-4 text-center"></i>
      <span>${escapeHtml(l.label)}</span>
    </a>
  `).join("");

  return `
    <aside class="fixed inset-y-0 left-0 z-30 hidden w-72 flex-col bg-slate-950 p-5 lg:flex">
      <div class="mb-8 flex items-center gap-2 px-2">
        <span class="text-lg font-black text-white">Kër Mobilier</span>
      </div>
      <nav class="flex flex-1 flex-col gap-1">
        ${liensHtml}
      </nav>
      <button id="sidebarLogoutBtn" class="mt-auto flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold text-slate-400 transition hover:bg-white/5 hover:text-rose-400">
        <i class="fa-solid fa-power-off w-4 text-center"></i>
        <span>Déconnexion</span>
      </button>
    </aside>
  `;
}

// Délégation d'événement globale pour la déconnexion depuis la sidebar
document.addEventListener("click", (e) => {
  if (e.target.closest("#sidebarLogoutBtn")) {
    clearSession();
    window.location.reload();
  }
});
