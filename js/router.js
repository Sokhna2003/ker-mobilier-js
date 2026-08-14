import { renderBoutiquePage } from "./pages/accueil/boutiquePage.js";
import { renderLoginPage } from "./pages/accueil/loginPage.js";
import { renderAdminDashboard } from "./pages/admin/dashboardPage.js";
import { renderArtisanDashboard } from "./pages/artisan/dashboardPage.js";
import { renderArtisanProduitsPage } from "./pages/artisan/produitsPage.js";
import { renderClientDashboard } from "./pages/client/dashboardPage.js";
import { renderLivreurDashboard } from "./pages/livreur/dashboardPage.js";
import { renderLivreurLivraisonsPage } from "./pages/livreur/livraisonsPage.js";
import { renderUtilisateursPage } from "./pages/admin/utilisateursPage.js";
import { renderUtilisateurDetailPage } from "./pages/admin/utilisateurDetailPage.js";
import { renderCorbeillePage } from "./pages/admin/corbeillePage.js";
import { renderCategoriesPage } from "./pages/admin/categoriesPage.js";
import { renderProduitsPage } from "./pages/admin/produitsPage.js";
import { renderProduitDetailPage } from "./pages/admin/produitDetailPage.js";
import { renderAdminCommandesPage } from "./pages/admin/commandesPage.js";
import { renderArtisanCommandesPage } from "./pages/artisan/commandesPage.js";
import { renderClientCommandesPage } from "./pages/client/commandesPage.js";
import { renderAdminLivraisonsPage } from "./pages/admin/livraisonsPage.js";
import { renderAdminSurMesurePage } from "./pages/admin/surMesurePage.js";
import { renderAdminAvisPage } from "./pages/admin/avisPage.js";
import { renderArtisanSurMesurePage } from "./pages/artisan/surMesurePage.js";
import { renderArtisanPropositionsPage } from "./pages/artisan/propositionsPage.js";
import { renderArtisanAvisPage } from "./pages/artisan/avisPage.js";
import { renderClientLivraisonsPage } from "./pages/client/livraisonsPage.js";
import { renderClientPropositionsPage } from "./pages/client/propositionsPage.js";
import { renderClientAvisPage } from "./pages/client/avisPage.js";

// Table de correspondance des routes (sans les paramètres ?...)
const routes = {
  "accueil/boutique": renderBoutiquePage,
  "login": renderLoginPage,
  "admin/dashboard": renderAdminDashboard,
  "artisan/dashboard": renderArtisanDashboard,
  "artisan/produits": renderArtisanProduitsPage,
  "client/dashboard": renderClientDashboard,
  "livreur/dashboard": renderLivreurDashboard,
  "livreur/mes-livraisons": renderLivreurLivraisonsPage,
  "admin/utilisateurs": renderUtilisateursPage,
  "admin/utilisateur-detail": renderUtilisateurDetailPage,
  "admin/corbeille": renderCorbeillePage,
  "admin/categories": renderCategoriesPage,
  "admin/produits": renderProduitsPage,
  "admin/produit-detail": renderProduitDetailPage,
  "admin/commandes": renderAdminCommandesPage,
  "artisan/commandes": renderArtisanCommandesPage,
  "client/commandes": renderClientCommandesPage,
  "admin/livraison": renderAdminLivraisonsPage,
  "admin/sur-mesure": renderAdminSurMesurePage,
  "admin/avis": renderAdminAvisPage,
  "artisan/sur-mesure": renderArtisanSurMesurePage,
  "artisan/propositions": renderArtisanPropositionsPage,
  "artisan/avis": renderArtisanAvisPage,
  "client/livraisons": renderClientLivraisonsPage,
  "client/propositions": renderClientPropositionsPage,
  "client/avis": renderClientAvisPage
};

const TITRES = {
  "admin/utilisateurs": "Gestion des Utilisateurs",
  "admin/utilisateur-detail": "Détail de l'utilisateur",
  "admin/corbeille": "Corbeille",
  "admin/categories": "Catégories",
  "admin/produits": "Produits",
  "admin/produit-detail": "Détail du produit",
  "admin/dashboard": "Espace Direction",
  "artisan/produits": "Mes Produits",
  "livreur/mes-livraisons": "Mes Livraisons",
  "admin/commandes": "Commandes",
  "artisan/commandes": "Mes Commandes",
  "client/commandes": "Mes Commandes",
  "admin/livraison": "Livraisons",
  "admin/sur-mesure": "Fabrication sur mesure",
  "admin/avis": "Avis",
  "artisan/sur-mesure": "Fabrication sur mesure",
  "artisan/propositions": "Mes Propositions",
  "artisan/avis": "Avis Reçus",
  "client/livraisons": "Suivi des Livraisons",
  "client/propositions": "Propositions des artisans",
  "client/avis": "Mes Avis"
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