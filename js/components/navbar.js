import { getSession } from "../utils/session.js";
import { escapeHtml } from "../utils/html.js";


/**
 * Génère la barre de navigation supérieure sombre pour tous les acteurs connectés.
 * S'adapte dynamiquement selon que l'utilisateur est admin, artisan, livreur ou client.
 */
export function renderNavbar() {
  const user = getSession();

  //  Récupération dynamique du prénom (ou du nom de l'atelier pour un artisan)
  const prenomAafficher = user?.prenom || user?.atelier || "Utilisateur";

  //  Traduction ou formatage propre du rôle pour l'affichage visuel à l'écran
  let roleLibelle = "Client";
  if (user?.role === "admin") roleLibelle = "Admin";
  if (user?.role === "artisan") roleLibelle = "Artisan";
  if (user?.role === "livreur") roleLibelle = "Livreur";

  return `
    <header class="fixed inset-x-0 top-0 z-50 flex h-16 items-center justify-between bg-slate-950 px-6 text-white shadow-md">
      
      <!-- ZONE GAUCHE : Logo Kër Mobilier conforme à la maquette -->
      <div class="flex items-center gap-3 cursor-pointer" data-page="accueil/boutique">
        <span class="font-serif text-lg font-extrabold tracking-tight text-white hover:text-amber-500 transition">
          Kër Mobilier
        </span>
      </div>

      <!-- ZONE CENTRALE : Barre de recherche épurée -->
      <div class="relative w-full max-w-md hidden md:block">
        <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
          <i class="fa-solid fa-magnifying-glass text-xs"></i>
        </div>
        <input type="text" class="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs font-medium text-slate-200 outline-none transition focus:border-amber-700" placeholder="Search..." />
      </div>

      <!-- ZONE DROITE : Actions et Profil de l'utilisateur connecté -->
      <div class="flex items-center gap-6">
        
        <!-- Bouton de retour vers la vitrine publique -->
        <button data-page="accueil/boutique" class="hidden sm:inline-flex items-center gap-1.5 rounded-xl border border-slate-800 bg-slate-900 px-3 py-1.5 text-xs font-bold text-slate-300 transition hover:bg-slate-800 hover:text-white">
          <i class="fa-solid fa-eye text-[11px]"></i>
          <span>Voir le site public</span>
        </button>

        <!-- Icônes utilitaires (Luminosité, Thème, Cloche) -->
        <div class="flex items-center gap-3 text-slate-400 text-xs">
          <button class="hover:text-white transition"><i class="fa-solid fa-sun"></i></button>
          <button class="hover:text-white transition"><i class="fa-solid fa-moon"></i></button>
          <button class="hover:text-white transition relative">
            <i class="fa-solid fa-bell"></i>
            <span class="absolute -top-1 -right-1 h-1.5 w-1.5 rounded-full bg-amber-600"></span>
          </button>
        </div>

        <!-- Bloc Profil de l'acteur (Avatar + Prénom + Rôle) -->
        <div class="flex items-center gap-3 border-l border-slate-800 pl-4">
          <div class="h-8 w-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 font-bold overflow-hidden shadow-inner">
            <i class="fa-solid fa-user text-xs"></i>
          </div>
          <div class="text-left leading-none">
            <p class="text-xs font-black text-white">${escapeHtml(prenomAafficher)}</p>
            <p class="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-wider">${escapeHtml(roleLibelle)}</p>
          </div>
        </div>

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
