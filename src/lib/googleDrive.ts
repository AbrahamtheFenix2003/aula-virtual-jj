import { google } from "googleapis";

// Configuración de autenticación con Service Account
const auth = new google.auth.GoogleAuth({
  credentials: {
    client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
  },
  scopes: ["https://www.googleapis.com/auth/drive.readonly"],
});

// Cliente de Google Drive
export const drive = google.drive({ version: "v3", auth });

// ID de la carpeta raíz de videos
export const DRIVE_FOLDER_ID = process.env.GOOGLE_DRIVE_FOLDER_ID;

/**
 * Obtiene la información de un archivo de Drive
 */
export async function getFileInfo(fileId: string) {
  try {
    const response = await drive.files.get({
      fileId,
      fields: "id, name, mimeType, size, thumbnailLink, videoMediaMetadata",
    });
    return response.data;
  } catch (error) {
    console.error("Error getting file info:", error);
    throw error;
  }
}

/**
 * Obtiene el stream de un video para hacer proxy
 */
export async function getVideoStream(fileId: string) {
  try {
    const response = await drive.files.get(
      { fileId, alt: "media" },
      { responseType: "stream" }
    );
    return response;
  } catch (error) {
    console.error("Error getting video stream:", error);
    throw error;
  }
}

/**
 * Lista los videos de una carpeta
 */
export async function listVideosInFolder(folderId?: string) {
  try {
    const response = await drive.files.list({
      q: `'${folderId || DRIVE_FOLDER_ID}' in parents and mimeType contains 'video/' and trashed = false`,
      fields: "files(id, name, mimeType, size, thumbnailLink, createdTime)",
      orderBy: "createdTime desc",
    });
    return response.data.files || [];
  } catch (error) {
    console.error("Error listing videos:", error);
    throw error;
  }
}

/**
 * Genera URL de thumbnail de Drive
 */
export function getThumbnailUrl(fileId: string, size: number = 320) {
  return `https://drive.google.com/thumbnail?id=${fileId}&sz=w${size}`;
}
