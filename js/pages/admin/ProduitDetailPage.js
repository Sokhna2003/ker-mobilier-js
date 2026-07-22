import { getProduitById, validerProduit, rejeterProduit, deplacerProduitVersCorbeille } from "../../services/produitservice.js";
import { getCategories } from "../../services/categorieservice.js";
import { getAllUtilisateurs } from "../../services/utilisateurservice.js";
import { escapeHtml } from "../../utils/html.js";
import { showToast } from "../../components/toast.js";
import { openConfirm } from "../../components/modal.js";
import { navigate } from "../../router.js";

const IMAGE_PLACEHOLDER = "https://placehold.co/700x500/EDE1D3/2F4B36?text=Produit";

const STATUT_INFO = {
  EN_ATTENTE: { label: "En attente", classe: "bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-600/20" },
  VALIDE: { label: "Validé", classe: "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/20" },
  REJETE: { label: "Refusé", classe: "bg-rose-50 text-rose-700 ring-1 ring-inset ring-rose-600/20" }
};

export async function renderProduitDetailPage(params) {
  const app = document.getElementById("app");
  const id = params.get("id");

  if (!id) {
    app.innerHTML = `<p class="text-rose-600 font-bold p-4">Aucun produit sélectionné.</p>`;
    return;
  }

  try {
    const [produit, categories, utilisateurs] = await Promise.all([
      getProduitById(id),
      getCategories(),
      getAllUtilisateurs()
    ]);

    const categorie = categories.find(c => c.id === produit.categorieId);
    const artisan = utilisateurs.find(u => u.id === produit.artisanId);
    const statutInfo = STATUT_INFO[produit.statut] || { label: produit.statut, classe: "bg-slate-100 text-slate-600" };
    const image = produit.images && produit.images !== "https://placehold.co" ? produit.images : IMAGE_PLACEHOLDER;

    app.innerHTML = `
      <section class="space-y-6">
        <button data-page="admin/produits" class="inline-flex items-center gap-2 text-xs font-black text-slate-500 hover:text-slate-900">
          <i class="fa-solid fa-arrow-left"></i>
          Retour à la liste des produits
        </button>

        <div class="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
          <article class="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
            <div class="relative h-72 w-full bg-slate-100 sm:h-96">
              <img src="${image}" alt="${escapeHtml(produit.nom)}" class="h-full w-full object-cover" />
              <span class="absolute right-4 top-4 rounded-full px-3 py-1.5 text-xs font-black uppercase ${statutInfo.classe}">
                ${statutInfo.label}
              </span>
              ${produit.isPremium ? `<span class="absolute left-4 top-4 rounded-full bg-slate-950/80 px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-white"><i class="fa-solid fa-certificate mr-1"></i>Partenaire Agréé</span>` : ""}
            </div>

            <div class="p-6">
              <p class="text-[11px] font-black uppercase tracking-wider text-terracotta-600">${escapeHtml(categorie?.libelle || "Catégorie inconnue")}</p>
              <h1 class="mt-1 text-2xl font-black text-slate-950">${escapeHtml(produit.nom)}</h1>
              <p class="mt-3 text-sm leading-6 text-slate-600">${escapeHtml(produit.description || "Aucune description fournie.")}</p>

              <div class="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
                <div class="rounded-2xl bg-slate-50 p-3">
                  <p class="text-[10px] font-extrabold uppercase text-slate-400">Prix</p>
                  <p class="mt-1 font-mono text-sm font-black text-slate-950">${Number(produit.prix).toLocaleString()} FCFA</p>
                </div>
                <div class="rounded-2xl bg-slate-50 p-3">
                  <p class="text-[10px] font-extrabold uppercase text-slate-400">Stock</p>
                  <p class="mt-1 text-sm font-black ${Number(produit.stock) <= 1 ? "text-rose-600" : "text-slate-950"}">${produit.stock} unité(s)</p>
                </div>
                <div class="rounded-2xl bg-slate-50 p-3">
                  <p class="text-[10px] font-extrabold uppercase text-slate-400">Matériau</p>
                  <p class="mt-1 text-sm font-black text-slate-950">${escapeHtml(produit.materiau || "—")}</p>
                </div>
                <div class="rounded-2xl bg-slate-50 p-3">
                  <p class="text-[10px] font-extrabold uppercase text-slate-400">Note</p>
                  <p class="mt-1 text-sm font-black text-slate-950">${produit.nombreAvis > 0 ? `${produit.noteMoyenne} ★ (${produit.nombreAvis})` : "Aucun avis"}</p>
                </div>
              </div>

              <div class="mt-6 grid grid-cols-2 gap-4 text-xs text-slate-500 sm:grid-cols-3">
                <p><i class="fa-solid fa-calendar-plus mr-1.5 text-slate-400"></i>Créé le ${escapeHtml(produit.dateCreation || "—")}</p>
                <p><i class="fa-solid fa-calendar-check mr-1.5 text-slate-400"></i>Publié le ${escapeHtml(produit.datePublication || "—")}</p>
                <p><i class="fa-solid fa-pen-clip mr-1.5 text-slate-400"></i>Modifié le ${escapeHtml(produit.dateModification || "—")}</p>
              </div>

              <div class="mt-6 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-5" id="actionsDetailProduit"></div>
            </div>
          </article>

          <aside class="space-y-4">
            <article class="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <p class="text-[11px] font-black uppercase tracking-wider text-slate-400">Artisan</p>
              <div class="mt-3 flex items-center gap-3">
                <div class="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#0B132B] text-sm font-black text-white">
                  ${(artisan?.prenom || "?").charAt(0)}${(artisan?.nom || "").charAt(0)}
                </div>
                <div>
                  <p class="text-sm font-black text-slate-950">${escapeHtml(artisan?.atelier || `${artisan?.prenom ?? ""} ${artisan?.nom ?? ""}`)}</p>
                  <p class="text-[11px] text-slate-400">${escapeHtml(artisan?.prenom || "")} ${escapeHtml(artisan?.nom || "")}</p>
                </div>
              </div>
              <div class="mt-4 space-y-1.5 text-xs text-slate-600">
                <p><i class="fa-solid fa-envelope mr-2 text-slate-400"></i>${escapeHtml(artisan?.email || "—")}</p>
                <p><i class="fa-solid fa-phone mr-2 text-slate-400"></i>${escapeHtml(artisan?.telephone || "—")}</p>
                <p><i class="fa-solid fa-location-dot mr-2 text-slate-400"></i>${escapeHtml(artisan?.adresse || "—")}</p>
                ${artisan?.isPremium ? `<p class="mt-2 inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-[10px] font-black uppercase text-amber-700"><i class="fa-solid fa-certificate"></i>Artisan agréé</p>` : ""}
              </div>
              <button data-page="admin/utilisateur-detail?id=${escapeHtml(produit.artisanId)}" class="mt-4 w-full rounded-xl border border-slate-200 py-2 text-xs font-black text-slate-700 transition hover:bg-slate-50">
                Voir le profil complet
              </button>
            </article>

            <article class="rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-5 text-[11px] leading-5 text-slate-500">
              <p><i class="fa-solid fa-circle-info mr-1.5"></i>Origine : ${produit.ajoutePar === "admin" ? "Ajouté par l'administration (artisan agréé)" : "Soumis par l'artisan lui-même"}</p>
            </article>
          </aside>
        </div>
      </section>
    `;

    afficherActionsDetail(produit);
  } catch (error) {
    app.innerHTML = `<p class="text-rose-600 font-bold p-4">Erreur : ${escapeHtml(error.message)}</p>`;
  }
}

