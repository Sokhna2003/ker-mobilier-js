import { loginUser } from "../../services/authservice.js";
import { showToast } from "../../components/toast.js";

export function renderLoginPage() {
  const app = document.getElementById("app");

  // Masque la sidebar et la navbar pour afficher l'écran de login en plein écran
  document.getElementById("sidebarRoot")?.classList.add("hidden");
  document.getElementById("navbarRoot")?.classList.add("hidden");

  // Récupère l'identifiant du rôle choisi (ex: "admin", "artisan") et nettoie le préfixe "role-" s'il existe
  let roleChoisi = sessionStorage.getItem("chosen_role") || "client";
  roleChoisi = roleChoisi.replace("role-", "").trim().toLowerCase();

  app.innerHTML = `
    <div class="grid min-h-[80vh] place-items-center p-4 bg-slate-50 relative">
      <div class="w-full max-w-4xl bg-gradient-to-br from-amber-800 via-amber-700 to-emerald-800 rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col md:flex-row min-h-[500px]">
          
          <!-- PARTIE GAUCHE (BLANCHE) : Le Formulaire -->
          <div class="w-full md:w-[55%] bg-white p-8 sm:p-12 flex flex-col justify-center rounded-br-[100px] shadow-lg">
              <div class="mb-6 text-center md:text-left">
                  <h2 class="text-3xl font-black text-slate-950">Bonjour !</h2>
                  <p class="text-xs text-slate-400 font-bold uppercase tracking-wider">Connexion : Portail ${roleChoisi}</p>
              </div>

              <form id="spaLoginForm" class="space-y-4">
                  <!-- Zone rouge pour l'affichage de l'erreur en haut de l'input -->
                  <div id="globalLoginError" class="hidden bg-rose-50 text-rose-600 text-xs font-bold p-3 rounded-xl border border-red-100 text-center"></div>
                  
                  <div>
                    <input type="email" id="loginEmail" placeholder="Adresse e-mail" required
                        class="w-full bg-slate-50 text-gray-800 rounded-2xl px-4 py-3.5 text-sm border-0 focus:outline-none focus:ring-4 focus:ring-amber-50 font-medium" />
                  </div>

                  <div>
                    <input type="password" id="loginPassword" placeholder="Mot de passe" required
                        class="w-full bg-slate-50 text-gray-800 rounded-2xl px-4 py-3.5 text-sm border-0 focus:outline-none focus:ring-4 focus:ring-amber-50 font-medium" />
                  </div>

                  <div class="pt-2">
                      <button type="submit" class="w-full sm:w-48 bg-amber-700 hover:bg-emerald-700 text-white text-xs font-black py-4 rounded-full tracking-widest uppercase shadow-lg transition duration-200 cursor-pointer">
                          Se connecter
                      </button>
                  </div>
              </form>
          </div>

          <!-- PARTIE DROITE : Message d'accueil -->
          <div class="hidden md:flex w-[45%] p-12 flex-col justify-center text-white">
              <h3 class="text-2xl font-black tracking-tight">Kër Mobilier</h3>
              <p class="text-xs text-amber-50/90 leading-relaxed font-medium mt-2">
                  Connectez-vous pour accéder de manière sécurisée à votre tableau de bord métier.
              </p>
          </div>
      </div>
    </div>
  `;

  document.getElementById("spaLoginForm")?.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = document.getElementById("loginEmail").value;
    const password = document.getElementById("loginPassword").value;
    const errorBox = document.getElementById("globalLoginError");

    if (errorBox) {
      errorBox.textContent = "";
      errorBox.classList.add("hidden");
    }

    try {
      const user = await loginUser(email, password);
      
      // CORRECTION GLOBALE : On lit user.role à la place de user.roleId pour correspondre au db.json
      const userRole = String(user.role).replace("role-", "").trim().toLowerCase();

      // Sécurité : Vérifie si le compte possède le bon rôle sélectionné
      if (userRole !== roleChoisi) {
        throw new Error(`Ce compte possède un profil "${userRole}" et ne peut pas accéder à l'espace "${roleChoisi}".`);
      }

      showToast(`Ravi de vous revoir !`, "success");
      
      // On réactive les menus et on recharge l'application
      document.getElementById("sidebarRoot")?.classList.remove("hidden");
      document.getElementById("navbarRoot")?.classList.remove("hidden");
      window.location.reload();

    } catch (err) {
      if (errorBox) {
        errorBox.textContent = err.message;
        errorBox.classList.remove("hidden");
      }
      showToast(err.message, "error");
    }
  });
}
