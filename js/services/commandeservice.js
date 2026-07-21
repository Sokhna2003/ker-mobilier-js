import { API_BASE_URL } from "../config/api.js";
import { apiRequest } from "./apiClient.js";

export async function getCommandesParClient(clientId) {
  return apiRequest(
    `${API_BASE_URL}/commandes?clientId=${encodeURIComponent(clientId)}`,
    {},
    "Impossible de charger les commandes de ce client."
  );
}