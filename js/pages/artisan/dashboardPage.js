import { getAllProduits } from "../../services/produitservice.js";
import { getAllCommandes, getAllLignesCommande } from "../../services/commandeservice.js";
import { getAllDemandesSurMesure } from "../../services/demandeSurMesureservice.js";
import { getAllUtilisateurs } from "../../services/utilisateurservice.js";
import { getSession } from "../../utils/session.js";
import { escapeHtml } from "../../utils/html.js";
import { showToast } from "../../components/toast.js";

// Chemins des deux visuels (images statiques pour le moment).
// Placez vos fichiers dans assets/images/, à côté de index.html :
const IMAGE_EVOLUTION_VENTES = "../../../assets/images/evolution-ventes-artisan.png";
const IMAGE_REPARTITION_COMMANDES = "../../../assets/images/repartition-commandes-artisan.png";

const LABEL_STATUT_COMMANDE = {
  EN_ATTENTE: "En attente",
  EN_COURS: "Fabrication",
  PRETE: "Prête",
  LIVREE: "Livrée",
  ANNULEE: "Annulée"
};

export async function renderArtisanDashboard() {
  const app = document.getElementById("app");
  const session = getSession();

  try {
    const [tousLesProduits, commandes, lignesCommande, demandesSurMesure, utilisateurs] = await Promise.all([
      getAllProduits(),
      getAllCommandes(),
      getAllLignesCommande(),
      getAllDemandesSurMesure(),
      getAllUtilisateurs()
    ]);

    const mesProduits = tousLesProduits.filter(p => p.artisanId === session.id);
    const mesProduitsIds = mesProduits.map(p => p.id);

    const produitsValides = mesProduits.filter(p => p.statut === "VALIDE");
    const produitsEnAttente = mesProduits.filter(p => p.statut === "EN_ATTENTE");

    const aujourdHui = new Date();
    const estMemeMois = (dateStr) => {
      if (!dateStr) return false;
      const d = new Date(dateStr);
      return d.getMonth() === aujourdHui.getMonth() && d.getFullYear() === aujourdHui.getFullYear();
    };
    const validesCeMois = produitsValides.filter(p => estMemeMois(p.datePublication)).length;

    const produitsAvecAvis = mesProduits.filter(p => p.nombreAvis > 0);
    const noteMoyenne = produitsAvecAvis.length
      ? (produitsAvecAvis.reduce((s, p) => s + Number(p.noteMoyenne), 0) / produitsAvecAvis.length).toFixed(1)
      : null;

    // Jointure commandes <-> mes produits via lignesCommande
    const mesLignes = lignesCommande.filter(l => mesProduitsIds.includes(l.produitId));
    const idsCommandesConcernees = [...new Set(mesLignes.map(l => l.commandeId))];

    const mesCommandes = commandes
      .filter(c => idsCommandesConcernees.includes(c.id))
      .map(c => {
        const lignesDeLaCommande = mesLignes.filter(l => l.commandeId === c.id);
        const montantPourMoi = lignesDeLaCommande.reduce((s, l) => s + Number(l.prix) * Number(l.quantite), 0);
        const produitPrincipal = mesProduits.find(p => p.id === lignesDeLaCommande[0]?.produitId);
        const client = utilisateurs.find(u => u.id === c.clientId);
        return {
          ...c,
          montantPourMoi,
          nomProduit: produitPrincipal?.nom || "—",
          autresProduits: lignesDeLaCommande.length - 1,
          nomClient: client ? `${client.prenom} ${client.nom}` : "Client inconnu"
        };
      })
      .sort((a, b) => new Date(b.dateCommande || 0) - new Date(a.dateCommande || 0));

    const commandesAujourdHui = mesCommandes.filter(c => c.dateCommande === aujourdHui.toISOString().split("T")[0]).length;
    const revenuMois = mesCommandes.filter(c => estMemeMois(c.dateCommande)).reduce((s, c) => s + c.montantPourMoi, 0);

    const demandesOuvertes = demandesSurMesure
      .filter(d => d.statut === "EN_ATTENTE" && !d.dateCloture)
      .sort((a, b) => new Date(b.dateCreation || 0) - new Date(a.dateCreation || 0));

    app.innerHTML = `
      <section class="space-y-6">
        <div class="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 class="flex flex-wrap items-baseline gap-2 text-2xl font-black text-slate-950">
              Tableau de bord
              <span class="text-sm font-bold text-slate-400">· Espace ${escapeHtml(session?.atelier || "Atelier")}</span>
            </h1>
            <p class="mt-1 text-sm text-slate-500">Consultez l'évolution de vos ventes, vos tâches en cours et les demandes sur-mesure d'aujourd'hui.</p>
          </div>
          ${session?.isPremium ? `
            <span class="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-4 py-2 text-xs font-black text-amber-700">
              <i class="fa-solid fa-certificate"></i> Artisan Partenaire Agréé
            </span>
          ` : ""}
        </div>

        <div class="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          ${carteStat("Produits validés", produitsValides.length, `+${validesCeMois} ce mois`, "fa-cube", "bg-blue-50 text-blue-600")}
          ${carteStat("En attente", produitsEnAttente.length, "Vérif admin", "fa-clock", "bg-amber-50 text-amber-600")}
          ${carteStat("Commandes", mesCommandes.length, `+${commandesAujourdHui} d'aujourd'hui`, "fa-bag-shopping", "bg-indigo-50 text-indigo-600")}
          ${carteStat("Revenus (mois)", `${revenuMois.toLocaleString()} F`, "Virement auto", "fa-sack-dollar", "bg-emerald-50 text-emerald-600")}
          ${carteStat("Sur mesure reçu", demandesOuvertes.length, "Offres ouvertes", "fa-file-lines", "bg-purple-50 text-purple-600")}
          ${carteStat("Note moyenne", noteMoyenne ? `${noteMoyenne}/5` : "—", noteMoyenne ? (noteMoyenne >= 4 ? "Excellent" : "Correct") : "Aucun avis", "fa-star", "bg-orange-50 text-orange-600")}
        </div>

        <div class="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
          <article class="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div class="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 class="text-sm font-black text-slate-950">Évolution des ventes par mois (FCFA)</h2>
                <p class="text-xs text-slate-400">Tendance sur les commandes reçues.</p>
              </div>
            </div>
            <img src="${IMAGE_EVOLUTION_VENTES}" alt="Évolution des ventes" class="mt-4 w-full rounded-2xl" />
          </article>

          <article class="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 class="text-sm font-black text-slate-950">Répartition des commandes</h2>
            <p class="text-xs text-slate-400">Statut des ${mesCommandes.length} commande(s) reçue(s) à ce jour.</p>
            <img src="${IMAGE_REPARTITION_COMMANDES}" alt="Répartition des commandes" class="mx-auto mt-4 h-32 w-32" />
            <div class="mt-4 space-y-2 text-xs font-semibold text-slate-600">
              ${renderLegendeStatuts(mesCommandes)}
            </div>
            <button id="btnGererLivraisons" class="mt-4 w-full rounded-xl bg-slate-100 py-2.5 text-xs font-black text-slate-600 transition hover:bg-slate-200">
              Gérer les livraisons en cours
            </button>
          </article>
        </div>

        <div class="grid gap-6 lg:grid-cols-2">
          <article class="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div class="flex items-center justify-between">
              <h2 class="text-sm font-black text-slate-950">Commandes récentes</h2>
              <button id="btnGererCommandes" class="text-xs font-black text-emerald-700 hover:underline">Gérer tout</button>
            </div>
            <div class="mt-3 overflow-x-auto">
              <table class="w-full border-collapse text-left text-xs">
                <thead>
                  <tr class="text-slate-400">
                    <th class="py-2 font-black uppercase">Numéro</th>
                    <th class="py-2 font-black uppercase">Client</th>
                    <th class="py-2 font-black uppercase">Produit</th>
                    <th class="py-2 font-black uppercase">Montant</th>
                    <th class="py-2 font-black uppercase">Statut</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-100">
                  ${mesCommandes.length ? mesCommandes.slice(0, 3).map(ligneCommandeHtml).join("") : `<tr><td colspan="5" class="py-6 text-center font-bold text-slate-400">Aucune commande pour l'instant.</td></tr>`}
                </tbody>
              </table>
            </div>
          </article>

          <article class="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div class="flex items-center justify-between">
              <h2 class="text-sm font-black text-slate-950">Demandes sur mesure urgentes</h2>
              <button id="btnVoirOffres" class="text-xs font-black text-emerald-700 hover:underline">Voir les offres</button>
            </div>
            <div class="mt-3 space-y-3">
              ${demandesOuvertes.length ? demandesOuvertes.slice(0, 2).map(carteDemandeHtml).join("") : `<p class="py-6 text-center text-xs font-bold text-slate-400">Aucune demande ouverte pour l'instant.</p>`}
            </div>
            <div class="mt-4 rounded-2xl bg-slate-50 p-3 text-[11px] leading-5 text-slate-500">
              <i class="fa-solid fa-lightbulb mr-1 text-amber-500"></i>
              <strong class="text-slate-700">Conseil d'Artisan d'Art :</strong> répondre à une demande sur-mesure en moins de 3 heures augmente vos chances de vente.
            </div>
          </article>
        </div>
      </section>
    `;

    document.getElementById("btnGererLivraisons").addEventListener("click", () => showToast("La gestion des livraisons arrive bientôt."));
    document.getElementById("btnGererCommandes").addEventListener("click", () => showToast("La page Commandes arrive bientôt."));
    document.getElementById("btnVoirOffres").addEventListener("click", () => showToast("La page des offres sur mesure arrive bientôt."));
    document.querySelectorAll("[data-devis]").forEach(btn => {
      btn.addEventListener("click", () => showToast("L'envoi de devis arrive bientôt."));
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
      <p class="mt-0.5 text-[11px] font-bold text-emerald-600">${sousTitre}</p>
    </article>
  `;
}

function renderLegendeStatuts(commandes) {
  const total = commandes.length;
  if (!total) return `<p class="text-slate-400">Aucune commande à répartir.</p>`;

  const compteParStatut = {};
  commandes.forEach(c => {
    compteParStatut[c.statut] = (compteParStatut[c.statut] || 0) + 1;
  });

  return Object.entries(compteParStatut).map(([statut, nombre]) => `
    <div class="flex items-center justify-between">
      <span>${escapeHtml(LABEL_STATUT_COMMANDE[statut] || statut)} (${Math.round((nombre / total) * 100)}%)</span>
      <span class="font-black text-slate-950">${nombre}</span>
    </div>
  `).join("");
}

function ligneCommandeHtml(c) {
  const produitAffiche = c.autresProduits > 0 ? `${escapeHtml(c.nomProduit)} +${c.autresProduits}` : escapeHtml(c.nomProduit);
  return `
    <tr>
      <td class="py-3 font-black text-slate-950">${escapeHtml(c.id)}</td>
      <td class="py-3 font-semibold text-slate-700">${escapeHtml(c.nomClient)}</td>
      <td class="py-3 text-slate-600">${produitAffiche}</td>
      <td class="py-3 font-mono font-black text-slate-900">${c.montantPourMoi.toLocaleString()} F</td>
      <td class="py-3 font-bold">${escapeHtml(LABEL_STATUT_COMMANDE[c.statut] || c.statut)}</td>
    </tr>
  `;
}

function carteDemandeHtml(d) {
  return `
    <div class="flex items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-3">
      <img src="${d.image || "https://placehold.co/80x80/EDE1D3/2F4B36?text=%20"}" alt="" class="h-12 w-12 flex-none rounded-xl object-cover" />
      <div class="flex-1">
        <p class="text-xs font-black text-slate-950">${escapeHtml(d.description)}</p>
        <p class="text-[11px] font-bold text-amber-700">Budget : ${Number(d.budget).toLocaleString()} FCFA</p>
        <p class="text-[10px] text-slate-400">Publiée le ${escapeHtml(d.dateCreation || "—")}</p>
      </div>
      <button data-devis="${escapeHtml(d.id)}" class="rounded-lg bg-emerald-700 px-3 py-2 text-[11px] font-black text-white transition hover:bg-emerald-800">Devis</button>
    </div>
  `;
}