function afficherActionsDetail(produit) {
  const zone = document.getElementById("actionsDetailProduit");
  if (!zone) return;

  let boutons = "";

  if (produit.statut === "EN_ATTENTE") {
    boutons += `
      <button id="btnValiderDetail" class="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-black text-white transition hover:bg-emerald-700">
        <i class="fa-solid fa-check"></i> Valider
      </button>
      <button id="btnRejeterDetail" class="inline-flex items-center gap-2 rounded-xl bg-rose-50 px-4 py-2.5 text-xs font-black text-rose-600 transition hover:bg-rose-100">
        <i class="fa-solid fa-xmark"></i> Rejeter
      </button>
    `;
  }

  if (produit.ajoutePar === "admin") {
    boutons += `
      <button data-page="admin/produits" class="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-black text-slate-700 transition hover:bg-slate-50">
        <i class="fa-solid fa-pen"></i> Modifier depuis la liste
      </button>
    `;
  }

  boutons += `
    <button id="btnCorbeilleDetail" class="inline-flex items-center gap-2 rounded-xl bg-slate-100 px-4 py-2.5 text-xs font-black text-slate-600 transition hover:bg-rose-100 hover:text-rose-600">
      <i class="fa-solid fa-trash-can"></i> Retirer (corbeille)
    </button>
  `;

  zone.innerHTML = boutons;

  document.getElementById("btnValiderDetail")?.addEventListener("click", async () => {
    try {
      await validerProduit(produit.id);
      showToast("Produit validé, il est maintenant visible sur la boutique.");
      await renderProduitDetailPage(new URLSearchParams(`id=${produit.id}`));
    } catch (error) {
      showToast(error.message, "error");
    }
  });

  document.getElementById("btnRejeterDetail")?.addEventListener("click", () => {
    openConfirm({
      message: "Rejeter ce produit ? L'artisan verra que sa soumission a été refusée.",
      confirmLabel: "Rejeter",
      onConfirm: async () => {
        try {
          await rejeterProduit(produit.id);
          showToast("Produit rejeté.");
          await renderProduitDetailPage(new URLSearchParams(`id=${produit.id}`));
        } catch (error) {
          showToast(error.message, "error");
        }
      }
    });
  });

  document.getElementById("btnCorbeilleDetail")?.addEventListener("click", () => {
    openConfirm({
      message: "Retirer ce produit du site et le déplacer vers la corbeille ?",
      confirmLabel: "Déplacer vers la corbeille",
      onConfirm: async () => {
        try {
          await deplacerProduitVersCorbeille(produit.id);
          showToast("Produit déplacé vers la corbeille.");
          navigate("admin/produits");
        } catch (error) {
          showToast(error.message, "error");
        }
      }
    });
  });
}