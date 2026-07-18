import { renderBoutiquePage } from "./pages/accueil/boutiquePage.js";
import { renderLoginPage } from "./pages/accueil/loginPage.js";
import { renderAdminDashboard } from "./pages/admin/dashboardPage.js";
import { renderArtisanDashboard } from "./pages/artisan/dashboardPage.js";
import { renderClientDashboard } from "./pages/client/dashboardPage.js";
import { renderLivreurDashboard } from "./pages/livreur/dashboardPage.js";



// Table de correspondance des routes
const routes = {
  "accueil/boutique": renderBoutiquePage,
  "login": renderLoginPage,
  "admin/dashboard": renderAdminDashboard,
  "artisan/dashboard": renderArtisanDashboard,
  "client/dashboard": renderClientDashboard,
  "livreur/dashboard": renderLivreurDashboard
};

export async function navigate(page) {
  const app = document.getElementById("app");
  
  // Si la route demandée n'existe pas, retour à la boutique
  const routeFunction = routes[page] || routes["accueil/boutique"];

  // Écran de chargement temporaire
  app.innerHTML = `
    <div class="grid min-h-[30vh] place-items-center">
      <p class="text-xs font-bold text-slate-400 uppercase tracking-widest animate-pulse">Chargement...</p>
    </div>
  `;

  try {
    await routeFunction();
  } catch (error) {
    console.error("Erreur de routage :", error);
    app.innerHTML = `<p class="text-rose-600 font-bold p-4">Erreur : ${error.message}</p>`;
  }
}
