import { getUtilisateursCorbeille, restaurerUtilisateur, supprimerDefinitivementUtilisateur } from "../../services/utilisateurservice.js";
import { getCategoriesCorbeille, restaurerCategorie, supprimerDefinitivementCategorie } from "../../services/categorieservice.js";
import { getProduitsCorbeille, republierProduit, supprimerDefinitivementProduit } from "../../services/produitservice.js";
import { escapeHtml } from "../../utils/html.js";
import { showToast } from "../../components/toast.js";
import { openConfirm } from "../../components/modal.js";

// Pour ajouter un nouveau type d'entité à la corbeille plus tard,
// il suffit d'ajouter une entrée ici avec ses fonctions restaurer/supprimer.
const TYPES_CORBEILLE = {
  utilisateur: {
    label: "Utilisateur",
    badgeClasse: "bg-purple-50 text-purple-700",
    restaurerLabel: "Restaurer",
    restaurer: restaurerUtilisateur,
    supprimerDefinitivement: supprimerDefinitivementUtilisateur
  },
  categorie: {
    label: "Catégorie",
    badgeClasse: "bg-amber-50 text-amber-700",
    restaurerLabel: "Restaurer",
    restaurer: restaurerCategorie,
    supprimerDefinitivement: supprimerDefinitivementCategorie
  },
  produit: {
    label: "Produit",
    badgeClasse: "bg-emerald-50 text-emerald-700",
    restaurerLabel: "Republier",
    restaurer: republierProduit,
    supprimerDefinitivement: supprimerDefinitivementProduit
  }
};

let elementsCorbeille = [];
let filtreType = "tout";

export async function renderCorbeillePage() {
  const app = document.getElementById("app");

  try {
    const [utilisateurs, categories, produits] = await Promise.all([
      getUtilisateursCorbeille(),
      getCategoriesCorbeille(),
      getProduitsCorbeille()
    ]);

    elementsCorbeille = [
      ...utilisateurs.map(u => ({
        type: "utilisateur",
        id: u.id,
        titre: `${u.prenom} ${u.nom}`,
        sousTitre: u.email,
        dateSuppression: u.dateSuppression
      })),
      ...categories.map(c => ({
        type: "categorie",
        id: c.id,
        titre: c.libelle,
        sousTitre: "Catégorie",
        dateSuppression: c.dateSuppression
      })),
      ...produits.map(p => ({
        type: "produit",
        id: p.id,
        titre: p.nom,
        sousTitre: `${Number(p.prix).toLocaleString()} FCFA`,
        dateSuppression: p.dateSuppression
      }))
    ];

    app.innerHTML = `
      <section class="space-y-6">
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <span class="text-xs font-black uppercase tracking-[0.2em] text-rose-600">Éléments supprimés</span>
            <h1 class="mt-1 text-2xl font-black text-slate-950">Corbeille</h1>
            <p class="mt-0.5 text-xs text-slate-400">
              Les éléments supprimés sont conservés ici. Vous pouvez les restaurer ou les effacer définitivement.
            </p>
          </div>

          <select id="filtreTypeCorbeille" class="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-black text-slate-700 outline-none cursor-pointer transition hover:border-[#0B132B] focus:border-[#0B132B]">
            <option value="tout">Tous les éléments</option>
            <option value="utilisateur">Utilisateurs</option>
            <option value="categorie">Catégories</option>
            <option value="produit">Produits</option>
          </select>
        </div>

        <article class="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div class="overflow-x-auto">
            <table class="w-full border-collapse text-left text-xs">
              <thead class="bg-[#0B132B] text-white font-black uppercase tracking-wider">
                <tr>
                  <th class="px-6 py-4 rounded-tl-3xl">Élément</th>
                  <th class="px-6 py-4">Type</th>
                  <th class="px-6 py-4">Supprimé le</th>
                  <th class="px-6 py-4 text-right rounded-tr-3xl">Actions</th>
                </tr>
              </thead>
              <tbody id="corpsCorbeille" class="divide-y divide-slate-100 font-medium text-slate-700"></tbody>
            </table>
          </div>
        </article>
      </section>
    `;

    document.getElementById("filtreTypeCorbeille").addEventListener("change", (e) => {
      filtreType = e.target.value;
      afficherLignes();
    });

    afficherLignes();
  } catch (error) {
    app.innerHTML = `<p class="text-rose-600 font-bold p-4">Erreur : ${escapeHtml(error.message)}</p>`;
  }
}

