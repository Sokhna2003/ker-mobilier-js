export function openRoleSelectionModal() {
  const root = document.getElementById("modalRoot");
  if (!root) return;

  const overlay = document.createElement("div");
  overlay.id = "roleModalOverlay";
  overlay.className = "fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm animate-in fade-in duration-200";

  overlay.innerHTML = `
    <div class="w-full max-w-xl rounded-[2.5rem] bg-white p-6 shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-200">

      <!-- En-tête de la modale -->
      <div class="flex items-center justify-between border-b border-slate-100 pb-4 mb-5">
        <div>
          <h2 class="text-xl font-black tracking-tight text-slate-950">Portail d'authentification</h2>
          <p class="text-xs text-slate-400 mt-0.5">Sélectionnez votre profil d'acteur pour vous connecter</p>
        </div>
        <button id="closeRoleModalBtn" class="flex h-9 w-9 items-center justify-center rounded-xl text-slate-400 transition hover:bg-slate-100 hover:text-slate-700">
          <i class="fa-solid fa-xmark"></i>
        </button>
      </div>

      <!-- Grille des 4 Cartes de Rôles -->
      <div class="grid grid-cols-2 gap-4">

        <!-- CARTE 1 : ADMINISTRATEUR -->
        <button data-role="admin" class="group flex flex-col items-center justify-center p-5 rounded-2xl bg-amber-700 text-white transition duration-200 hover:bg-emerald-700 shadow-lg outline-none text-center">
          <div class="h-12 w-12 rounded-xl bg-white/10 flex items-center justify-center mb-3">
            <i class="fa-solid fa-user-shield text-lg"></i>
          </div>
          <h3 class="text-sm font-black uppercase tracking-wider">Administrateur</h3>
          <p class="text-[11px] text-white/70 mt-1 leading-snug">Gestion globale, validations & livreurs</p>
        </button>

        <!-- CARTE 2 : ARTISAN MENUISIER -->
        <button data-role="artisan" class="group flex flex-col items-center justify-center p-5 rounded-2xl bg-amber-700 text-white transition duration-200 hover:bg-emerald-700 shadow-lg outline-none text-center">
          <div class="h-12 w-12 rounded-xl bg-white/10 flex items-center justify-center mb-3">
            <i class="fa-solid fa-hammer text-lg"></i>
          </div>
          <h3 class="text-sm font-black uppercase tracking-wider">Artisan</h3>
          <p class="text-[11px] text-white/70 mt-1 leading-snug">Gestion de l'atelier, catalogue & sur-mesure</p>
        </button>

        <!-- CARTE 3 : CLIENT -->
        <button data-role="client" class="group flex flex-col items-center justify-center p-5 rounded-2xl bg-amber-700 text-white transition duration-200 hover:bg-emerald-700 shadow-lg outline-none text-center">
          <div class="h-12 w-12 rounded-xl bg-white/10 flex items-center justify-center mb-3">
            <i class="fa-solid fa-bag-shopping text-lg"></i>
          </div>
          <h3 class="text-sm font-black uppercase tracking-wider">Client</h3>
          <p class="text-[11px] text-white/70 mt-1 leading-snug">Commandes, catalogue public & demandes</p>
        </button>

        <!-- CARTE 4 : LIVREUR LOGISTIQUE -->
        <button data-role="livreur" class="group flex flex-col items-center justify-center p-5 rounded-2xl bg-amber-700 text-white transition duration-200 hover:bg-emerald-700 shadow-lg outline-none text-center">
          <div class="h-12 w-12 rounded-xl bg-white/10 flex items-center justify-center mb-3">
            <i class="fa-solid fa-truck-fast text-lg"></i>
          </div>
          <h3 class="text-sm font-black uppercase tracking-wider">Livreur</h3>
          <p class="text-[11px] text-white/70 mt-1 leading-snug">Tournées de livraison & récupération ateliers</p>
        </button>

      </div>
    </div>
  `;

  root.appendChild(overlay);

  // Fonction de fermeture locale
  const close = () => overlay.remove();

  // Événements de fermeture
  document.getElementById("closeRoleModalBtn")?.addEventListener("click", close);
  overlay.addEventListener("click", (e) => { if (e.target === overlay) close(); });

  // Événement lors du clic sur un rôle
  overlay.querySelectorAll("[data-role]").forEach(btn => {
    btn.addEventListener("click", () => {
      const selectedRole = btn.dataset.role;
      close();

      // Mémorise temporairement le rôle choisi pour pré-remplir ou adapter le formulaire
      sessionStorage.setItem("chosen_role", selectedRole);

      // Déclenche l'affichage de la page de connexion spécifique
      window.location.hash = `login?role=${selectedRole}`;
      window.location.reload();
    });
  });
}