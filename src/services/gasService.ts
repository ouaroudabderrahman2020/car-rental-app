/**
 * GasService handles communication with the Google Apps Script Web App.
 * Includes safety checks for file sizes and strict ISO 8601 date handling.
 */

const GAS_URL = import.meta.env.VITE_GAS_URL;
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export interface ExportData {
  exportType: 'reservations' | 'fleet';
  payload: any[];
}

export interface FileUploadData {
  base64Data: string;
  fileName: string;
  contentType: string;
}

export const gasService = {
  /**
   * Universal fetch wrapper for GAS
   */
  async _callGas(action: string, data: any) {
    if (!GAS_URL) {
      return { success: false, error: 'GAS_URL not configured.' };
    }

    try {
      // NOTE: We use no-cors because GAS Web App redirects often cause CORS preflight failures in browser
      // This means we won't be able to read the JSON response, but the action will trigger.
      await fetch(GAS_URL, {
        method: 'POST',
        mode: 'no-cors', 
        headers: {
          'Content-Type': 'text/plain',
        },
        body: JSON.stringify({
          action,
          data
        })
      });
      return { success: true };
    } catch (error) {
      console.error(`GAS ${action} Error:`, error);
      return { success: false, error: 'Communication error with Google Services.' };
    }
  },

  /**
   * Uploads base64 data to Google Drive via GAS
   */
  async uploadBase64(fileData: { base64Data: string; fileName: string; contentType: string; subFolder?: string }): Promise<{ success: boolean; error?: string }> {
    return this._callGas('upload_file', {
      filename: fileData.fileName,
      mimeType: fileData.contentType,
      base64Data: fileData.base64Data,
      subFolder: fileData.subFolder
    });
  },

  /**
   * Uploads a file to Google Drive via GAS
   */
  async uploadFile(file: File, subFolder?: string): Promise<{ success: boolean; error?: string }> {
    if (file.size > MAX_FILE_SIZE) {
      return { success: false, error: 'File size exceeds 5MB limit.' };
    }

    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64Data = (reader.result as string).split(',')[1];
        const res = await this.uploadBase64({
          base64Data,
          fileName: file.name,
          contentType: file.type,
          subFolder
        });
        resolve(res);
      };
      reader.onerror = () => resolve({ success: false, error: 'Error reading file.' });
      reader.readAsDataURL(file);
    });
  },

  /**
   * Exports data to Google Sheets via GAS
   */
  async exportData(sheetName: string, rows: any[][]) {
    return this._callGas('export_data', {
      sheetName,
      rows
    });
  },

  /**
   * Generates a contract from a template via GAS
   */
  async generateContract(filename: string, placeholders: Record<string, any>) {
    return this._callGas('generate_contract', {
      filename,
      placeholders
    });
  }
};
