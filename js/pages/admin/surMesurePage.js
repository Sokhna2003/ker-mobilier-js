import { getAllDemandesSurMesure, validerDemandeSurMesure, rejeterDemandeSurMesure } from "../../services/demandeSurMesureservice.js";
import { getAllUtilisateurs } from "../../services/utilisateurservice.js";
import { escapeHtml } from "../../utils/html.js";
import { showToast } from "../../components/toast.js";
import { openConfirm } from "../../components/modal.js";
import { labelStatutDemandeSurMesure, classeStatutDemandeSurMesure } from "../../utils/constantes.js";

let filtreStatut = "tout";
let demandesEnrichies = [];

export async function renderAdminSurMesurePage() {
  const app = document.getElementById("app");

  try {
    const [demandes, utilisateurs] = await Promise.all([
      getAllDemandesSurMesure(),
      getAllUtilisateurs()
    ]);

    demandesEnrichies = demandes
      .map(d => {
        const client = utilisateurs.find(u => u.id === d.clientId);
        return { ...d, nomClient: client ? `${client.prenom} ${client.nom}` : "Client inconnu" };
      })
      .sort((a, b) => new Date(b.dateCreation || 0) - new Date(a.dateCreation || 0));

    app.innerHTML = `
      <section class="space-y-6">
        <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <span class="text-xs font-black uppercase tracking-[0.2em] text-amber-700">Demandes clients</span>
            <h1 class="mt-1 text-2xl font-black text-slate-950">Fabrication sur mesure</h1>
            <p class="mt-0.5 text-xs text-slate-400">Validez les demandes avant qu'elles ne soient transmises aux artisans agréés.</p>
          </div>

          <select id="filtreStatutSurMesure" class="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs font-black text-slate-700 outline-none cursor-pointer transition hover:border-[#0B132B] focus:border-[#0B132B]">
            <option value="tout">Toutes les demandes</option>
            <option value="EN_ATTENTE">En attente de validation</option>
            <option value="VALIDEE">Validées</option>
            <option value="REJETEE">Rejetées</option>
          </select>
        </div>

        <div id="grilleSurMesure" class="grid grid-cols-1 gap-5 lg:grid-cols-2"></div>
      </section>
    `;

    document.getElementById("filtreStatutSurMesure").addEventListener("change", (e) => {
      filtreStatut = e.target.value;
      afficherDemandes();
    });

    afficherDemandes();
  } catch (error) {
    app.innerHTML = `<p class="text-rose-600 font-bold p-4">Erreur : ${escapeHtml(error.message)}</p>`;
  }
}

function afficherDemandes() {
  const grille = document.getElementById("grilleSurMesure");
  if (!grille) return;

  const liste = filtreStatut === "tout" ? demandesEnrichies : demandesEnrichies.filter(d => (d.statut || "EN_ATTENTE") === filtreStatut);

  if (!liste.length) {
    grille.innerHTML = `
      <div class="col-span-full rounded-3xl border border-dashed border-slate-300 bg-slate-50 px-5 py-10 text-center text-sm font-semibold text-slate-500">
        Aucune demande pour ce filtre.
      </div>
    `;
    return;
  }

  grille.innerHTML = liste.map(carteDemandeHtml).join("");

  document.querySelectorAll("[data-valider-demande]").forEach(btn => {
    btn.addEventListener("click", async () => {
      try {
        await validerDemandeSurMesure(btn.dataset.validerDemande);
        showToast("Demande validée, elle est transmise aux artisans agréés.");
        await renderAdminSurMesurePage();
      } catch (error) {
        showToast(error.message, "error");
      }
    });
  });

  document.querySelectorAll("[data-rejeter-demande]").forEach(btn => {
    btn.addEventListener("click", () => {
      openConfirm({
        message: "Rejeter cette demande ? Le client en sera informé.",
        confirmLabel: "Rejeter",
        onConfirm: async () => {
          try {
            await rejeterDemandeSurMesure(btn.dataset.rejeterDemande);
            showToast("Demande rejetée.");
            await renderAdminSurMesurePage();
          } catch (error) {
            showToast(error.message, "error");
          }
        }
      });
    });
  });
}

function carteDemandeHtml(d) {
  const statut = d.statut || "EN_ATTENTE";

  return `
    <article class="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div class="flex items-center justify-between border-b border-slate-50 pb-3">
        <div>
          <p class="text-[10px] font-black uppercase tracking-wider text-slate-400">Demande</p>
          <p class="text-sm font-black text-slate-950">${escapeHtml(d.id)}</p>
        </div>
        <span class="inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-black uppercase ${classeStatutDemandeSurMesure(statut)}">
          ${escapeHtml(labelStatutDemandeSurMesure(statut))}
        </span>
      </div>

      <div class="border-b border-slate-50 py-3 text-xs text-slate-600 space-y-1">
        <p><i class="fa-solid fa-user mr-1.5 text-slate-400"></i>${escapeHtml(d.nomClient)}</p>
        <p><i class="fa-solid fa-ruler-combined mr-1.5 text-slate-400"></i>${escapeHtml(d.dimensions || "Dimensions non précisées")}</p>
        <p><i class="fa-solid fa-tree mr-1.5 text-slate-400"></i>${escapeHtml(d.materiau || "Matériau non précisé")}</p>
        <p><i class="fa-solid fa-sack-dollar mr-1.5 text-slate-400"></i>Budget : ${Number(d.budget).toLocaleString()} FCFA</p>
        <p><i class="fa-solid fa-calendar mr-1.5 text-slate-400"></i>${escapeHtml(d.dateCreation || "—")}</p>
      </div>

      <p class="py-3 text-xs leading-5 text-slate-600">${escapeHtml(d.description)}</p>

      ${statut === "EN_ATTENTE" ? `
        <div class="flex gap-2 pt-1">
          <button data-valider-demande="${escapeHtml(d.id)}" class="flex-1 rounded-xl bg-emerald-600 py-2.5 text-xs font-black text-white transition hover:bg-emerald-700">
            <i class="fa-solid fa-check mr-1"></i> Valider
          </button>
          <button data-rejeter-demande="${escapeHtml(d.id)}" class="flex-1 rounded-xl bg-rose-50 py-2.5 text-xs font-black text-rose-600 transition hover:bg-rose-100">
            <i class="fa-solid fa-xmark mr-1"></i> Rejeter
          </button>
        </div>
      ` : ""}
    </article>
  `;
}