import { loginUser } from "../../services/authservice.js";
import { showToast } from "../../components/toast.js";

export function renderLoginPage() {
  const app = document.getElementById("app");
  
  // Cache les menus fixes pour l'écran de login
  document.getElementById("sidebarRoot")?.classList.add("hidden");
  document.getElementById("navbarRoot")?.classList.add("hidden");

  app.innerHTML = `
    <div class="grid min-h-[85vh] place-items-center p-4 bg-slate-50">
      <div class="w-full max-w-md rounded-[2rem] border border-slate-200 bg-white p-8 shadow-2xl">
        <div class="text-center mb-6">
          <div class="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-600 to-amber-900 text-xl font-black text-white shadow-lg shadow-amber-200">
            <i class="fa-solid fa-couch"></i>
          </div>
          <h1 class="mt-4 text-2xl font-black text-slate-950">Kër Mobilier</h1>
          <p class="text-xs font-bold text-amber-700 uppercase tracking-widest mt-1">Le mobilier sénégalais à portée de clic</p>
        </div>

        <form id="loginForm" class="grid gap-4">
          <div>
            <label class="mb-2 block text-xs font-extrabold uppercase tracking-wider text-slate-500">Adresse Email</label>
            <input class="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-medium outline-none focus:border-amber-600 focus:ring-4 focus:ring-amber-50" type="email" id="logEmail" placeholder="ex: abdou@gmail.com" required />
          </div>
          <div>
            <label class="mb-2 block text-xs font-extrabold uppercase tracking-wider text-slate-500">Mot de passe</label>
            <input class="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-medium outline-none focus:border-amber-600 focus:ring-4 focus:ring-amber-50" type="password" id="logPass" placeholder="••••••••" required />
          </div>
          <button type="submit" class="w-full rounded-2xl bg-amber-700 py-3.5 text-sm font-black text-white shadow-lg shadow-amber-100 transition hover:bg-amber-800 mt-2">
            Se connecter
          </button>
        </form>
      </div>
    </div>
  `;

  document.getElementById("loginForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = document.getElementById("logEmail").value;
    const password = document.getElementById("logPass").value;

    try {
      const user = await loginUser(email, password);
      showToast(`Bienvenue ${user.prenom} !`, "success");
      
      // Réaffiche les menus et recharge l'application
      document.getElementById("sidebarRoot")?.classList.remove("hidden");
      document.getElementById("navbarRoot")?.classList.remove("hidden");
      window.location.reload();
    } catch (err) {
      showToast(err.message, "error");
    }
  });
}
