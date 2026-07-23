import { API_BASE_URL } from "../config/api.js";
import { apiRequest } from "./apiClient.js";
import { setSession } from "../utils/session.js";

export async function loginUser(email, password) {
  const url = `${API_BASE_URL}/utilisateurs?email=${encodeURIComponent(email)}&password=${encodeURIComponent(password)}`;
  const result = await apiRequest(url, {}, "Erreur de connexion.");

  if (!result || result.length === 0) {
    throw new Error("Adresse e-mail ou mot de passe incorrect");
  }

  const user = result[0];  // Extraction de l'utilisateur unique de la liste
  setSession(user);  // Activation de sa session
  return user;
}
