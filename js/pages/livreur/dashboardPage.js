import { getAllLivraisons } from "../../services/livraisonservice.js";
import { getAllCommandes, getAllLignesCommande } from "../../services/commandeservice.js";
import { getAllProduits } from "../../services/produitservice.js";
import { getAllUtilisateurs } from "../../services/utilisateurservice.js";
import { getSession } from "../../utils/session.js";
import { escapeHtml } from "../../utils/html.js";

// Visuel de la carte de tournée (image statique pour le moment).
// Placez le fichier dans assets/images/, à côté de index.html :
const IMAGE_CARTE_TOURNEE = "../../../assets/images/carte-tournee-livreur.png";

const LABEL_STATUT_LIVRAISON = {
  EN_COURS: "En cours",
  ATTRIBUEE: "Attribuée",
  LIVREE: "Livrée",
  ANNULEE: "Annulée"
};

const CLASSE_STATUT_LIVRAISON = {
  EN_COURS: "bg-blue-50 text-blue-700",
  ATTRIBUEE: "bg-amber-50 text-amber-700",
  LIVREE: "bg-emerald-50 text-emerald-700",
  ANNULEE: "bg-rose-50 text-rose-700"
};

export async function renderLivreurDashboard() {
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

    const mesLivraisons = livraisons.filter(l => l.livreurId === session.id);
    const aujourdHuiStr = new Date().toISOString().split("T")[0];
    const aujourdHui = new Date();
    const estMemeMois = (dateStr) => {
      if (!dateStr) return false;
      const d = new Date(dateStr);
      return d.getMonth() === aujourdHui.getMonth() && d.getFullYear() === aujourdHui.getFullYear();
    };

    const aLivrerAujourdhui = mesLivraisons.filter(l => l.dateLivraison === aujourdHuiStr && l.statut !== "LIVREE");
    const enCours = mesLivraisons.filter(l => l.statut === "EN_COURS");
    const livreesCeMois = mesLivraisons.filter(l => l.statut === "LIVREE" && estMemeMois(l.dateLivree));
    const annulees = mesLivraisons.filter(l => l.statut === "ANNULEE");
    const totalTerminees = livreesCeMois.length + annulees.length;
    const tauxReussite = totalTerminees > 0
      ? `${((mesLivraisons.filter(l => l.statut === "LIVREE").length / (mesLivraisons.filter(l => l.statut === "LIVREE").length + annulees.length || 1)) * 100).toFixed(1)}%`
      : "—";

    // Jointure livraison -> commande -> client, et -> lignesCommande -> produit -> artisan
    const enrichir = (livraison) => {
      const commande = commandes.find(c => c.id === livraison.commandeId);
      const client = utilisateurs.find(u => u.id === commande?.clientId);
      const lignes = lignesCommande.filter(l => l.commandeId === livraison.commandeId);
      const produit = produits.find(p => p.id === lignes[0]?.produitId);
      const artisan = utilisateurs.find(u => u.id === produit?.artisanId);
      return {
        ...livraison,
        nomClient: client ? `${client.prenom} ${client.nom}` : "Client inconnu",
        adresseLivraison: commande?.adresseLivraison || "—",
        nomAtelier: artisan?.atelier || "Atelier inconnu"
      };
    };

    const missionsDuJour = mesLivraisons
      .filter(l => l.dateLivraison === aujourdHuiStr)
      .map(enrichir);

    app.innerHTML = `
      <section class="space-y-6">
        <div class="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 class="flex flex-wrap items-baseline gap-2 text-2xl font-black text-slate-950">
              Tableau de bord
              <span class="text-sm font-bold text-slate-400">· Agent Logistique</span>
            </h1>
            <p class="mt-1 text-sm text-slate-500">Planning d'aujourd'hui, statut des livraisons attribuées et itinéraire cartographique intelligent.</p>
          </div>
          <span class="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs font-black text-emerald-700">
            <i class="fa-solid fa-circle text-[6px]"></i> Actif & Disponible
          </span>
        </div>

        <div class="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          ${carteStat("À livrer aujourd'hui", aLivrerAujourdhui.length, "Dakar & Banlieues", "fa-calendar-day", "bg-blue-50 text-blue-600")}
          ${carteStat("Missions en cours", enCours.length, "En transit", "fa-location-arrow", "bg-amber-50 text-amber-600")}
          ${carteStat("Livrées ce mois", livreesCeMois.length, "Archivées avec succès", "fa-circle-check", "bg-emerald-50 text-emerald-600")}
          ${carteStat("Mes gains (mois)", "—", "Non calculable pour l'instant", "fa-sack-dollar", "bg-indigo-50 text-indigo-600")}
          ${carteStat("Taux de réussite", tauxReussite, tauxReussite !== "—" ? "Excellence client" : "Pas encore de données", "fa-chart-line", "bg-orange-50 text-orange-600")}
        </div>

        <div class="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
          <article class="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div class="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 class="text-sm font-black text-slate-950">Carte interactive de tournée</h2>
                <p class="text-xs text-slate-400">Points de collecte (Artisans) et destinations (Clients).</p>
              </div>
              <span class="text-[11px] font-bold text-slate-400">Cliquez sur "Détails" pour tracer un itinéraire</span>
            </div>
            <img src="${IMAGE_CARTE_TOURNEE}" alt="Carte de tournée" class="mt-4 w-full rounded-2xl" />
          </article>

          <article id="panneauMission" class="flex flex-col items-center justify-center rounded-3xl border border-slate-200 bg-white p-6 text-center shadow-sm">
            <span class="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
              <i class="fa-solid fa-location-arrow"></i>
            </span>
            <p class="mt-3 text-sm font-black text-slate-950">Aucune mission sélectionnée</p>
            <p class="mt-1 text-xs text-slate-400">Cliquez sur "Détails" dans le tableau ci-dessous pour afficher les informations de la mission.</p>
          </article>
        </div>

        <article class="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div class="flex items-center justify-between">
            <h2 class="text-sm font-black text-slate-950">Missions de livraison planifiées (Aujourd'hui)</h2>
            <button id="btnVoirToutesLivraisons" class="text-xs font-black text-emerald-700 hover:underline">Voir toutes les livraisons</button>
          </div>

          <div class="mt-3 overflow-x-auto">
            <table class="w-full border-collapse text-left text-xs">
              <thead>
                <tr class="text-slate-400">
                  <th class="py-2 font-black uppercase">Numéro</th>
                  <th class="py-2 font-black uppercase">Client</th>
                  <th class="py-2 font-black uppercase">Artisan d'origine</th>
                  <th class="py-2 font-black uppercase">Adresse de livraison</th>
                  <th class="py-2 font-black uppercase">Statut</th>
                  <th class="py-2 text-right font-black uppercase">Action</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100">
                ${missionsDuJour.length ? missionsDuJour.map(ligneMissionHtml).join("") : `<tr><td colspan="6" class="py-6 text-center font-bold text-slate-400">Aucune mission planifiée aujourd'hui.</td></tr>`}
              </tbody>
            </table>
          </div>
        </article>
      </section>
    `;

    document.getElementById("btnVoirToutesLivraisons").addEventListener("click", () => {
      document.getElementById("panneauMission").innerHTML = `
        <p class="text-xs font-bold text-slate-400">La page complète des livraisons arrive bientôt.</p>
      `;
    });

    document.querySelectorAll("[data-details-mission]").forEach(btn => {
      btn.addEventListener("click", () => {
        const mission = missionsDuJour.find(m => m.id === btn.dataset.detailsMission);
        if (!mission) return;
        document.getElementById("panneauMission").innerHTML = `
          <div class="w-full text-left">
            <p class="text-[10px] font-black uppercase text-slate-400">Mission ${escapeHtml(mission.id)}</p>
            <p class="mt-2 text-sm font-black text-slate-950">${escapeHtml(mission.nomClient)}</p>
            <p class="mt-1 text-xs text-slate-500"><i class="fa-solid fa-location-dot mr-1.5 text-rose-500"></i>${escapeHtml(mission.adresseLivraison)}</p>
            <p class="mt-1 text-xs text-slate-500"><i class="fa-solid fa-shop mr-1.5 text-slate-900"></i>Collecte : ${escapeHtml(mission.nomAtelier)}</p>
            <span class="mt-3 inline-flex items-center rounded-md px-2 py-1 text-[10px] font-black uppercase ${CLASSE_STATUT_LIVRAISON[mission.statut] || "bg-slate-100 text-slate-600"}">
              ${escapeHtml(LABEL_STATUT_LIVRAISON[mission.statut] || mission.statut)}
            </span>
          </div>
        `;
      });
    });
  } catch (error) {
    app.innerHTML = `<p class="text-rose-600 font-bold p-4">Erreur : ${escapeHtml(error.message)}</p>`;
  }
}

function carteStat(titre, valeur, sousTitre, icone, classeIcone) {
  return `
    <article class="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div class="flex items-center justify-between">
        <span class="text-[10px] font-black uppercase tracking-wider text-slate-400">${titre}</span>
        <span class="flex h-8 w-8 items-center justify-center rounded-xl ${classeIcone}">
          <i class="fa-solid ${icone} text-xs"></i>
        </span>
      </div>
      <p class="mt-2 text-2xl font-black text-slate-950">${valeur}</p>
      <p class="mt-0.5 text-[11px] font-bold text-slate-500">${sousTitre}</p>
    </article>
  `;
}

function ligneMissionHtml(m) {
  const classeStatut = CLASSE_STATUT_LIVRAISON[m.statut] || "bg-slate-100 text-slate-600";
  return `
    <tr>
      <td class="py-3 font-black text-slate-950">${escapeHtml(m.id)}</td>
      <td class="py-3 font-semibold text-slate-700">${escapeHtml(m.nomClient)}</td>
      <td class="py-3 text-slate-600">${escapeHtml(m.nomAtelier)}</td>
      <td class="py-3 max-w-[200px] truncate text-slate-600">${escapeHtml(m.adresseLivraison)}</td>
      <td class="py-3">
        <span class="inline-flex items-center rounded-md px-2 py-1 text-[10px] font-black uppercase ${classeStatut}">
          ${escapeHtml(LABEL_STATUT_LIVRAISON[m.statut] || m.statut)}
        </span>
      </td>
      <td class="py-3 text-right">
        <button data-details-mission="${escapeHtml(m.id)}" class="rounded-lg border border-slate-200 px-3 py-1.5 text-[11px] font-black text-slate-700 transition hover:bg-slate-50">Détails</button>
      </td>
    </tr>
  `;
}