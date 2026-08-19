import { getAllLivraisons, reassignerLivreur } from "../../services/livraisonservice.js";
import { getAllCommandes, getAllLignesCommande } from "../../services/commandeservice.js";
import { getAllProduits } from "../../services/produitservice.js";
import { getAllUtilisateurs } from "../../services/utilisateurservice.js";
import { escapeHtml } from "../../utils/html.js";
import { showToast } from "../../components/toast.js";
import { openModal } from "../../components/modal.js";
import { labelStatutLivraison, classeStatutLivraison } from "../../utils/constantes.js";

let livraisonsEnrichies = [];
let livreursDisponibles = [];
let filtreTexte = "";
let filtreStatut = "tout";

export async function renderAdminLivraisonsPage() {
  const app = document.getElementById("app");

  try {
    const [livraisons, commandes, lignesCommande, produits, utilisateurs] = await Promise.all([
      getAllLivraisons(),
      getAllCommandes(),
      getAllLignesCommande(),
      getAllProduits(),
      getAllUtilisateurs()
    ]);

    livreursDisponibles = utilisateurs.filter(u => u.role === "livreur" && u.supprime !== true);

    livraisonsEnrichies = livraisons
      .map(l => {
        const commande = commandes.find(c => c.id === l.commandeId);
        const client = utilisateurs.find(u => u.id === commande?.clientId);
        const livreur = utilisateurs.find(u => u.id === l.livreurId);
        const lignes = lignesCommande.filter(ln => ln.commandeId === l.commandeId);
        const produit = produits.find(p => p.id === lignes[0]?.produitId);
        const artisan = utilisateurs.find(u => u.id === produit?.artisanId);

        return {
          ...l,
          nomClient: client ? `${client.prenom} ${client.nom}` : "Client inconnu",
          nomLivreur: livreur ? `${livreur.prenom} ${livreur.nom}` : "Non assigné",
          nomAtelier: artisan?.atelier || "Atelier inconnu",
          adresseLivraison: commande?.adresseLivraison || "—"
        };
      })
      .sort((a, b) => new Date(b.dateLivraison || 0) - new Date(a.dateLivraison || 0));

    app.innerHTML = `
      <section class="space-y-6">
        <div>
          <span class="text-xs font-black uppercase tracking-[0.2em] text-amber-700">Logistique</span>
          <h1 class="mt-1 text-2xl font-black text-slate-950">Livraisons</h1>
          <p class="mt-0.5 text-xs text-slate-400">Suivi global de toutes les livraisons attribuées aux livreurs.</p>
        </div>

        <div class="grid gap-4 rounded-2xl border border-black/5 bg-white p-4 shadow-sm sm:grid-cols-[1fr_auto]">
          <div class="relative flex items-center">
            <div class="absolute left-3 text-slate-400"><i class="fa-solid fa-magnifying-glass text-xs"></i></div>
            <input type="text" id="rechercheLivraisonAdmin" class="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold text-slate-800 outline-none transition focus:border-[#0B132B] focus:bg-white" placeholder="Rechercher par client, livreur, numéro..." />
          </div>

          <select id="filtreStatutLivraisonAdmin" class="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs font-black text-slate-700 outline-none cursor-pointer transition hover:border-[#0B132B] focus:border-[#0B132B]">
            <option value="tout">Tous les statuts</option>
            <option value="ATTRIBUEE">Attribuée</option>
            <option value="EN_LIVRAISON">En livraison</option>
            <option value="LIVREE">Livrée</option>
            <option value="ANNULEE">Annulée</option>
          </select>
        </div>

        <p id="compteurLivraisonsAdmin" class="text-xs font-bold text-slate-500"></p>

        <article class="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div class="overflow-x-auto">
            <table class="w-full border-collapse text-left text-xs">
              <thead class="bg-[#0B132B] text-white font-black uppercase tracking-wider">
                <tr>
                  <th class="px-5 py-4 rounded-tl-3xl">Numéro</th>
                  <th class="px-5 py-4">Client</th>
                  <th class="px-5 py-4">Livreur</th>
                  <th class="px-5 py-4">Atelier de collecte</th>
                  <th class="px-5 py-4">Adresse</th>
                  <th class="px-5 py-4">Statut</th>
                  <th class="px-5 py-4 text-right rounded-tr-3xl">Action</th>
                </tr>
              </thead>
              <tbody id="corpsLivraisonsAdmin" class="divide-y divide-slate-100 font-medium text-slate-700"></tbody>
            </table>
          </div>
        </article>
      </section>
    `;

    document.getElementById("rechercheLivraisonAdmin").addEventListener("input", (e) => {
      filtreTexte = e.target.value;
      afficherLignes();
    });

    document.getElementById("filtreStatutLivraisonAdmin").addEventListener("change", (e) => {
      filtreStatut = e.target.value;
      afficherLignes();
    });

    afficherLignes();
  } catch (error) {
    app.innerHTML = `<p class="text-rose-600 font-bold p-4">Erreur : ${escapeHtml(error.message)}</p>`;
  }
}

