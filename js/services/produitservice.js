import { API_BASE_URL } from "../config/api.js";
import { apiRequest } from "./apiClient.js";

export async function getProduitsParArtisan(artisanId) {
  return apiRequest(
    `${API_BASE_URL}/produits?artisanId=${encodeURIComponent(artisanId)}`,
    {},
    "Impossible de charger les produits de cet artisan."
  );
}

export async function getAllProduits() {
  return apiRequest(`${API_BASE_URL}/produits`, {}, "Impossible de charger les produits.");
}