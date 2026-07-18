import { getSession } from "../utils/session.js";
import { escapeHtml } from "../utils/html.js";

/**
 * Navbar de l'espace connecté (admin / artisan) : fixe, avec sidebar à gauche,
 * recherche et profil. Utilisée uniquement quand un utilisateur avec rôle
 * back-office est connecté.
 */
export function renderNavbar() {
  const user = getSession();

  let userZoneHtml = "";

  if (user) {
    const displayName = user.prenom ? `${user.prenom} ${user.nom}` : user.atelier;
    userZoneHtml = `
      <div class="flex items-center gap-3">
        <div class="hidden sm:block text-right">
          <p class="text-xs font-black text-slate-950">${escapeHtml(displayName)}</p>
          <p class="text-[10px] font-bold text-amber-700 uppercase tracking-tight">${escapeHtml(user.role)}</p>
        </div>
        <button id="logoutBtn" class="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-500 border border-slate-200 transition hover:bg-rose-50 hover:text-rose-600" title="Se déconnecter">
          <i class="fa-solid fa-power-off text-sm"></i>
        </button>
      </div>
    `;
  } else {
    userZoneHtml = `
      <button id="openLoginModalBtn" class="inline-flex items-center gap-2 rounded-xl bg-amber-700 px-4 py-2 text-xs font-black text-white shadow-md transition hover:bg-amber-800">
        <i class="fa-solid fa-user-lock"></i>
        <span>Connexion</span>
      </button>
    `;
  }

  return `
    <header class="fixed inset-x-0 top-0 z-20 flex h-16 items-center justify-between border-b border-slate-200 bg-white/90 px-4 backdrop-blur lg:left-72">
      <div class="flex items-center gap-3">
        <button id="sidebarToggle" class="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50 lg:hidden" aria-label="Ouvrir le menu">
          <i class="fa-solid fa-bars"></i>
        </button>
        <div class="flex items-center gap-2 text-sm font-bold text-slate-500">
          <i class="fa-solid fa-house text-slate-400"></i>
          <span id="navbarTitle">Boutique</span>
        </div>
      </div>

      <div class="hidden md:block w-72 relative">
        <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
          <i class="fa-solid fa-magnifying-glass text-xs"></i>
        </div>
        <input type="text" class="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-medium text-slate-800 outline-none transition focus:border-amber-600 focus:bg-white focus:ring-4 focus:ring-amber-50" placeholder="Rechercher un salon, une armoire..." />
      </div>

      <div class="flex items-center gap-3">
        ${userZoneHtml}
      </div>
    </header>
  `;
}

/**
 * Navbar du site public (vitrine / boutique) : logo, menu centré,
 * icônes favoris/panier, bouton connexion. Pleine largeur, non-fixe.
 */
export function renderPublicNavbar() {
  const liens = [
    { label: "Accueil", page: "accueil/boutique" },
    { label: "Catalogue", page: "accueil/boutique" },
    { label: "Fabrication sur mesure", page: "accueil/boutique" },
    { label: "À propos", page: "accueil/apropos" }
  ];

  const liensHtml = liens.map(l => `
    <a href="#" data-page="${l.page}" class="public-nav-link text-sm font-semibold text-slate-600 transition hover:text-slate-950">
      ${escapeHtml(l.label)}
    </a>
  `).join("");

  return `
    <header class="relative z-20 border-b border-black/5 bg-cream">
      <div class="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <a href="#" data-page="accueil/boutique" class="font-serif text-xl font-semibold tracking-tight text-slate-950">
          Kër Mobilier
        </a>

        <nav class="hidden items-center gap-8 md:flex">
          ${liensHtml}
        </nav>

        <div class="flex items-center gap-4">
          <button class="hidden h-9 w-9 items-center justify-center rounded-full text-slate-600 transition hover:bg-black/5 sm:flex" title="Favoris">
            <i class="fa-regular fa-heart"></i>
          </button>
          <button class="hidden h-9 w-9 items-center justify-center rounded-full text-slate-600 transition hover:bg-black/5 sm:flex" title="Panier">
            <i class="fa-solid fa-bag-shopping"></i>
          </button>
          
          <!-- CORRECTION : Ajout de l'ID pour déclencher la modale et harmonisation bg -->
          <button id="openLoginModalBtn" class="rounded-full bg-amber-700 px-5 py-2 text-xs font-black uppercase tracking-wide text-white shadow-sm transition hover:bg-emerald-700">
            Connexion
          </button>
        </div>
      </div>
    </header>
  `;
}
