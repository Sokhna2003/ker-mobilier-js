// app.js
import { getSession, clearSession } from "./utils/session.js";
import { renderSidebar } from "./components/sidebar.js";
import { renderNavbar, renderPublicNavbar } from "./components/navbar.js";
import { renderFooter } from "./components/footer.js";
import { navigate } from "./router.js";
import { ouvrirPanierModal } from "./components/panierModal.js";
import { mettreAJourBadgePanier } from "./utils/panier.js";

function mountLayout() {
  const user = getSession();
  const mainLayout = document.getElementById("mainLayout");
  const appEl = document.getElementById("app");
  const sidebarEl = document.getElementById("sidebarRoot");
  const navbarEl = document.getElementById("navbarRoot");
  const footerRoot = document.getElementById("footerRoot");

  // Tout utilisateur connecté (quel que soit son rôle) a la mise en page "espace connecté".
  // Seul un visiteur non connecté voit le site public.
  const estBackOffice = Boolean(user);

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
  mettreAJourBadgePanier();

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
  const sidebar = document.getElementById("sidebar");
  const overlay = document.getElementById("sidebarOverlay");

  if (lien) {
    e.preventDefault();
    navigate(lien.dataset.page);

    // Sur mobile, on referme le menu après avoir choisi une page
    if (window.innerWidth < 1024 && sidebar && overlay) {
      sidebar.classList.add("-translate-x-full");
      overlay.classList.add("hidden");
    }
  }

  // Clic sur l'icône burger : ouvrir le menu
  if (e.target.closest("#sidebarToggle")) {
    e.preventDefault();
    if (sidebar && overlay) {
      sidebar.classList.remove("-translate-x-full");
      overlay.classList.remove("hidden");
    }
  }

  // Clic sur le voile sombre : fermer le menu
  if (e.target.closest("#sidebarOverlay")) {
    if (sidebar && overlay) {
      sidebar.classList.add("-translate-x-full");
      overlay.classList.add("hidden");
    }
  }

  if (e.target.closest("#openLoginModalBtn") || e.target.closest("#navLoginBtn") || e.target.closest("#loginBtn")) {
    e.preventDefault();
    navigate("login");
  }

  if (e.target.closest("#panierBtn")) {
    e.preventDefault();
    ouvrirPanierModal();
  }

  if (e.target.closest("#logoutBtn")) {
    clearSession();
    window.location.reload();
  }
});

window.addEventListener("hashchange", startApp);

// Lancement de la SPA
startApp();