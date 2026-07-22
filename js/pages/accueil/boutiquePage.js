// accueil/boutiquePage.js
import { API_BASE_URL } from "../../config/api.js";
import { apiRequest } from "../../services/apiClient.js";
import { getAllProduits } from "../../services/produitservice.js";
import { escapeHtml } from "../../utils/html.js";

function placeholderUrl(label, w = 600, h = 450) {
  return `https://placehold.co/${w}x${h}/EDE1D3/2F4B36?text=${encodeURIComponent(label)}&font=raleway`;
}

// Dernier segment d'une adresse "Médina, Rue 22, Dakar" -> "Dakar"
function extraireVille(adresse) {
  if (!adresse) return "Sénégal";
  const parts = adresse.split(",").map(p => p.trim());
  return parts[parts.length - 1] || "Sénégal";
}

const etatFiltre = {
  categorieId: "tout",
  budgetMax: 1000000,
  tri: "popularite"
};

let produitsEnrichis = [];
let categories = [];

export async function renderBoutiquePage() {
  const app = document.getElementById("app");

  try {
    const [tousLesProduits, categoriesData, utilisateurs] = await Promise.all([
      getAllProduits(), // exclut déjà les produits mis à la corbeille par l'admin
      apiRequest(`${API_BASE_URL}/categories`, {}, "Erreur catégories."),
      apiRequest(`${API_BASE_URL}/utilisateurs`, {}, "Erreur utilisateurs.")
    ]);

    const produits = tousLesProduits.filter(p => p.statut === "VALIDE");

    categories = categoriesData;

    // Jointure produit -> catégorie (libelle) + artisan (atelier, ville)
    produitsEnrichis = produits.map(p => {
      const categorie = categories.find(c => c.id === p.categorieId);
      const artisan = utilisateurs.find(u => u.id === p.artisanId && u.role === "artisan");
      return {
        ...p,
        categorieLibelle: categorie?.libelle || "Autre",
        artisanNom: artisan?.atelier || `${artisan?.prenom ?? ""} ${artisan?.nom ?? ""}`.trim() || "Artisan Kër Mobilier",
        artisanVille: extraireVille(artisan?.adresse)
      };
    });

    app.innerHTML = `
      ${renderHero()}
      ${renderCartesAtouts()}
      ${renderCategories()}
      ${renderCatalogue()}
      ${renderDevisSurMesure()}
      ${renderPourquoiChoisir()}
      ${renderTemoignages()}
    `;

    attacherEvenements();
  } catch (err) {
    app.innerHTML = `
      <div class="mx-auto max-w-3xl p-6">
        <p class="text-rose-600 font-bold p-4">Erreur : ${escapeHtml(err.message)}</p>
      </div>
    `;
  }
}

// ---------- SECTIONS ----------

function renderHero() {
  return `
    <section class="relative overflow-hidden">
      <div class="absolute inset-0">
        <img src="${placeholderUrl('Intérieur+Kër+Mobilier', 1600, 900)}" alt="" class="h-full w-full object-cover" />
        <div class="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-transparent"></div>
      </div>
      <div class="relative mx-auto max-w-7xl px-4 py-24 sm:px-6 sm:py-32 lg:px-8">
        <div class="max-w-xl">
          <h1 class="font-serif text-4xl font-semibold leading-[1.05] text-white sm:text-6xl">
            Concevez l'espace de vie de vos rêves
          </h1>
          <p class="mt-5 text-base leading-7 text-white/85 sm:text-lg">
            Des meubles locaux et une décoration élégante pour sublimer votre intérieur.
          </p>
          <button data-scroll-to="catalogue" class="mt-8 rounded-full bg-terracotta-500 px-6 py-3 text-sm font-black text-white shadow-lg transition hover:bg-terracotta-600">
            En savoir plus
          </button>
        </div>
      </div>
    </section>
  `;
}

function renderCartesAtouts() {
  const cartes = [
    { titre: "Mobilier Moderne", texte: "Des lignes épurées et des finitions soignées, pensées pour durer dans votre quotidien.", image: placeholderUrl("Mobilier") },
    { titre: "Touches Décoratives", texte: "Des objets qui racontent une histoire : céramiques, tissages et pièces façonnées à la main.", image: placeholderUrl("Déco") },
    { titre: "Une vie inspirée", texte: "Composez un intérieur qui vous ressemble, à partir du savoir-faire de nos artisans.", image: placeholderUrl("Intérieur") }
  ];

  const cartesHtml = cartes.map(c => `
    <div class="flex items-center gap-4 rounded-3xl border border-black/5 bg-white p-4 shadow-sm">
      <img src="${c.image}" alt="" class="h-16 w-16 flex-none rounded-2xl object-cover" />
      <div>
        <h3 class="text-sm font-black text-slate-950">${c.titre}</h3>
        <p class="mt-1 text-xs leading-5 text-slate-500">${c.texte}</p>
      </div>
    </div>
  `).join("");

  return `
    <section class="relative -mt-10 px-4 sm:px-6 lg:px-8">
      <div class="mx-auto grid max-w-7xl gap-4 sm:grid-cols-3">${cartesHtml}</div>
    </section>
  `;
}

