import { getAllLivraisons } from "../../services/livraisonservice.js";
import { getAllCommandes, getAllLignesCommande } from "../../services/commandeservice.js";
import { getAllProduits } from "../../services/produitservice.js";
import { getAllUtilisateurs } from "../../services/utilisateurservice.js";
import { getSession } from "../../utils/session.js";
import { escapeHtml } from "../../utils/html.js";
import { labelStatutLivraison, classeStatutLivraison } from "../../utils/constantes.js";

let historiqueComplet = [];
let filtreTexte = "";

export async function renderLivreurHistoriquePage() {
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

    historiqueComplet = livraisons
      .filter(l => l.livreurId === session.id && (l.statut === "LIVREE" || l.statut === "ANNULEE"))
      .map(l => {
        const commande = commandes.find(c => c.id === l.commandeId);
        const client = utilisateurs.find(u => u.id === commande?.clientId);
        const lignes = lignesCommande.filter(ln => ln.commandeId === l.commandeId);
        const produit = produits.find(p => p.id === lignes[0]?.produitId);
        return {
          ...l,
          nomClient: client ? `${client.prenom} ${client.nom}` : "Client inconnu",
          nomProduit: produit?.nom || "—",
          adresseLivraison: commande?.adresseLivraison || "—"
        };
      })
      .sort((a, b) => new Date(b.dateLivree || b.dateLivraison || 0) - new Date(a.dateLivree || a.dateLivraison || 0));

    const nombreLivrees = historiqueComplet.filter(l => l.statut === "LIVREE").length;

    app.innerHTML = `
      <section class="space-y-6">
        <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <span class="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Archives</span>
            <h1 class="mt-1 text-2xl font-black text-slate-950">Historique</h1>
            <p class="mt-0.5 text-xs text-slate-400">${nombreLivrees} livraison(s) effectuée(s) au total.</p>
          </div>
          <div class="relative flex items-center">
            <div class="absolute left-3 text-slate-400"><i class="fa-solid fa-magnifying-glass text-xs"></i></div>
            <input type="text" id="rechercheHistorique" class="w-full sm:w-72 pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold text-slate-800 outline-none transition focus:border-emerald-700 focus:bg-white" placeholder="Rechercher par client, produit..." />
          </div>
        </div>

        <article class="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div class="overflow-x-auto">
            <table class="w-full border-collapse text-left text-xs">
              <thead class="bg-slate-50">
                <tr>
                  <th class="px-5 py-4 font-black uppercase text-slate-500">Numéro</th>
                  <th class="px-5 py-4 font-black uppercase text-slate-500">Client</th>
                  <th class="px-5 py-4 font-black uppercase text-slate-500">Produit</th>
                  <th class="px-5 py-4 font-black uppercase text-slate-500">Adresse</th>
                  <th class="px-5 py-4 font-black uppercase text-slate-500">Date</th>
                  <th class="px-5 py-4 font-black uppercase text-slate-500">Statut</th>
                </tr>
              </thead>
              <tbody id="corpsHistorique" class="divide-y divide-slate-100"></tbody>
            </table>
          </div>
        </article>
      </section>
    `;

    document.getElementById("rechercheHistorique").addEventListener("input", (e) => {
      filtreTexte = e.target.value;
      afficherHistorique();
    });

    afficherHistorique();
  } catch (error) {
    app.innerHTML = `<p class="text-rose-600 font-bold p-4">Erreur : ${escapeHtml(error.message)}</p>`;
  }
}

function afficherHistorique() {
  const corps = document.getElementById("corpsHistorique");
  if (!corps) return;

  const texte = filtreTexte.toLowerCase().trim();
  const liste = historiqueComplet.filter(l =>
    !texte || [l.nomClient, l.nomProduit].join(" ").toLowerCase().includes(texte)
  );

  if (!liste.length) {
    corps.innerHTML = `<tr><td colspan="6" class="px-5 py-10 text-center font-bold text-slate-400">Aucune livraison dans l'historique.</td></tr>`;
    return;
  }

  corps.innerHTML = liste.map(l => `
    <tr class="hover:bg-slate-50/50 transition">
      <td class="px-5 py-3 font-black text-slate-950">${escapeHtml(l.id)}</td>
      <td class="px-5 py-3 text-slate-700">${escapeHtml(l.nomClient)}</td>
      <td class="px-5 py-3 text-slate-600">${escapeHtml(l.nomProduit)}</td>
      <td class="px-5 py-3 max-w-[200px] truncate text-slate-600">${escapeHtml(l.adresseLivraison)}</td>
      <td class="px-5 py-3 text-slate-500">${escapeHtml(l.dateLivree || l.dateLivraison || "—")}</td>
      <td class="px-5 py-3">
        <span class="inline-flex items-center rounded-md px-2 py-1 text-[10px] font-black uppercase ${classeStatutLivraison(l.statut)}">
          ${escapeHtml(labelStatutLivraison(l.statut))}
        </span>
      </td>
    </tr>
  `).join("");
}