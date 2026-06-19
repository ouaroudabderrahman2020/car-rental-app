/**
 * Google Apps Script Proxy Utility
 */

const GAS_WEB_APP_URL = import.meta.env.VITE_GAS_WEB_APP_URL || '';

async function callGasAction(action: string, data: any) {
  if (!GAS_WEB_APP_URL) {
    console.warn('GAS_WEB_APP_URL is not defined. Skipping backend action:', action);
    return { status: 'error', message: 'Backend integration URL missing in environment variables.' };
  }

  try {
    if (!GAS_WEB_APP_URL) {
      console.error('VITE_GAS_WEB_APP_URL is missing in environment variables!');
      return { status: 'error', message: 'Server configuration error: Missing GAS URL' };
    }

    const corsResponse = await fetch(GAS_WEB_APP_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain', 
      },
      body: JSON.stringify({ action, ...data }),
    });

    if (!corsResponse.ok) {
      throw new Error(`HTTP error! status: ${corsResponse.status}`);
    }

    const text = await corsResponse.text();
    
    try {
      return JSON.parse(text);
    } catch (e) {
      console.error('Failed to parse GAS response as JSON:', text);
      // If it looks like HTML, it might be a Google Login page or Error page
      if (text.includes('<html')) {
        return { 
          status: 'error', 
          message: 'Server returned HTML instead of JSON. Check if the script is published as "Anyone" and permissions are correct.' 
        };
      }
      return { status: 'error', message: 'Invalid response format from server' };
    }
  } catch (err) {
    console.error('GAS call failed:', err);
    return { status: 'error', message: err instanceof Error ? err.message : String(err) };
  }
}

/**
 * Modern wrapper for components to handle car files and folders
 */
export const gasService = {
  async uploadCarFile(fileData: { base64?: string; base64Data?: string; fileName: string; contentType: string; carFolderName: string; oldCarFolderName?: string; oldFileId?: string }) {
    return callGasAction('uploadCarFile', {
      base64: fileData.base64 || fileData.base64Data,
      fileName: fileData.fileName,
      contentType: fileData.contentType,
      carFolderName: fileData.carFolderName,
      oldCarFolderName: fileData.oldCarFolderName,
      oldFileId: fileData.oldFileId
    });
  },

  async uploadClientFile(fileData: { base64?: string; base64Data?: string; fileName: string; contentType: string; clientFolderName: string; oldClientFolderName?: string; oldFileId?: string }) {
    return callGasAction('uploadClientFile', {
      base64: fileData.base64 || fileData.base64Data,
      fileName: fileData.fileName,
      contentType: fileData.contentType,
      clientFolderName: fileData.clientFolderName,
      oldClientFolderName: fileData.oldClientFolderName,
      oldFileId: fileData.oldFileId
    });
  },

  async renameFolder(oldName: string, newName: string) {
    return callGasAction('renameFolder', { oldName, newName });
  },

  async renameClientFolder(oldName: string, newName: string) {
    return callGasAction('renameClientFolder', { oldName, newName });
  },

  async deleteCarFile(fileId: string) {
    return callGasAction('deleteCarFile', { fileId });
  },

  async deleteCarFolder(carFolderName: string) {
    return callGasAction('deleteCarFolder', { carFolderName });
  },

  async deleteClientFolder(clientFolderName: string) {
    return callGasAction('deleteClientFolder', { clientFolderName });
  },

  async uploadReservationFile(fileData: { base64: string; fileName: string; contentType: string; reservationFolderName: string; oldFileId?: string; oldReservationFolderName?: string }) {
    return callGasAction('uploadReservationFile', {
      base64: fileData.base64,
      fileName: fileData.fileName,
      contentType: fileData.contentType,
      reservationFolderName: fileData.reservationFolderName,
      oldFileId: fileData.oldFileId,
      oldReservationFolderName: fileData.oldReservationFolderName,
    });
  },

  async uploadReservationFiles(files: { base64: string; fileName: string; contentType: string }[], reservationFolderName: string) {
    return callGasAction('uploadReservationFiles', { files, reservationFolderName });
  },

  async renameReservationFolder(oldName: string, newName: string) {
    return callGasAction('renameReservationFolder', { oldName, newName });
  },

  async deleteReservationFiles(fileIds: string[]) {
    return callGasAction('deleteReservationFiles', { fileIds });
  },

  async deleteReservationFolder(reservationFolderName: string) {
    return callGasAction('deleteReservationFolder', { reservationFolderName });
  },

  async deleteCarFiles(fileIds: string[]) {
    return callGasAction('deleteCarFiles', { fileIds });
  },

  async getConfig() {
    return callGasAction('getConfig', {});
  },

  // Legacy stubs
  async updateCarFile(fileData: any) {
    return this.uploadCarFile({
      ...fileData,
      carFolderName: `${fileData.brand} ${fileData.model} ${fileData.plateNumber}`
    });
  },

  async uploadBase64(fileData: any) {
    return this.uploadCarFile({
      base64: fileData.base64Data,
      fileName: fileData.fileName,
      contentType: fileData.contentType,
      carFolderName: 'General Uploads'
    });
  },

  async exportData(...args: any[]) { return { success: true, status: 'disabled', message: 'Export disabled' }; },
  async generateContract(...args: any[]) { return { success: true, status: 'disabled', message: 'Contract generation disabled', error: '' }; }
};

