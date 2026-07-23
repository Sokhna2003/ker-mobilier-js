import { getAllProduits, createProduit, updateProduit, deplacerProduitVersCorbeille } from "../../services/produitservice.js";
import { getCategories } from "../../services/categorieservice.js";
import { uploaderImage } from "../../services/cloudinaryService.js";
import { getSession } from "../../utils/session.js";
import { escapeHtml } from "../../utils/html.js";
import { showToast } from "../../components/toast.js";
import { openModal, openConfirm } from "../../components/modal.js";
import { required, isPositiveNumber, isNonNegativeNumber, validerFormulaire } from "../../utils/validator.js";

const IMAGE_PLACEHOLDER = "https://placehold.co/400x300/EDE1D3/2F4B36?text=Produit";

const STATUT_INFO = {
  EN_ATTENTE: { label: "En attente", classe: "bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-600/20" },
  VALIDE: { label: "Validé", classe: "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/20" },
  REJETE: { label: "Refusé", classe: "bg-rose-50 text-rose-700 ring-1 ring-inset ring-rose-600/20" }
};

let mesProduits = [];
let categoriesDisponibles = [];
let filtreTexte = "";
let filtreCategorie = "tout";
let filtreStatutArtisan = "tout";
let modeAffichage = "cartes"; // "cartes" | "liste"

export async function renderArtisanProduitsPage() {
  const app = document.getElementById("app");
  const session = getSession();

  try {
    const [tousLesProduits, categories] = await Promise.all([getAllProduits(), getCategories()]);

    categoriesDisponibles = categories;
    mesProduits = tousLesProduits
      .filter(p => p.artisanId === session.id)
      .map(p => ({ ...p, categorieLibelle: categories.find(c => c.id === p.categorieId)?.libelle || "—" }));

    app.innerHTML = `
      <section class="space-y-6">
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-100 pb-5">
          <div>
            <span class="text-xs font-black uppercase tracking-[0.2em] text-amber-700">Mon atelier</span>
            <h1 class="text-2xl font-black text-slate-950 mt-1">Mes Produits</h1>
            <p class="text-xs text-slate-400 mt-0.5">Gérez votre catalogue. Toute nouveauté est soumise à la validation de l'administration.</p>
          </div>

          <button id="addProduitArtisanBtn" class="inline-flex items-center gap-2 rounded-xl bg-amber-700 px-4 py-3 text-xs font-black text-white shadow-md transition hover:bg-amber-800">
            <i class="fa-solid fa-plus text-sm"></i>
            <span>Ajouter un produit</span>
          </button>
        </div>

        <div class="grid gap-4 rounded-2xl border border-black/5 bg-white p-4 shadow-sm sm:grid-cols-[1fr_auto_auto_auto]">
          <div class="relative flex items-center">
            <div class="absolute left-3 text-slate-400"><i class="fa-solid fa-magnifying-glass text-xs"></i></div>
            <input type="text" id="rechercheProduitArtisan" class="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold text-slate-800 outline-none transition focus:border-amber-700 focus:bg-white" placeholder="Rechercher un de mes produits..." />
          </div>

          <select id="filtreCategorieArtisan" class="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs font-black text-slate-700 outline-none cursor-pointer transition hover:border-amber-700 focus:border-amber-700">
            <option value="tout">Toutes les catégories</option>
            ${categories.map(c => `<option value="${c.id}">${escapeHtml(c.libelle)}</option>`).join("")}
          </select>

          <select id="filtreStatutArtisanSelect" class="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs font-black text-slate-700 outline-none cursor-pointer transition hover:border-amber-700 focus:border-amber-700">
            <option value="tout">Tous les états</option>
            <option value="EN_ATTENTE">En attente</option>
            <option value="VALIDE">Validé</option>
            <option value="REJETE">Refusé</option>
          </select>

          <div class="flex items-center gap-1 rounded-xl border border-slate-200 bg-slate-50 p-1">
            <button id="vueCartesArtisanBtn" class="flex h-9 w-9 items-center justify-center rounded-lg transition" title="Vue cartes">
              <i class="fa-solid fa-grip"></i>
            </button>
            <button id="vueListeArtisanBtn" class="flex h-9 w-9 items-center justify-center rounded-lg transition" title="Vue liste">
              <i class="fa-solid fa-list"></i>
            </button>
          </div>
        </div>

        <p id="compteurProduitsArtisan" class="text-xs font-bold text-slate-500"></p>
        <div id="zoneProduitsArtisan"></div>
      </section>
    `;

    document.getElementById("addProduitArtisanBtn").addEventListener("click", () => ouvrirFormulaireProduitArtisan());

    document.getElementById("rechercheProduitArtisan").addEventListener("input", (e) => {
      filtreTexte = e.target.value;
      afficherMesProduits();
    });

    document.getElementById("filtreCategorieArtisan").addEventListener("change", (e) => {
      filtreCategorie = e.target.value;
      afficherMesProduits();
    });

    document.getElementById("filtreStatutArtisanSelect").addEventListener("change", (e) => {
      filtreStatutArtisan = e.target.value;
      afficherMesProduits();
    });

    document.getElementById("vueCartesArtisanBtn").addEventListener("click", () => {
      modeAffichage = "cartes";
      afficherMesProduits();
    });

    document.getElementById("vueListeArtisanBtn").addEventListener("click", () => {
      modeAffichage = "liste";
      afficherMesProduits();
    });

    afficherMesProduits();
  } catch (error) {
    app.innerHTML = `<p class="text-rose-600 font-bold p-4">Erreur : ${escapeHtml(error.message)}</p>`;
  }
}