function renderCategories() {
  const pillsHtml = [{ id: "tout", libelle: "Tout" }, ...categories].map(c => `
    <button data-categorie-id="${c.id}" class="pill-categorie rounded-full px-4 py-2 text-xs font-bold transition ${c.id === "tout" ? "bg-forest-700 text-white" : "bg-white text-slate-600 border border-black/10 hover:border-forest-700"}">
      ${escapeHtml(c.libelle)}
    </button>
  `).join("");

  const cartesHtml = categories.map(c => `
    <button data-categorie-id="${c.id}" class="carte-categorie group text-left">
      <div class="relative h-28 overflow-hidden rounded-2xl">
        <img src="${c.image || placeholderUrl(c.libelle)}" alt="${escapeHtml(c.libelle)}" class="h-full w-full object-cover transition group-hover:scale-105" />
        <div class="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
      </div>
      <p class="mt-2 text-sm font-black text-slate-950">${escapeHtml(c.libelle)}</p>
      <p class="text-[11px] font-bold text-terracotta-600">Voir les créations</p>
    </button>
  `).join("");

  return `
    <section class="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <span class="text-xs font-black uppercase tracking-[0.2em] text-forest-700">Univers d'ameublement</span>
      <div class="mt-2 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 class="font-serif text-2xl font-semibold text-slate-950 sm:text-3xl">Parcourir par catégories</h2>
          <p class="mt-1 text-sm text-slate-500">Choisissez la pièce de votre maison à sublimer.</p>
        </div>
        <div class="flex flex-wrap gap-2">${pillsHtml}</div>
      </div>
      <div class="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">${cartesHtml}</div>
    </section>
  `;
}

function renderCatalogue() {
  const categorieOptions = [`<option value="tout">Tout</option>`, ...categories.map(c => `<option value="${c.id}">${escapeHtml(c.libelle)}</option>`)].join("");

  return `
    <section id="catalogue" class="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <div class="text-center">
        <span class="text-xs font-black uppercase tracking-[0.2em] text-forest-700">Catalogue mobilier d'art</span>
        <h2 class="mt-2 font-serif text-2xl font-semibold text-slate-950 sm:text-3xl">Nos créations populaires</h2>
        <p class="mx-auto mt-2 max-w-xl text-sm text-slate-500">Commandez directement ou envoyez une demande sur mesure à l'artisan agréé.</p>
      </div>

      <div class="mt-8 grid gap-4 rounded-3xl border border-black/5 bg-white p-5 shadow-sm sm:grid-cols-3">
        <label class="block">
          <span class="mb-1 block text-[10px] font-extrabold uppercase text-slate-400">Catégorie</span>
          <select id="filtreCategorie" class="w-full rounded-xl border border-slate-200 bg-slate-50 p-2 text-xs font-bold">${categorieOptions}</select>
        </label>
        <label class="block">
          <span class="mb-1 flex items-center justify-between text-[10px] font-extrabold uppercase text-slate-400">
            <span>Budget max</span>
            <span id="valeurBudget" class="text-forest-700">${etatFiltre.budgetMax.toLocaleString()} FCFA</span>
          </span>
          <input id="filtreBudget" type="range" min="20000" max="1000000" step="10000" value="${etatFiltre.budgetMax}" class="w-full accent-forest-700" />
        </label>
        <label class="block">
          <span class="mb-1 block text-[10px] font-extrabold uppercase text-slate-400">Trier par</span>
          <select id="filtreTri" class="w-full rounded-xl border border-slate-200 bg-slate-50 p-2 text-xs font-bold">
            <option value="popularite">Popularité & Évaluations</option>
            <option value="prix_asc">Prix croissant</option>
            <option value="prix_desc">Prix décroissant</option>
          </select>
        </label>
      </div>

      <p id="compteurResultats" class="mt-6 text-xs font-bold text-slate-500"></p>
      <div id="grilleProduits" class="mt-3 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4"></div>
    </section>
  `;
}

