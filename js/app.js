import { getSession } from "./utils/session.js";
import { renderLoginPage } from "./pages/accueil/loginPage.js";
import { renderSidebar } from "./components/sidebar.js";
import { renderNavbar } from "./components/navbar.js";
import { navigate } from "./router.js";

function mountLayout() {
  document.getElementById("sidebarRoot").innerHTML = renderSidebar();
  document.getElementById("navbarRoot").innerHTML = renderNavbar();
}

function startApp() {
  const user = getSession();

  // Si aucun jeton de session n'existe, on reste bloqué sur l'écran de connexion
  if (!user) {
    renderLoginPage();
    return;
  }

  // Si connecté, montage des menus et routage initial selon le rôle
  mountLayout();
  
  if (user.role === "artisan") {
    navigate("artisan/produits");
  } else if (user.role === "admin") {
    navigate("admin/dashboard");
  } else {
    navigate("accueil/boutique"); // Client par défaut
  }
}

startApp();
