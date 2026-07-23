import { API_BASE_URL } from "../config/api.js";
import { apiRequest } from "./apiClient.js";

// Récupère uniquement les comptes actifs (non passés à la corbeille)
export async function getAllUtilisateurs() {
  const tous = await apiRequest(`${API_BASE_URL}/utilisateurs`, {}, "Impossible de charger les utilisateurs.");
  return tous.filter(u => u.supprime !== true);
}

// Artisans "Agréés" (partenaires premium) : ce sont les seuls pour qui l'admin
// peut publier un produit directement en leur nom (cf. Fonctionnalité 1).
export async function getArtisansAgrees() {
  const tous = await getAllUtilisateurs();
  return tous.filter(u => u.role === "artisan" && u.isPremium === true);
}

// Récupère uniquement les comptes mis à la corbeille
export async function getUtilisateursCorbeille() {
  const tous = await apiRequest(`${API_BASE_URL}/utilisateurs`, {}, "Impossible de charger la corbeille.");
  return tous.filter(u => u.supprime === true);
}

export async function getUtilisateurById(id) {
  return apiRequest(`${API_BASE_URL}/utilisateurs/${id}`, {}, "Impossible de charger cet utilisateur.");
}

export async function createUtilisateur(payload) {
  return apiRequest(
    `${API_BASE_URL}/utilisateurs`,
    {
      method: "POST",
      body: JSON.stringify({ ...payload, supprime: false })
    },
    "Impossible de créer cet utilisateur."
  );
}

export async function updateUtilisateur(id, payload) {
  return apiRequest(
    `${API_BASE_URL}/utilisateurs/${id}`,
    {
      method: "PATCH",
      body: JSON.stringify(payload)
    },
    "Impossible de modifier cet utilisateur."
  );
}

// Suppression "douce" : l'utilisateur part à la corbeille, il n'est pas perdu
export async function deplacerUtilisateurVersCorbeille(id) {
  return apiRequest(
    `${API_BASE_URL}/utilisateurs/${id}`,
    {
      method: "PATCH",
      body: JSON.stringify({ supprime: true, dateSuppression: new Date().toISOString() })
    },
    "Impossible de déplacer cet utilisateur vers la corbeille."
  );
}

// Restaure un utilisateur depuis la corbeille
export async function restaurerUtilisateur(id) {
  return apiRequest(
    `${API_BASE_URL}/utilisateurs/${id}`,
    {
      method: "PATCH",
      body: JSON.stringify({ supprime: false, dateSuppression: null })
    },
    "Impossible de restaurer cet utilisateur."
  );
}

// Suppression définitive et irréversible (uniquement depuis la corbeille)
export async function supprimerDefinitivementUtilisateur(id) {
  return apiRequest(
    `${API_BASE_URL}/utilisateurs/${id}`,
    { method: "DELETE" },
    "Impossible de supprimer définitivement cet utilisateur."
  );
}