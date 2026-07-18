/**
 * @file dashboardPage.js (Admin)
 * @description Page d'accueil de l'espace d'administration globale.
 */
export function renderAdminDashboard() {
  const app = document.getElementById("app");
  app.innerHTML = `
    <div class="space-y-4">
      <h1 class="text-3xl font-black text-slate-950 tracking-tight">👋 Bienvenue sur le Dashboard ADMINISTRATEUR</h1>
      <p class="text-sm text-slate-500">Ici, vous pourrez valider les meubles des artisans et attribuer les livraisons.</p>
    </div>
  `;
}
