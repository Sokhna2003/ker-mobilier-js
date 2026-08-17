import { getAllAvis, deplacerAvisVersCorbeille } from "../../services/avisservice.js";
import { getAllLignesCommande } from "../../services/commandeservice.js";
import { getAllProduits } from "../../services/produitservice.js";
import { getAllUtilisateurs } from "../../services/utilisateurservice.js";
import { escapeHtml } from "../../utils/html.js";
import { showToast } from "../../components/toast.js";
import { openConfirm } from "../../components/modal.js";

let avisEnrichis = [];
let filtreTexte = "";
let filtreNote = "tout";

export async function renderAdminAvisPage() {
  const app = document.getElementById("app");

  try {
    const [avis, lignesCommande, produits, utilisateurs] = await Promise.all([
      getAllAvis(),
      getAllLignesCommande(),
      getAllProduits(),
      getAllUtilisateurs()
    ]);

    avisEnrichis = avis
      .map(a => {
        const client = utilisateurs.find(u => u.id === a.clientId);
        const ligne = lignesCommande.find(l => l.id === a.ligneCommandeId);
        const produit = produits.find(p => p.id === ligne?.produitId);
        return {
          ...a,
          nomClient: client ? `${client.prenom} ${client.nom}` : "Client inconnu",
          nomProduit: produit?.nom || "Produit inconnu"
        };
      })
      .sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));

    app.innerHTML = `
      <section class="space-y-6">
        <div>
          <span class="text-xs font-black uppercase tracking-[0.2em] text-amber-700">Modération</span>
          <h1 class="mt-1 text-2xl font-black text-slate-950">Avis</h1>
          <p class="mt-0.5 text-xs text-slate-400">${avisEnrichis.length} avis publié(s) sur la plateforme.</p>
        </div>

        <div class="grid gap-4 rounded-2xl border border-black/5 bg-white p-4 shadow-sm sm:grid-cols-[1fr_auto]">
          <div class="relative flex items-center">
            <div class="absolute left-3 text-slate-400"><i class="fa-solid fa-magnifying-glass text-xs"></i></div>
            <input type="text" id="rechercheAvis" class="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold text-slate-800 outline-none transition focus:border-[#0B132B] focus:bg-white" placeholder="Rechercher par client, produit, commentaire..." />
          </div>

          <select id="filtreNoteAvis" class="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs font-black text-slate-700 outline-none cursor-pointer transition hover:border-[#0B132B] focus:border-[#0B132B]">
            <option value="tout">Toutes les notes</option>
            <option value="5">5 étoiles</option>
            <option value="4">4 étoiles</option>
            <option value="3">3 étoiles</option>
            <option value="2">2 étoiles</option>
            <option value="1">1 étoile</option>
          </select>
        </div>

        <div id="listeAvisAdmin" class="grid gap-4"></div>
      </section>
    `;

    document.getElementById("rechercheAvis").addEventListener("input", (e) => {
      filtreTexte = e.target.value;
      afficherAvis();
    });

    document.getElementById("filtreNoteAvis").addEventListener("change", (e) => {
      filtreNote = e.target.value;
      afficherAvis();
    });

    afficherAvis();
  } catch (error) {
    app.innerHTML = `<p class="text-rose-600 font-bold p-4">Erreur : ${escapeHtml(error.message)}</p>`;
  }
}

function listeFiltree() {
  return avisEnrichis.filter(a => {
    const correspondNote = filtreNote === "tout" || String(a.note) === filtreNote;
    const texte = filtreTexte.toLowerCase().trim();
    const correspondTexte = !texte || [a.nomClient, a.nomProduit, a.commentaire].join(" ").toLowerCase().includes(texte);
    return correspondNote && correspondTexte;
  });
}

function afficherAvis() {
  const zone = document.getElementById("listeAvisAdmin");
  if (!zone) return;

  const liste = listeFiltree();

  if (!liste.length) {
    zone.innerHTML = `
      <div class="rounded-3xl border border-dashed border-slate-300 bg-slate-50 px-5 py-10 text-center text-sm font-semibold text-slate-500">
        Aucun avis ne correspond à vos critères.
      </div>
    `;
    return;
  }

  zone.innerHTML = liste.map(a => `
    <article class="flex items-start justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div class="flex-1">
        <div class="flex items-center gap-2">
          <p class="text-sm font-black text-slate-950">${escapeHtml(a.nomClient)}</p>
          <span class="text-[10px] text-slate-400">→ ${escapeHtml(a.nomProduit)}</span>
        </div>
        <p class="mt-1 text-xs font-bold text-amber-500">${"★".repeat(a.note)}${"☆".repeat(5 - a.note)}</p>
        <p class="mt-1 text-xs leading-5 text-slate-600">${escapeHtml(a.commentaire)}</p>
        <p class="mt-1 text-[10px] text-slate-400">${escapeHtml(a.date || "—")}</p>
      </div>
      <button data-supprimer-avis="${escapeHtml(a.id)}" class="flex h-8 w-8 flex-none items-center justify-center rounded-xl bg-rose-50 text-rose-600 transition hover:bg-rose-100" title="Retirer (corbeille)">
        <i class="fa-solid fa-trash-can text-xs"></i>
      </button>
    </article>
  `).join("");

  document.querySelectorAll("[data-supprimer-avis]").forEach(btn => {
    btn.addEventListener("click", () => {
      openConfirm({
        message: "Retirer cet avis et le déplacer vers la corbeille ?",
        confirmLabel: "Déplacer vers la corbeille",
        onConfirm: async () => {
          try {
            await deplacerAvisVersCorbeille(btn.dataset.supprimerAvis);
            showToast("Avis déplacé vers la corbeille.");
            await renderAdminAvisPage();
          } catch (error) {
            showToast(error.message, "error");
          }
        }
      });
    });
  });
}