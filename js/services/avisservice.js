import { API_BASE_URL } from "../config/api.js";
import { apiRequest } from "./apiClient.js";
import { createId } from "../utils/id.js";

export async function getAllAvis() {
  const tous = await apiRequest(`${API_BASE_URL}/avis`, {}, "Impossible de charger les avis.");
  return tous.filter(a => a.supprime !== true);
}

export async function getAvisCorbeille() {
  const tous = await apiRequest(`${API_BASE_URL}/avis`, {}, "Impossible de charger la corbeille des avis.");
  return tous.filter(a => a.supprime === true);
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

export async function deplacerAvisVersCorbeille(id) {
  return apiRequest(
    `${API_BASE_URL}/avis/${id}`,
    { method: "PATCH", body: JSON.stringify({ supprime: true, dateSuppression: new Date().toISOString() }) },
    "Impossible de déplacer cet avis vers la corbeille."
  );
}

export async function restaurerAvis(id) {
  return apiRequest(
    `${API_BASE_URL}/avis/${id}`,
    { method: "PATCH", body: JSON.stringify({ supprime: false, dateSuppression: null }) },
    "Impossible de restaurer cet avis."
  );
}

export async function supprimerDefinitivementAvis(id) {
  return apiRequest(
    `${API_BASE_URL}/avis/${id}`,
    { method: "DELETE" },
    "Impossible de supprimer définitivement cet avis."
  );
}