function listeFiltree() {
  return livraisonsEnrichies.filter(l => {
    const correspondStatut = filtreStatut === "tout" || l.statut === filtreStatut;
    const texte = filtreTexte.toLowerCase().trim();
    const correspondTexte = !texte || [l.id, l.nomClient, l.nomLivreur].join(" ").toLowerCase().includes(texte);
    return correspondStatut && correspondTexte;
  });
}

function afficherLignes() {
  const corps = document.getElementById("corpsLivraisonsAdmin");
  const compteur = document.getElementById("compteurLivraisonsAdmin");
  if (!corps) return;

  const liste = listeFiltree();
  compteur.textContent = `${liste.length} livraison(s) trouvée(s)`;

  if (!liste.length) {
    corps.innerHTML = `<tr><td colspan="7" class="px-5 py-10 text-center font-bold text-slate-400">Aucune livraison ne correspond à vos critères.</td></tr>`;
    return;
  }

  corps.innerHTML = liste.map(l => `
    <tr class="hover:bg-slate-50/50 transition">
      <td class="px-5 py-3 font-black text-slate-950">${escapeHtml(l.id)}</td>
      <td class="px-5 py-3">${escapeHtml(l.nomClient)}</td>
      <td class="px-5 py-3">${escapeHtml(l.nomLivreur)}</td>
      <td class="px-5 py-3 text-slate-600">${escapeHtml(l.nomAtelier)}</td>
      <td class="px-5 py-3 max-w-[200px] truncate text-slate-600">${escapeHtml(l.adresseLivraison)}</td>
      <td class="px-5 py-3">
        <span class="inline-flex items-center rounded-md px-2 py-1 text-[10px] font-black uppercase ${classeStatutLivraison(l.statut)}">
          ${escapeHtml(labelStatutLivraison(l.statut))}
        </span>
      </td>
      <td class="px-5 py-3 text-right">
        ${l.statut === "ATTRIBUEE" || l.statut === "EN_LIVRAISON"
          ? `<button data-reassigner="${escapeHtml(l.id)}" class="rounded-lg border border-slate-200 bg-white px-3 py-2 text-[11px] font-black text-slate-700 transition hover:bg-slate-50">Réassigner</button>`
          : `<span class="text-[11px] text-slate-300">—</span>`}
      </td>
    </tr>
  `).join("");

  document.querySelectorAll("[data-reassigner]").forEach(btn => {
    btn.addEventListener("click", () => ouvrirReassignation(btn.dataset.reassigner));
  });
}

function ouvrirReassignation(livraisonId) {
  if (!livreursDisponibles.length) {
    showToast("Aucun autre livreur disponible.", "error");
    return;
  }

  const options = livreursDisponibles.map(l => `<option value="${l.id}">${escapeHtml(l.prenom)} ${escapeHtml(l.nom)} — ${escapeHtml(l.zone || "Zone non définie")}</option>`).join("");

  openModal({
    title: "Réassigner cette livraison",
    icon: "fa-truck",
    iconClass: "bg-blue-100 text-blue-700",
    body: `
      <div>
        <label class="mb-2 block text-xs font-extrabold uppercase tracking-[0.14em] text-slate-500">Nouveau livreur *</label>
        <select id="selectNouveauLivreur" class="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-800 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100">
          ${options}
        </select>
      </div>
    `,
    confirmLabel: "Réassigner",
    confirmIcon: "fa-truck",
    confirmClass: "bg-blue-600 shadow-blue-100 hover:bg-blue-700",
    onConfirm: async (overlay) => {
      const nouveauLivreurId = overlay.querySelector("#selectNouveauLivreur").value;
      try {
        await reassignerLivreur(livraisonId, nouveauLivreurId);
        showToast("Livraison réassignée avec succès.");
        await renderAdminLivraisonsPage();
      } catch (error) {
        showToast(error.message, "error");
        return false;
      }
    }
  });
}


