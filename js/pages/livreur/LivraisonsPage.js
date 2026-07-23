import { getAllLivraisons } from "../../services/livraisonservice.js";
import { getAllCommandes, getAllLignesCommande } from "../../services/commandeservice.js";
import { getAllProduits } from "../../services/produitservice.js";
import { getAllUtilisateurs } from "../../services/utilisateurservice.js";
import { getSession } from "../../utils/session.js";
import { escapeHtml } from "../../utils/html.js";
import { showToast } from "../../components/toast.js";

const LABEL_STATUT = {
  EN_COURS: "En cours",
  ATTRIBUEE: "Attribuée",
  LIVREE: "Livrée",
  ANNULEE: "Annulée"
};

const CLASSE_STATUT = {
  EN_COURS: "bg-blue-50 text-blue-700",
  ATTRIBUEE: "bg-amber-50 text-amber-700",
  LIVREE: "bg-emerald-50 text-emerald-700",
  ANNULEE: "bg-rose-50 text-rose-700"
};

let mesLivraisons = [];
let filtreTexte = "";
let filtreStatut = "tout";

export async function renderLivreurLivraisonsPage() {
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

    mesLivraisons = livraisons
      .filter(l => l.livreurId === session.id)
      .map(l => {
        const commande = commandes.find(c => c.id === l.commandeId);
        const client = utilisateurs.find(u => u.id === commande?.clientId);
        const lignes = lignesCommande.filter(ln => ln.commandeId === l.commandeId);
        const produit = produits.find(p => p.id === lignes[0]?.produitId);
        const artisan = utilisateurs.find(u => u.id === produit?.artisanId);

        return {
          ...l,
          nomProduit: produit?.nom || "Produit inconnu",
          materiau: produit?.materiau || null,
          nomAtelier: artisan?.atelier || "Atelier inconnu",
          nomArtisan: artisan ? `${artisan.prenom} ${artisan.nom}` : "",
          adresseCollecte: artisan?.adresse || "—",
          nomClient: client ? `${client.prenom} ${client.nom}` : "Client inconnu",
          telephoneClient: client?.telephone || "",
          adresseRemise: commande?.adresseLivraison || "—"
        };
      })
      .sort((a, b) => new Date(b.dateLivraison || 0) - new Date(a.dateLivraison || 0));

    app.innerHTML = `
      <section class="space-y-6">
        <div>
          <span class="text-xs font-black uppercase tracking-[0.2em] text-emerald-700">Logistique</span>
          <h1 class="mt-1 text-2xl font-black text-slate-950">Mes Livraisons</h1>
          <p class="mt-0.5 text-xs text-slate-400">Retrouvez toutes vos missions de transport, passées et à venir.</p>
        </div>

        <div class="grid gap-4 rounded-2xl border border-black/5 bg-white p-4 shadow-sm sm:grid-cols-[1fr_auto]">
          <div class="relative flex items-center">
            <div class="absolute left-3 text-slate-400"><i class="fa-solid fa-magnifying-glass text-xs"></i></div>
            <input type="text" id="rechercheLivraison" class="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold text-slate-800 outline-none transition focus:border-emerald-700 focus:bg-white" placeholder="Rechercher par client, produit, numéro..." />
          </div>

          <select id="filtreStatutLivraison" class="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs font-black text-slate-700 outline-none cursor-pointer transition hover:border-emerald-700 focus:border-emerald-700">
            <option value="tout">Tous les statuts</option>
            <option value="ATTRIBUEE">Attribuée</option>
            <option value="EN_COURS">En cours</option>
            <option value="LIVREE">Livrée</option>
            <option value="ANNULEE">Annulée</option>
          </select>
        </div>

        <p id="compteurLivraisons" class="text-xs font-bold text-slate-500"></p>
        <div id="grilleLivraisons" class="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3"></div>
      </section>
    `;

    document.getElementById("rechercheLivraison").addEventListener("input", (e) => {
      filtreTexte = e.target.value;
      afficherLivraisons();
    });

    document.getElementById("filtreStatutLivraison").addEventListener("change", (e) => {
      filtreStatut = e.target.value;
      afficherLivraisons();
    });

    afficherLivraisons();
  } catch (error) {
    app.innerHTML = `<p class="text-rose-600 font-bold p-4">Erreur : ${escapeHtml(error.message)}</p>`;
  }
}

