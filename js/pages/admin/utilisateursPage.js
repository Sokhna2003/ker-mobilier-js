import { getAllUtilisateurs, createUtilisateur, deplacerUtilisateurVersCorbeille } from "../../services/utilisateurservice.js";
import { escapeHtml } from "../../utils/html.js";
import { showToast } from "../../components/toast.js";
import { required, isEmail, isTelephoneSenegal, minLength, validerFormulaire, supprimerErreurChamp } from "../../utils/validator.js";
import { createId } from "../../utils/id.js";
import { openConfirm } from "../../components/modal.js";
import { navigate } from "../../router.js";


// Mémoire locale pour stocker la liste brute et l'état des filtres
let listeUtilisateursComplete = [];
let filtreTexte = "";
let filtreRole = "tout";

/**
 * Fonction maîtresse de rendu de la page de gestion des utilisateurs
 */
export async function renderUtilisateursPage() {
  const app = document.getElementById("app");

  try {
    // Récupération en temps réel de tous les comptes enregistrés dans db.json
    listeUtilisateursComplete = await getAllUtilisateurs();

    // Injection du squelette de la page (En-tête, Filtres, et Conteneur du tableau)
    app.innerHTML = `
      <section class="space-y-6">
        
        <!-- EN-TÊTE DE LA PAGE -->
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-100 pb-5">
          <div>
            <span class="text-xs font-black uppercase tracking-[0.2em] text-amber-700">Sécurité & Droits</span>
            <h1 class="text-2xl font-black text-slate-950 mt-1">Comptes Utilisateurs</h1>
            <p class="text-xs text-slate-400 mt-0.5">Pilotez les accès des administrateurs, artisans, clients et livreurs de la plateforme.</p>
          </div>
          
          <button id="addUtilisateurBtn" class="inline-flex items-center gap-2 rounded-xl bg-amber-700 px-4 py-3 text-xs font-black text-white shadow-md transition hover:bg-amber-800">
            <i class="fa-solid fa-user-plus text-sm"></i>
            <span>Créer un compte</span>
          </button>
        </div>

        <!-- ZONE DE RECHERCHE ET FILTRAGE DYNAMIQUE -->
        <div class="grid gap-4 sm:grid-cols-3 bg-white p-4 rounded-2xl border border-black/5 shadow-sm">
          <div class="relative flex items-center">
            <div class="absolute left-3 text-slate-400"><i class="fa-solid fa-magnifying-glass text-xs"></i></div>
            <input type="text" id="rechercheUser" value="${escapeHtml(filtreTexte)}" class="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold text-slate-800 outline-none transition hover:border-[#0B132B] focus:border-[#0B132B] focus:bg-white" placeholder="Rechercher par nom, prénom, email..." />
          </div>

          <div class="relative flex items-center">
            <div class="absolute left-3 text-slate-400"><i class="fa-solid fa-filter text-xs"></i></div>
            <select id="filtreRoleUser" class="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-black text-slate-800 outline-none cursor-pointer transition hover:border-[#0B132B] focus:border-[#0B132B] focus:bg-white">
              <option value="tout" ${filtreRole === "tout" ? "selected" : ""}>Tous les rôles</option>
              <option value="admin" ${filtreRole === "admin" ? "selected" : ""}>Administrateurs</option>
              <option value="artisan" ${filtreRole === "artisan" ? "selected" : ""}>Artisans Fabricants</option>
              <option value="client" ${filtreRole === "client" ? "selected" : ""}>Clients Acheteurs</option>
              <option value="livreur" ${filtreRole === "livreur" ? "selected" : ""}>Livreurs Logistique</option>
            </select>
          </div>

          <div class="flex items-center justify-end pr-2 text-right">
            <p id="compteurUsers" class="text-xs font-black text-slate-400 uppercase tracking-wider"></p>
          </div>
        </div>

        <!-- BLOC DU TABLEAU STYLE MAQUETTE -->
        <article class="overflow-x-auto rounded-3xl border border-slate-200 bg-white shadow-sm">
          <table class="w-full border-collapse text-left text-xs">
            <thead class="bg-[#0B132B] text-white font-black uppercase tracking-wider">
              <tr>
                <th class="px-6 py-4 font-black rounded-tl-3xl">Profil</th>
                <th class="px-6 py-4 font-black">Nom complet</th>
                <th class="px-6 py-4 font-black">Coordonnées</th>
                <th class="px-6 py-4 font-black">Atelier / Zone / Infos</th>
                <th class="px-6 py-4 font-black">Rôle</th>
                <th class="px-6 py-4 font-black text-right rounded-tr-3xl">Actions</th>
              </tr>
            </thead>
            <tbody id="corpsTableauUsers" class="divide-y divide-slate-100 font-medium text-slate-700">
              <!-- Injecté dynamiquement par rafraichirTableauUsers() -->
            </tbody>
          </table>
        </article>

      </section>
    `;

    // Attachement des écouteurs de saisie et premier affichage des lignes
    attacherEvenementsFiltres();

  } catch (error) {
    console.error(error);
    app.innerHTML = `<p class="text-rose-600 font-bold p-4">Erreur : ${escapeHtml(error.message)}</p>`;
  }
}

