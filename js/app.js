import { getSession } from "./utils/session.js";
import { renderBoutiquePage } from "./pages/accueil/boutiquePage.js";
import { renderSidebar } from "./components/sidebar.js";
import { renderNavbar } from "./components/navbar.js";
import { navigate } from "./router.js";

function mountLayout() {
  // On laisse la navbar et la sidebar visibles si l'étudiant veut se connecter plus tard
  document.getElementById("sidebarRoot").innerHTML = renderSidebar();
  document.getElementById("navbarRoot").innerHTML = renderNavbar();
}

function startApp() {
  const user = getSession();

  // CORRECTION : Si aucun utilisateur n'est connecté, on affiche la boutique de la maquette !
  if (!user) {
    // Montage partiel (juste la navbar pour le bouton de connexion si vous en avez un)
    document.getElementById("sidebarRoot").classList.add("hidden"); // Cache la sidebar admin/artisan
    renderBoutiquePage(); // Affiche la maquette
    return;
  }

  // Si connecté, comportement normal selon le rôle
  mountLayout();
  document.getElementById("sidebarRoot").classList.remove("hidden");
  
  if (user.role === "artisan") {
    navigate("artisan/produits");
  } else if (user.role === "admin") {
    navigate("admin/dashboard");
  } else {
    renderBoutiquePage(); // Client connecté
  }
}

startApp();
