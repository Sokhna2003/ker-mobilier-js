/**
 * @file dashboardPage.js (Artisan)
 * @description Page d'accueil de l'espace menuisier fabricant.
 */
export function renderArtisanDashboard() {
  const app = document.getElementById("app");
  app.innerHTML = `
    <div class="space-y-4">
      <h1 class="text-3xl font-black text-slate-950 tracking-tight">🛠️ Bienvenue sur le Dashboard ARTISAN</h1>
      <p class="text-sm text-slate-500">Ici, vous pourrez gérer vos meubles en stock et répondre aux propositions sur mesure.</p>
    </div>
  `;
}
