import { getAllUtilisateurs } from "../../services/utilisateurservice.js";
import { getAllProduits, validerProduit, rejeterProduit } from "../../services/produitservice.js";
import { getAllCommandes } from "../../services/commandeservice.js";
import { getAllLivraisons } from "../../services/livraisonservice.js";
import { getAllDemandesSurMesure } from "../../services/demandeSurMesureservice.js";
import { escapeHtml } from "../../utils/html.js";
import { showToast } from "../../components/toast.js";
import { openConfirm } from "../../components/modal.js";
import { navigate } from "../../router.js";

// Chemins des deux visuels (images statiques pour le moment, pas de vraie librairie de graphiques).
// Placez vos fichiers ici : assets/images/evolution-commandes.png et assets/images/repartition-statuts.png
// (dossier "assets" à la racine du projet, à côté de index.html).
const IMAGE_EVOLUTION_COMMANDES = "../../../assets/images/evolution-commandes.png";
const IMAGE_REPARTITION_STATUTS = "../../../assets/images/repartition-statuts.png";

export async function renderAdminDashboard() {
  const app = document.getElementById("app");

  try {
    const [utilisateurs, produits, commandes, livraisons, demandesSurMesure] = await Promise.all([
      getAllUtilisateurs(),
      getAllProduits(),
      getAllCommandes(),
      getAllLivraisons(),
      getAllDemandesSurMesure()
    ]);

    const nombreClients = utilisateurs.filter(u => u.role === "client").length;
    const nombreArtisans = utilisateurs.filter(u => u.role === "artisan").length;

    const repartition = {
      LIVREE: commandes.filter(c => c.statut === "LIVREE").length,
      EN_COURS: commandes.filter(c => c.statut === "EN_COURS").length,
      EN_ATTENTE: commandes.filter(c => c.statut === "EN_ATTENTE").length
    };
    const totalCommandes = commandes.length;
    const pourcentage = (valeur) => totalCommandes > 0 ? Math.round((valeur / totalCommandes) * 100) : 0;

    const soumissionsRecentes = produits
      .filter(p => p.statut === "EN_ATTENTE")
      .sort((a, b) => new Date(b.dateCreation || 0) - new Date(a.dateCreation || 0))
      .slice(0, 3)
      .map(p => ({
        ...p,
        artisanNom: utilisateurs.find(u => u.id === p.artisanId)?.atelier
          || `${utilisateurs.find(u => u.id === p.artisanId)?.prenom ?? ""} ${utilisateurs.find(u => u.id === p.artisanId)?.nom ?? ""}`.trim()
          || "Artisan inconnu"
      }));

    app.innerHTML = `
      <section class="space-y-6">
        <div class="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 class="flex flex-wrap items-baseline gap-2 text-2xl font-black text-slate-950">
              Tableau de bord
              <span class="text-sm font-bold text-slate-400">· Kër Mobilier Admin</span>
            </h1>
            <p class="mt-1 text-sm text-slate-500">Gérer, auditer et valider les activités de la plateforme à l'échelle nationale.</p>
          </div>
          <span class="inline-flex items-center rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-black text-slate-500">
            UTC : ${new Date().toISOString().split("T")[0]}
          </span>
        </div>

        <div class="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          ${carteStat("Clients", nombreClients, "fa-users", "bg-emerald-50 text-emerald-600")}
          ${carteStat("Artisans", nombreArtisans, "fa-envelope", "bg-blue-50 text-blue-600")}
          ${carteStat("Produits", produits.length, "fa-cube", "bg-blue-50 text-blue-600")}
          ${carteStat("Commandes", totalCommandes, "fa-cart-shopping", "bg-amber-50 text-amber-600")}
          ${carteStat("Livraisons", livraisons.length, "fa-truck", "bg-purple-50 text-purple-600")}
          ${carteStat("Sur Mesure", demandesSurMesure.length, "fa-file-lines", "bg-rose-50 text-rose-600")}
        </div>

        <div class="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
          <article class="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div class="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 class="text-sm font-black text-slate-950">Évolution des Commandes</h2>
                <p class="text-xs text-slate-400">Comparatif des volumes de vente par mois en ${new Date().getFullYear()}.</p>
              </div>
              <div class="flex items-center gap-4 text-[11px] font-bold text-slate-500">
                <span class="flex items-center gap-1.5"><span class="h-2 w-2 rounded-full bg-emerald-700"></span>Commandes</span>
                <span class="flex items-center gap-1.5"><span class="h-2 w-2 rounded-full bg-amber-500"></span>Revenu (M FCFA)</span>
              </div>
            </div>
            <img src="${IMAGE_EVOLUTION_COMMANDES}" alt="Évolution des commandes" class="mt-4 w-full rounded-2xl" />
          </article>

          <article class="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 class="text-sm font-black text-slate-950">Répartition Statuts</h2>
            <p class="text-xs text-slate-400">Statut des ${totalCommandes} commandes.</p>
            <img src="${IMAGE_REPARTITION_STATUTS}" alt="Répartition des statuts de commandes" class="mx-auto mt-4 h-36 w-36" />
            <div class="mt-4 space-y-2 text-xs font-semibold text-slate-600">
              <div class="flex items-center justify-between">
                <span class="flex items-center gap-2"><span class="h-2 w-2 rounded-full bg-emerald-700"></span>Livrées (${pourcentage(repartition.LIVREE)}%)</span>
                <span class="font-black text-slate-950">${repartition.LIVREE}</span>
              </div>
              <div class="flex items-center justify-between">
                <span class="flex items-center gap-2"><span class="h-2 w-2 rounded-full bg-amber-500"></span>En cours (${pourcentage(repartition.EN_COURS)}%)</span>
                <span class="font-black text-slate-950">${repartition.EN_COURS}</span>
              </div>
              <div class="flex items-center justify-between">
                <span class="flex items-center gap-2"><span class="h-2 w-2 rounded-full bg-slate-900"></span>En attente (${pourcentage(repartition.EN_ATTENTE)}%)</span>
                <span class="font-black text-slate-950">${repartition.EN_ATTENTE}</span>
              </div>
            </div>
          </article>
        </div>

        <article class="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div class="flex items-center justify-between">
            <div>
              <h2 class="text-sm font-black text-slate-950">Soumissions d'artisans en attente</h2>
              <p class="text-xs text-slate-400">À vérifier et publier.</p>
            </div>
            <button data-page="admin/produits?statut=EN_ATTENTE" class="text-xs font-black text-emerald-700 hover:underline">Voir tout</button>
          </div>

          <div class="mt-4 overflow-x-auto">
            <table class="w-full border-collapse text-left text-xs">
              <thead>
                <tr class="text-slate-400">
                  <th class="py-2 font-black uppercase">Meuble</th>
                  <th class="py-2 font-black uppercase">Artisan</th>
                  <th class="py-2 font-black uppercase">Prix</th>
                  <th class="py-2 text-right font-black uppercase">Actions</th>
                </tr>
              </thead>
              <tbody id="corpsSoumissions" class="divide-y divide-slate-100"></tbody>
            </table>
          </div>
        </article>
      </section>
    `;

    afficherSoumissions(soumissionsRecentes);
  } catch (error) {
    app.innerHTML = `<p class="text-rose-600 font-bold p-4">Erreur : ${escapeHtml(error.message)}</p>`;
  }
}

