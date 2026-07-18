
export function renderClientDashboard() {
  const app = document.getElementById("app");
  app.innerHTML = `
    <div class="space-y-4">
      <h1 class="text-3xl font-black text-slate-950 tracking-tight">🛒 Bienvenue sur le Dashboard CLIENT</h1>
      <p class="text-sm text-slate-500">Ici, vous pourrez suivre vos commandes de meubles et vos demandes de fabrication sur mesure.</p>
    </div>
  `;
}
