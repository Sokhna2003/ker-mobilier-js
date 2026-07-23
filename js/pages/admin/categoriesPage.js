import {
  getCategories,
  createCategorie,
  updateCategorie,
  deplacerCategorieVersCorbeille
} from "../../services/categorieservice.js";
import { getAllProduits } from "../../services/produitservice.js";
import { uploaderImage } from "../../services/cloudinaryService.js";
import { escapeHtml } from "../../utils/html.js";
import { showToast } from "../../components/toast.js";
import { openModal, openConfirm } from "../../components/modal.js";
import { required, validerFormulaire } from "../../utils/validator.js";

const IMAGE_PLACEHOLDER = "https://placehold.co/400x300/EDE1D3/2F4B36?text=Cat%C3%A9gorie";

export async function renderCategoriesPage() {
  const app = document.getElementById("app");

  try {
    const [categories, produits] = await Promise.all([getCategories(), getAllProduits()]);

    // Nombre de produits associés à chaque catégorie (calculé une seule fois, côté client)
    const categoriesAvecCompte = categories.map(cat => ({
      ...cat,
      nombreProduits: produits.filter(p => p.categorieId === cat.id).length
    }));

    app.innerHTML = `
      <section class="space-y-6">
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-100 pb-5">
          <div>
            <span class="text-xs font-black uppercase tracking-[0.2em] text-amber-700">Référentiel</span>
            <h1 class="text-2xl font-black text-slate-950 mt-1">Catégories</h1>
            <p class="text-xs text-slate-400 mt-0.5">${categoriesAvecCompte.length} catégorie(s) enregistrée(s).</p>
          </div>

          <button id="addCategorieBtn" class="inline-flex items-center gap-2 rounded-xl bg-amber-700 px-4 py-3 text-xs font-black text-white shadow-md transition hover:bg-amber-800">
            <i class="fa-solid fa-plus text-sm"></i>
            <span>Nouvelle catégorie</span>
          </button>
        </div>

        <div id="grilleCategories" class="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4"></div>
      </section>
    `;

    afficherCartes(categoriesAvecCompte);

    document.getElementById("addCategorieBtn").addEventListener("click", () => ouvrirFormulaireCategorie());
  } catch (error) {
    app.innerHTML = `<p class="text-rose-600 font-bold p-4">Erreur : ${escapeHtml(error.message)}</p>`;
  }
}

function afficherCartes(categories) {
  const grille = document.getElementById("grilleCategories");
  if (!grille) return;

  if (!categories.length) {
    grille.innerHTML = `
      <div class="col-span-full rounded-3xl border border-dashed border-slate-300 bg-slate-50 px-5 py-10 text-center text-sm font-semibold text-slate-500">
        Aucune catégorie enregistrée pour l'instant.
      </div>
    `;
    return;
  }

  grille.innerHTML = categories.map(cat => `
    <article class="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition hover:shadow-md">
      <div class="relative h-36 w-full bg-slate-100">
        <img src="${cat.image || IMAGE_PLACEHOLDER}" alt="${escapeHtml(cat.libelle)}" class="h-full w-full object-cover" />
        <span class="absolute right-3 top-3 rounded-full bg-slate-950/80 px-2.5 py-1 text-[10px] font-black text-white">
          ${cat.nombreProduits} produit${cat.nombreProduits > 1 ? "s" : ""}
        </span>
      </div>
      <div class="p-4">
        <h3 class="text-sm font-black text-slate-950 truncate">${escapeHtml(cat.libelle)}</h3>
        <div class="mt-3 flex items-center justify-end gap-2">
          <button class="inline-flex h-8 w-8 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-100" title="Modifier" data-edit-categorie="${escapeHtml(cat.id)}">
            <i class="fa-solid fa-pen text-xs"></i>
          </button>
          <button class="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-rose-50 text-rose-600 transition hover:bg-rose-100" title="Supprimer" data-delete-categorie="${escapeHtml(cat.id)}">
            <i class="fa-solid fa-trash-can text-xs"></i>
          </button>
        </div>
      </div>
    </article>
  `).join("");

  document.querySelectorAll("[data-edit-categorie]").forEach(btn => {
    btn.addEventListener("click", () => {
      const cat = categories.find(c => c.id === btn.dataset.editCategorie);
      if (cat) ouvrirFormulaireCategorie(cat);
    });
  });

  document.querySelectorAll("[data-delete-categorie]").forEach(btn => {
    btn.addEventListener("click", () => {
      const id = btn.dataset.deleteCategorie;
      const cat = categories.find(c => c.id === id);

      openConfirm({
        message: cat?.nombreProduits > 0
          ? `Attention : ${cat.nombreProduits} produit(s) sont rattachés à "${cat.libelle}". Déplacer quand même cette catégorie vers la corbeille ?`
          : `Déplacer la catégorie "${cat?.libelle || ""}" vers la corbeille ?`,
        confirmLabel: "Déplacer vers la corbeille",
        onConfirm: async () => {
          try {
            await deplacerCategorieVersCorbeille(id);
            showToast("Catégorie déplacée vers la corbeille.");
            await renderCategoriesPage();
          } catch (error) {
            showToast(error.message, "error");
          }
        }
      });
    });
  });
}

