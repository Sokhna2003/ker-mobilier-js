import { getSession, clearSession } from "./utils/session.js";
import { renderSidebar } from "./components/sidebar.js";
import { renderNavbar, renderPublicNavbar } from "./components/navbar.js";
import { renderFooter } from "./components/footer.js";
import { navigate } from "./router.js";
import { openRoleSelectionModal } from "./components/modalSelectionRole.js";

const ROLES_BACK_OFFICE = ["admin", "artisan", "client", "livreur"];

function mountLayout() {
  const user = getSession();
  const mainLayout = document.getElementById("mainLayout");
  const appEl = document.getElementById("app");
  const sidebarEl = document.getElementById("sidebarRoot");
  const navbarEl = document.getElementById("navbarRoot");
  const footerRoot = document.getElementById("footerRoot");

  const estBackOffice = user && ROLES_BACK_OFFICE.includes(user.role);

  if (estBackOffice) {
    // Espace connecté : sidebar + navbar fixes, contenu centré et paddé
    if (sidebarEl) {
      sidebarEl.innerHTML = renderSidebar();
      sidebarEl.classList.remove("hidden");
    }
    if (navbarEl) navbarEl.innerHTML = renderNavbar();

    mainLayout.classList.add("pt-16", "lg:pl-72");
    appEl.className = "mx-auto max-w-7xl p-4 sm:p-6 lg:p-8";
    footerRoot?.remove();
  } else {
    // Site public (boutique) : navbar pleine largeur, pas de sidebar, pas de padding forcé
    sidebarEl?.classList.add("hidden");
    if (navbarEl) navbarEl.innerHTML = renderPublicNavbar();

    mainLayout.classList.remove("pt-16", "lg:pl-72");
    appEl.className = "";

    if (!document.getElementById("footerRoot")) {
      const footer = document.createElement("div");
      footer.id = "footerRoot";
      footer.innerHTML = renderFooter();
      mainLayout.appendChild(footer);
    }
  }
}

function startApp() {
  const user = getSession();

  mountLayout();

  if (window.location.hash.startsWith("#login")) {
    navigate("login");
    return;
  }

  if (!user) {
    navigate("accueil/boutique");
    return;
  }

  if (user.role === "artisan") {
    navigate("artisan/produits");
  } else if (user.role === "admin") {
    navigate("admin/dashboard");
  } else if (user.role === "client") {
    navigate("client/dashboard");
  } else if (user.role === "livreur") {
    navigate("livreur/dashboard");
  } else {
    navigate("accueil/boutique");
  }
}

// Délégation d'événements globale pour la navigation via data-page (liens navbar publique, sidebar, etc.)
document.addEventListener("click", (e) => {
  const lien = e.target.closest("[data-page]");
  if (lien) {
    e.preventDefault();
    navigate(lien.dataset.page);
  }

  if (e.target.closest("#openLoginModalBtn") || e.target.closest("#navLoginBtn") || e.target.closest("#loginBtn")) {
    e.preventDefault();
    openRoleSelectionModal();
  }

  if (e.target.closest("#logoutBtn")) {
    clearSession();
    window.location.reload();
  }
});

window.addEventListener("hashchange", startApp);

// Lancement de la SPA
startApp();