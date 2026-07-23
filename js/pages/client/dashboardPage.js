import { getCommandesParClient, getAllLignesCommande } from "../../services/commandeservice.js";
import { getAllProduits } from "../../services/produitservice.js";
import { getAllDemandesSurMesure } from "../../services/demandeSurMesureservice.js";
import { getAvisParClient } from "../../services/avisservice.js";
import { getSession } from "../../utils/session.js";
import { escapeHtml } from "../../utils/html.js";
import { showToast } from "../../components/toast.js";
import { navigate } from "../../router.js";

const LABEL_STATUT_COMMANDE = {
  EN_ATTENTE: "En attente",
  EN_COURS: "En cours",
  PRETE: "Prête",
  LIVREE: "Livrée",
  ANNULEE: "Annulée"
};

const CLASSE_STATUT_COMMANDE = {
  EN_ATTENTE: "bg-slate-100 text-slate-600",
  EN_COURS: "bg-amber-50 text-amber-700",
  PRETE: "bg-blue-50 text-blue-700",
  LIVREE: "bg-emerald-50 text-emerald-700",
  ANNULEE: "bg-rose-50 text-rose-700"
};

export async function renderClientDashboard() {
  const app = document.getElementById("app");
  const session = getSession();

  try {
    const [commandes, lignesCommande, produits, demandesSurMesure, avis] = await Promise.all([
      getCommandesParClient(session.id),
      getAllLignesCommande(),
      getAllProduits(),
      getAllDemandesSurMesure(),
      getAvisParClient(session.id)
    ]);

    const mesDemandesSurMesure = demandesSurMesure.filter(d => d.clientId === session.id);

    const commandesEnrichies = commandes
      .map(c => {
        const lignes = lignesCommande.filter(l => l.commandeId === c.id);
        const nomsProduits = lignes
          .map(l => produits.find(p => p.id === l.produitId)?.nom)
          .filter(Boolean)
          .join(", ");
        return { ...c, nomsProduits: nomsProduits || "—" };
      })
      .sort((a, b) => new Date(b.dateCommande || 0) - new Date(a.dateCommande || 0));

    app.innerHTML = `
      <section class="space-y-6">
        <div>
          <h1 class="text-2xl font-black text-slate-950">Tableau de bord</h1>
          <p class="mt-1 text-sm text-slate-500">Consultez l'état de vos commandes, vos favoris et vos demandes sur mesure.</p>
        </div>

        <div class="grid grid-cols-2 gap-4 sm:grid-cols-4">
          ${carteStat("Commandes", commandes.length, "Achat(s) réalisé(s)", "fa-bag-shopping", "bg-emerald-50 text-emerald-600")}
          ${carteStat("Favoris", 0, "Meubles sauvegardés", "fa-heart", "bg-rose-50 text-rose-600")}
          ${carteStat("Sur mesure", mesDemandesSurMesure.length, "Projet(s) déposé(s)", "fa-file-lines", "bg-amber-50 text-amber-600")}
          ${carteStat("Avis publiés", avis.length, "Commentaire(s) partagé(s)", "fa-star", "bg-blue-50 text-blue-600")}
        </div>

        <article class="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div class="flex items-center justify-between">
            <h2 class="text-sm font-black text-slate-950">Dernières Commandes</h2>
            <button id="btnVoirToutesCommandes" class="text-xs font-black text-emerald-700 hover:underline">Voir tout</button>
          </div>

          <div class="mt-3 overflow-x-auto">
            <table class="w-full border-collapse text-left text-xs">
              <thead>
                <tr class="text-slate-400">
                  <th class="py-2 font-black uppercase">Numéro</th>
                  <th class="py-2 font-black uppercase">Date</th>
                  <th class="py-2 font-black uppercase">Produits</th>
                  <th class="py-2 font-black uppercase">Montant</th>
                  <th class="py-2 font-black uppercase">Statut</th>
                  <th class="py-2 text-right font-black uppercase">Action</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100">
                ${commandesEnrichies.length
                  ? commandesEnrichies.slice(0, 3).map(ligneCommandeHtml).join("")
                  : `<tr><td colspan="6" class="py-6 text-center font-bold text-slate-400">Vous n'avez pas encore passé de commande.</td></tr>`}
              </tbody>
            </table>
          </div>
        </article>
      </section>
    `;

    document.getElementById("btnVoirToutesCommandes").addEventListener("click", () => navigate("client/commandes"));
    document.querySelectorAll("[data-voir-commande]").forEach(btn => {
      btn.addEventListener("click", () => showToast("Le détail de la commande arrive bientôt."));
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

function ligneCommandeHtml(c) {
  const classeStatut = CLASSE_STATUT_COMMANDE[c.statut] || "bg-slate-100 text-slate-600";
  return `
    <tr>
      <td class="py-3 font-black text-slate-950">${escapeHtml(c.id)}</td>
      <td class="py-3 text-slate-500">${escapeHtml(c.dateCommande || "—")}</td>
      <td class="py-3 max-w-[220px] truncate text-slate-600">${escapeHtml(c.nomsProduits)}</td>
      <td class="py-3 font-mono font-black text-slate-900">${Number(c.montant).toLocaleString()} FCFA</td>
      <td class="py-3">
        <span class="inline-flex items-center rounded-md px-2 py-1 text-[10px] font-black uppercase ${classeStatut}">
          ${escapeHtml(LABEL_STATUT_COMMANDE[c.statut] || c.statut)}
        </span>
      </td>
      <td class="py-3 text-right">
        <button data-voir-commande="${escapeHtml(c.id)}" class="rounded-lg border border-slate-200 px-3 py-1.5 text-[11px] font-black text-slate-700 transition hover:bg-slate-50">Voir</button>
      </td>
    </tr>
  `;
}