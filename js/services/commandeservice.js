import { API_BASE_URL } from "../config/api.js";
import { apiRequest } from "./apiClient.js";

export async function getAllCommandes() {
  return apiRequest(`${API_BASE_URL}/commandes`, {}, "Impossible de charger les commandes.");
}

export async function getCommandesParClient(clientId) {
  return apiRequest(
    `${API_BASE_URL}/commandes?clientId=${encodeURIComponent(clientId)}`,
    {},
    "Impossible de charger les commandes de ce client."
  );
}