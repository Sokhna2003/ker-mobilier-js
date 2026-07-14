import { API_BASE_URL } from "../../config/api.js";
import { apiRequest } from "../../services/apiClient.js";
import { showToast } from "../../components/toast.js";
import { escapeHtml } from "../../utils/html.js";

export async function renderBoutiquePage() {
  const app = document.getElementById("app");

  // Charge les données nécessaires depuis le db.json (uniquement les produits validés en ligne)
  const [produits, categories] = await Promise.all([
    apiRequest(`${API_BASE_URL}/produits?statut=VALIDE`, {}, "Erreur produits."),
    apiRequest(`${API_BASE_URL}/categories`, {}, "Erreur catégories.")
  ]);

  // Génération dynamique des cartes de catégories pour la section "Parcourir par catégories"
  const categoriesHtml = categories.map(cat => `
    <div class="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 text-center shadow-sm transition hover:shadow-md cursor-pointer">
      <div class="mx-auto mb-2 h-16 w-16 rounded-full bg-amber-50 text-amber-800 flex items-center justify-center font-black">
        <i class="fa-solid fa-chair text-xl"></i>
      </div>
      <h3 class="text-sm font-bold text-slate-900">${escapeHtml(cat.libelle)}</h3>
    </div>
  `).join("");

  // Génération dynamique de la grille des meubles pour la section "Nos créations populaires"
  const produitsHtml = produits.map(p => `
    <div class="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition hover:shadow-md">
      <div class="relative h-48 w-full bg-slate-100">
        <img src="${p.images}" alt="${escapeHtml(p.nom)}" class="h-full w-full object-cover" />
        ${p.isPremium ? `<span class="absolute left-3 top-3 rounded-full bg-amber-700 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-white shadow-sm">👑 Premium</span>` : ""}
      </div>
      <div class="p-4">
        <h3 class="text-base font-black text-slate-950 truncate">${escapeHtml(p.nom)}</h3>
        <p class="mt-1 text-xs text-slate-500 line-clamp-2">${escapeHtml(p.description)}</p>
        <div class="mt-4 flex items-center justify-between border-t border-slate-50 pt-3">
          <span class="font-mono text-base font-black text-amber-800">${p.prix.toLocaleString()} F</span>
          <button class="rounded-xl bg-slate-900 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-slate-800">
            Détails
          </button>
        </div>
      </div>
    </div>
  `).join("");

  // Structure HTML globale de votre superbe maquette
  app.innerHTML = `
    <!-- 1. SECTION HERO BANNER -->
    <header class="mb-12 overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-slate-950 via-slate-900 to-amber-950 p-8 text-white shadow-soft sm:p-12 relative">
      <div class="max-w-2xl z-10 relative">
        <span class="mb-3 inline-flex rounded-full bg-amber-500/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.2em] text-amber-300 ring-1 ring-amber-500/20">Kër Mobilier</span>
        <h1 class="text-4xl font-black tracking-tight sm:text-6xl leading-none">Concevez l'espace de vie de vos rêves</h1>
        <p class="mt-4 text-sm leading-6 text-slate-300 sm:text-base">Des meubles locaux et une décoration élégante pour sublimer votre intérieur. Fabriqués avec passion par les meilleurs artisans sénégalais.</p>
        <button class="mt-6 rounded-2xl bg-amber-700 px-5 py-3 text-sm font-black text-white shadow-lg shadow-amber-900/40 transition hover:bg-amber-800">
          Découvrir nos meubles
        </button>
      </div>
    </header>

    <!-- 2. SECTION PARCOURIR PAR CATÉGORIES -->
    <section class="mb-12">
      <h2 class="text-2xl font-black tracking-tight text-slate-950">Parcourir par catégories</h2>
      <p class="text-sm text-slate-500 mb-6">Trouvez rapidement le style de meuble qui vous correspond.</p>
      <div class="grid grid-cols-2 gap-4 sm:grid-cols-4">
        ${categoriesHtml}
      </div>
    </section>

    <!-- 3. SECTION GRILLE DE PRODUITS DE LA MARKETPLACE -->
    <section class="mb-12">
      <div class="mb-6">
        <h2 class="text-2xl font-black tracking-tight text-slate-950">Nos créations populaires</h2>
        <p class="text-sm text-slate-500">Découvrez les réalisations de nos ateliers partenaires validées par Kër Mobilier.</p>
      </div>
      <div class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        ${produitsHtml}
      </div>
    </section>

    <!-- 4. SECTION FORMULAIRE FABRICATION SUR MESURE (Fonctionnalité 3) -->
    <section class="rounded-[2.5rem] border border-slate-200 bg-white p-6 shadow-sm lg:p-10 grid gap-8 lg:grid-cols-2">
      <div>
        <span class="rounded-full bg-indigo-50 px-3 py-1 text-xs font-bold uppercase tracking-wider text-indigo-700">Service Exclusif</span>
        <h2 class="mt-3 text-3xl font-black tracking-tight text-slate-950">Vous avez un modèle précis en tête ?</h2>
        <p class="mt-3 text-sm leading-6 text-slate-600">Envoyez une demande de fabrication personnalisée. Notre réseau d'artisans qualifiés analysera votre projet (dimensions, matériaux) et vous enverra des propositions de prix et de délais sous 48 heures.</p>
        
        <div class="mt-6 grid gap-3 text-sm font-bold text-slate-700">
          <div class="flex items-center gap-2"><i class="fa-solid fa-check text-emerald-600"></i> Vous fixez votre budget</div>
          <div class="flex items-center gap-2"><i class="fa-solid fa-check text-emerald-600"></i> Choix des essences de bois (Teck, Vène, Merisier)</div>
          <div class="flex items-center gap-2"><i class="fa-solid fa-check text-emerald-600"></i> Mise en concurrence des artisans</div>
        </div>
      </div>

      <form id="surMesureForm" class="bg-slate-50 p-6 rounded-3xl border border-slate-100 grid gap-4">
        <h3 class="text-base font-black text-slate-900 border-b pb-2">Décrivez le meuble de vos rêves</h3>
        
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="mb-1 block text-xs font-extrabold uppercase text-slate-500">Type de meuble *</label>
            <input type="text" id="smType" class="w-full rounded-xl border border-slate-200 p-2.5 text-xs font-medium bg-white" placeholder="ex: Armoire 4 portes" required />
          </div>
          <div>
            <label class="mb-1 block text-xs font-extrabold uppercase text-slate-500">Matériau souhaité *</label>
            <input type="text" id="smMateriau" class="w-full rounded-xl border border-slate-200 p-2.5 text-xs font-medium bg-white" placeholder="ex: Bois de Teck" required />
          </div>
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="mb-1 block text-xs font-extrabold uppercase text-slate-500">Dimensions précises *</label>
            <input type="text" id="smDimensions" class="w-full rounded-xl border border-slate-200 p-2.5 text-xs font-medium bg-white" placeholder="ex: 2m x 1.5m" required />
          </div>
          <div>
            <label class="mb-1 block text-xs font-extrabold uppercase text-slate-500">Votre budget estimé (FCFA) *</label>
            <input type="number" id="smBudget" class="w-full rounded-xl border border-slate-200 p-2.5 text-xs font-medium bg-white" placeholder="ex: 350000" required />
          </div>
        </div>

        <div>
          <label class="mb-1 block text-xs font-extrabold uppercase text-slate-500">Description du projet *</label>
          <textarea id="smDescription" rows="2" class="w-full rounded-xl border border-slate-200 p-2.5 text-xs font-medium bg-white" placeholder="Détaillez votre demande (couleurs, finitions...)" required></textarea>
        </div>

        <button type="submit" class="w-full rounded-xl bg-indigo-600 py-3 text-xs font-black text-white shadow-md transition hover:bg-indigo-700">
          Soumettre ma demande sur-mesure
        </button>
      </form>
    </section>
  `;

  // Événement pour enregistrer la demande sur-mesure dans db.json
  document.getElementById("surMesureForm")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const payload = {
      clientId: "user-client-1", // Simulé pour le test
      typeMeuble: document.getElementById("smType").value,
      materiau: document.getElementById("smMateriau").value,
      dimensions: document.getElementById("smDimensions").value,
      budget: Number(document.getElementById("smBudget").value),
      description: document.getElementById("smDescription").value,
      dateCreation: new Date().toISOString().split('T')[0],
      statut: "EN_ATTENTE"
    };

    try {
      await apiRequest(`${API_BASE_URL}/demandesSurMesure`, {
        method: "POST",
        body: JSON.stringify(payload)
      }, "Erreur envoi.");
      
      showToast("Votre demande sur-mesure a bien été transmise à l'administrateur !", "success");
      document.getElementById("surMesureForm").reset();
    } catch (err) {
      showToast(err.message, "error");
    }
  });
}
