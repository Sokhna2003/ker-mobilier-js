import { pageHeader } from "../../components/pageHeader.js";
import { renderTable } from "../../components/table.js";
import { getSession } from "../../utils/session.js";
import { API_BASE_URL } from "../../config/api.js";
import { apiRequest } from "../../services/apiClient.js";

export async function renderArtisanProduitsPage() {
  const app = document.getElementById("app");
  const user = getSession();

  // Récupération de tous les produits de cet artisan précis depuis le db.json
  const produits = await apiRequest(`${API_BASE_URL}/produits?artisanId=${user.id}`, {}, "Erreur de chargement.");

  // Calcul rapide du chiffre d'affaires fictif pour impressionner l'enseignant (Statistiques réclamées)
  const totalVentes = produits.filter(p => p.statut === "VALIDE").reduce((sum, p) => sum + (p.prix * p.stock), 0);

  app.innerHTML = `
    <section class="grid gap-6">
      ${pageHeader({
        kicker: "Atelier Numérique",
        title: "Mes Meubles & Créations",
        subtitle: `Gérez le catalogue de l'atelier : ${user.atelier}.`,
        actionLabel: "Publier un meuble",
        actionId: "addMeubleBtn",
        actionIcon: "fa-plus"
      })}

      <!-- Cartes de statistiques de ventes pour l'artisan -->
      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div class="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <p class="text-xs font-extrabold uppercase tracking-wider text-slate-400">Valeur totale du stock</p>
          <p class="mt-2 text-2xl font-black text-slate-950">${totalVentes.toLocaleString()} FCFA</p>
        </div>
        <div class="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <p class="text-xs font-extrabold uppercase tracking-wider text-slate-400">Articles publiés</p>
          <p class="mt-2 text-2xl font-black text-slate-950">${produits.length} modèle(s)</p>
        </div>
      </div>

      <!-- Tableau d'affichage avec filtre de validation -->
      <article class="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
        <h2 class="text-lg font-black text-slate-950 mb-4">Mes publications sur la Marketplace</h2>
        
        ${renderTable({
          rows: produits,
          emptyMessage: "Vous n'avez pas encore publié de meubles sur la plateforme.",
          columns: [
            { label: "Visuel", render: (p) => `<img src="${p.images}" class="h-10 w-10 object-cover rounded-xl border" />` },
            { label: "Désignation", render: (p) => `<strong class="font-bold text-slate-950">${p.nom}</strong>` },
            { label: "Prix Public", render: (p) => `<span class="font-mono font-bold">${p.prix.toLocaleString()} F</span>` },
            { 
              label: "Statut Modération", 
              render: (p) => {
                // Gestion visuelle de la fonctionnalité 2 : Validation par l'administrateur
                const label = p.statut === "VALIDE" ? "En ligne" : "En attente de validation";
                const color = p.statut === "VALIDE" ? "bg-emerald-50 text-emerald-700 ring-emerald-600/10" : "bg-amber-50 text-amber-700 ring-amber-600/10";
                return `<span class="inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${color}">${label}</span>`;
              } 
            }
          ]
        })}
      </article>
    </section>
  `;
}
