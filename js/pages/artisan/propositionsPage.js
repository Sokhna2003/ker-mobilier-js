import { getPropositionsParArtisan } from "../../services/propositionservice.js";
import { getAllDemandesSurMesure } from "../../services/demandeSurMesureservice.js";
import { getSession } from "../../utils/session.js";
import { escapeHtml } from "../../utils/html.js";
import { labelStatutProposition, classeStatutProposition } from "../../utils/constantes.js";

export async function renderArtisanPropositionsPage() {
  const app = document.getElementById("app");
  const session = getSession();

  try {
    const [propositions, demandes] = await Promise.all([
      getPropositionsParArtisan(session.id),
      getAllDemandesSurMesure()
    ]);

    const propositionsEnrichies = propositions
      .map(p => {
        const demande = demandes.find(d => d.id === p.demandeSurMesureId);
        return { ...p, description: demande?.description || "Demande introuvable", dimensions: demande?.dimensions || "—" };
      })
      .sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));

    app.innerHTML = `
      <section class="space-y-6">
        <div>
          <span class="text-xs font-black uppercase tracking-[0.2em] text-amber-700">Suivi</span>
          <h1 class="mt-1 text-2xl font-black text-slate-950">Mes Propositions</h1>
          <p class="mt-0.5 text-xs text-slate-400">${propositionsEnrichies.length} devis envoyé(s) aux clients.</p>
        </div>

        <div class="grid gap-4">
          ${propositionsEnrichies.length
            ? propositionsEnrichies.map(carteHtml).join("")
            : `<div class="rounded-3xl border border-dashed border-slate-300 bg-slate-50 px-5 py-10 text-center text-sm font-semibold text-slate-500">Vous n'avez envoyé aucun devis pour l'instant.</div>`}
        </div>
      </section>
    `;
  } catch (error) {
    app.innerHTML = `<p class="text-rose-600 font-bold p-4">Erreur : ${escapeHtml(error.message)}</p>`;
  }
}

function carteHtml(p) {
  return `
    <article class="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div class="flex items-center justify-between">
        <p class="text-sm font-black text-slate-950 truncate max-w-md">${escapeHtml(p.description)}</p>
        <span class="inline-flex items-center rounded-md px-2 py-1 text-[10px] font-black uppercase ${classeStatutProposition(p.statut)}">
          ${escapeHtml(labelStatutProposition(p.statut))}
        </span>
      </div>
      <div class="mt-2 flex flex-wrap gap-x-6 gap-y-1 text-xs text-slate-500">
        <span><i class="fa-solid fa-sack-dollar mr-1 text-slate-400"></i>${Number(p.prix).toLocaleString()} FCFA</span>
        <span><i class="fa-solid fa-clock mr-1 text-slate-400"></i>${escapeHtml(p.delai)}</span>
        <span><i class="fa-solid fa-ruler-combined mr-1 text-slate-400"></i>${escapeHtml(p.dimensions)}</span>
      </div>
      ${p.message ? `<p class="mt-2 text-xs italic text-slate-500">"${escapeHtml(p.message)}"</p>` : ""}
    </article>
  `;
}