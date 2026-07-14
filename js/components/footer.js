// footer.js
export function renderFooter() {
  const annee = new Date().getFullYear();
  return `
    <footer class="border-t border-black/5 bg-cream">
      <div class="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div class="flex flex-col items-center justify-between gap-4 sm:flex-row">
          <span class="font-serif text-lg font-semibold text-slate-950">Kër Mobilier</span>
          <p class="text-xs font-medium text-slate-500">© ${annee} Kër Mobilier — Le mobilier sénégalais à portée de clic.</p>
        </div>
      </div>
    </footer>
  `;
}