function listeFiltree() {
  return mesLivraisons.filter(l => {
    const correspondStatut = filtreStatut === "tout" || l.statut === filtreStatut;
    const texte = filtreTexte.toLowerCase().trim();
    const correspondTexte = !texte || [l.id, l.nomClient, l.nomProduit].join(" ").toLowerCase().includes(texte);
    return correspondStatut && correspondTexte;
  });
}

function afficherLivraisons() {
  const grille = document.getElementById("grilleLivraisons");
  const compteur = document.getElementById("compteurLivraisons");
  if (!grille) return;

  const liste = listeFiltree();
  compteur.textContent = `${liste.length} mission(s) trouvée(s)`;

  grille.innerHTML = liste.length
    ? liste.map(carteMissionHtml).join("")
    : `<div class="col-span-full rounded-3xl border border-dashed border-slate-300 bg-slate-50 px-5 py-10 text-center text-sm font-semibold text-slate-500">Aucune mission ne correspond à vos critères.</div>`;

  document.querySelectorAll("[data-ouvrir-carte]").forEach(btn => {
    btn.addEventListener("click", () => showToast("L'ouverture cartographique de l'itinéraire arrive bientôt."));
  });
}

function carteMissionHtml(m) {
  const classeStatut = CLASSE_STATUT[m.statut] || "bg-slate-100 text-slate-600";

  return `
    <article class="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div class="flex items-center justify-between border-b border-slate-50 pb-3">
        <div>
          <p class="text-[10px] font-black uppercase tracking-wider text-slate-400">Mission transport</p>
          <p class="text-base font-black text-slate-950">${escapeHtml(m.id)}</p>
        </div>
        <span class="inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-black uppercase ${classeStatut}">
          ${escapeHtml(LABEL_STATUT[m.statut] || m.statut)}
        </span>
      </div>

      <div class="border-b border-slate-50 py-3">
        <p class="text-[10px] font-black uppercase tracking-wider text-slate-400">Produit volumineux</p>
        <p class="text-sm font-black text-slate-950">${escapeHtml(m.nomProduit)}</p>
        ${m.materiau ? `<p class="text-[11px] font-bold text-amber-700">Matériau : ${escapeHtml(m.materiau)}</p>` : ""}
      </div>

      <div class="space-y-3 border-b border-slate-50 py-3">
        <div class="flex gap-2">
          <span class="flex h-6 w-6 flex-none items-center justify-center rounded-full bg-slate-200 text-[10px] font-black text-slate-700">A</span>
          <div>
            <p class="text-xs font-black text-slate-950">Collecte : ${escapeHtml(m.nomAtelier)} ${m.nomArtisan ? `(${escapeHtml(m.nomArtisan)})` : ""}</p>
            <p class="text-[11px] text-slate-400">${escapeHtml(m.adresseCollecte)}</p>
          </div>
        </div>
        <div class="flex gap-2">
          <span class="flex h-6 w-6 flex-none items-center justify-center rounded-full bg-rose-100 text-[10px] font-black text-rose-700">C</span>
          <div>
            <p class="text-xs font-black text-slate-950">Remise : ${escapeHtml(m.nomClient)}</p>
            <p class="text-[11px] text-slate-400">${escapeHtml(m.adresseRemise)}</p>
          </div>
        </div>
      </div>

      <div class="flex items-center justify-between py-3 text-xs">
        <div>
          <p class="text-[10px] font-black uppercase text-slate-400">Date de passage</p>
          <p class="font-bold text-slate-700">${escapeHtml(m.dateLivraison || "—")}</p>
        </div>
        <div class="text-right">
          <p class="text-[10px] font-black uppercase text-slate-400">Gains livraison</p>
          <p class="font-mono font-black text-slate-400">—</p>
        </div>
      </div>

      <div class="flex items-center gap-2 pt-1">
        <button data-ouvrir-carte="${escapeHtml(m.id)}" class="flex-1 rounded-full bg-emerald-700 py-2.5 text-xs font-black text-white transition hover:bg-emerald-800">
          Ouvrir sur la carte
        </button>
        ${m.telephoneClient ? `
          <a href="tel:${escapeHtml(m.telephoneClient)}" class="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 text-slate-600 transition hover:bg-slate-50" title="Appeler le client">
            <i class="fa-solid fa-phone text-xs"></i>
          </a>
        ` : ""}
      </div>
    </article>
  `;
}