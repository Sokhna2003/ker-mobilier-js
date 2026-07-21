// utils/validator.js
// Fonctions de validation réutilisables : chacune lève une Error avec un message
// clair si la valeur est invalide, sinon ne fait rien (comme required() dans l'exo de référence).

export function required(value, message = "Ce champ est obligatoire.") {
  if (value === null || value === undefined || String(value).trim() === "") {
    throw new Error(message);
  }
}

export function isEmail(value, message = "L'adresse email n'est pas valide.") {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!regex.test(String(value || "").trim())) {
    throw new Error(message);
  }
}

// Numéros sénégalais : 9 chiffres commençant par 70/75/76/77/78,
// avec ou sans indicatif +221.
export function isTelephoneSenegal(value, message = "Le numéro de téléphone n'est pas un numéro sénégalais valide (ex: 771234567).") {
  const regex = /^(\+221)?(70|75|76|77|78)\d{7}$/;
  const nettoye = String(value || "").replace(/\s/g, "");
  if (!regex.test(nettoye)) {
    throw new Error(message);
  }
}

export function minLength(value, min, message) {
  const texte = String(value || "");
  if (texte.trim().length < min) {
    throw new Error(message || `Ce champ doit contenir au moins ${min} caractères.`);
  }
}

export function isPositiveNumber(value, message = "Ce champ doit être un nombre positif.") {
  const nombre = Number(value);
  if (Number.isNaN(nombre) || nombre <= 0) {
    throw new Error(message);
  }
}

// ---------- Affichage des erreurs directement sous les champs ----------

/**
 * Affiche un message rouge juste en dessous du champ concerné (id de l'input).
 */
export function afficherErreurChamp(inputId, message) {
  const input = document.getElementById(inputId);
  if (!input) return;

  supprimerErreurChamp(inputId);

  const erreurEl = document.createElement("p");
  erreurEl.id = `erreur-${inputId}`;
  erreurEl.className = "mt-1 text-[11px] font-bold text-rose-600";
  erreurEl.textContent = message;

  input.insertAdjacentElement("afterend", erreurEl);
  input.classList.add("border-rose-500", "focus:border-rose-500");
}

/**
 * Retire le message d'erreur (et le style rouge) d'un champ donné.
 */
export function supprimerErreurChamp(inputId) {
  const input = document.getElementById(inputId);
  const erreurExistante = document.getElementById(`erreur-${inputId}`);

  if (erreurExistante) erreurExistante.remove();
  input?.classList.remove("border-rose-500", "focus:border-rose-500");
}

/**
 * Valide un ensemble de champs d'un coup et affiche automatiquement les
 * messages rouges sous les champs en erreur.
 *
 * Usage (dans n'importe quelle page, sans répéter la logique) :
 *
 *   const estValide = validerFormulaire([
 *     { id: "newPrenom", verifications: [() => required(prenom, "Le prénom est obligatoire.")] },
 *     { id: "newEmail",  verifications: [() => required(email, "L'email est obligatoire."), () => isEmail(email)] },
 *   ]);
 *   if (!estValide) return; // on arrête l'envoi du formulaire
 *
 * @param {{id: string, verifications: Array<() => void>}[]} champs
 * @returns {boolean} true si tous les champs sont valides
 */
export function validerFormulaire(champs) {
  let estValide = true;

  champs.forEach(({ id, verifications }) => {
    supprimerErreurChamp(id);

    for (const verifier of verifications) {
      try {
        verifier();
      } catch (error) {
        afficherErreurChamp(id, error.message);
        estValide = false;
        break; // on n'affiche que la première erreur du champ
      }
    }
  });

  return estValide;
}