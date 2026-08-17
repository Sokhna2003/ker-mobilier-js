import { getAllDemandesSurMesure } from "../../services/demandeSurMesureservice.js";
import { getPropositionsParArtisan, createProposition } from "../../services/propositionservice.js";
import { getSession } from "../../utils/session.js";
import { escapeHtml } from "../../utils/html.js";
import { showToast } from "../../components/toast.js";
import { openModal } from "../../components/modal.js";
import { required, isPositiveNumber, validerFormulaire } from "../../utils/validator.js";

export async function renderArtisanSurMesurePage() {
  const app = document.getElementById("app");
  const session = getSession();

  if (!session?.isPremium) {
    app.innerHTML = `
      <section class="grid min-h-[50vh] place-items-center text-center">
        <div class="max-w-sm rounded-3xl border border-dashed border-amber-200 bg-amber-50/50 p-8">
          <i class="fa-solid fa-certificate text-2xl text-amber-600"></i>
          <h1 class="mt-3 text-lg font-black text-slate-950">Réservé aux artisans agréés</h1>
          <p class="mt-2 text-xs text-slate-500">Les demandes de fabrication sur mesure ne sont transmises qu'aux artisans partenaires agréés par Kër Mobilier. Rapprochez-vous de l'administration pour le devenir.</p>
        </div>
      </section>
    `;
    return;
  }

  try {
    const [demandes, mesPropositions] = await Promise.all([
      getAllDemandesSurMesure(),
      getPropositionsParArtisan(session.id)
    ]);

    const demandesOuvertes = demandes
      .filter(d => d.statut === "VALIDEE")
      .map(d => ({ ...d, dejaPropose: mesPropositions.some(p => p.demandeSurMesureId === d.id) }))
      .sort((a, b) => new Date(b.dateCreation || 0) - new Date(a.dateCreation || 0));

    app.innerHTML = `
      <section class="space-y-6">
        <div>
          <span class="text-xs font-black uppercase tracking-[0.2em] text-amber-700">Opportunités</span>
          <h1 class="mt-1 text-2xl font-black text-slate-950">Fabrication sur mesure</h1>
          <p class="mt-0.5 text-xs text-slate-400">Demandes validées par l'administration, ouvertes aux artisans agréés.</p>
        </div>

        <div id="grilleDemandesArtisan" class="grid grid-cols-1 gap-5 lg:grid-cols-2"></div>
      </section>
    `;

    afficherDemandes(demandesOuvertes);
  } catch (error) {
    app.innerHTML = `<p class="text-rose-600 font-bold p-4">Erreur : ${escapeHtml(error.message)}</p>`;
  }
}

function afficherDemandes(demandes) {
  const grille = document.getElementById("grilleDemandesArtisan");
  if (!grille) return;

  if (!demandes.length) {
    grille.innerHTML = `
      <div class="col-span-full rounded-3xl border border-dashed border-slate-300 bg-slate-50 px-5 py-10 text-center text-sm font-semibold text-slate-500">
        Aucune demande ouverte pour l'instant.
      </div>
    `;
    return;
  }

  grille.innerHTML = demandes.map(d => `
    <article class="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div class="border-b border-slate-50 pb-3 text-xs text-slate-600 space-y-1">
        <p><i class="fa-solid fa-ruler-combined mr-1.5 text-slate-400"></i>${escapeHtml(d.dimensions || "Dimensions non précisées")}</p>
        <p><i class="fa-solid fa-tree mr-1.5 text-slate-400"></i>${escapeHtml(d.materiau || "Matériau non précisé")}</p>
        <p><i class="fa-solid fa-sack-dollar mr-1.5 text-slate-400"></i>Budget client : ${Number(d.budget).toLocaleString()} FCFA</p>
        <p><i class="fa-solid fa-calendar mr-1.5 text-slate-400"></i>${escapeHtml(d.dateCreation || "—")}</p>
      </div>
      <p class="py-3 text-xs leading-5 text-slate-600">${escapeHtml(d.description)}</p>
      ${d.dejaPropose
        ? `<span class="inline-flex items-center gap-1.5 rounded-xl bg-emerald-50 px-3 py-2 text-xs font-black text-emerald-700"><i class="fa-solid fa-check"></i> Devis déjà envoyé</span>`
        : `<button data-proposer="${escapeHtml(d.id)}" class="w-full rounded-xl bg-amber-700 py-2.5 text-xs font-black text-white transition hover:bg-amber-800">Proposer un devis</button>`}
    </article>
  `).join("");

  document.querySelectorAll("[data-proposer]").forEach(btn => {
    btn.addEventListener("click", () => ouvrirFormulaireDevis(btn.dataset.proposer));
  });
}

function ouvrirFormulaireDevis(demandeSurMesureId) {
  const session = getSession();

  const body = `
    <div class="grid grid-cols-2 gap-3">
      <div>
        <label class="mb-2 block text-xs font-extrabold uppercase tracking-[0.14em] text-slate-500" for="devisPrix">Votre prix (FCFA) *</label>
        <input type="number" id="devisPrix" class="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-amber-600 focus:ring-4 focus:ring-amber-50" placeholder="ex: 380000" />
      </div>
      <div>
        <label class="mb-2 block text-xs font-extrabold uppercase tracking-[0.14em] text-slate-500" for="devisDelai">Délai *</label>
        <input type="text" id="devisDelai" class="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-amber-600 focus:ring-4 focus:ring-amber-50" placeholder="ex: 15 jours" />
      </div>
    </div>
    <div>
      <label class="mb-2 block text-xs font-extrabold uppercase tracking-[0.14em] text-slate-500" for="devisMessage">Message pour le client</label>
      <textarea id="devisMessage" rows="3" class="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-amber-600 focus:ring-4 focus:ring-amber-50" placeholder="Présentez votre savoir-faire, vos finitions..."></textarea>
    </div>
  `;

  openModal({
    title: "Proposer un devis",
    icon: "fa-file-invoice-dollar",
    iconClass: "bg-amber-100 text-amber-700",
    body,
    confirmLabel: "Envoyer ma proposition",
    confirmClass: "bg-amber-700 shadow-amber-200 hover:bg-amber-800",
    onConfirm: async (overlay) => {
      const prix = overlay.querySelector("#devisPrix").value;
      const delai = overlay.querySelector("#devisDelai").value.trim();

      const estValide = validerFormulaire([
        { id: "devisPrix", verifications: [
          () => required(prix, "Le prix est obligatoire."),
          () => isPositiveNumber(prix, "Le prix doit être un nombre positif.")
        ] },
        { id: "devisDelai", verifications: [() => required(delai, "Le délai est obligatoire.")] }
      ]);
      if (!estValide) return false;

      try {
        await createProposition({
          demandeSurMesureId,
          artisanId: session.id,
          prix: Number(prix),
          delai,
          message: overlay.querySelector("#devisMessage").value.trim()
        });
        showToast("Votre devis a été envoyé au client.");
        await renderArtisanSurMesurePage();
      } catch (error) {
        showToast(error.message, "error");
        return false;
      }
    }
  });
}