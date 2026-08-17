// utils/panier.js
const CLE_PANIER = "ker_panier";

function lirePanier() {
  try {
    const brut = localStorage.getItem(CLE_PANIER);
    return brut ? JSON.parse(brut) : [];
  } catch {
    return [];
  }
}

function ecrirePanier(articles) {
  localStorage.setItem(CLE_PANIER, JSON.stringify(articles));
}

export function getPanier() {
  return lirePanier();
}

export function ajouterAuPanier(produit, quantite = 1) {
  const articles = lirePanier();
  const existant = articles.find(a => a.produitId === produit.id);

  if (existant) {
    existant.quantite += quantite;
  } else {
    articles.push({
      produitId: produit.id,
      nom: produit.nom,
      prix: produit.prix,
      image: produit.images || "",
      artisanId: produit.artisanId,
      quantite
    });
  }

  ecrirePanier(articles);
  return articles;
}

export function modifierQuantitePanier(produitId, quantite) {
  let articles = lirePanier();
  if (quantite <= 0) {
    articles = articles.filter(a => a.produitId !== produitId);
  } else {
    const article = articles.find(a => a.produitId === produitId);
    if (article) article.quantite = quantite;
  }
  ecrirePanier(articles);
  return articles;
}

export function retirerDuPanier(produitId) {
  const articles = lirePanier().filter(a => a.produitId !== produitId);
  ecrirePanier(articles);
  return articles;
}

export function viderPanier() {
  ecrirePanier([]);
}

export function totalPanier() {
  return lirePanier().reduce((s, a) => s + a.prix * a.quantite, 0);
}

export function nombreArticlesPanier() {
  return lirePanier().reduce((s, a) => s + a.quantite, 0);
}

// Met à jour le badge du panier dans la navbar (appelée après chaque ajout/retrait)
export function mettreAJourBadgePanier() {
  const badge = document.getElementById("badgePanier");
  if (!badge) return;
  const nombre = nombreArticlesPanier();
  badge.textContent = nombre;
  badge.classList.toggle("hidden", nombre === 0);
  badge.classList.toggle("flex", nombre > 0);
}