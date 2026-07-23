import { API_BASE_URL } from "../config/api.js";
import { apiRequest } from "./apiClient.js";

export async function getAllProduits() {
  const tous = await apiRequest(`${API_BASE_URL}/produits`, {}, "Impossible de charger les produits.");
  return tous.filter(p => p.supprime !== true);
}

export async function getProduitsCorbeille() {
  const tous = await apiRequest(`${API_BASE_URL}/produits`, {}, "Impossible de charger la corbeille des produits.");
  return tous.filter(p => p.supprime === true);
}

export async function getProduitById(id) {
  return apiRequest(`${API_BASE_URL}/produits/${id}`, {}, "Impossible de charger ce produit.");
}

// Utilisé par la page de détail utilisateur (produits d'un artisan donné)
export async function getProduitsParArtisan(artisanId) {
  const tous = await getAllProduits();
  return tous.filter(p => p.artisanId === artisanId);
}

export async function createProduit(payload) {
  return apiRequest(
    `${API_BASE_URL}/produits`,
    { method: "POST", body: JSON.stringify({ ...payload, supprime: false }) },
    "Impossible de créer le produit."
  );
}

export async function updateProduit(id, payload) {
  return apiRequest(
    `${API_BASE_URL}/produits/${id}`,
    {
      method: "PATCH",
      body: JSON.stringify({ ...payload, dateModification: new Date().toISOString().split("T")[0] })
    },
    "Impossible de modifier le produit."
  );
}

// Validation / rejet d'un produit soumis par un artisan
export async function validerProduit(id) {
  return apiRequest(
    `${API_BASE_URL}/produits/${id}`,
    {
      method: "PATCH",
      body: JSON.stringify({ statut: "VALIDE", datePublication: new Date().toISOString().split("T")[0] })
    },
    "Impossible de valider le produit."
  );
}

export async function rejeterProduit(id) {
  return apiRequest(
    `${API_BASE_URL}/produits/${id}`,
    { method: "PATCH", body: JSON.stringify({ statut: "REJETE" }) },
    "Impossible de rejeter le produit."
  );
}

// Suppression douce : le produit part à la corbeille, il disparaît du site public
export async function deplacerProduitVersCorbeille(id) {
  return apiRequest(
    `${API_BASE_URL}/produits/${id}`,
    {
      method: "PATCH",
      body: JSON.stringify({ supprime: true, dateSuppression: new Date().toISOString() })
    },
    "Impossible de déplacer le produit vers la corbeille."
  );
}

// Republication depuis la corbeille (on ne repasse pas par la validation)
export async function republierProduit(id) {
  return apiRequest(
    `${API_BASE_URL}/produits/${id}`,
    { method: "PATCH", body: JSON.stringify({ supprime: false, dateSuppression: null }) },
    "Impossible de republier le produit."
  );
}

export async function supprimerDefinitivementProduit(id) {
  return apiRequest(
    `${API_BASE_URL}/produits/${id}`,
    { method: "DELETE" },
    "Impossible de supprimer définitivement le produit."
  );
}