function listeFiltree() {
  return mesProduits.filter(p => {
    const correspondCategorie = filtreCategorie === "tout" || p.categorieId === filtreCategorie;
    const correspondStatut = filtreStatutArtisan === "tout" || p.statut === filtreStatutArtisan;
    const correspondTexte = p.nom.toLowerCase().includes(filtreTexte.toLowerCase().trim());
    return correspondCategorie && correspondStatut && correspondTexte;
  });
}

function afficherMesProduits() {
  const zone = document.getElementById("zoneProduitsArtisan");
  const compteur = document.getElementById("compteurProduitsArtisan");
  const btnCartes = document.getElementById("vueCartesArtisanBtn");
  const btnListe = document.getElementById("vueListeArtisanBtn");
  if (!zone) return;

  btnCartes.classList.toggle("bg-white", modeAffichage === "cartes");
  btnCartes.classList.toggle("shadow-sm", modeAffichage === "cartes");
  btnCartes.classList.toggle("text-slate-900", modeAffichage === "cartes");
  btnCartes.classList.toggle("text-slate-400", modeAffichage !== "cartes");

  btnListe.classList.toggle("bg-white", modeAffichage === "liste");
  btnListe.classList.toggle("shadow-sm", modeAffichage === "liste");
  btnListe.classList.toggle("text-slate-900", modeAffichage === "liste");
  btnListe.classList.toggle("text-slate-400", modeAffichage !== "liste");

  const liste = listeFiltree();
  compteur.textContent = `${liste.length} produit(s) trouvé(s)`;

  if (!liste.length) {
    zone.innerHTML = `
      <div class="rounded-3xl border border-dashed border-slate-300 bg-slate-50 px-5 py-10 text-center text-sm font-semibold text-slate-500">
        Aucun produit ne correspond à vos critères.
      </div>
    `;
    return;
  }

  zone.innerHTML = modeAffichage === "cartes" ? renderVueCartes(liste) : renderVueListe(liste);
  attacherActionsArtisan();
}

// ---------- Vue cartes ----------

function renderVueCartes(liste) {
  return `<div class="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">${liste.map(carteProduitHtml).join("")}</div>`;
}