/**
 * Drive URL Helpers
 */

export function getFileIdFromUrl(url?: string) {
  if (!url) return null;
  
  const cleanUrl = url.trim();

  // 1. Direct ID (33+ characters typical, allowing 20+ for safety)
  if (/^[a-zA-Z0-9_-]{20,}$/.test(cleanUrl)) return cleanUrl;

  // 2. Handle drive.google.com/file/d/FILE_ID/...
  if (cleanUrl.includes('/d/')) {
    try {
      const parts = cleanUrl.split('/d/');
      const afterD = parts[parts.length - 1];
      const id = afterD.split('/')[0].split(/[?&#]/)[0];
      if (id) return id;
    } catch (e) {}
  }
  
  // 3. Handle drive.google.com/open?id=ID or similar
  const patterns = [
    /[?&]id=([a-zA-Z0-9_-]{20,})/, 
    /open\?id=([a-zA-Z0-9_-]{20,})/, 
    /uc\?id=([a-zA-Z0-9_-]{20,})/,
    /view\?id=([a-zA-Z0-9_-]{20,})/,
    /folders\/([a-zA-Z0-9_-]{20,})/,
    /docs\.google\.com\/.*\/([a-zA-Z0-9_-]{20,})\//
  ];
  for (const pattern of patterns) {
    const match = cleanUrl.match(pattern);
    if (match && match[1]) return match[1];
  }
  
  // 4. Handle googleusercontent.com/d/FILE_ID
  if (cleanUrl.includes('googleusercontent.com/d/')) {
    try {
      const parts = cleanUrl.split('/d/');
      return parts[parts.length - 1].split(/[/?#=]/)[0];
    } catch (e) {}
  }

  return null;
}

export function getDrivePreviewUrl(url?: string) {
  if (!url) return '';
  if (!url.includes('google')) return url;
  const id = getFileIdFromUrl(url);
  return id ? `https://drive.google.com/file/d/${id}/view` : url;
}

export function getDriveImageUrl(url?: string) {
  if (!url) return '';
  if (url.startsWith('data:')) return url;
  
  const id = getFileIdFromUrl(url);
  if (id) {
    // Try Google's thumbnail API (more reliable cross-origin than lh3)
    return `https://drive.google.com/thumbnail?id=${id}&sz=w800`;
  }
  
  return url;
}

export function getDocUrl(docId?: string) {
  if (!docId) return '';
  return `https://docs.google.com/document/d/${docId}/edit`;
}

export function getSheetUrl(sheetId?: string) {
  if (!sheetId) return '';
  return `https://docs.google.com/spreadsheets/d/${sheetId}/edit`;
}
