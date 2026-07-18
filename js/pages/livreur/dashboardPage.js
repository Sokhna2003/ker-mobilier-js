/**
 * @file dashboardPage.js (Livreur)
 * @description Page d'accueil de l'espace livreur logistique.
 */
export function renderLivreurDashboard() {
  const app = document.getElementById("app");
  app.innerHTML = `
    <div class="space-y-4">
      <h1 class="text-3xl font-black text-slate-950 tracking-tight">🚚 Bienvenue sur le Dashboard LIVREUR</h1>
      <p class="text-sm text-slate-500">Ici, vous pourrez consulter vos tournées de livraison et de récupération de meubles.</p>
    </div>
  `;
}