function ouvrirFormulaireCategorie(categorie = null) {
  let fichierImageChoisi = null;

  const body = `
    <div>
      <label class="mb-2 block text-xs font-extrabold uppercase tracking-[0.14em] text-slate-500" for="categorieLibelle">Libellé *</label>
      <input id="categorieLibelle" type="text" value="${escapeHtml(categorie?.libelle || "")}" placeholder="ex: Salons & Canapés" class="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-800 outline-none transition focus:border-amber-600 focus:ring-4 focus:ring-amber-50" />
    </div>

    <div>
      <label class="mb-2 block text-xs font-extrabold uppercase tracking-[0.14em] text-slate-500">Image de la catégorie</label>
      <div class="flex items-center gap-4">
        <img id="previsualisationImage" src="${categorie?.image || IMAGE_PLACEHOLDER}" alt="" class="h-16 w-16 rounded-2xl object-cover border border-slate-200" />
        <input id="categorieImageFichier" type="file" accept="image/*" class="flex-1 text-xs text-slate-500 file:mr-3 file:rounded-xl file:border-0 file:bg-slate-100 file:px-3 file:py-2 file:text-xs file:font-bold file:text-slate-700 hover:file:bg-slate-200" />
      </div>
      <p class="mt-1 text-[11px] text-slate-400">Stockée sur Cloudinary. Laissez vide pour garder l'image actuelle.</p>
    </div>
  `;

  openModal({
    title: categorie ? "Modifier la catégorie" : "Nouvelle catégorie",
    icon: "fa-tag",
    iconClass: "bg-amber-100 text-amber-700",
    body,
    confirmLabel: categorie ? "Enregistrer" : "Créer",
    confirmClass: "bg-amber-700 shadow-amber-200 hover:bg-amber-800",
    onMount: (overlay) => {
      overlay.querySelector("#categorieImageFichier").addEventListener("change", (e) => {
        fichierImageChoisi = e.target.files[0] || null;
        if (fichierImageChoisi) {
          overlay.querySelector("#previsualisationImage").src = URL.createObjectURL(fichierImageChoisi);
        }
      });
      overlay.querySelector("#categorieLibelle").focus();
    },
    onConfirm: async (overlay) => {
      const libelle = overlay.querySelector("#categorieLibelle").value.trim();

      const estValide = validerFormulaire([
        { id: "categorieLibelle", verifications: [() => required(libelle, "Le libellé est obligatoire.")] }
      ]);
      if (!estValide) return false; // on garde la modale ouverte

      try {
        let urlImage = categorie?.image || "";

        if (fichierImageChoisi) {
          showToast("Envoi de l'image sur Cloudinary...");
          const resultat = await uploaderImage(fichierImageChoisi);
          urlImage = resultat.imageUrl;
        }

        if (categorie) {
          await updateCategorie(categorie.id, { libelle, image: urlImage });
          showToast("Catégorie modifiée avec succès.");
        } else {
          await createCategorie({ libelle, image: urlImage });
          showToast("Catégorie créée avec succès.");
        }

        await renderCategoriesPage();
      } catch (error) {
        showToast(error.message, "error");
        return false; // on garde la modale ouverte pour corriger
      }
    }
  });
}