function carteProduitHtml(p) {
  const statutInfo = STATUT_INFO[p.statut] || { label: p.statut, classe: "bg-slate-100 text-slate-600" };
  const image = p.images && p.images !== "https://placehold.co" ? p.images : IMAGE_PLACEHOLDER;
  const stockFaible = Number(p.stock) <= 1;

  return `
    <article class="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition hover:shadow-md">
      <div class="relative h-40 w-full bg-slate-100">
        <img src="${image}" alt="${escapeHtml(p.nom)}" class="h-full w-full object-cover" />
        <span class="absolute right-3 top-3 rounded-full px-2.5 py-1 text-[10px] font-black uppercase ${statutInfo.classe}">${statutInfo.label}</span>
      </div>
      <div class="p-4">
        <p class="text-[10px] font-black uppercase tracking-wider text-slate-400">${escapeHtml(p.categorieLibelle)}</p>
        <h3 class="mt-1 text-sm font-black text-slate-950 truncate">${escapeHtml(p.nom)}</h3>
        <p class="mt-1 text-[11px] text-slate-500 line-clamp-2">${escapeHtml(p.description || "")}</p>
        <p class="mt-2 text-[11px] font-bold ${stockFaible ? "text-rose-600" : "text-slate-500"}">Stock : ${p.stock} restant(s)</p>
        <div class="mt-3 flex items-center justify-between border-t border-slate-50 pt-3">
          <span class="font-mono text-sm font-black text-slate-950">${Number(p.prix).toLocaleString()} FCFA</span>
          <div class="flex items-center gap-1.5">${renderActionsProduitArtisan(p)}</div>
        </div>
      </div>
    </article>
  `;
}

// ---------- Vue liste ----------

function renderVueListe(liste) {
  return `
    <article class="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
      <div class="overflow-x-auto">
        <table class="w-full border-collapse text-left text-xs">
          <thead class="bg-slate-50">
            <tr>
              <th class="px-5 py-4 font-black uppercase text-slate-500">Photo & Nom</th>
              <th class="px-5 py-4 font-black uppercase text-slate-500">Catégorie</th>
              <th class="px-5 py-4 font-black uppercase text-slate-500">Prix</th>
              <th class="px-5 py-4 font-black uppercase text-slate-500">Stock</th>
              <th class="px-5 py-4 font-black uppercase text-slate-500">Statut</th>
              <th class="px-5 py-4 text-right font-black uppercase text-slate-500">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">${liste.map(ligneProduitHtml).join("")}</tbody>
        </table>
      </div>
    </article>
  `;
}

function ligneProduitHtml(p) {
  const statutInfo = STATUT_INFO[p.statut] || { label: p.statut, classe: "bg-slate-100 text-slate-600" };
  const image = p.images && p.images !== "https://placehold.co" ? p.images : IMAGE_PLACEHOLDER;
  const stockFaible = Number(p.stock) <= 1;

  return `
    <tr class="hover:bg-slate-50/50 transition">
      <td class="px-5 py-3">
        <div class="flex items-center gap-3">
          <img src="${image}" alt="" class="h-10 w-10 rounded-xl object-cover" />
          <p class="font-black text-slate-950">${escapeHtml(p.nom)}</p>
        </div>
      </td>
      <td class="px-5 py-3 text-slate-600">${escapeHtml(p.categorieLibelle)}</td>
      <td class="px-5 py-3 font-mono font-bold text-slate-900">${Number(p.prix).toLocaleString()} FCFA</td>
      <td class="px-5 py-3 font-bold ${stockFaible ? "text-rose-600" : "text-slate-600"}">${p.stock} unité(s)</td>
      <td class="px-5 py-3">
        <span class="inline-flex items-center rounded-md px-2 py-1 text-[10px] font-black uppercase ${statutInfo.classe}">${statutInfo.label}</span>
      </td>
      <td class="px-5 py-3 text-right">
        <div class="flex items-center justify-end gap-1.5">${renderActionsProduitArtisan(p)}</div>
      </td>
    </tr>
  `;
}

// ---------- Actions : l'artisan gère toujours ses propres produits (modifier + corbeille) ----------

function renderActionsProduitArtisan(p) {
  return `
    <button class="flex h-8 w-8 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-100" title="Modifier" data-modifier-artisan="${escapeHtml(p.id)}">
      <i class="fa-solid fa-pen text-xs"></i>
    </button>
    <button class="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-100 text-slate-600 transition hover:bg-rose-100 hover:text-rose-600" title="Retirer (corbeille)" data-corbeille-artisan="${escapeHtml(p.id)}">
      <i class="fa-solid fa-trash-can text-xs"></i>
    </button>
  `;
}

