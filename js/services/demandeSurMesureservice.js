import { API_BASE_URL } from "../config/api.js";
import { apiRequest } from "./apiClient.js";

export async function getAllDemandesSurMesure() {
  return apiRequest(`${API_BASE_URL}/demandesSurMesure`, {}, "Impossible de charger les demandes sur mesure.");
}