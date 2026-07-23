import { API_BASE_URL } from "../config/api.js";
import { apiRequest } from "./apiClient.js";

export async function getAllAvis() {
  return apiRequest(`${API_BASE_URL}/avis`, {}, "Impossible de charger les avis.");
}

export async function getAvisParClient(clientId) {
  const tous = await getAllAvis();
  return tous.filter(a => a.clientId === clientId);
}