function carteProduitHtml(p) {
  const image = p.images && p.images !== "https://placehold.co" ? p.images : placeholderUrl(p.nom);

  return `
    <div class="overflow-hidden rounded-3xl border border-black/5 bg-white shadow-sm transition hover:shadow-md">
      <div class="relative h-44 w-full bg-slate-100">
        <img src="${image}" alt="${escapeHtml(p.nom)}" class="h-full w-full object-cover" />
        ${p.isPremium ? `<span class="absolute left-3 top-3 rounded-full bg-forest-700 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-white shadow-sm"><i class="fa-solid fa-certificate mr-1"></i>Partenaire Agréé</span>` : ""}
        <button class="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-slate-500 transition hover:text-rose-500" title="Ajouter aux favoris">
          <i class="fa-regular fa-heart text-xs"></i>
        </button>
      </div>
      <div class="p-4">
        <div class="flex items-center justify-between">
          <span class="text-[10px] font-black uppercase tracking-wide text-terracotta-600">${escapeHtml(p.categorieLibelle)}</span>
          ${p.nombreAvis > 0
            ? `<span class="flex items-center gap-1 text-[11px] font-bold text-amber-600"><i class="fa-solid fa-star"></i> ${p.noteMoyenne} (${p.nombreAvis})</span>`
            : `<span class="text-[10px] font-bold text-slate-400">Nouveau</span>`}
        </div>
        <h3 class="mt-1 text-sm font-black text-slate-950 truncate">${escapeHtml(p.nom)}</h3>
        <p class="mt-1 text-[11px] font-semibold text-slate-500">${escapeHtml(p.artisanNom)} · ${escapeHtml(p.artisanVille)}</p>
        <div class="mt-4 flex items-center justify-between border-t border-slate-50 pt-3">
          <div>
            <p class="text-[9px] font-extrabold uppercase text-slate-400">Prix direct</p>
            <span class="font-mono text-sm font-black text-slate-950">${p.prix.toLocaleString()} FCFA</span>
          </div>
          <div class="flex items-center gap-2">
            <button class="rounded-xl bg-slate-900 px-3 py-1.5 text-[11px] font-bold text-white transition hover:bg-slate-800">Détails</button>
            <button class="flex h-8 w-8 items-center justify-center rounded-xl bg-terracotta-500 text-white transition hover:bg-terracotta-600" title="Ajouter au panier">
              <i class="fa-solid fa-plus text-xs"></i>
            </button>
          </div>
        </div>
      </div>
    </div>
  `;
}

function rafraichirGrilleProduits() {
  let liste = [...produitsEnrichis];

  if (etatFiltre.categorieId !== "tout") {
    liste = liste.filter(p => p.categorieId === etatFiltre.categorieId);
  }
  liste = liste.filter(p => p.prix <= etatFiltre.budgetMax);

  if (etatFiltre.tri === "prix_asc") liste.sort((a, b) => a.prix - b.prix);
  if (etatFiltre.tri === "prix_desc") liste.sort((a, b) => b.prix - a.prix);
  if (etatFiltre.tri === "popularite") liste.sort((a, b) => (b.noteMoyenne ?? 0) - (a.noteMoyenne ?? 0));

  const grille = document.getElementById("grilleProduits");
  const compteur = document.getElementById("compteurResultats");
  if (!grille || !compteur) return;

  compteur.textContent = `${liste.length} modèle(s) trouvé(s) correspondant à vos critères`;
  grille.innerHTML = liste.length
    ? liste.map(carteProduitHtml).join("")
    : `<p class="col-span-full rounded-2xl border border-dashed border-slate-200 p-8 text-center text-xs font-bold text-slate-400">Aucun produit ne correspond à ces critères pour l'instant.</p>`;
}

