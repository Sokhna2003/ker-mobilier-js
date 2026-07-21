import { API_BASE_URL } from "../config/api.js";
import { apiRequest } from "./apiClient.js";

export async function getCategories() {
  const toutes = await apiRequest(`${API_BASE_URL}/categories`, {}, "Impossible de charger les catégories.");
  return toutes.filter(c => c.supprime !== true);
}

export async function getCategoriesCorbeille() {
  const toutes = await apiRequest(`${API_BASE_URL}/categories`, {}, "Impossible de charger la corbeille des catégories.");
  return toutes.filter(c => c.supprime === true);
}

export async function getCategorieById(id) {
  return apiRequest(`${API_BASE_URL}/categories/${id}`, {}, "Impossible de charger cette catégorie.");
}

export async function createCategorie(payload) {
  return apiRequest(
    `${API_BASE_URL}/categories`,
    { method: "POST", body: JSON.stringify({ ...payload, supprime: false }) },
    "Impossible de créer la catégorie."
  );
}

export async function updateCategorie(id, payload) {
  return apiRequest(
    `${API_BASE_URL}/categories/${id}`,
    { method: "PATCH", body: JSON.stringify(payload) },
    "Impossible de modifier la catégorie."
  );
}

// Suppression douce : la catégorie part à la corbeille
export async function deplacerCategorieVersCorbeille(id) {
  return apiRequest(
    `${API_BASE_URL}/categories/${id}`,
    { method: "PATCH", body: JSON.stringify({ supprime: true, dateSuppression: new Date().toISOString() }) },
    "Impossible de déplacer la catégorie vers la corbeille."
  );
}

export async function restaurerCategorie(id) {
  return apiRequest(
    `${API_BASE_URL}/categories/${id}`,
    { method: "PATCH", body: JSON.stringify({ supprime: false, dateSuppression: null }) },
    "Impossible de restaurer la catégorie."
  );
}

export async function supprimerDefinitivementCategorie(id) {
  return apiRequest(
    `${API_BASE_URL}/categories/${id}`,
    { method: "DELETE" },
    "Impossible de supprimer définitivement la catégorie."
  );
}