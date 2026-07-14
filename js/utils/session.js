// session.js
// Ce fichier stocke l'utilisateur connecté dans la mémoire du navigateur (localStorage) pour 
// savoir qui navigue sur l'application.

// Stocke l'utilisateur en cours dans le navigateur
export function setSession(user) {
  localStorage.setItem("ker_user", JSON.stringify(user));
}

// Récupère l'utilisateur actuellement connecté
export function getSession() {
  const user = localStorage.getItem("ker_user");
  return user ? JSON.parse(user) : null;
}

export function clearSession() {
  localStorage.removeItem("ker_user");
}

// Vérifie le role de  l'utilisateur connecté
export function getRole() {
  return getSession()?.role || null;
}
