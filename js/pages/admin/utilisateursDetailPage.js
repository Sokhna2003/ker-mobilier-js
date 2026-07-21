import { getUtilisateurById } from "../../services/utilisateurservice.js";
import { getProduitsParArtisan } from "../../services/produitservice.js";
import { getCommandesParClient } from "../../services/commandeservice.js";
import { escapeHtml } from "../../utils/html.js";

const LABEL_ROLE = {
  admin: "Administrateur",
  artisan: "Artisan Fabricant",
  client: "Client Acheteur",
  livreur: "Livreur Logistique"
};

export async function renderUtilisateurDetailPage(params) {
  const app = document.getElementById("app");
  const id = params.get("id");

  if (!id) {
    app.innerHTML = `<p class="text-rose-600 font-bold p-4">Aucun utilisateur sélectionné.</p>`;
    return;
  }

  try {
    const user = await getUtilisateurById(id);

    app.innerHTML = `
      <section class="space-y-6">
        <button data-page="admin/utilisateurs" class="inline-flex items-center gap-2 text-xs font-black text-slate-500 hover:text-slate-900">
          <i class="fa-solid fa-arrow-left"></i>
          Retour à la liste des utilisateurs
        </button>

        ${renderEnteteProfil(user)}

        <div id="zoneContenuMetier"></div>
      </section>
    `;

    const zone = document.getElementById("zoneContenuMetier");

    if (user.role === "artisan") {
      zone.innerHTML = renderChargement();
      const produits = await getProduitsParArtisan(user.id);
      zone.innerHTML = renderProduitsArtisan(produits);
    } else if (user.role === "client") {
      zone.innerHTML = renderChargement();
      const commandes = await getCommandesParClient(user.id);
      zone.innerHTML = renderCommandesClient(commandes);
    } else {
      zone.innerHTML = renderProfilSimple(user);
    }
  } catch (error) {
    app.innerHTML = `<p class="text-rose-600 font-bold p-4">Erreur : ${escapeHtml(error.message)}</p>`;
  }
}

function renderChargement() {
  return `
    <div class="grid min-h-[20vh] place-items-center">
      <p class="text-xs font-bold text-slate-400 uppercase tracking-widest animate-pulse">Chargement...</p>
    </div>
  `;
}

function renderEnteteProfil(user) {
  const initiales = `${(user.prenom || "").charAt(0)}${(user.nom || "").charAt(0)}`.toUpperCase() || "❓";

  return `
    <article class="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:flex-row sm:items-center sm:justify-between">
      <div class="flex items-center gap-4">
        <div class="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#0B132B] text-lg font-black text-white">
          ${initiales}
        </div>
        <div>
          <h1 class="text-xl font-black text-slate-950">${escapeHtml(user.prenom)} ${escapeHtml(user.nom)}</h1>
          <p class="text-xs font-bold text-slate-400">${escapeHtml(LABEL_ROLE[user.role] || user.role)}</p>
        </div>
      </div>

      <div class="grid grid-cols-1 gap-x-8 gap-y-1 text-xs font-semibold text-slate-600 sm:grid-cols-2">
        <p><i class="fa-solid fa-envelope mr-2 text-slate-400"></i>${escapeHtml(user.email)}</p>
        <p><i class="fa-solid fa-phone mr-2 text-slate-400"></i>${escapeHtml(user.telephone || "Non renseigné")}</p>
        ${user.atelier ? `<p><i class="fa-solid fa-house-chimney mr-2 text-slate-400"></i>${escapeHtml(user.atelier)}</p>` : ""}
        ${user.zone ? `<p><i class="fa-solid fa-map-location-dot mr-2 text-slate-400"></i>${escapeHtml(user.zone)}</p>` : ""}
        ${user.adresse ? `<p><i class="fa-solid fa-location-dot mr-2 text-slate-400"></i>${escapeHtml(user.adresse)}</p>` : ""}
      </div>
    </article>
  `;
}

function renderProfilSimple(user) {
  return `
    <article class="rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center">
      <p class="text-sm font-bold text-slate-500">
        Aucune information métier supplémentaire à afficher pour ce rôle (${escapeHtml(LABEL_ROLE[user.role] || user.role)}).
      </p>
    </article>
  `;
}

