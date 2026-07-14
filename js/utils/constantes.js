// utils/constantes.js

// Catégories métiers de Kër Mobilier (cf. proposition de projet).
// Fixe et non dérivée des produits, pour que la pastille "Salon" par exemple
// reste visible même si aucun produit n'est encore publié dedans.
export const CATEGORIES = [
  { valeur: "salon", label: "Salon", icone: "fa-couch" },
  { valeur: "chambre", label: "Chambre", icone: "fa-bed" },
  { valeur: "salle-a-manger", label: "Salle à manger", icone: "fa-utensils" },
  { valeur: "bureau", label: "Bureau", icone: "fa-briefcase" },
  { valeur: "decoration", label: "Décoration", icone: "fa-vase" }
];

export const ESSENCES_BOIS = [
  "Tous les bois nobles",
  "Acajou",
  "Teck",
  "Wengé",
  "MDF laqué"
];

export const OPTIONS_TRI = [
  { valeur: "popularite", label: "Popularité & Évaluations" },
  { valeur: "prix_asc", label: "Prix croissant" },
  { valeur: "prix_desc", label: "Prix décroissant" }
];