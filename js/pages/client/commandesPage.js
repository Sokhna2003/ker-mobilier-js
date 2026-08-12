import { getCommandesParClient, getAllLignesCommande } from "../../services/commandeservice.js";
import { getAllProduits } from "../../services/produitservice.js";
import { getAllAvis, createAvis } from "../../services/avisservice.js";
import { getSession } from "../../utils/session.js";
import { escapeHtml } from "../../utils/html.js";
import { showToast } from "../../components/toast.js";
import { openModal } from "../../components/modal.js";
import { required, validerFormulaire } from "../../utils/validator.js";
import { labelStatutCommande, classeStatutCommande } from "../../utils/constantes.js";

export async function renderClientCommandesPage() {
  const app = document.getElementById("app");
  const session = getSession();

  try {
    const [commandes, lignesCommande, produits, avis] = await Promise.all([
      getCommandesParClient(session.id),
      getAllLignesCommande(),
      getAllProduits(),
      getAllAvis()
    ]);

    const commandesEnrichies = commandes
      .map(c => {
        const lignes = lignesCommande
          .filter(l => l.commandeId === c.id)
          .map(l => ({
            ...l,
            nomProduit: produits.find(p => p.id === l.produitId)?.nom || "Produit inconnu",
            dejaNote: avis.some(a => a.ligneCommandeId === l.id)
          }));
        return { ...c, lignes };
      })
      .sort((a, b) => new Date(b.dateCommande || 0) - new Date(a.dateCommande || 0));

    app.innerHTML = `
      <section class="space-y-6">
        <div>
          <span class="text-xs font-black uppercase tracking-[0.2em] text-emerald-700">Historique</span>
          <h1 class="mt-1 text-2xl font-black text-slate-950">Mes Commandes</h1>
          <p class="mt-0.5 text-xs text-slate-400">Suivez l'avancement de vos commandes et laissez un avis une fois livrées.</p>
        </div>

        <div id="listeCommandesClient" class="grid gap-5"></div>
      </section>
    `;

    afficherCommandes(commandesEnrichies);
  } catch (error) {
    app.innerHTML = `<p class="text-rose-600 font-bold p-4">Erreur : ${escapeHtml(error.message)}</p>`;
  }
}

function afficherCommandes(commandes) {
  const zone = document.getElementById("listeCommandesClient");
  if (!zone) return;

  if (!commandes.length) {
    zone.innerHTML = `
      <div class="rounded-3xl border border-dashed border-slate-300 bg-slate-50 px-5 py-10 text-center text-sm font-semibold text-slate-500">
        Vous n'avez pas encore passé de commande.
      </div>
    `;
    return;
  }

  zone.innerHTML = commandes.map(carteCommandeHtml).join("");

  document.querySelectorAll("[data-laisser-avis]").forEach(btn => {
    btn.addEventListener("click", () => ouvrirFormulaireAvis(btn.dataset.laisserAvis, btn.dataset.nomProduit, commandes));
  });
}

function carteCommandeHtml(c) {
  const lignesHtml = c.lignes.map(l => `
    <li class="flex items-center justify-between gap-3 text-xs">
      <span class="text-slate-700">${escapeHtml(l.nomProduit)} <span class="text-slate-400">× ${l.quantite}</span></span>
      ${c.statut === "TERMINEE"
        ? (l.dejaNote
          ? `<span class="text-[10px] font-black text-emerald-600"><i class="fa-solid fa-check"></i> Avis publié</span>`
          : `<button data-laisser-avis="${escapeHtml(l.id)}" data-nom-produit="${escapeHtml(l.nomProduit)}" class="rounded-lg bg-amber-50 px-2.5 py-1 text-[10px] font-black text-amber-700 transition hover:bg-amber-100">Laisser un avis</button>`)
        : ""}
    </li>
  `).join("");

  return `
    <article class="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div class="flex items-center justify-between border-b border-slate-50 pb-3">
        <div>
          <p class="text-[10px] font-black uppercase tracking-wider text-slate-400">Commande ${escapeHtml(c.id)}</p>
          <p class="text-xs text-slate-500">${escapeHtml(c.dateCommande || "—")}</p>
        </div>
        <span class="inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-black uppercase ${classeStatutCommande(c.statut)}">
          ${escapeHtml(labelStatutCommande(c.statut))}
        </span>
      </div>
      <ul class="space-y-2 py-3">${lignesHtml}</ul>
      <div class="flex items-center justify-between border-t border-slate-50 pt-3">
        <span class="text-[11px] font-black uppercase text-slate-400">Total</span>
        <span class="font-mono text-sm font-black text-slate-950">${Number(c.montant).toLocaleString()} FCFA</span>
      </div>
    </article>
  `;
}

function ouvrirFormulaireAvis(ligneCommandeId, nomProduit) {
  const session = getSession();
  let noteChoisie = 5;

  const body = `
    <div>
      <p class="mb-2 text-xs font-extrabold uppercase tracking-[0.14em] text-slate-500">Votre note pour "${escapeHtml(nomProduit)}"</p>
      <div id="etoilesAvis" class="flex gap-1 text-2xl text-amber-400">
        ${[1, 2, 3, 4, 5].map(n => `<button type="button" data-etoile="${n}" class="transition hover:scale-110"><i class="fa-solid fa-star"></i></button>`).join("")}
      </div>
    </div>
    <div>
      <label class="mb-2 block text-xs font-extrabold uppercase tracking-[0.14em] text-slate-500" for="commentaireAvis">Votre commentaire</label>
      <textarea id="commentaireAvis" rows="3" class="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-amber-600 focus:ring-4 focus:ring-amber-50" placeholder="Qu'avez-vous pensé de ce produit ?"></textarea>
    </div>
  `;

  openModal({
    title: "Laisser un avis",
    icon: "fa-star",
    iconClass: "bg-amber-100 text-amber-700",
    body,
    confirmLabel: "Publier l'avis",
    confirmClass: "bg-amber-700 shadow-amber-200 hover:bg-amber-800",
    onMount: (overlay) => {
      const boutons = overlay.querySelectorAll("[data-etoile]");
      const colorer = () => boutons.forEach(b => b.classList.toggle("text-amber-500", Number(b.dataset.etoile) <= noteChoisie) || b.classList.toggle("opacity-30", Number(b.dataset.etoile) > noteChoisie));
      colorer();
      boutons.forEach(b => b.addEventListener("click", () => { noteChoisie = Number(b.dataset.etoile); colorer(); }));
    },
    onConfirm: async (overlay) => {
      const commentaire = overlay.querySelector("#commentaireAvis").value.trim();

      const estValide = validerFormulaire([
        { id: "commentaireAvis", verifications: [() => required(commentaire, "Merci de laisser un commentaire.")] }
      ]);
      if (!estValide) return false;

      try {
        await createAvis({ clientId: session.id, ligneCommandeId, note: noteChoisie, commentaire });
        showToast("Merci pour votre avis !");
        await renderClientCommandesPage();
      } catch (error) {
        showToast(error.message, "error");
        return false;
      }
    }
  });
}