function afficherLignes() {
  const corps = document.getElementById("corpsCorbeille");
  if (!corps) return;

  const liste = filtreType === "tout"
    ? elementsCorbeille
    : elementsCorbeille.filter(e => e.type === filtreType);

  if (!liste.length) {
    corps.innerHTML = `
      <tr>
        <td colspan="4" class="px-6 py-12 text-center font-bold text-slate-400">
          Aucun élément dans la corbeille pour ce filtre.
        </td>
      </tr>
    `;
    return;
  }

  corps.innerHTML = liste.map(item => {
    const config = TYPES_CORBEILLE[item.type];
    return `
      <tr class="hover:bg-slate-50/50 transition">
        <td class="px-6 py-4">
          <div class="font-black text-slate-950">${escapeHtml(item.titre)}</div>
          <div class="text-[11px] text-slate-400 mt-0.5">${escapeHtml(item.sousTitre)}</div>
        </td>
        <td class="px-6 py-4">
          <span class="inline-flex items-center rounded-md px-2 py-1 text-[10px] font-black uppercase ${config.badgeClasse}">
            ${config.label}
          </span>
        </td>
        <td class="px-6 py-4 text-slate-500">
          ${item.dateSuppression ? new Date(item.dateSuppression).toLocaleDateString("fr-FR") : "—"}
        </td>
        <td class="px-6 py-4 text-right">
          <div class="flex items-center justify-end gap-2">
            <button class="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-[11px] font-black text-slate-700 transition hover:bg-slate-50" data-restaurer="${escapeHtml(item.id)}" data-type="${item.type}">
              <i class="fa-solid fa-rotate-left"></i>
              ${config.restaurerLabel}
            </button>
            <button class="inline-flex items-center gap-1.5 rounded-xl bg-rose-600 px-3 py-2 text-[11px] font-black text-white transition hover:bg-rose-700" data-supprimer-definitif="${escapeHtml(item.id)}" data-type="${item.type}">
              <i class="fa-solid fa-trash"></i>
              Supprimer définitivement
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join("");

  document.querySelectorAll("[data-restaurer]").forEach(btn => {
    btn.addEventListener("click", () => {
      const config = TYPES_CORBEILLE[btn.dataset.type];

      openConfirm({
        message: `${config.restaurerLabel} cet élément ? Il redeviendra visible dans sa liste d'origine.`,
        confirmLabel: config.restaurerLabel,
        onConfirm: async () => {
          try {
            await config.restaurer(btn.dataset.restaurer);
            showToast("Élément restauré avec succès.");
            await renderCorbeillePage();
          } catch (error) {
            showToast(error.message, "error");
          }
        }
      });
    });
  });

  document.querySelectorAll("[data-supprimer-definitif]").forEach(btn => {
    btn.addEventListener("click", () => {
      const config = TYPES_CORBEILLE[btn.dataset.type];

      openConfirm({
        message: "Cette action est irréversible : l'élément sera définitivement effacé de la base de données. Continuer ?",
        confirmLabel: "Supprimer définitivement",
        onConfirm: async () => {
          try {
            await config.supprimerDefinitivement(btn.dataset.supprimerDefinitif);
            showToast("Élément supprimé définitivement.");
            await renderCorbeillePage();
          } catch (error) {
            showToast(error.message, "error");
          }
        }
      });
    });
  });
}