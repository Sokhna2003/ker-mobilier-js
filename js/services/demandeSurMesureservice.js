import { API_BASE_URL } from "../config/api.js";
import { apiRequest } from "./apiClient.js";

export async function getAllDemandesSurMesure() {
  return apiRequest(`${API_BASE_URL}/demandesSurMesure`, {}, "Impossible de charger les demandes sur mesure.");
}

export async function getDemandesParClient(clientId) {
  const toutes = await getAllDemandesSurMesure();
  return toutes.filter(d => d.clientId === clientId);
}

// Le client choisit l'artisan qui réalisera son meuble : ferme la demande
export async function cloturerDemandeSurMesure(id, artisanChoisiId) {
  return apiRequest(
    `${API_BASE_URL}/demandesSurMesure/${id}`,
    {
      method: "PATCH",
      body: JSON.stringify({ artisanChoisiId, dateCloture: new Date().toISOString().split("T")[0] })
    },
    "Impossible de clôturer cette demande."
  );
}
export async function getDemandeSurMesureById(id) {
  return apiRequest(`${API_BASE_URL}/demandesSurMesure/${id}`, {}, "Impossible de charger cette demande.");
}

// Validation par l'admin : la demande devient visible pour les artisans agréés
export async function validerDemandeSurMesure(id) {
  return apiRequest(
    `${API_BASE_URL}/demandesSurMesure/${id}`,
    { method: "PATCH", body: JSON.stringify({ statut: "VALIDEE" }) },
    "Impossible de valider cette demande."
  );
}

export async function rejeterDemandeSurMesure(id) {
  return apiRequest(
    `${API_BASE_URL}/demandesSurMesure/${id}`,
    { method: "PATCH", body: JSON.stringify({ statut: "REJETEE", dateCloture: new Date().toISOString().split("T")[0] }) },
    "Impossible de rejeter cette demande."
  );
}