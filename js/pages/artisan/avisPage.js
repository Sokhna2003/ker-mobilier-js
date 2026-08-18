import { getAllAvis } from "../../services/avisservice.js";
import { getAllLignesCommande } from "../../services/commandeservice.js";
import { getAllProduits } from "../../services/produitservice.js";
import { getAllUtilisateurs } from "../../services/utilisateurservice.js";
import { getSession } from "../../utils/session.js";
import { escapeHtml } from "../../utils/html.js";

export async function renderArtisanAvisPage() {
  const app = document.getElementById("app");
  const session = getSession();

  try {
    const [avis, lignesCommande, produits, utilisateurs] = await Promise.all([
      getAllAvis(),
      getAllLignesCommande(),
      getAllProduits(),
      getAllUtilisateurs()
    ]);

    const mesProduitsIds = produits.filter(p => p.artisanId === session.id).map(p => p.id);

    const avisRecus = avis
      .map(a => {
        const ligne = lignesCommande.find(l => l.id === a.ligneCommandeId);
        if (!ligne || !mesProduitsIds.includes(ligne.produitId)) return null;
        const produit = produits.find(p => p.id === ligne.produitId);
        const client = utilisateurs.find(u => u.id === a.clientId);
        return {
          ...a,
          nomProduit: produit?.nom || "Produit inconnu",
          nomClient: client ? `${client.prenom} ${client.nom}` : "Client inconnu"
        };
      })
      .filter(Boolean)
      .sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));

    const noteMoyenne = avisRecus.length
      ? (avisRecus.reduce((s, a) => s + a.note, 0) / avisRecus.length).toFixed(1)
      : null;

    app.innerHTML = `
      <section class="space-y-6">
        <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <span class="text-xs font-black uppercase tracking-[0.2em] text-amber-700">Réputation</span>
            <h1 class="mt-1 text-2xl font-black text-slate-950">Avis Reçus</h1>
            <p class="mt-0.5 text-xs text-slate-400">${avisRecus.length} avis sur vos produits.</p>
          </div>
          ${noteMoyenne ? `
            <div class="flex items-center gap-2 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3">
              <i class="fa-solid fa-star text-amber-500"></i>
              <span class="text-lg font-black text-slate-950">${noteMoyenne}/5</span>
            </div>
          ` : ""}
        </div>

        <div class="grid gap-4">
          ${avisRecus.length
            ? avisRecus.map(carteHtml).join("")
            : `<div class="rounded-3xl border border-dashed border-slate-300 bg-slate-50 px-5 py-10 text-center text-sm font-semibold text-slate-500">Aucun avis reçu pour l'instant.</div>`}
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
        <p class="text-sm font-black text-slate-950">${escapeHtml(a.nomClient)}</p>
        <span class="text-[10px] text-slate-400">${escapeHtml(a.date || "—")}</span>
      </div>
      <p class="mt-1 text-[11px] font-bold text-terracotta-600">${escapeHtml(a.nomProduit)}</p>
      <p class="mt-1 text-xs font-bold text-amber-500">${"★".repeat(a.note)}${"☆".repeat(5 - a.note)}</p>
      <p class="mt-1 text-xs leading-5 text-slate-600">${escapeHtml(a.commentaire)}</p>
    </article>
  `;
}