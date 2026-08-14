import { getCommandesParClient } from "../../services/commandeservice.js";
import { getAllLivraisons } from "../../services/livraisonservice.js";
import { getAllUtilisateurs } from "../../services/utilisateurservice.js";
import { getSession } from "../../utils/session.js";
import { escapeHtml } from "../../utils/html.js";
import { labelStatutLivraison, classeStatutLivraison } from "../../utils/constantes.js";

export async function renderClientLivraisonsPage() {
  const app = document.getElementById("app");
  const session = getSession();

  try {
    const [commandes, livraisons, utilisateurs] = await Promise.all([
      getCommandesParClient(session.id),
      getAllLivraisons(),
      getAllUtilisateurs()
    ]);

    const mesCommandeIds = commandes.map(c => c.id);

    const mesLivraisons = livraisons
      .filter(l => mesCommandeIds.includes(l.commandeId))
      .map(l => {
        const commande = commandes.find(c => c.id === l.commandeId);
        const livreur = utilisateurs.find(u => u.id === l.livreurId);
        return {
          ...l,
          adresseLivraison: commande?.adresseLivraison || "—",
          nomLivreur: livreur ? `${livreur.prenom} ${livreur.nom}` : "Non assigné",
          telephoneLivreur: livreur?.telephone || ""
        };
      })
      .sort((a, b) => new Date(b.dateLivraison || 0) - new Date(a.dateLivraison || 0));

    app.innerHTML = `
      <section class="space-y-6">
        <div>
          <span class="text-xs font-black uppercase tracking-[0.2em] text-emerald-700">Suivi</span>
          <h1 class="mt-1 text-2xl font-black text-slate-950">Suivi des Livraisons</h1>
          <p class="mt-0.5 text-xs text-slate-400">Suivez l'acheminement de vos meubles jusqu'à votre porte.</p>
        </div>

        <div class="grid gap-4">
          ${mesLivraisons.length
            ? mesLivraisons.map(carteHtml).join("")
            : `<div class="rounded-3xl border border-dashed border-slate-300 bg-slate-50 px-5 py-10 text-center text-sm font-semibold text-slate-500">Aucune livraison en cours pour l'instant.</div>`}
        </div>
      </section>
    `;
  } catch (error) {
    app.innerHTML = `<p class="text-rose-600 font-bold p-4">Erreur : ${escapeHtml(error.message)}</p>`;
  }
}

function carteHtml(l) {
  const etapes = ["ATTRIBUEE", "EN_LIVRAISON", "LIVREE"];
  const etapeActuelle = etapes.indexOf(l.statut);

  const barreEtapes = etapes.map((e, i) => `
    <div class="flex-1 h-1.5 rounded-full ${i <= etapeActuelle ? "bg-emerald-600" : "bg-slate-100"}"></div>
  `).join("");

  return `
    <article class="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div class="flex items-center justify-between">
        <p class="text-sm font-black text-slate-950">${escapeHtml(l.id)}</p>
        <span class="inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-black uppercase ${classeStatutLivraison(l.statut)}">
          ${escapeHtml(labelStatutLivraison(l.statut))}
        </span>
      </div>

      <div class="mt-4 flex gap-1.5">${barreEtapes}</div>
      <div class="mt-1.5 flex justify-between text-[10px] font-bold text-slate-400">
        <span>Attribuée</span>
        <span>En livraison</span>
        <span>Livrée</span>
      </div>

      <div class="mt-4 space-y-1 text-xs text-slate-600">
        <p><i class="fa-solid fa-location-dot mr-1.5 text-slate-400"></i>${escapeHtml(l.adresseLivraison)}</p>
        <p><i class="fa-solid fa-truck mr-1.5 text-slate-400"></i>Livreur : ${escapeHtml(l.nomLivreur)}</p>
        ${l.telephoneLivreur ? `<p><i class="fa-solid fa-phone mr-1.5 text-slate-400"></i>${escapeHtml(l.telephoneLivreur)}</p>` : ""}
      </div>
    </article>
  `;
}