// ---------- Bloc Artisan : produits en ligne / en attente / rejetés ----------

function renderProduitsArtisan(produits) {
  const enLigne = produits.filter(p => p.statut === "VALIDE");
  const enAttente = produits.filter(p => p.statut === "EN_ATTENTE");
  const rejetes = produits.filter(p => p.statut === "REJETE");

  return `
    <div class="grid gap-6 lg:grid-cols-3">
      ${renderColonneProduits("En ligne", "bg-emerald-50 text-emerald-700", "fa-circle-check", enLigne)}
      ${renderColonneProduits("En attente de validation", "bg-amber-50 text-amber-700", "fa-hourglass-half", enAttente)}
      ${renderColonneProduits("Rejetés", "bg-rose-50 text-rose-700", "fa-circle-xmark", rejetes)}
    </div>
  `;
}

function renderColonneProduits(titre, classeBadge, icone, liste) {
  const lignesHtml = liste.length
    ? liste.map(p => `
        <div class="rounded-2xl border border-slate-100 bg-white p-3">
          <p class="text-xs font-black text-slate-950 truncate">${escapeHtml(p.nom)}</p>
          <p class="mt-1 text-[11px] font-bold text-slate-500">${Number(p.prix).toLocaleString()} FCFA</p>
        </div>
      `).join("")
    : `<p class="text-[11px] font-bold text-slate-400 text-center py-6">Aucun produit ici.</p>`;

  return `
    <article class="rounded-3xl border border-slate-200 bg-slate-50 p-4">
      <div class="mb-3 flex items-center justify-between">
        <h3 class="text-xs font-black uppercase tracking-wider text-slate-700">${titre}</h3>
        <span class="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-black ${classeBadge}">
          <i class="fa-solid ${icone}"></i> ${liste.length}
        </span>
      </div>
      <div class="grid gap-2">${lignesHtml}</div>
    </article>
  `;
}

// ---------- Bloc Client : commandes ----------

function renderCommandesClient(commandes) {
  if (!commandes.length) {
    return `
      <article class="rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center">
        <p class="text-sm font-bold text-slate-400">Ce client n'a passé aucune commande pour l'instant.</p>
      </article>
    `;
  }

  const STATUT_CLASSE = {
    EN_COURS: "bg-amber-50 text-amber-700",
    LIVREE: "bg-emerald-50 text-emerald-700",
    ANNULEE: "bg-rose-50 text-rose-700"
  };

  const lignesHtml = commandes.map(c => `
    <tr class="border-t border-slate-100">
      <td class="px-4 py-3 text-xs font-bold text-slate-950">${escapeHtml(c.id)}</td>
      <td class="px-4 py-3 text-xs text-slate-600">${escapeHtml(c.dateCommande)}</td>
      <td class="px-4 py-3 text-xs font-mono font-bold text-slate-900">${Number(c.montant).toLocaleString()} FCFA</td>
      <td class="px-4 py-3 text-xs text-slate-600">${escapeHtml(c.adresseLivraison)}</td>
      <td class="px-4 py-3">
        <span class="inline-flex items-center rounded-md px-2 py-1 text-[10px] font-black uppercase ${STATUT_CLASSE[c.statut] || "bg-slate-100 text-slate-600"}">
          ${escapeHtml(c.statut)}
        </span>
      </td>
    </tr>
  `).join("");

  return `
    <article class="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
      <div class="overflow-x-auto">
        <table class="w-full border-collapse text-left">
          <thead class="bg-slate-50">
            <tr>
              <th class="px-4 py-3 text-[10px] font-black uppercase text-slate-500">Commande</th>
              <th class="px-4 py-3 text-[10px] font-black uppercase text-slate-500">Date</th>
              <th class="px-4 py-3 text-[10px] font-black uppercase text-slate-500">Montant</th>
              <th class="px-4 py-3 text-[10px] font-black uppercase text-slate-500">Adresse de livraison</th>
              <th class="px-4 py-3 text-[10px] font-black uppercase text-slate-500">Statut</th>
            </tr>
          </thead>
          <tbody>${lignesHtml}</tbody>
        </table>
      </div>
    </article>
  `;
}