function renderDevisSurMesure() {
  const etapes = [
    { n: 1, titre: "Remplissez le formulaire de projet", texte: "Indiquez le type de meuble souhaité et vos dimensions." },
    { n: 2, titre: "Réception des devis d'artisans", texte: "Comparez les propositions des artisans partenaires, leur prix et leur délai." },
    { n: 3, titre: "Lancement de la fabrication", texte: "Validez la proposition de votre choix pour démarrer la fabrication sur mesure." }
  ];

  const etapesHtml = etapes.map(e => `
    <div class="flex gap-3">
      <span class="flex h-7 w-7 flex-none items-center justify-center rounded-full bg-terracotta-500 text-xs font-black text-white">${e.n}</span>
      <div>
        <p class="text-sm font-black text-slate-950">${e.titre}</p>
        <p class="text-xs leading-5 text-slate-500">${e.texte}</p>
      </div>
    </div>
  `).join("");

  return `
    <section class="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <div class="grid gap-10 rounded-[2.5rem] border border-black/5 bg-white p-6 shadow-sm lg:grid-cols-2 lg:p-10">
        <div>
          <span class="rounded-full bg-forest-700/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-forest-700">Exclusivité Kër Mobilier</span>
          <h2 class="mt-3 font-serif text-2xl font-semibold text-slate-950 sm:text-3xl">Vous avez un modèle précis en tête ?</h2>
          <p class="mt-3 text-sm leading-6 text-slate-600">
            Envoyez votre projet : notre équipe transmet votre demande aux artisans partenaires les plus adaptés, qui vous font parvenir leurs propositions de prix et de délai.
          </p>
          <div class="mt-6 grid gap-4">${etapesHtml}</div>
        </div>

        <form id="surMesureForm" class="grid gap-4 rounded-3xl border border-slate-100 bg-slate-50 p-6">
          <h3 class="border-b pb-2 text-base font-black text-slate-900">Demande de fabrication sur mesure</h3>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="mb-1 block text-[10px] font-extrabold uppercase text-slate-500">Type de meuble *</label>
              <input type="text" id="smType" class="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs" placeholder="Ex: Armoire" required />
            </div>
            <div>
              <label class="mb-1 block text-[10px] font-extrabold uppercase text-slate-500">Matériau *</label>
              <input type="text" id="smMateriau" class="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs" placeholder="Ex: Bois de Teck" required />
            </div>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="mb-1 block text-[10px] font-extrabold uppercase text-slate-500">Dimensions *</label>
              <input type="text" id="smDimensions" class="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs" placeholder="Ex: 3m x 2m" required />
            </div>
            <div>
              <label class="mb-1 block text-[10px] font-extrabold uppercase text-slate-500">Budget (FCFA) *</label>
              <input type="number" id="smBudget" class="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs" placeholder="Ex: 350000" required />
            </div>
          </div>

          <div>
            <label class="mb-1 block text-[10px] font-extrabold uppercase text-slate-500">Description *</label>
            <textarea id="smDescription" rows="2" class="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs" placeholder="Détails, finitions souhaitées..." required></textarea>
          </div>

          <button type="submit" class="w-full rounded-xl bg-terracotta-500 py-3 text-xs font-black text-white shadow-md transition hover:bg-terracotta-600">
            Soumettre ma demande
          </button>
        </form>
      </div>
    </section>
  `;
}

function renderPourquoiChoisir() {
  const atouts = [
    { titre: "Artisans vérifiés", texte: "Chaque artisan passe par un processus de sélection pour garantir des finitions soignées." },
    { titre: "Produits locaux", texte: "Mobilier fabriqué au Sénégal par des artisans de Dakar et sa banlieue." },
    { titre: "Livraison suivie", texte: "Nos livreurs récupèrent le meuble chez l'artisan et le livrent chez vous en toute sécurité." },
    { titre: "Fabrication sur mesure", texte: "Décrivez vos dimensions et votre budget, recevez des propositions d'artisans partenaires." },
    { titre: "Validation qualité", texte: "Chaque produit publié est validé par notre équipe avant d'être visible sur la boutique." },
    { titre: "Support client réactif", texte: "Notre équipe vous accompagne de la commande jusqu'à la livraison." }
  ];

  const atoutsHtml = atouts.map(a => `
    <div class="rounded-2xl border border-black/5 bg-white p-5">
      <span class="flex h-8 w-8 items-center justify-center rounded-full bg-forest-700/10 text-forest-700"><i class="fa-solid fa-check text-xs"></i></span>
      <h3 class="mt-3 text-sm font-black text-slate-950">${a.titre}</h3>
      <p class="mt-1 text-xs leading-5 text-slate-500">${a.texte}</p>
    </div>
  `).join("");

  return `
    <section class="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <div class="text-center">
        <span class="text-xs font-black uppercase tracking-[0.2em] text-forest-700">L'artisanat avec garantie</span>
        <h2 class="mt-2 font-serif text-2xl font-semibold text-slate-950 sm:text-3xl">Pourquoi choisir Kër Mobilier ?</h2>
      </div>
      <div class="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">${atoutsHtml}</div>
    </section>
  `;
}

