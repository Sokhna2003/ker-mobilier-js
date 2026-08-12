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


// Cycle de vie d'une commande (cf. scénario validé) :
// EN_ATTENTE -> (artisan répond) -> EN_PREPARATION | REJETEE
// EN_PREPARATION -> PRET_A_LIVRER -> (admin assigne un livreur) -> EN_LIVRAISON -> TERMINEE
export const STATUTS_COMMANDE = {
  EN_ATTENTE: { label: "En attente", classe: "bg-slate-100 text-slate-600" },
  EN_PREPARATION: { label: "En préparation", classe: "bg-amber-50 text-amber-700" },
  REJETEE: { label: "Refusée", classe: "bg-rose-50 text-rose-700" },
  PRET_A_LIVRER: { label: "Prêt à livrer", classe: "bg-blue-50 text-blue-700" },
  EN_LIVRAISON: { label: "En livraison", classe: "bg-indigo-50 text-indigo-700" },
  TERMINEE: { label: "Terminée", classe: "bg-emerald-50 text-emerald-700" }
};

// Cycle de vie d'une livraison :
// ATTRIBUEE (admin vient d'assigner) -> EN_LIVRAISON (livreur a accepté/récupéré) -> LIVREE
export const STATUTS_LIVRAISON = {
  ATTRIBUEE: { label: "Attribuée", classe: "bg-amber-50 text-amber-700" },
  EN_LIVRAISON: { label: "En livraison", classe: "bg-blue-50 text-blue-700" },
  LIVREE: { label: "Livrée", classe: "bg-emerald-50 text-emerald-700" },
  ANNULEE: { label: "Annulée", classe: "bg-rose-50 text-rose-700" }
};

export function labelStatutCommande(statut) {
  return STATUTS_COMMANDE[statut]?.label || statut;
}

export function classeStatutCommande(statut) {
  return STATUTS_COMMANDE[statut]?.classe || "bg-slate-100 text-slate-600";
}

export function labelStatutLivraison(statut) {
  return STATUTS_LIVRAISON[statut]?.label || statut;
}

export function classeStatutLivraison(statut) {
  return STATUTS_LIVRAISON[statut]?.classe || "bg-slate-100 text-slate-600";
}