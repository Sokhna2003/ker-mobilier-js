import { getAllLivraisons, accepterLivraison, marquerLivraisonEffectuee } from "../../services/livraisonservice.js";
import { getAllCommandes, getAllLignesCommande } from "../../services/commandeservice.js";
import { getAllProduits } from "../../services/produitservice.js";
import { getAllUtilisateurs } from "../../services/utilisateurservice.js";
import { getSession } from "../../utils/session.js";
import { escapeHtml } from "../../utils/html.js";
import { showToast } from "../../components/toast.js";
import { openConfirm } from "../../components/modal.js";
import { labelStatutLivraison, classeStatutLivraison } from "../../utils/constantes.js";

const IMAGE_CARTE_TOURNEE = "../../../assets/images/carte-tournee-livreur.png";

let missionsActives = [];

export async function renderLivreurSuiviPage() {
  const app = document.getElementById("app");
  const session = getSession();

  try {
    const [livraisons, commandes, lignesCommande, produits, utilisateurs] = await Promise.all([
      getAllLivraisons(),
      getAllCommandes(),
      getAllLignesCommande(),
      getAllProduits(),
      getAllUtilisateurs()
    ]);

    missionsActives = livraisons
      .filter(l => l.livreurId === session.id && (l.statut === "ATTRIBUEE" || l.statut === "EN_LIVRAISON"))
      .map(l => {
        const commande = commandes.find(c => c.id === l.commandeId);
        const client = utilisateurs.find(u => u.id === commande?.clientId);
        const lignes = lignesCommande.filter(ln => ln.commandeId === l.commandeId);
        const produit = produits.find(p => p.id === lignes[0]?.produitId);
        const artisan = utilisateurs.find(u => u.id === produit?.artisanId);

        return {
          ...l,
          nomClient: client ? `${client.prenom} ${client.nom}` : "Client inconnu",
          telephoneClient: client?.telephone || "",
          adresseLivraison: commande?.adresseLivraison || "—",
          nomAtelier: artisan?.atelier || "Atelier inconnu",
          adresseCollecte: artisan?.adresse || "—"
        };
      })
      .sort((a, b) => (a.statut === "EN_LIVRAISON" ? -1 : 1));

    app.innerHTML = `
      <section class="space-y-6">
        <div>
          <span class="text-xs font-black uppercase tracking-[0.2em] text-emerald-700">Temps réel</span>
          <h1 class="mt-1 text-2xl font-black text-slate-950">Suivi des livraisons</h1>
          <p class="mt-0.5 text-xs text-slate-400">Vos missions actives, en un coup d'œil.</p>
        </div>

        <div class="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
          <article class="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 class="text-sm font-black text-slate-950">Carte de tournée</h2>
            <img src="${IMAGE_CARTE_TOURNEE}" alt="Carte de tournée" class="mt-3 w-full rounded-2xl" />
          </article>

          <article id="panneauMissionSuivi" class="flex flex-col items-center justify-center rounded-3xl border border-slate-200 bg-white p-6 text-center shadow-sm">
            <span class="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
              <i class="fa-solid fa-location-arrow"></i>
            </span>
            <p class="mt-3 text-sm font-black text-slate-950">Aucune mission sélectionnée</p>
            <p class="mt-1 text-xs text-slate-400">Cliquez sur une mission ci-dessous pour voir le détail.</p>
          </article>
        </div>

        <div id="listeMissionsActives" class="grid gap-4"></div>
      </section>
    `;

    afficherMissions();
  } catch (error) {
    app.innerHTML = `<p class="text-rose-600 font-bold p-4">Erreur : ${escapeHtml(error.message)}</p>`;
  }
}

function afficherMissions() {
  const zone = document.getElementById("listeMissionsActives");
  if (!zone) return;

  if (!missionsActives.length) {
    zone.innerHTML = `
      <div class="rounded-3xl border border-dashed border-slate-300 bg-slate-50 px-5 py-10 text-center text-sm font-semibold text-slate-500">
        Aucune mission active pour le moment.
      </div>
    `;
    return;
  }

  zone.innerHTML = missionsActives.map(m => `
    <button data-mission="${escapeHtml(m.id)}" class="flex w-full items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:border-emerald-300">
      <div>
        <p class="text-sm font-black text-slate-950">${escapeHtml(m.nomClient)}</p>
        <p class="text-[11px] text-slate-400">${escapeHtml(m.adresseLivraison)}</p>
      </div>
      <span class="inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-black uppercase ${classeStatutLivraison(m.statut)}">
        ${escapeHtml(labelStatutLivraison(m.statut))}
      </span>
    </button>
  `).join("");

  document.querySelectorAll("[data-mission]").forEach(btn => {
    btn.addEventListener("click", () => afficherDetailMission(btn.dataset.mission));
  });
}

function afficherDetailMission(missionId) {
  const m = missionsActives.find(x => x.id === missionId);
  if (!m) return;

  const panneau = document.getElementById("panneauMissionSuivi");

  let actionHtml = "";
  if (m.statut === "ATTRIBUEE") {
    actionHtml = `<button id="btnAccepterSuivi" class="mt-3 w-full rounded-xl bg-amber-600 py-2.5 text-xs font-black text-white transition hover:bg-amber-700">Accepter la livraison</button>`;
  } else if (m.statut === "EN_LIVRAISON") {
    actionHtml = `<button id="btnLivreeSuivi" class="mt-3 w-full rounded-xl bg-emerald-700 py-2.5 text-xs font-black text-white transition hover:bg-emerald-800">Livraison effectuée</button>`;
  }

  panneau.innerHTML = `
    <div class="w-full text-left">
      <p class="text-[10px] font-black uppercase text-slate-400">Mission ${escapeHtml(m.id)}</p>
      <p class="mt-2 text-sm font-black text-slate-950">${escapeHtml(m.nomClient)}</p>
      <p class="mt-1 text-xs text-slate-500"><i class="fa-solid fa-location-dot mr-1.5 text-rose-500"></i>${escapeHtml(m.adresseLivraison)}</p>
      <p class="mt-1 text-xs text-slate-500"><i class="fa-solid fa-shop mr-1.5 text-slate-900"></i>Collecte : ${escapeHtml(m.nomAtelier)}</p>
      <p class="mt-1 text-xs text-slate-500">${escapeHtml(m.adresseCollecte)}</p>
      ${m.telephoneClient ? `<a href="tel:${escapeHtml(m.telephoneClient)}" class="mt-2 inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700"><i class="fa-solid fa-phone"></i> Appeler le client</a>` : ""}
      ${actionHtml}
    </div>
  `;

  document.getElementById("btnAccepterSuivi")?.addEventListener("click", async () => {
    try {
      await accepterLivraison(m.id);
      showToast("Livraison acceptée. Récupérez le meuble chez l'artisan.");
      await renderLivreurSuiviPage();
    } catch (error) {
      showToast(error.message, "error");
    }
  });

  document.getElementById("btnLivreeSuivi")?.addEventListener("click", () => {
    openConfirm({
      message: "Confirmer que ce meuble a bien été livré au client ?",
      confirmLabel: "Confirmer la livraison",
      onConfirm: async () => {
        try {
          await marquerLivraisonEffectuee(m.id, m.commandeId);
          showToast("Livraison finalisée. La commande est marquée terminée.");
          await renderLivreurSuiviPage();
        } catch (error) {
          showToast(error.message, "error");
        }
      }
    });
  });
}