function renderTemoignages() {
  const avis = [
    { nom: "Aminata Fall", note: 5, texte: "Le canapé commandé est arrivé en parfait état, fidèle au design demandé. Livraison à Dakar impeccable." },
    { nom: "Ndeye Diagne", note: 5, texte: "Très satisfaite de la qualité et du suivi de ma commande, du paiement jusqu'à la livraison." }
  ];

  const avisHtml = avis.map(a => `
    <div class="rounded-2xl border border-black/5 bg-white p-4">
      <div class="flex items-center gap-3">
        <span class="flex h-9 w-9 items-center justify-center rounded-full bg-forest-700/10 text-xs font-black text-forest-700">
          ${escapeHtml(a.nom.split(" ").map(n => n[0]).join(""))}
        </span>
        <p class="text-xs font-black text-slate-950">${escapeHtml(a.nom)}</p>
      </div>
      <p class="mt-2 text-[11px] font-bold text-amber-500">${"★".repeat(a.note)}</p>
      <p class="mt-1 text-xs leading-5 text-slate-500">${escapeHtml(a.texte)}</p>
    </div>
  `).join("");

  return `
    <section class="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <div class="text-center">
        <span class="text-xs font-black uppercase tracking-[0.2em] text-forest-700">Témoignages réels</span>
        <h2 class="mt-2 font-serif text-2xl font-semibold text-slate-950 sm:text-3xl">Ce que disent nos clients</h2>
      </div>
      <div class="mt-8 grid gap-6 rounded-[2.5rem] border border-black/5 bg-white p-6 shadow-sm lg:grid-cols-2 lg:p-8">
        <div class="grid gap-4">${avisHtml}</div>
        <img src="${placeholderUrl('Salle+à+manger', 700, 460)}" alt="" class="h-64 w-full rounded-3xl object-cover sm:h-full" />
      </div>
    </section>
  `;
}

// ---------- ÉVÉNEMENTS ----------

function attacherEvenements() {
  rafraichirGrilleProduits();

  document.querySelectorAll(".pill-categorie, .carte-categorie").forEach(el => {
    el.addEventListener("click", () => {
      etatFiltre.categorieId = el.dataset.categorieId;
      document.getElementById("filtreCategorie").value = etatFiltre.categorieId;
      document.querySelectorAll(".pill-categorie").forEach(p => {
        const actif = p.dataset.categorieId === etatFiltre.categorieId;
        p.classList.toggle("bg-forest-700", actif);
        p.classList.toggle("text-white", actif);
        p.classList.toggle("bg-white", !actif);
        p.classList.toggle("text-slate-600", !actif);
        p.classList.toggle("border", !actif);
        p.classList.toggle("border-black/10", !actif);
      });
      document.getElementById("catalogue")?.scrollIntoView({ behavior: "smooth", block: "start" });
      rafraichirGrilleProduits();
    });
  });

  document.getElementById("filtreCategorie")?.addEventListener("change", (e) => {
    etatFiltre.categorieId = e.target.value;
    rafraichirGrilleProduits();
  });

  document.getElementById("filtreBudget")?.addEventListener("input", (e) => {
    etatFiltre.budgetMax = Number(e.target.value);
    document.getElementById("valeurBudget").textContent = `${etatFiltre.budgetMax.toLocaleString()} FCFA`;
    rafraichirGrilleProduits();
  });

  document.getElementById("filtreTri")?.addEventListener("change", (e) => {
    etatFiltre.tri = e.target.value;
    rafraichirGrilleProduits();
  });

  document.querySelector("[data-scroll-to]")?.addEventListener("click", (e) => {
    document.getElementById(e.currentTarget.dataset.scrollTo)?.scrollIntoView({ behavior: "smooth" });
  });

  document.getElementById("surMesureForm")?.addEventListener("submit", async (e) => {
    e.preventDefault();

    const type = document.getElementById("smType").value;
    const description = document.getElementById("smDescription").value;

    const payload = {
      clientId: "user-client-1", // TODO: remplacer par l'ID du client connecté une fois l'auth branchée
      description: `${type} — ${description}`,
      dimensions: document.getElementById("smDimensions").value,
      materiau: document.getElementById("smMateriau").value,
      budget: Number(document.getElementById("smBudget").value),
      image: null,
      dateCreation: new Date().toISOString().split("T")[0],
      statut: "EN_ATTENTE"
    };

    try {
      await apiRequest(`${API_BASE_URL}/demandesSurMesure`, {
        method: "POST",
        body: JSON.stringify(payload)
      }, "Erreur lors de l'envoi.");

      alert("Votre demande sur-mesure a bien été transmise !");
      e.target.reset();
    } catch (err) {
      alert(err.message);
    }
  });
}