import { getDemandesParClient, cloturerDemandeSurMesure } from "../../services/demandeSurMesureservice.js";
import { getAllPropositions, accepterProposition, refuserProposition } from "../../services/propositionservice.js";
import { getAllUtilisateurs } from "../../services/utilisateurservice.js";
import { getSession } from "../../utils/session.js";
import { escapeHtml } from "../../utils/html.js";
import { showToast } from "../../components/toast.js";
import { openConfirm } from "../../components/modal.js";

export async function renderClientPropositionsPage() {
  const app = document.getElementById("app");
  const session = getSession();

  try {
    const [demandes, propositions, utilisateurs] = await Promise.all([
      getDemandesParClient(session.id),
      getAllPropositions(),
      getAllUtilisateurs()
    ]);

    const demandesAvecPropositions = demandes
      .map(d => ({
        ...d,
        propositions: propositions
          .filter(p => p.demandeSurMesureId === d.id)
          .map(p => {
            const artisan = utilisateurs.find(u => u.id === p.artisanId);
            return { ...p, nomAtelier: artisan?.atelier || "Atelier inconnu" };
          })
      }))
      .filter(d => d.propositions.length > 0)
      .sort((a, b) => new Date(b.dateCreation || 0) - new Date(a.dateCreation || 0));

    app.innerHTML = `
      <section class="space-y-6">
        <div>
          <span class="text-xs font-black uppercase tracking-[0.2em] text-emerald-700">Sur mesure</span>
          <h1 class="mt-1 text-2xl font-black text-slate-950">Propositions des artisans</h1>
          <p class="mt-0.5 text-xs text-slate-400">Comparez les devis reçus et choisissez l'artisan qui réalisera votre meuble.</p>
        </div>

        <div id="listeDemandesPropositions" class="grid gap-6"></div>
      </section>
    `;

    afficherDemandes(demandesAvecPropositions);
  } catch (error) {
    app.innerHTML = `<p class="text-rose-600 font-bold p-4">Erreur : ${escapeHtml(error.message)}</p>`;
  }
}

function afficherDemandes(demandes) {
  const zone = document.getElementById("listeDemandesPropositions");
  if (!zone) return;

  if (!demandes.length) {
    zone.innerHTML = `
      <div class="rounded-3xl border border-dashed border-slate-300 bg-slate-50 px-5 py-10 text-center text-sm font-semibold text-slate-500">
        Aucune proposition reçue pour l'instant sur vos demandes sur mesure.
      </div>
    `;
    return;
  }

  zone.innerHTML = demandes.map(d => `
    <article class="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div class="border-b border-slate-50 pb-3">
        <p class="text-sm font-black text-slate-950">${escapeHtml(d.description)}</p>
        <p class="text-[11px] text-slate-400">Budget initial : ${Number(d.budget).toLocaleString()} FCFA${d.artisanChoisiId ? " · Artisan déjà choisi" : ""}</p>
      </div>
      <div class="mt-3 grid gap-3 sm:grid-cols-2">
        ${d.propositions.map(p => carteProposition(p, d)).join("")}
      </div>
    </article>
  `).join("");

  document.querySelectorAll("[data-choisir]").forEach(btn => {
    btn.addEventListener("click", () => {
      openConfirm({
        message: "Choisir cet artisan pour réaliser votre meuble ? Les autres propositions seront automatiquement déclinées.",
        confirmLabel: "Confirmer le choix",
        onConfirm: async () => {
          try {
            const propositionId = btn.dataset.proposition;
            const demandeId = btn.dataset.demande;
            const artisanId = btn.dataset.artisan;
            const autres = btn.dataset.autres;

            await accepterProposition(propositionId);
            await Promise.all(autres.split(",").filter(Boolean).map(id => refuserProposition(id)));
            await cloturerDemandeSurMesure(demandeId, artisanId);

            showToast("Artisan choisi ! Il va démarrer la fabrication de votre meuble.");
            await renderClientPropositionsPage();
          } catch (error) {
            showToast(error.message, "error");
          }
        }
      });
    });
  });
}

function carteProposition(p, demande) {
  const autresIds = demande.propositions.filter(x => x.id !== p.id).map(x => x.id).join(",");
  const dejaTranche = Boolean(demande.artisanChoisiId);
  const estChoisi = demande.artisanChoisiId === p.artisanId;

  return `
    <div class="rounded-2xl border ${estChoisi ? "border-emerald-300 bg-emerald-50/40" : "border-slate-100"} p-4">
      <div class="flex items-center justify-between">
        <p class="text-xs font-black text-slate-950">${escapeHtml(p.nomAtelier)}</p>
        ${estChoisi ? `<span class="text-[10px] font-black text-emerald-700"><i class="fa-solid fa-check-circle"></i> Choisi</span>` : ""}
      </div>
      <p class="mt-1 font-mono text-sm font-black text-slate-900">${Number(p.prix).toLocaleString()} FCFA</p>
      <p class="text-[11px] text-slate-500"><i class="fa-solid fa-clock mr-1"></i>${escapeHtml(p.delai)}</p>
      ${p.message ? `<p class="mt-1 text-[11px] italic text-slate-500">"${escapeHtml(p.message)}"</p>` : ""}
      ${!dejaTranche ? `
        <button data-choisir data-proposition="${escapeHtml(p.id)}" data-demande="${escapeHtml(demande.id)}" data-artisan="${escapeHtml(p.artisanId)}" data-autres="${escapeHtml(autresIds)}" class="mt-3 w-full rounded-xl bg-emerald-700 py-2 text-[11px] font-black text-white transition hover:bg-emerald-800">
          Choisir cet artisan
        </button>
      ` : ""}
    </div>
  `;
}