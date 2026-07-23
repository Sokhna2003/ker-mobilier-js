// Ce fichier stocke l'utilisateur connecté dans la mémoire du navigateur (localStorage) pour 
// savoir qui navigue sur l'application.

// Sauvegarde l'utilisateur connecté dans le localStorage
export function setSession(user) {
  localStorage.setItem("ker_user", JSON.stringify(user));
}

// Récupère l'utilisateur actuellement connecté
export function getSession() {
  const user = localStorage.getItem("ker_user");
  return user ? JSON.parse(user) : null;
}

// Supprime l'utilisateur (Déconnexion)
export function clearSession() {
  localStorage.removeItem("ker_user");
}

//  Récupère l'identifiant du rôle (ex: "admin", "artisan")
export function getRole() {
  return getSession()?.role || null;
}
