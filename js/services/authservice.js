import { API_BASE_URL } from "../config/api.js";
import { apiRequest } from "./apiClient.js";
import { setSession } from "../utils/session.js";

export async function loginUser(email, password) {
  const url = `${API_BASE_URL}/utilisateurs?email=${encodeURIComponent(email)}&password=${encodeURIComponent(password)}`;
  const result = await apiRequest(url, {}, "Erreur de connexion.");

  if (!result || result.length === 0) {
    throw new Error("Identifiants incorrects. Veuillez réessayer.");
  }

  const user = result[0];
  setSession(user);
  return user;
}
