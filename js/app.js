import { getSession, clearSession, getRole } from "./utils/session.js";
import { renderSidebar } from "./components/sidebar.js";
import { renderNavbar, renderPublicNavbar } from "./components/navbar.js";
import { navigate } from "./router.js";
import { openRoleSelectionModal } from "./components/modalSelectionRole.js";

const ROLES_BACK_OFFICE = ["admin", "artisan"];

function mountLayout() {
  const user = getSession();
  const sidebarEl = document.getElementById("sidebarRoot");
  const navbarEl = document.getElementById("navbarRoot");

  // On vérifie si l'acteur fait partie du Back-Office (Admin ou Artisan)
  const estBackOffice = user && ROLES_BACK_OFFICE.includes(user.role);

  if (estBackOffice) {
    if (sidebarEl) {
      sidebarEl.innerHTML = renderSidebar();
      sidebarEl.classList.remove("hidden");
    }
    if (navbarEl) navbarEl.innerHTML = renderNavbar();
  } else {
    // Client ou Visiteur anonyme -> Pas de sidebar, navbar publique
    sidebarEl?.classList.add("hidden");
    if (navbarEl) navbarEl.innerHTML = renderPublicNavbar();
  }
}

function startApp() {
  const user = getSession();
  const roleId = getRole();

  // 1. CAS CONECTÉ : On redirige directement vers le bon H1 de test
  if (user) {
    mountLayout();
    if (roleId === "admin") navigate("admin/dashboard");
    else if (roleId === "artisan") navigate("artisan/dashboard");
    else if (roleId === "client") navigate("client/dashboard");
    else if (roleId === "livreur") navigate("livreur/dashboard");
    return;
  }

  // 2. CAS NON-CONNECTÉ : Gestion de la page demandée
  // Permet d'intercepter la demande de connexion de la modale
  if (window.location.hash.startsWith("#login")) {
    navigate("login");
  } else {
    mountLayout();
    navigate("accueil/boutique");
  }
}

// Détection des clics globaux
document.addEventListener("click", (e) => {
  const lien = e.target.closest("[data-page]");
  if (lien) {
    e.preventDefault();
    navigate(lien.dataset.page);
  }

  // Ouvre la modale au clic sur le bouton connexion
  if (e.target.closest("#openLoginModalBtn") || e.target.closest("#navLoginBtn") || e.target.closest("#loginBtn")) {
    e.preventDefault();
    openRoleSelectionModal();
  }

  // Gestion de la déconnexion
  if (e.target.closest("#logoutBtn")) {
    clearSession();
    window.location.reload();
  }
});

// Écoute les changements d'URL du navigateur pour la modale
window.addEventListener("hashchange", startApp);

// Lancement initial
startApp();