/**
 * Calcule les filtres et redessine uniquement les lignes du tableau (sans clignotement)
 */
function rafraichirTableauUsers() {
  const corps = document.getElementById("corpsTableauUsers");
  const compteur = document.getElementById("compteurUsers");
  if (!corps) return;

  // Filtrage combiné : Texte + Rôle
  const listeFiltree = listeUtilisateursComplete.filter(user => {
    const correspondRole = filtreRole === "tout" || user.role === filtreRole;

    const chaineRecherche = `${user.nom} ${user.prenom} ${user.email} ${user.telephone || ""}`.toLowerCase();
    const correspondTexte = chaineRecherche.includes(filtreTexte.toLowerCase().trim());

    return correspondRole && correspondTexte;
  });

  if (compteur) {
    compteur.textContent = `${listeFiltree.length} utilisateur(s) trouvé(s)`;
  }

  if (listeFiltree.length === 0) {
    corps.innerHTML = `
      <tr>
        <td colspan="6" class="px-6 py-12 text-center font-bold text-slate-400">
          Aucun utilisateur enregistré ne correspond à vos critères de recherche.
        </td>
      </tr>
    `;
    return;
  }

  // Génération des lignes du tableau conforme à vos exigences graphiques
  corps.innerHTML = listeFiltree.map(user => {
    const pLettre = String(user.prenom || "").charAt(0).toUpperCase();
    const nLettre = String(user.nom || "").charAt(0).toUpperCase();
    const initiales = `${pLettre}${nLettre}` || "❓";

    const bgAvatar = user.role === "admin" ? "bg-purple-100 text-purple-700" :
                     user.role === "artisan" ? "bg-amber-100 text-amber-800" :
                     user.role === "livreur" ? "bg-blue-100 text-blue-700" : "bg-emerald-100 text-emerald-700";

    let detailMetier = "—";
    if (user.role === "artisan") detailMetier = `<span class="font-bold text-slate-900">${escapeHtml(user.atelier || "Atelier non renseigné")}</span>`;
    if (user.role === "livreur") detailMetier = `<span class="font-bold text-slate-600"><i class="fa-solid fa-map-location-dot mr-1"></i>${escapeHtml(user.zone || "Zone non définie")}</span>`;

    const badgeColor = user.role === "admin" ? "bg-purple-50 text-purple-700 ring-purple-600/10" :
                       user.role === "artisan" ? "bg-amber-50 text-amber-700 ring-amber-600/10" :
                       user.role === "livreur" ? "bg-blue-50 text-blue-700 ring-blue-600/10" : "bg-emerald-50 text-emerald-700 ring-emerald-600/10";

    return `
      <tr class="hover:bg-slate-50/50 transition">
        <td class="px-6 py-4">
          <div class="flex h-9 w-9 items-center justify-center rounded-full font-black text-xs ${bgAvatar}">
            ${initiales}
          </div>
        </td>
        <td class="px-6 py-4">
          <div class="font-black text-slate-950 text-sm">${escapeHtml(user.prenom)} ${escapeHtml(user.nom)}</div>
          <div class="text-[11px] text-slate-400 mt-0.5">ID: ${escapeHtml(user.id)}</div>
        </td>
        <td class="px-6 py-4">
          <div class="font-medium text-slate-900">${escapeHtml(user.email)}</div>
          <div class="text-[11px] text-slate-400 mt-0.5">${escapeHtml(user.telephone || "Pas de téléphone")}</div>
        </td>
        <td class="px-6 py-4 text-xs">
          ${detailMetier}
        </td>
        <td class="px-6 py-4">
          <span class="inline-flex items-center rounded-md px-2 py-1 text-[10px] font-black uppercase ring-1 ring-inset ${badgeColor}">
            ${escapeHtml(user.role)}
          </span>
        </td>
        <td class="px-6 py-4 text-right">
          <div class="flex items-center justify-end gap-2">
            <button class="inline-flex h-8 w-8 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-100" title="Voir les détails" data-view-user="${escapeHtml(user.id)}">
              <i class="fa-solid fa-eye text-xs"></i>
            </button>
            <button class="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-rose-50 text-rose-600 transition hover:bg-rose-100" title="Supprimer le compte" data-delete-user="${escapeHtml(user.id)}">
              <i class="fa-solid fa-trash-can text-xs"></i>
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join("");

  attacherEvenementsLignes();
}

/**
 * Lie les écouteurs de saisie sur les inputs de filtrage
 */
function attacherEvenementsFiltres() {
  document.getElementById("rechercheUser")?.addEventListener("input", (e) => {
    filtreTexte = e.target.value;
    rafraichirTableauUsers();
  });

  document.getElementById("filtreRoleUser")?.addEventListener("change", (e) => {
    filtreRole = e.target.value;
    rafraichirTableauUsers();
  });

  document.getElementById("addUtilisateurBtn")?.addEventListener("click", () => {
    ouvrirFormulaireAjoutUser();
  });

  rafraichirTableauUsers();
}

/**
 * Lie les clics sur les boutons Voir détails et Supprimer de chaque ligne
 */
function attacherEvenementsLignes() {
  document.querySelectorAll("[data-view-user]").forEach(btn => {
    btn.addEventListener("click", () => {
      navigate(`admin/utilisateur-detail?id=${btn.dataset.viewUser}`);
    });
  });

  document.querySelectorAll("[data-delete-user]").forEach(btn => {
    btn.addEventListener("click", () => {
      const id = btn.dataset.deleteUser;

      openConfirm({
        message: "Voulez-vous déplacer cet utilisateur vers la corbeille ? Vous pourrez le restaurer plus tard.",
        confirmLabel: "Déplacer vers la corbeille",
        onConfirm: async () => {
          try {
            await deplacerUtilisateurVersCorbeille(id);
            showToast("Utilisateur déplacé vers la corbeille.", "success");
            await renderUtilisateursPage();
          } catch (error) {
            showToast(error.message, "error");
          }
        }
      });
    });
  });
}

/**
 * Ouvre une boîte de dialogue (Modale) pour ajouter un nouvel utilisateur.
 * Affiche dynamiquement les champs selon le rôle sélectionné.
 */
function ouvrirFormulaireAjoutUser() {
  const root = document.getElementById("modalRoot");
  if (!root) return;

  const overlay = document.createElement("div");
  overlay.id = "addUserModalOverlay";
  overlay.className = "fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm animate-in fade-in duration-150";

  const labelClass = "mb-1 block text-[10px] font-black uppercase tracking-wider text-slate-400";
  const inputClass = "w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-800 outline-none transition focus:border-amber-700 focus:bg-white";

  overlay.innerHTML = `
    <div class="w-full max-w-lg rounded-[2.5rem] bg-white p-6 shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-150">

      <div class="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
        <div>
          <h2 class="text-lg font-black text-slate-950">Créer un nouveau compte</h2>
          <p class="text-[11px] text-slate-400">Enregistrez un nouvel acteur sur Kër Mobilier</p>
        </div>
        <button id="closeAddUserBtn" class="flex h-8 w-8 items-center justify-center rounded-xl text-slate-400 hover:bg-slate-100">
          <i class="fa-solid fa-xmark text-sm"></i>
        </button>
      </div>

      <form id="addUserForm" class="space-y-3" novalidate>
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="${labelClass}">Prénom *</label>
            <input type="text" id="newPrenom" class="${inputClass}" placeholder="ex: Modou" />
          </div>
          <div>
            <label class="${labelClass}">Nom *</label>
            <input type="text" id="newNom" class="${inputClass}" placeholder="ex: Diop" />
          </div>
        </div>

        <div>
          <label class="${labelClass}">Adresse Email *</label>
          <input type="email" id="newEmail" class="${inputClass}" placeholder="ex: modou@gmail.com" />
        </div>

        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="${labelClass}">Téléphone *</label>
            <input type="tel" id="newTel" class="${inputClass}" placeholder="ex: 771234567" />
          </div>
          <div>
            <label class="${labelClass}">Mot de passe *</label>
            <input type="password" id="newPassword" class="${inputClass}" placeholder="••••••••" />
          </div>
        </div>

        <div>
          <label class="${labelClass}">Rôle de l'utilisateur *</label>
          <select id="newRole" class="${inputClass} cursor-pointer font-bold">
            <option value="client">Client Acheteur</option>
            <option value="artisan">Artisan Fabricant</option>
            <option value="livreur">Livreurs Logistique</option>
            <option value="admin">Administrateur</option>
          </select>
        </div>

        <div id="blocArtisanFields" class="hidden space-y-3 p-3 bg-amber-50/50 rounded-2xl border border-amber-100/50">
          <div>
            <label class="${labelClass} text-amber-800">Nom de l'atelier *</label>
            <input type="text" id="newAtelier" class="${inputClass}" placeholder="ex: Menuiserie Gadiaga" />
          </div>
          <div>
            <label class="${labelClass} text-amber-800">Spécialité / Essence de bois favorite *</label>
            <input type="text" id="newSpecialite" class="${inputClass}" placeholder="ex: Ébéniste - Bois de Teck" />
          </div>
          <div>
            <label class="${labelClass} text-amber-800">Adresse de l'atelier *</label>
            <input type="text" id="newAdresseArtisan" class="${inputClass}" placeholder="ex: Médina, Rue 22, Dakar" />
          </div>
        </div>

        <div id="blocLivreurFields" class="hidden space-y-3 p-3 bg-blue-50/50 rounded-2xl border border-blue-100/50">
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="${labelClass} text-blue-800">Numéro de Matricule *</label>
              <input type="text" id="newMatricule" class="${inputClass}" placeholder="ex: DK-4567-B" />
            </div>
            <div>
              <label class="${labelClass} text-blue-800">Type de Véhicule *</label>
              <input type="text" id="newVehicule" class="${inputClass}" placeholder="ex: Camionnette" />
            </div>
          </div>
          <div>
            <label class="${labelClass} text-blue-800">Zone de couverture géographique *</label>
            <input type="text" id="newZone" class="${inputClass}" placeholder="ex: Dakar Centre" />
          </div>
        </div>

        <div id="blocClientFields" class="hidden p-3 bg-emerald-50/50 rounded-2xl border border-emerald-100/50">
          <div>
            <label class="${labelClass} text-emerald-800">Adresse de livraison par défaut *</label>
            <input type="text" id="newAdresseClient" class="${inputClass}" placeholder="ex: Fann Résidence, Dakar" />
          </div>
        </div>

        <div class="pt-4 border-t border-slate-100 flex justify-end gap-2">
          <button type="button" id="cancelAddUserBtn" class="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-600 transition hover:bg-slate-50">Annuler</button>
          <button type="submit" class="rounded-xl bg-amber-700 px-5 py-2.5 text-xs font-black text-white shadow-md transition hover:bg-amber-800">Enregistrer le compte</button>
        </div>
      </form>
    </div>
  `;

  root.appendChild(overlay);

  // Efface le message rouge d'un champ dès que l'utilisateur recommence à le remplir
  overlay.querySelectorAll("input, select").forEach(champ => {
    champ.addEventListener("input", () => supprimerErreurChamp(champ.id));
  });

  const closeForm = () => overlay.remove();
  document.getElementById("closeAddUserBtn").addEventListener("click", closeForm);
  document.getElementById("cancelAddUserBtn").addEventListener("click", closeForm);

  const selectRole = document.getElementById("newRole");
  const bArtisan = document.getElementById("blocArtisanFields");
  const bLivreur = document.getElementById("blocLivreurFields");
  const bClient = document.getElementById("blocClientFields");

  selectRole.addEventListener("change", () => {
    const val = selectRole.value;
    bArtisan.classList.add("hidden");
    bLivreur.classList.add("hidden");
    bClient.classList.add("hidden");

    if (val === "artisan") {
      bArtisan.classList.remove("hidden");
    } else if (val === "livreur") {
      bLivreur.classList.remove("hidden");
    } else if (val === "client") {
      bClient.classList.remove("hidden");
    }
  });

  selectRole.dispatchEvent(new Event("change"));

  // Écriture dans db.json via le service (au lieu d'un fetch brut, cohérent avec deleteUtilisateur)
  document.getElementById("addUserForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const role = selectRole.value;
    const payload = {
      id: createId("user-" + role),
      nom: document.getElementById("newNom").value.trim(),
      prenom: document.getElementById("newPrenom").value.trim(),
      email: document.getElementById("newEmail").value.trim(),
      password: document.getElementById("newPassword").value.trim(),
      telephone: document.getElementById("newTel").value.trim(),
      role: role
    };

    if (role === "artisan") {
      payload.atelier = document.getElementById("newAtelier").value.trim();
      payload.specialite = document.getElementById("newSpecialite").value.trim();
      payload.adresse = document.getElementById("newAdresseArtisan").value.trim();
      payload.isPremium = false;
    } else if (role === "livreur") {
      payload.matricule = document.getElementById("newMatricule").value.trim();
      payload.vehicule = document.getElementById("newVehicule").value.trim();
      payload.zone = document.getElementById("newZone").value.trim();
    } else if (role === "client") {
      payload.adresse = document.getElementById("newAdresseClient").value.trim();
    }

    // Construction de la liste des champs à valider (communs + spécifiques au rôle).
    // Un seul appel suffit : plus besoin de répéter "obligatoire" à chaque page,
    // les messages rouges s'affichent automatiquement sous les bons champs.
    const champsAValider = [
      { id: "newPrenom", verifications: [() => required(payload.prenom, "Le prénom est obligatoire.")] },
      { id: "newNom", verifications: [() => required(payload.nom, "Le nom est obligatoire.")] },
      { id: "newEmail", verifications: [
        () => required(payload.email, "L'adresse email est obligatoire."),
        () => isEmail(payload.email)
      ] },
      { id: "newTel", verifications: [
        () => required(payload.telephone, "Le numéro de téléphone est obligatoire."),
        () => isTelephoneSenegal(payload.telephone)
      ] },
      { id: "newPassword", verifications: [
        () => required(payload.password, "Le mot de passe est obligatoire."),
        () => minLength(payload.password, 6, "Le mot de passe doit contenir au moins 6 caractères.")
      ] }
    ];

    if (role === "artisan") {
      champsAValider.push(
        { id: "newAtelier", verifications: [() => required(payload.atelier, "Le nom de l'atelier est obligatoire.")] },
        { id: "newSpecialite", verifications: [() => required(payload.specialite, "La spécialité est obligatoire.")] },
        { id: "newAdresseArtisan", verifications: [() => required(payload.adresse, "L'adresse de l'atelier est obligatoire.")] }
      );
    } else if (role === "livreur") {
      champsAValider.push(
        { id: "newMatricule", verifications: [() => required(payload.matricule, "Le numéro de matricule est obligatoire.")] },
        { id: "newVehicule", verifications: [() => required(payload.vehicule, "Le type de véhicule est obligatoire.")] },
        { id: "newZone", verifications: [() => required(payload.zone, "La zone de couverture est obligatoire.")] }
      );
    } else if (role === "client") {
      champsAValider.push(
        { id: "newAdresseClient", verifications: [() => required(payload.adresse, "L'adresse de livraison est obligatoire.")] }
      );
    }

    const estValide = validerFormulaire(champsAValider);
    if (!estValide) return; // messages rouges déjà affichés sous les champs, on arrête ici

    try {
      await createUtilisateur(payload);
      showToast("Compte créé avec succès !", "success");
      closeForm();
      await renderUtilisateursPage(); // Rafraîchit instantanément la table
    } catch (error) {
      showToast(error.message, "error");
    }
  });
}