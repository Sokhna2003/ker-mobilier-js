import { getAvisParClient } from "../../services/avisservice.js";
import { getAllLignesCommande } from "../../services/commandeservice.js";
import { getAllProduits } from "../../services/produitservice.js";
import { getSession } from "../../utils/session.js";
import { escapeHtml } from "../../utils/html.js";

export async function renderClientAvisPage() {
  const app = document.getElementById("app");
  const session = getSession();

  try {
    const [avis, lignesCommande, produits] = await Promise.all([
      getAvisParClient(session.id),
      getAllLignesCommande(),
      getAllProduits()
    ]);

    const avisEnrichis = avis
      .map(a => {
        const ligne = lignesCommande.find(l => l.id === a.ligneCommandeId);
        const produit = produits.find(p => p.id === ligne?.produitId);
        return { ...a, nomProduit: produit?.nom || "Produit inconnu" };
      })
      .sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));

    app.innerHTML = `
      <section class="space-y-6">
        <div>
          <span class="text-xs font-black uppercase tracking-[0.2em] text-emerald-700">Historique</span>
          <h1 class="mt-1 text-2xl font-black text-slate-950">Mes Avis</h1>
          <p class="mt-0.5 text-xs text-slate-400">${avisEnrichis.length} avis publié(s) sur vos achats.</p>
        </div>

        <div class="grid gap-4">
          ${avisEnrichis.length
            ? avisEnrichis.map(carteHtml).join("")
            : `<div class="rounded-3xl border border-dashed border-slate-300 bg-slate-50 px-5 py-10 text-center text-sm font-semibold text-slate-500">Vous n'avez publié aucun avis pour l'instant. Rendez-vous dans "Mes Commandes" une fois une commande terminée.</div>`}
        </div>
      </section>
    `;
  } catch (error) {
    app.innerHTML = `<p class="text-rose-600 font-bold p-4">Erreur : ${escapeHtml(error.message)}</p>`;
  }
}

function carteHtml(a) {
  return `
    <article class="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div class="flex items-center justify-between">
        <p class="text-sm font-black text-slate-950">${escapeHtml(a.nomProduit)}</p>
        <span class="text-[10px] text-slate-400">${escapeHtml(a.date || "—")}</span>
      </div>
      <p class="mt-1 text-xs font-bold text-amber-500">${"★".repeat(a.note)}${"☆".repeat(5 - a.note)}</p>
      <p class="mt-1 text-xs leading-5 text-slate-600">${escapeHtml(a.commentaire)}</p>
    </article>
  `;
}