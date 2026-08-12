import { API_BASE_URL } from "../config/api.js";
import { apiRequest } from "./apiClient.js";
import { createId } from "../utils/id.js";
import { passerCommandeEnLivraison, terminerCommande } from "./commandeservice.js";

export async function getAllLivraisons() {
  return apiRequest(`${API_BASE_URL}/livraisons`, {}, "Impossible de charger les livraisons.");
}

export async function getLivraisonParCommande(commandeId) {
  const toutes = await getAllLivraisons();
  return toutes.find(l => l.commandeId === commandeId) || null;
}

// ---------- Etape 4 : l'admin assigne un livreur a une commande PRET_A_LIVRER ----------

export async function assignerLivreur(commandeId, livreurId) {
  const livraison = await apiRequest(
    `${API_BASE_URL}/livraisons`,
    {
      method: "POST",
      body: JSON.stringify({
        id: createId("livr"),
        commandeId,
        livreurId,
        dateLivraison: new Date().toISOString().split("T")[0],
        dateRecuperation: null,
        dateLivree: null,
        statut: "ATTRIBUEE"
      })
    },
    "Impossible d'assigner ce livreur."
  );

  // La commande avance dans le cycle des qu'un livreur lui est attribue
  await passerCommandeEnLivraison(commandeId);

  return livraison;
}

// ---------- Etape 5 : le livreur accepte et recupere le meuble ----------

export async function accepterLivraison(id) {
  return apiRequest(
    `${API_BASE_URL}/livraisons/${id}`,
    {
      method: "PATCH",
      body: JSON.stringify({ statut: "EN_LIVRAISON", dateRecuperation: new Date().toISOString().split("T")[0] })
    },
    "Impossible d'accepter cette livraison."
  );
}

// ---------- Etape 6 : livraison effectuee ----------

export async function marquerLivraisonEffectuee(id, commandeId) {
  await apiRequest(
    `${API_BASE_URL}/livraisons/${id}`,
    {
      method: "PATCH",
      body: JSON.stringify({ statut: "LIVREE", dateLivree: new Date().toISOString().split("T")[0] })
    },
    "Impossible de finaliser cette livraison."
  );

  // La commande devient TERMINEE en meme temps (cf. scenario)
  await terminerCommande(commandeId);
}