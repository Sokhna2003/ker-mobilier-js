import { getPanier, modifierQuantitePanier, retirerDuPanier, viderPanier, totalPanier, mettreAJourBadgePanier } from "../utils/panier.js";
import { getSession } from "../utils/session.js";
import { escapeHtml } from "../utils/html.js";
import { showToast } from "./toast.js";
import { openModal } from "./modal.js";
import { navigate } from "../router.js";
import { creerCommandeAvecLignes } from "../services/commandeservice.js";

export function ouvrirPanierModal() {
  const articles = getPanier();

  const corpsPanier = articles.length
    ? articles.map(articleHtml).join("")
    : `<p class="py-8 text-center text-sm font-bold text-slate-400">Votre panier est vide.</p>`;

  openModal({
    title: "Mon panier",
    icon: "fa-bag-shopping",
    iconClass: "bg-terracotta-50 text-terracotta-600",
    body: `
      <div id="listeArticlesPanier" class="grid max-h-80 gap-3 overflow-y-auto">${corpsPanier}</div>
      <div class="flex items-center justify-between border-t border-slate-100 pt-4">
        <span class="text-sm font-black text-slate-950">Total</span>
        <span id="totalPanierAffiche" class="font-mono text-lg font-black text-slate-950">${totalPanier().toLocaleString()} FCFA</span>
      </div>
    `,
    confirmLabel: "Valider la commande",
    confirmIcon: "fa-check",
    confirmClass: "bg-terracotta-500 shadow-terracotta-100 hover:bg-terracotta-600",
    onMount: (overlay) => attacherEvenementsPanier(overlay),
    onConfirm: async () => {
      const articlesActuels = getPanier();
      if (!articlesActuels.length) {
        showToast("Votre panier est vide.", "error");
        return false;
      }

      const session = getSession();
      if (!session || session.role !== "client") {
        showToast("Connectez-vous en tant que client pour valider une commande.", "error");
        navigate("login");
        return false;
      }

      try {
        await creerCommandeAvecLignes(
          { clientId: session.id, adresseLivraison: session.adresse || "Adresse à confirmer" },
          articlesActuels
        );
        viderPanier();
        mettreAJourBadgePanier();
        showToast("Commande envoyée à l'artisan concerné !");
      } catch (error) {
        showToast(error.message, "error");
        return false;
      }
    }
  });
}

function articleHtml(a) {
  return `
    <div class="flex items-center gap-3 rounded-2xl border border-slate-100 p-3" data-article-panier="${escapeHtml(a.produitId)}">
      <img src="${a.image || "https://placehold.co/80x80/EDE1D3/2F4B36?text=%20"}" alt="" class="h-12 w-12 flex-none rounded-xl object-cover" />
      <div class="flex-1">
        <p class="text-xs font-black text-slate-950">${escapeHtml(a.nom)}</p>
        <p class="text-[11px] font-bold text-slate-500">${a.prix.toLocaleString()} FCFA</p>
      </div>
      <div class="flex items-center gap-2">
        <button data-diminuer class="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50">-</button>
        <span class="w-5 text-center text-xs font-black">${a.quantite}</span>
        <button data-augmenter class="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50">+</button>
      </div>
      <button data-supprimer class="flex h-7 w-7 items-center justify-center rounded-lg text-rose-500 hover:bg-rose-50" title="Retirer">
        <i class="fa-solid fa-trash-can text-xs"></i>
      </button>
    </div>
  `;
}

function rafraichir(overlay) {
  const articles = getPanier();
  overlay.querySelector("#listeArticlesPanier").innerHTML = articles.length
    ? articles.map(articleHtml).join("")
    : `<p class="py-8 text-center text-sm font-bold text-slate-400">Votre panier est vide.</p>`;
  overlay.querySelector("#totalPanierAffiche").textContent = `${totalPanier().toLocaleString()} FCFA`;
  mettreAJourBadgePanier();
  attacherEvenementsPanier(overlay);
}

function attacherEvenementsPanier(overlay) {
  overlay.querySelectorAll("[data-article-panier]").forEach(ligne => {
    const produitId = ligne.dataset.articlePanier;
    const article = getPanier().find(a => a.produitId === produitId);
    if (!article) return;

    ligne.querySelector("[data-augmenter]").onclick = () => {
      modifierQuantitePanier(produitId, article.quantite + 1);
      rafraichir(overlay);
    };
    ligne.querySelector("[data-diminuer]").onclick = () => {
      modifierQuantitePanier(produitId, article.quantite - 1);
      rafraichir(overlay);
    };
    ligne.querySelector("[data-supprimer]").onclick = () => {
      retirerDuPanier(produitId);
      rafraichir(overlay);
    };
  });
}