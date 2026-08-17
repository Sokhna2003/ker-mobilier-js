import { API_BASE_URL } from "../config/api.js";
import { apiRequest } from "./apiClient.js";
import { createId } from "../utils/id.js";

export async function getAllCommandes() {
  return apiRequest(`${API_BASE_URL}/commandes`, {}, "Impossible de charger les commandes.");
}

export async function getCommandeById(id) {
  return apiRequest(`${API_BASE_URL}/commandes/${id}`, {}, "Impossible de charger cette commande.");
}

export async function getCommandesParClient(clientId) {
  return apiRequest(
    `${API_BASE_URL}/commandes?clientId=${encodeURIComponent(clientId)}`,
    {},
    "Impossible de charger les commandes de ce client."
  );
}

export async function getAllLignesCommande() {
  return apiRequest(`${API_BASE_URL}/lignesCommande`, {}, "Impossible de charger les lignes de commande.");
}

// ---------- Etape 1 : le client valide son panier ----------

export async function creerCommandeAvecLignes(infosCommande, articlesPanier) {
  const montant = articlesPanier.reduce((s, a) => s + a.prix * a.quantite, 0);

  const commande = await apiRequest(
    `${API_BASE_URL}/commandes`,
    {
      method: "POST",
      body: JSON.stringify({
        id: createId("cmd"),
        clientId: infosCommande.clientId,
        dateCommande: new Date().toISOString().split("T")[0],
        montant,
        adresseLivraison: infosCommande.adresseLivraison,
        modePaiement: infosCommande.modePaiement || "",
        referencePaiement: "",
        statut: "EN_ATTENTE"
      })
    },
    "Impossible de créer la commande."
  );

  await Promise.all(articlesPanier.map(a =>
    apiRequest(
      `${API_BASE_URL}/lignesCommande`,
      {
        method: "POST",
        body: JSON.stringify({
          id: createId("lcmd"),
          commandeId: commande.id,
          produitId: a.produitId,
          quantite: a.quantite,
          prix: a.prix
        })
      },
      "Impossible d'enregistrer une ligne de commande."
    )
  ));

  return commande;
}

// ---------- Etape 2-3 : reponse de l'artisan ----------

export async function accepterCommande(id) {
  return apiRequest(
    `${API_BASE_URL}/commandes/${id}`,
    { method: "PATCH", body: JSON.stringify({ statut: "EN_PREPARATION" }) },
    "Impossible d'accepter cette commande."
  );
}

export async function refuserCommande(id) {
  return apiRequest(
    `${API_BASE_URL}/commandes/${id}`,
    { method: "PATCH", body: JSON.stringify({ statut: "REJETEE" }) },
    "Impossible de refuser cette commande."
  );
}

export async function marquerPretALivrer(id) {
  return apiRequest(
    `${API_BASE_URL}/commandes/${id}`,
    { method: "PATCH", body: JSON.stringify({ statut: "PRET_A_LIVRER" }) },
    "Impossible de marquer cette commande comme prête à livrer."
  );
}

// ---------- Etape 4-6 ----------

export async function passerCommandeEnLivraison(id) {
  return apiRequest(
    `${API_BASE_URL}/commandes/${id}`,
    { method: "PATCH", body: JSON.stringify({ statut: "EN_LIVRAISON" }) },
    "Impossible de mettre à jour la commande."
  );
}

export async function terminerCommande(id) {
  return apiRequest(
    `${API_BASE_URL}/commandes/${id}`,
    { method: "PATCH", body: JSON.stringify({ statut: "TERMINEE" }) },
    "Impossible de terminer cette commande."
  );
}