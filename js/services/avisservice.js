import { API_BASE_URL } from "../config/api.js";
import { apiRequest } from "./apiClient.js";
import { createId } from "../utils/id.js";

export async function getAllAvis() {
  return apiRequest(`${API_BASE_URL}/avis`, {}, "Impossible de charger les avis.");
}

export async function getAvisParClient(clientId) {
  const tous = await getAllAvis();
  return tous.filter(a => a.clientId === clientId);
}

export async function createAvis(payload) {
  return apiRequest(
    `${API_BASE_URL}/avis`,
    {
      method: "POST",
      body: JSON.stringify({ id: createId("avis"), date: new Date().toISOString().split("T")[0], ...payload })
    },
    "Impossible d'enregistrer votre avis."
  );
}