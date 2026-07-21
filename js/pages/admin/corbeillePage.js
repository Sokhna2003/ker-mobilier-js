import { getUtilisateursCorbeille, restaurerUtilisateur, supprimerDefinitivementUtilisateur } from "../../services/utilisateurservice.js";
import { escapeHtml } from "../../utils/html.js";
import { showToast } from "../../components/toast.js";
import { openConfirm } from "../../components/modal.js";

export async function renderCorbeillePage() {
  const app = document.getElementById("app");

  try {
    const utilisateurs = await getUtilisateursCorbeille();

    app.innerHTML = `
      <section class="space-y-6">
        <div>
          <span class="text-xs font-black uppercase tracking-[0.2em] text-rose-600">Éléments supprimés</span>
          <h1 class="mt-1 text-2xl font-black text-slate-950">Corbeille</h1>
          <p class="mt-0.5 text-xs text-slate-400">
            Les comptes supprimés sont conservés ici. Vous pouvez les restaurer ou les effacer définitivement.
          </p>
        </div>

        <article class="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div class="overflow-x-auto">
            <table class="w-full border-collapse text-left text-xs">
              <thead class="bg-[#0B132B] text-white font-black uppercase tracking-wider">
                <tr>
                  <th class="px-6 py-4 rounded-tl-3xl">Nom complet</th>
                  <th class="px-6 py-4">Rôle</th>
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

    afficherLignes(utilisateurs);
  } catch (error) {
    app.innerHTML = `<p class="text-rose-600 font-bold p-4">Erreur : ${escapeHtml(error.message)}</p>`;
  }
}

function afficherLignes(utilisateurs) {
  const corps = document.getElementById("corpsCorbeille");
  if (!corps) return;

  if (!utilisateurs.length) {
    corps.innerHTML = `
      <tr>
        <td colspan="4" class="px-6 py-12 text-center font-bold text-slate-400">
          La corbeille est vide.
        </td>
      </tr>
    `;
    return;
  }

  corps.innerHTML = utilisateurs.map(user => `
    <tr class="hover:bg-slate-50/50 transition">
      <td class="px-6 py-4">
        <div class="font-black text-slate-950">${escapeHtml(user.prenom)} ${escapeHtml(user.nom)}</div>
        <div class="text-[11px] text-slate-400 mt-0.5">${escapeHtml(user.email)}</div>
      </td>
      <td class="px-6 py-4">
        <span class="inline-flex items-center rounded-md bg-slate-100 px-2 py-1 text-[10px] font-black uppercase text-slate-600">
          ${escapeHtml(user.role)}
        </span>
      </td>
      <td class="px-6 py-4 text-slate-500">
        ${user.dateSuppression ? new Date(user.dateSuppression).toLocaleDateString("fr-FR") : "—"}
      </td>
      <td class="px-6 py-4 text-right">
        <div class="flex items-center justify-end gap-2">
          <button class="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-[11px] font-black text-slate-700 transition hover:bg-slate-50" data-restaurer="${escapeHtml(user.id)}">
            <i class="fa-solid fa-rotate-left"></i>
            Restaurer
          </button>
          <button class="inline-flex items-center gap-1.5 rounded-xl bg-rose-600 px-3 py-2 text-[11px] font-black text-white transition hover:bg-rose-700" data-supprimer-definitif="${escapeHtml(user.id)}">
            <i class="fa-solid fa-trash"></i>
            Supprimer définitivement
          </button>
        </div>
      </td>
    </tr>
  `).join("");

  document.querySelectorAll("[data-restaurer]").forEach(btn => {
    btn.addEventListener("click", () => {
      openConfirm({
        message: "Restaurer ce compte ? Il redeviendra visible dans la liste des utilisateurs.",
        confirmLabel: "Restaurer",
        onConfirm: async () => {
          try {
            await restaurerUtilisateur(btn.dataset.restaurer);
            showToast("Utilisateur restauré avec succès.");
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
      openConfirm({
        message: "Cette action est irréversible : le compte sera définitivement effacé de la base de données. Continuer ?",
        confirmLabel: "Supprimer définitivement",
        onConfirm: async () => {
          try {
            await supprimerDefinitivementUtilisateur(btn.dataset.supprimerDefinitif);
            showToast("Utilisateur supprimé définitivement.");
            await renderCorbeillePage();
          } catch (error) {
            showToast(error.message, "error");
          }
        }
      });
    });
  });
}