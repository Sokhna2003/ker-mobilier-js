import { API_BASE_URL } from "../config/api.js";
import { apiRequest } from "./apiClient.js";

export async function getAllLivraisons() {
  return apiRequest(`${API_BASE_URL}/livraisons`, {}, "Impossible de charger les livraisons.");
}