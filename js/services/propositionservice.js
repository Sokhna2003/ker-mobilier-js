import { API_BASE_URL } from "../config/api.js";
import { apiRequest } from "./apiClient.js";
import { createId } from "../utils/id.js";

export async function getAllPropositions() {
  return apiRequest(`${API_BASE_URL}/propositions`, {}, "Impossible de charger les propositions.");
}

export async function getPropositionsParArtisan(artisanId) {
  const toutes = await getAllPropositions();
  return toutes.filter(p => p.artisanId === artisanId);
}

export async function getPropositionsParDemande(demandeSurMesureId) {
  const toutes = await getAllPropositions();
  return toutes.filter(p => p.demandeSurMesureId === demandeSurMesureId);
}

export async function createProposition(payload) {
  return apiRequest(
    `${API_BASE_URL}/propositions`,
    { method: "POST", body: JSON.stringify({ id: createId("prop"), statut: "EN_ATTENTE", ...payload }) },
    "Impossible d'envoyer votre proposition."
  );
}

// Reservees a la page client (choix du devis) - construites ici pour etre pretes
export async function accepterProposition(id) {
  return apiRequest(
    `${API_BASE_URL}/propositions/${id}`,
    { method: "PATCH", body: JSON.stringify({ statut: "ACCEPTEE" }) },
    "Impossible d'accepter cette proposition."
  );
}

export async function refuserProposition(id) {
  return apiRequest(
    `${API_BASE_URL}/propositions/${id}`,
    { method: "PATCH", body: JSON.stringify({ statut: "REFUSEE" }) },
    "Impossible de refuser cette proposition."
  );
}