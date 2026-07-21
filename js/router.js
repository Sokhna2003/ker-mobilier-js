import { renderBoutiquePage } from "./pages/accueil/boutiquePage.js";
import { renderLoginPage } from "./pages/accueil/loginPage.js";
import { renderAdminDashboard } from "./pages/admin/dashboardPage.js";
import { renderArtisanDashboard } from "./pages/artisan/dashboardPage.js";
import { renderClientDashboard } from "./pages/client/dashboardPage.js";
import { renderLivreurDashboard } from "./pages/livreur/dashboardPage.js";
import { renderUtilisateursPage } from "./pages/admin/utilisateursPage.js";
import { renderUtilisateurDetailPage } from "./pages/admin/utilisateursDetailPage.js";
import { renderCorbeillePage } from "./pages/admin/corbeillePage.js";
import { renderCategoriesPage } from "./pages/admin/categoriesPage.js";

// Table de correspondance des routes (sans les paramètres ?...)
const routes = {
  "accueil/boutique": renderBoutiquePage,
  "login": renderLoginPage,
  "admin/dashboard": renderAdminDashboard,
  "artisan/dashboard": renderArtisanDashboard,
  "client/dashboard": renderClientDashboard,
  "livreur/dashboard": renderLivreurDashboard,
  "admin/utilisateurs": renderUtilisateursPage,
  "admin/utilisateur-detail": renderUtilisateurDetailPage,
  "admin/corbeille": renderCorbeillePage,
  "admin/categories": renderCategoriesPage
};

const TITRES = {
  "admin/utilisateurs": "Gestion des Utilisateurs",
  "admin/utilisateur-detail": "Détail de l'utilisateur",
  "admin/corbeille": "Corbeille",
  "admin/categories": "Catégories",
  "admin/dashboard": "Espace Direction"
};

export async function navigate(page) {
  const app = document.getElementById("app");

  // Une route peut porter des paramètres : "admin/utilisateur-detail?id=user-artisan-1"
  const [base, queryString] = page.split("?");
  const params = new URLSearchParams(queryString || "");

  // Si la route demandée n'existe pas, retour à la boutique
  const routeFunction = routes[base] || routes["accueil/boutique"];

  // Écran de chargement temporaire
  app.innerHTML = `
    <div class="grid min-h-[30vh] place-items-center">
      <p class="text-xs font-bold text-slate-400 uppercase tracking-widest animate-pulse">Chargement...</p>
    </div>
  `;

  const navbarTitle = document.getElementById("navbarTitle");
  if (navbarTitle) {
    navbarTitle.textContent = TITRES[base] || "Boutique Kër Mobilier";
  }

  try {
    await routeFunction(params);
  } catch (error) {
    console.error("Erreur de routage :", error);
    app.innerHTML = `<p class="text-rose-600 font-bold p-4">Erreur : ${error.message}</p>`;
  }
}