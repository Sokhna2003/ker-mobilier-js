// router.js
import { renderBoutiquePage } from "./pages/accueil/boutiquePage.js";
// import { renderArtisanProduitsPage } from "./pages/artisan/produitsPage.js";

const routes = {
  "accueil/boutique": renderBoutiquePage,
//   "artisan/produits": renderArtisanProduitsPage
};

export async function navigate(page) {
  const app = document.getElementById("app");
  
  // Sécurité de routage (Fallback vers la boutique par défaut)
  const routeFunction = routes[page] || routes["accueil/boutique"];

  // Changement dynamique du titre dans la navbar
  const navbarTitle = document.getElementById("navbarTitle");
  if (navbarTitle) {
    navbarTitle.textContent = page === "artisan/produits" ? "Espace Artisan" : "Boutique Kër Mobilier";
  }

  // Écran de chargement temporaire
  app.innerHTML = `
    <div class="grid min-h-[30vh] place-items-center">
      <p class="text-xs font-bold text-slate-400 uppercase tracking-widest animate-pulse">Chargement des meubles...</p>
    </div>
  `;

  try {
    // Appel de la fonction d'affichage de la page ciblée
    await routeFunction();
  } catch (error) {
    console.error("Erreur de routage :", error);
    app.innerHTML = `
      <div class="p-6 bg-white rounded-3xl border border-rose-100 text-center">
        <p class="text-sm font-bold text-rose-600">Erreur lors de l'affichage de la page.</p>
        <p class="text-xs text-slate-400 mt-1">${error.message}</p>
      </div>
    `;
  }
}