function attacherActionsArtisan() {
  document.querySelectorAll("[data-modifier-artisan]").forEach(btn => {
    btn.addEventListener("click", () => {
      const produit = mesProduits.find(p => p.id === btn.dataset.modifierArtisan);
      if (produit) ouvrirFormulaireProduitArtisan(produit);
    });
  });

  document.querySelectorAll("[data-corbeille-artisan]").forEach(btn => {
    btn.addEventListener("click", () => {
      openConfirm({
        message: "Retirer ce produit et le déplacer vers la corbeille ?",
        confirmLabel: "Déplacer vers la corbeille",
        onConfirm: async () => {
          try {
            await deplacerProduitVersCorbeille(btn.dataset.corbeilleArtisan);
            showToast("Produit déplacé vers la corbeille.");
            await renderArtisanProduitsPage();
          } catch (error) {
            showToast(error.message, "error");
          }
        }
      });
    });
  });
}

// ---------- Formulaire d'ajout / modification ----------

function ouvrirFormulaireProduitArtisan(produit = null) {
  let fichierImageChoisi = null;
  const session = getSession();

  const optionsCategories = categoriesDisponibles.map(c => `
    <option value="${c.id}" ${produit?.categorieId === c.id ? "selected" : ""}>${escapeHtml(c.libelle)}</option>
  `).join("");

  const imageDepart = produit?.images && produit.images !== "https://placehold.co" ? produit.images : "";

  const body = `
    <div class="grid grid-cols-2 gap-3">
      <div>
        <label class="mb-1 block text-[10px] font-extrabold uppercase text-slate-500">Catégorie *</label>
        <select id="produitCategorieArtisan" class="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-bold">${optionsCategories}</select>
      </div>
      <div>
        <label class="mb-1 block text-[10px] font-extrabold uppercase text-slate-500">Matériau</label>
        <input type="text" id="produitMateriauArtisan" value="${escapeHtml(produit?.materiau || "")}" placeholder="ex: Bois de Vène" class="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs" />
      </div>
    </div>

    <div>
      <label class="mb-1 block text-[10px] font-extrabold uppercase text-slate-500">Nom du produit *</label>
      <input type="text" id="produitNomArtisan" value="${escapeHtml(produit?.nom || "")}" placeholder="ex: Table Basse Ngor" class="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs" />
    </div>

    <div>
      <label class="mb-1 block text-[10px] font-extrabold uppercase text-slate-500">Description</label>
      <textarea id="produitDescriptionArtisan" rows="2" class="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs">${escapeHtml(produit?.description || "")}</textarea>
    </div>

    <div class="grid grid-cols-2 gap-3">
      <div>
        <label class="mb-1 block text-[10px] font-extrabold uppercase text-slate-500">Prix (FCFA) *</label>
        <input type="number" id="produitPrixArtisan" value="${produit?.prix ?? ""}" placeholder="ex: 125000" class="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs" />
      </div>
      <div>
        <label class="mb-1 block text-[10px] font-extrabold uppercase text-slate-500">Stock *</label>
        <input type="number" id="produitStockArtisan" value="${produit?.stock ?? ""}" placeholder="ex: 5" class="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs" />
      </div>
    </div>

    <div>
      <label class="mb-1 block text-[10px] font-extrabold uppercase text-slate-500">Image du produit</label>
      <label id="zoneDeposeImageArtisan" for="produitImageFichierArtisan" class="mt-1 flex cursor-pointer flex-col items-center justify-center gap-1 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center transition hover:border-amber-600 hover:bg-amber-50/40 ${imageDepart ? "hidden" : ""}">
        <i class="fa-solid fa-camera text-lg text-slate-400"></i>
        <p class="text-xs font-bold text-slate-600">Cliquez pour parcourir</p>
        <p class="text-[10px] text-slate-400">Formats acceptés : JPG, PNG</p>
      </label>
      <div id="zoneApercuImageArtisan" class="${imageDepart ? "" : "hidden"} relative mt-1 overflow-hidden rounded-2xl border border-slate-200">
        <img id="previsualisationImageArtisan" src="${imageDepart || IMAGE_PLACEHOLDER}" alt="" class="h-40 w-full object-cover" />
        <button type="button" id="changerImageArtisanBtn" class="absolute bottom-2 right-2 rounded-lg bg-slate-950/80 px-2.5 py-1.5 text-[10px] font-black text-white transition hover:bg-slate-950">
          <i class="fa-solid fa-rotate mr-1"></i>Changer l'image
        </button>
      </div>
      <input id="produitImageFichierArtisan" type="file" accept="image/*" class="hidden" />
    </div>

    ${produit ? "" : `<p class="text-[11px] text-slate-400"><i class="fa-solid fa-circle-info mr-1"></i>Ce produit sera soumis à la validation de l'administration avant d'apparaître sur la boutique.</p>`}
  `;

  openModal({
    title: produit ? "Modifier mon produit" : "Ajouter un nouveau produit",
    icon: "fa-couch",
    iconClass: "bg-amber-100 text-amber-700",
    body,
    confirmLabel: produit ? "Enregistrer" : "Soumettre à validation",
    confirmClass: "bg-amber-700 shadow-amber-200 hover:bg-amber-800",
    onMount: (overlay) => {
      const inputFichier = overlay.querySelector("#produitImageFichierArtisan");
      const zoneDepose = overlay.querySelector("#zoneDeposeImageArtisan");
      const zoneApercu = overlay.querySelector("#zoneApercuImageArtisan");
      const imgApercu = overlay.querySelector("#previsualisationImageArtisan");

      inputFichier.addEventListener("change", (e) => {
        fichierImageChoisi = e.target.files[0] || null;
        if (fichierImageChoisi) {
          imgApercu.src = URL.createObjectURL(fichierImageChoisi);
          zoneDepose.classList.add("hidden");
          zoneApercu.classList.remove("hidden");
        }
      });

      overlay.querySelector("#changerImageArtisanBtn").addEventListener("click", () => inputFichier.click());
      overlay.querySelector("#produitNomArtisan").focus();
    },
    onConfirm: async (overlay) => {
      const nom = overlay.querySelector("#produitNomArtisan").value.trim();
      const prix = overlay.querySelector("#produitPrixArtisan").value;
      const stock = overlay.querySelector("#produitStockArtisan").value;

      const estValide = validerFormulaire([
        { id: "produitNomArtisan", verifications: [() => required(nom, "Le nom du produit est obligatoire.")] },
        { id: "produitPrixArtisan", verifications: [
          () => required(prix, "Le prix est obligatoire."),
          () => isPositiveNumber(prix, "Le prix doit être un nombre positif.")
        ] },
        { id: "produitStockArtisan", verifications: [
          () => required(stock, "Le stock est obligatoire."),
          () => isNonNegativeNumber(stock, "Le stock doit être un nombre positif ou nul.")
        ] }
      ]);
      if (!estValide) return false;

      try {
        let urlImage = produit?.images || "";

        if (fichierImageChoisi) {
          showToast("Envoi de l'image sur Cloudinary...");
          const resultat = await uploaderImage(fichierImageChoisi);
          urlImage = resultat.imageUrl;
        }

        const payloadCommun = {
          nom,
          description: overlay.querySelector("#produitDescriptionArtisan").value.trim(),
          prix: Number(prix),
          stock: Number(stock),
          materiau: overlay.querySelector("#produitMateriauArtisan").value.trim(),
          categorieId: overlay.querySelector("#produitCategorieArtisan").value,
          images: urlImage
        };

        if (produit) {
          await updateProduit(produit.id, payloadCommun);
          showToast("Produit modifié avec succès.");
        } else {
          const aujourdHui = new Date().toISOString().split("T")[0];
          await createProduit({
            ...payloadCommun,
            artisanId: session.id,
            statut: "EN_ATTENTE",
            ajoutePar: "artisan",
            isPremium: session.isPremium === true,
            dateCreation: aujourdHui,
            datePublication: null,
            noteMoyenne: 0,
            nombreAvis: 0
          });
          showToast("Produit soumis à l'administration pour validation.");
        }

        await renderArtisanProduitsPage();
      } catch (error) {
        showToast(error.message, "error");
        return false;
      }
    }
  });
}