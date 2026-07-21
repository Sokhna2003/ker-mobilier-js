// app.js
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
  const mainLayout = document.getElementById("mainLayout") || document.body;

  const estBackOffice = user && ROLES_BACK_OFFICE.includes(user.role);

  if (estBackOffice) {
    if (sidebarEl) {
      sidebarEl.innerHTML = renderSidebar();
      sidebarEl.classList.remove("hidden");
    }
    if (navbarEl) navbarEl.innerHTML = renderNavbar();
    
    // Structure du Back-Office : Décalage à 72 unités sur PC, et compact (p-4)
    mainLayout.className = "pt-16 lg:pl-72 transition-all duration-150";

    const appEl = document.getElementById("app");
    if (appEl) {
      appEl.className = "mx-auto max-w-7xl p-4 sm:p-5 lg:p-6";
    }
  } else {
    // Site public (vitrine)
    sidebarEl?.classList.add("hidden");
    if (navbarEl) navbarEl.innerHTML = renderPublicNavbar();
    
    mainLayout.className = "";
    const appEl = document.getElementById("app");
    if (appEl) appEl.className = "";
  }
}

function startApp() {
  const user = getSession();
  const roleId = getRole();

  if (window.location.hash.startsWith("#login")) {
    navigate("login");
    return;
  }

  if (user) {
    mountLayout();
    if (roleId === "admin") navigate("admin/dashboard");
    else if (roleId === "artisan") navigate("artisan/dashboard");
    else if (roleId === "client") navigate("client/dashboard");
    else if (roleId === "livreur") navigate("livreur/dashboard");
    return;
  }

  mountLayout();
  navigate("accueil/boutique");
}

// DÉLÉGATION D'ÉVÉNEMENTS GLOBALE
document.addEventListener("click", (e) => {
  const lien = e.target.closest("[data-page]");
  const sidebar = document.getElementById("sidebar");
  const overlay = document.getElementById("sidebarOverlay");

  // 1. Clic sur un lien / onglet de navigation
  if (lien) {
    e.preventDefault();
    navigate(lien.dataset.page);
    
    // CORRECTION BURGER : Si on clique sur un onglet sur MOBILE, on replie la sidebar automatiquement
    if (window.innerWidth < 1024 && sidebar && overlay) {
      sidebar.classList.add("-translate-x-full");
      overlay.classList.add("hidden");
    }
  }

  // 2. CORRECTION BURGER : Clic sur l'icône des 3 barres pour OUVRIR
  if (e.target.closest("#sidebarToggle")) {
    e.preventDefault();
    if (sidebar && overlay) {
      sidebar.classList.remove("-translate-x-full");
      overlay.classList.remove("hidden");
    }
  }

  // 3. CORRECTION BURGER : Clic sur le voile noir pour FERMER
  if (e.target.closest("#sidebarOverlay")) {
    if (sidebar && overlay) {
      sidebar.classList.add("-translate-x-full");
      overlay.classList.add("hidden");
    }
  }

  // Ouvre la modale de sélection de rôle
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

window.addEventListener("hashchange", startApp);

startApp();
