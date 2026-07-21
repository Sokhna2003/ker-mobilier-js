// À REMPLACER par vos vraies valeurs Cloudinary (dashboard Cloudinary > Settings > Upload > Upload presets).
// L'upload preset doit être en mode "Unsigned" pour fonctionner directement depuis le navigateur.

export const CLOUDINARY_CONFIG = {
  cloudName: "dhevj2qfc",
  uploadPreset: "preset_ker_mobilier",
};


export const CLOUDINARY_UPLOAD_URL = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CONFIG.cloudName}/image/upload`;
