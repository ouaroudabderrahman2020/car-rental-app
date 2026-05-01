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
   * Uploads base64 data to Google Drive via GAS
   */
  async uploadBase64(data: { base64Data: string; fileName: string; contentType: string }): Promise<{ success: boolean; fileUrl?: string; error?: string }> {
    if (!GAS_URL) {
      return { success: false, error: 'GAS_URL not configured.' };
    }

    try {
      await fetch(GAS_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: {
          'Content-Type': 'text/plain',
        },
        body: JSON.stringify({
          action: 'upload_file',
          ...data
        })
      });
      return { success: true, fileUrl: 'Uploaded to Drive' };
    } catch (error) {
      console.error('GAS Upload Error:', error);
      return { success: false, error: 'Communication error with Google Services.' };
    }
  },

  /**
   * Uploads a file to Google Drive via GAS (kept for backward compatibility or direct use)
   */
  async uploadFile(file: File): Promise<{ success: boolean; fileUrl?: string; error?: string }> {
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
          contentType: file.type
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
  async exportData(type: 'reservations' | 'fleet', data: any[]) {
    if (!GAS_URL) {
      return { success: false, error: 'GAS_URL not configured.' };
    }

    const sanitizedData = data.map(item => {
      const newItem = { ...item };
      for (const key in newItem) {
        if (newItem[key] instanceof Date) {
          newItem[key] = newItem[key].toISOString();
        }
      }
      return newItem;
    });

    try {
      await fetch(GAS_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: {
          'Content-Type': 'text/plain',
        },
        body: JSON.stringify({
          action: 'export_data',
          exportType: type,
          payload: sanitizedData
        })
      });
      return { success: true };
    } catch (error) {
      console.error('GAS Export Error:', error);
      return { success: false, error: 'Export failed due to connection issues.' };
    }
  },

  /**
   * Generates a contract from a template via GAS
   */
  async generateContract(reservationData: any) {
    if (!GAS_URL) {
      return { success: false, error: 'GAS_URL not configured.' };
    }

    try {
      await fetch(GAS_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: {
          'Content-Type': 'text/plain',
        },
        body: JSON.stringify({
          action: 'generate_contract',
          reservation: reservationData
        })
      });
      return { success: true };
    } catch (error) {
      console.error('Contract Generation Error:', error);
      return { success: false, error: 'Contract generation failed.' };
    }
  }
};
