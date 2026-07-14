import { getSession, clearSession } from "../utils/session.js";

export function renderSidebar() {
  const user = getSession();
  let links = [];

  if (user?.role === "artisan") {
    links = [
      { page: "artisan/produits", label: "Mon Atelier", icon: "fa-couch" },
      { page: "artisan/sur-mesure", label: "Demandes Sur-Mesure", icon: "fa-compass-drafting" }
    ];
  } else if (user?.role === "admin") {
    links = [
      { page: "admin/dashboard", label: "Tableau de bord", icon: "fa-chart-pie" },
      { page: "admin/validation", label: "Validation Meubles", icon: "fa-clipboard-check" }
    ];
  }

  const items = links.map(l => `
    <button class="nav-link flex items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm font-semibold text-slate-600 transition hover:bg-slate-100 hover:text-slate-950" data-page="${l.page}">
      <i class="fa-solid ${l.icon} w-5 text-center"></i>
      <span>${l.label}</span>
    </button>
  `).join("");

  return `
    <aside id="sidebar" class="fixed inset-y-0 left-0 z-40 w-72 -translate-x-full border-r border-slate-200 bg-white transition-transform lg:translate-x-0">
      <div class="px-5 py-5 border-b border-slate-100">
        <h1 class="text-xl font-black text-slate-950">Kër Mobilier</h1>
        <p class="text-xs font-bold text-amber-700 uppercase tracking-wider mt-0.5">${user?.atelier || "Espace Admin"}</p>
      </div>
      <nav class="grid gap-2 px-4 py-4">${items}</nav>
    </aside>
  `;
}
