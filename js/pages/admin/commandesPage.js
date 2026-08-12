import { getAllCommandes, getAllLignesCommande } from "../../services/commandeservice.js";
import { getAllProduits } from "../../services/produitservice.js";
import { getAllUtilisateurs } from "../../services/utilisateurservice.js";
import { assignerLivreur } from "../../services/livraisonservice.js";
import { escapeHtml } from "../../utils/html.js";
import { showToast } from "../../components/toast.js";
import { openModal } from "../../components/modal.js";
import { STATUTS_COMMANDE, labelStatutCommande, classeStatutCommande } from "../../utils/constantes.js";

let filtreStatut = "tout";
let commandesEnrichies = [];

export async function renderAdminCommandesPage() {
  const app = document.getElementById("app");

  try {
    const [commandes, lignesCommande, produits, utilisateurs] = await Promise.all([
      getAllCommandes(),
      getAllLignesCommande(),
      getAllProduits(),
      getAllUtilisateurs()
    ]);

    commandesEnrichies = commandes
      .map(c => {
        const client = utilisateurs.find(u => u.id === c.clientId);
        const lignes = lignesCommande.filter(l => l.commandeId === c.id);
        const nomsProduits = lignes.map(l => produits.find(p => p.id === l.produitId)?.nom).filter(Boolean).join(", ");
        return { ...c, nomClient: client ? `${client.prenom} ${client.nom}` : "Client inconnu", nomsProduits: nomsProduits || "—" };
      })
      .sort((a, b) => new Date(b.dateCommande || 0) - new Date(a.dateCommande || 0));

    const livreursDisponibles = utilisateurs.filter(u => u.role === "livreur" && u.supprime !== true);

    app.innerHTML = `
      <section class="space-y-6">
        <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <span class="text-xs font-black uppercase tracking-[0.2em] text-amber-700">Suivi global</span>
            <h1 class="mt-1 text-2xl font-black text-slate-950">Commandes</h1>
            <p class="mt-0.5 text-xs text-slate-400">Les commandes "Prêt à livrer" attendent l'attribution d'un livreur.</p>
          </div>

          <select id="filtreStatutCommandeAdmin" class="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs font-black text-slate-700 outline-none cursor-pointer transition hover:border-[#0B132B] focus:border-[#0B132B]">
            <option value="tout">Tous les statuts</option>
            ${Object.keys(STATUTS_COMMANDE).map(s => `<option value="${s}">${labelStatutCommande(s)}</option>`).join("")}
          </select>
        </div>

        <article class="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div class="overflow-x-auto">
            <table class="w-full border-collapse text-left text-xs">
              <thead class="bg-[#0B132B] text-white font-black uppercase tracking-wider">
                <tr>
                  <th class="px-5 py-4 rounded-tl-3xl">Numéro</th>
                  <th class="px-5 py-4">Client</th>
                  <th class="px-5 py-4">Produits</th>
                  <th class="px-5 py-4">Montant</th>
                  <th class="px-5 py-4">Date</th>
                  <th class="px-5 py-4">Statut</th>
                  <th class="px-5 py-4 text-right rounded-tr-3xl">Action</th>
                </tr>
              </thead>
              <tbody id="corpsCommandesAdmin" class="divide-y divide-slate-100 font-medium text-slate-700"></tbody>
            </table>
          </div>
        </article>
      </section>
    `;

    document.getElementById("filtreStatutCommandeAdmin").addEventListener("change", (e) => {
      filtreStatut = e.target.value;
      afficherLignes(livreursDisponibles);
    });

    afficherLignes(livreursDisponibles);
  } catch (error) {
    app.innerHTML = `<p class="text-rose-600 font-bold p-4">Erreur : ${escapeHtml(error.message)}</p>`;
  }
}

function afficherLignes(livreursDisponibles) {
  const corps = document.getElementById("corpsCommandesAdmin");
  if (!corps) return;

  const liste = filtreStatut === "tout" ? commandesEnrichies : commandesEnrichies.filter(c => c.statut === filtreStatut);

  if (!liste.length) {
    corps.innerHTML = `<tr><td colspan="7" class="px-5 py-10 text-center font-bold text-slate-400">Aucune commande pour ce filtre.</td></tr>`;
    return;
  }

  corps.innerHTML = liste.map(c => `
    <tr class="hover:bg-slate-50/50 transition">
      <td class="px-5 py-3 font-black text-slate-950">${escapeHtml(c.id)}</td>
      <td class="px-5 py-3">${escapeHtml(c.nomClient)}</td>
      <td class="px-5 py-3 max-w-[220px] truncate">${escapeHtml(c.nomsProduits)}</td>
      <td class="px-5 py-3 font-mono font-bold text-slate-900">${Number(c.montant).toLocaleString()} FCFA</td>
      <td class="px-5 py-3 text-slate-500">${escapeHtml(c.dateCommande || "—")}</td>
      <td class="px-5 py-3">
        <span class="inline-flex items-center rounded-md px-2 py-1 text-[10px] font-black uppercase ${classeStatutCommande(c.statut)}">
          ${escapeHtml(labelStatutCommande(c.statut))}
        </span>
      </td>
      <td class="px-5 py-3 text-right">
        ${c.statut === "PRET_A_LIVRER"
          ? `<button data-assigner="${escapeHtml(c.id)}" class="rounded-lg bg-blue-600 px-3 py-2 text-[11px] font-black text-white transition hover:bg-blue-700">Assigner un livreur</button>`
          : `<span class="text-[11px] text-slate-300">—</span>`}
      </td>
    </tr>
  `).join("");

  document.querySelectorAll("[data-assigner]").forEach(btn => {
    btn.addEventListener("click", () => ouvrirAssignationLivreur(btn.dataset.assigner, livreursDisponibles));
  });
}

function ouvrirAssignationLivreur(commandeId, livreurs) {
  if (!livreurs.length) {
    showToast("Aucun livreur disponible dans le système.", "error");
    return;
  }

  const options = livreurs.map(l => `<option value="${l.id}">${escapeHtml(l.prenom)} ${escapeHtml(l.nom)} — ${escapeHtml(l.zone || "Zone non définie")}</option>`).join("");

  openModal({
    title: "Assigner un livreur",
    icon: "fa-truck",
    iconClass: "bg-blue-100 text-blue-700",
    body: `
      <div>
        <label class="mb-2 block text-xs font-extrabold uppercase tracking-[0.14em] text-slate-500">Livreur disponible *</label>
        <select id="selectLivreur" class="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-800 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100">
          ${options}
        </select>
      </div>
    `,
    confirmLabel: "Assigner",
    confirmIcon: "fa-truck",
    confirmClass: "bg-blue-600 shadow-blue-100 hover:bg-blue-700",
    onConfirm: async (overlay) => {
      const livreurId = overlay.querySelector("#selectLivreur").value;
      try {
        await assignerLivreur(commandeId, livreurId);
        showToast("Livreur assigné, la commande passe en livraison.");
        await renderAdminCommandesPage();
      } catch (error) {
        showToast(error.message, "error");
        return false;
      }
    }
  });
}