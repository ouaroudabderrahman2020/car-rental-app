/**
 * Google Apps Script Proxy Utility
 */

const GAS_WEB_APP_URL = import.meta.env.VITE_GAS_WEB_APP_URL || '';

async function callGasAction(action: string, payload: any) {
  if (!GAS_WEB_APP_URL) {
    console.warn('GAS_WEB_APP_URL is not defined. Skipping backend action:', action);
    return { status: 'error', message: 'Backend integration URL missing in environment variables.' };
  }

  try {
    const corsResponse = await fetch(GAS_WEB_APP_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain', // GAS often prefers text/plain to avoid preflight
      },
      body: JSON.stringify({ action, payload }),
    });

    if (!corsResponse.ok) {
      throw new Error(`GAS Error: ${corsResponse.statusText}`);
    }

    const result = await corsResponse.json();
    return result;
  } catch (err) {
    console.error('GAS call failed:', err);
    return { status: 'error', message: err instanceof Error ? err.message : String(err) };
  }
}

/**
 * Legacy wrapper for components expecting gasService patterns
 */
export const gasService = {
  async uploadBase64(fileData: { base64Data: string; fileName: string; contentType: string; category?: string; entityIdentifier?: string }) {
    return this.uploadCarFile({
      base64: fileData.base64Data,
      fileName: fileData.fileName,
      contentType: fileData.contentType,
      plateNumber: fileData.entityIdentifier || 'General'
    });
  },

  async uploadCarFile(fileData: { base64: string; fileName: string; contentType: string; plateNumber: string }) {
    return callGasAction('upload', fileData);
  },

  async updateCarFile(fileData: { oldFileId: string; base64: string; fileName: string; contentType: string; plateNumber: string }) {
    return callGasAction('update', fileData);
  },

  async deleteCarFile(fileId: string) {
    return callGasAction('delete', { fileId });
  },

  // Stubs to avoid breaking other components during testing
  async exportData(...args: any[]) { return { success: true, status: 'disabled', message: 'Export disabled' }; },
  async generateContract(...args: any[]) { return { success: true, status: 'disabled', message: 'Contract generation disabled', error: '' }; }
};