function carteStat(titre, valeur, icone, classeIcone) {
  return `
    <article class="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div class="flex items-center justify-between">
        <span class="text-[10px] font-black uppercase tracking-wider text-slate-400">${titre}</span>
        <span class="flex h-8 w-8 items-center justify-center rounded-xl ${classeIcone}">
          <i class="fa-solid ${icone} text-xs"></i>
        </span>
      </div>
      <p class="mt-2 text-2xl font-black text-slate-950">${valeur}</p>
    </article>
  `;
}

function afficherSoumissions(liste) {
  const corps = document.getElementById("corpsSoumissions");
  if (!corps) return;

  if (!liste.length) {
    corps.innerHTML = `
      <tr><td colspan="4" class="py-6 text-center font-bold text-slate-400">Aucune soumission en attente.</td></tr>
    `;
    return;
  }

  corps.innerHTML = liste.map(p => `
    <tr>
      <td class="py-3 font-black text-slate-950">${escapeHtml(p.nom)}</td>
      <td class="py-3 font-semibold text-slate-600">${escapeHtml(p.artisanNom)}</td>
      <td class="py-3 font-mono font-black text-slate-900">${Number(p.prix).toLocaleString()} FCFA</td>
      <td class="py-3 text-right">
        <div class="flex items-center justify-end gap-2">
          <button class="rounded-lg bg-emerald-50 px-3 py-1.5 text-[11px] font-black text-emerald-700 transition hover:bg-emerald-100" data-valider-dash="${escapeHtml(p.id)}">Valider</button>
          <button class="rounded-lg bg-rose-50 px-3 py-1.5 text-[11px] font-black text-rose-600 transition hover:bg-rose-100" data-rejeter-dash="${escapeHtml(p.id)}">Rejeter</button>
        </div>
      </td>
    </tr>
  `).join("");

  document.querySelectorAll("[data-valider-dash]").forEach(btn => {
    btn.addEventListener("click", async () => {
      try {
        await validerProduit(btn.dataset.validerDash);
        showToast("Produit validé avec succès.");
        await renderAdminDashboard();
      } catch (error) {
        showToast(error.message, "error");
      }
    });
  });

  document.querySelectorAll("[data-rejeter-dash]").forEach(btn => {
    btn.addEventListener("click", () => {
      openConfirm({
        message: "Rejeter ce produit ? L'artisan verra que sa soumission a été refusée.",
        confirmLabel: "Rejeter",
        onConfirm: async () => {
          try {
            await rejeterProduit(btn.dataset.rejeterDash);
            showToast("Produit rejeté.");
            await renderAdminDashboard();
          } catch (error) {
            showToast(error.message, "error");
          }
        }
      });
    });
  });
}