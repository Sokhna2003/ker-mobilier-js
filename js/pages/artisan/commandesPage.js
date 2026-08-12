import { getAllCommandes, getAllLignesCommande, accepterCommande, refuserCommande, marquerPretALivrer } from "../../services/commandeservice.js";
import { getAllProduits } from "../../services/produitservice.js";
import { getAllUtilisateurs } from "../../services/utilisateurservice.js";
import { getSession } from "../../utils/session.js";
import { escapeHtml } from "../../utils/html.js";
import { showToast } from "../../components/toast.js";
import { openConfirm } from "../../components/modal.js";
import { STATUTS_COMMANDE, labelStatutCommande, classeStatutCommande } from "../../utils/constantes.js";

export async function renderArtisanCommandesPage() {
  const app = document.getElementById("app");
  const session = getSession();

  try {
    const [commandes, lignesCommande, produits, utilisateurs] = await Promise.all([
      getAllCommandes(),
      getAllLignesCommande(),
      getAllProduits(),
      getAllUtilisateurs()
    ]);

    const mesProduitsIds = produits.filter(p => p.artisanId === session.id).map(p => p.id);

    const mesCommandes = commandes
      .map(c => {
        const lignes = lignesCommande.filter(l => l.commandeId === c.id && mesProduitsIds.includes(l.produitId));
        if (!lignes.length) return null;

        const client = utilisateurs.find(u => u.id === c.clientId);
        const detailsLignes = lignes.map(l => {
          const produit = produits.find(p => p.id === l.produitId);
          return { nom: produit?.nom || "Produit inconnu", quantite: l.quantite, prix: l.prix };
        });
        const montantPourMoi = detailsLignes.reduce((s, l) => s + l.prix * l.quantite, 0);

        return {
          ...c,
          nomClient: client ? `${client.prenom} ${client.nom}` : "Client inconnu",
          detailsLignes,
          montantPourMoi
        };
      })
      .filter(Boolean)
      .sort((a, b) => new Date(b.dateCommande || 0) - new Date(a.dateCommande || 0));

    app.innerHTML = `
      <section class="space-y-6">
        <div>
          <span class="text-xs font-black uppercase tracking-[0.2em] text-amber-700">Mon atelier</span>
          <h1 class="mt-1 text-2xl font-black text-slate-950">Mes Commandes</h1>
          <p class="mt-0.5 text-xs text-slate-400">Acceptez, préparez et marquez vos commandes comme prêtes à livrer.</p>
        </div>

        <div id="grilleCommandesArtisan" class="grid grid-cols-1 gap-5 lg:grid-cols-2"></div>
      </section>
    `;

    afficherCommandes(mesCommandes);
  } catch (error) {
    app.innerHTML = `<p class="text-rose-600 font-bold p-4">Erreur : ${escapeHtml(error.message)}</p>`;
  }
}

function afficherCommandes(commandes) {
  const grille = document.getElementById("grilleCommandesArtisan");
  if (!grille) return;

  if (!commandes.length) {
    grille.innerHTML = `
      <div class="col-span-full rounded-3xl border border-dashed border-slate-300 bg-slate-50 px-5 py-10 text-center text-sm font-semibold text-slate-500">
        Aucune commande reçue pour l'instant.
      </div>
    `;
    return;
  }

  grille.innerHTML = commandes.map(carteCommandeHtml).join("");

  document.querySelectorAll("[data-accepter]").forEach(btn => {
    btn.addEventListener("click", async () => {
      try {
        await accepterCommande(btn.dataset.accepter);
        showToast("Commande acceptée, vous pouvez commencer la préparation.");
        await renderArtisanCommandesPage();
      } catch (error) {
        showToast(error.message, "error");
      }
    });
  });

  document.querySelectorAll("[data-refuser]").forEach(btn => {
    btn.addEventListener("click", () => {
      openConfirm({
        message: "Refuser cette commande ? Le client en sera informé (produit indisponible).",
        confirmLabel: "Refuser",
        onConfirm: async () => {
          try {
            await refuserCommande(btn.dataset.refuser);
            showToast("Commande refusée.");
            await renderArtisanCommandesPage();
          } catch (error) {
            showToast(error.message, "error");
          }
        }
      });
    });
  });

  document.querySelectorAll("[data-pret]").forEach(btn => {
    btn.addEventListener("click", async () => {
      try {
        await marquerPretALivrer(btn.dataset.pret);
        showToast("Commande marquée prête à livrer. L'administration va assigner un livreur.");
        await renderArtisanCommandesPage();
      } catch (error) {
        showToast(error.message, "error");
      }
    });
  });
}

function carteCommandeHtml(c) {
  const produitsHtml = c.detailsLignes.map(l => `
    <li class="flex items-center justify-between text-xs">
      <span class="text-slate-700">${escapeHtml(l.nom)} <span class="text-slate-400">× ${l.quantite}</span></span>
      <span class="font-mono font-bold text-slate-900">${(l.prix * l.quantite).toLocaleString()} FCFA</span>
    </li>
  `).join("");

  let actions = "";
  if (c.statut === "EN_ATTENTE") {
    actions = `
      <button data-accepter="${escapeHtml(c.id)}" class="flex-1 rounded-xl bg-emerald-600 py-2.5 text-xs font-black text-white transition hover:bg-emerald-700">
        <i class="fa-solid fa-check mr-1"></i> Accepter
      </button>
      <button data-refuser="${escapeHtml(c.id)}" class="flex-1 rounded-xl bg-rose-50 py-2.5 text-xs font-black text-rose-600 transition hover:bg-rose-100">
        <i class="fa-solid fa-xmark mr-1"></i> Refuser
      </button>
    `;
  } else if (c.statut === "EN_PREPARATION") {
    actions = `
      <button data-pret="${escapeHtml(c.id)}" class="flex-1 rounded-xl bg-blue-600 py-2.5 text-xs font-black text-white transition hover:bg-blue-700">
        <i class="fa-solid fa-box mr-1"></i> Prêt pour livraison
      </button>
    `;
  }

  return `
    <article class="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div class="flex items-center justify-between border-b border-slate-50 pb-3">
        <div>
          <p class="text-[10px] font-black uppercase tracking-wider text-slate-400">Commande</p>
          <p class="text-sm font-black text-slate-950">${escapeHtml(c.id)}</p>
        </div>
        <span class="inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-black uppercase ${classeStatutCommande(c.statut)}">
          ${escapeHtml(labelStatutCommande(c.statut))}
        </span>
      </div>

      <div class="border-b border-slate-50 py-3 text-xs text-slate-600">
        <p><i class="fa-solid fa-user mr-1.5 text-slate-400"></i>${escapeHtml(c.nomClient)}</p>
        <p class="mt-1"><i class="fa-solid fa-location-dot mr-1.5 text-slate-400"></i>${escapeHtml(c.adresseLivraison)}</p>
        <p class="mt-1"><i class="fa-solid fa-calendar mr-1.5 text-slate-400"></i>${escapeHtml(c.dateCommande || "—")}</p>
      </div>

      <ul class="space-y-1.5 border-b border-slate-50 py-3">${produitsHtml}</ul>

      <div class="flex items-center justify-between py-3">
        <span class="text-[11px] font-black uppercase text-slate-400">Total (vos produits)</span>
        <span class="font-mono text-sm font-black text-slate-950">${c.montantPourMoi.toLocaleString()} FCFA</span>
      </div>

      ${actions ? `<div class="flex gap-2 pt-1">${actions}</div>` : ""}
    </article>
  `;
}