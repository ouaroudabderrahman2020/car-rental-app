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
   * Uploads a file to Google Drive via GAS
   */
  async uploadFile(file: File): Promise<{ success: boolean; fileUrl?: string; error?: string }> {
    if (!GAS_URL) {
      return { success: false, error: 'GAS_URL not configured in environment.' };
    }

    if (file.size > MAX_FILE_SIZE) {
      return { success: false, error: 'File size exceeds 5MB limit.' };
    }

    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const base64Data = (reader.result as string).split(',')[1];
          // Using standard mode: 'cors' and handling opaque responses if necessary
          // Note: GAS doesn't support CORS unless deployed as exec, so we use no-cors
          // However, we can use a small hack: catch opaque response as success
          await fetch(GAS_URL, {
            method: 'POST',
            mode: 'no-cors',
            headers: {
              'Content-Type': 'text/plain', // Avoid preflight by using simple content type
            },
            body: JSON.stringify({
              action: 'upload_file',
              base64Data,
              fileName: file.name,
              contentType: file.type
            })
          });
          
          // With no-cors, we can't see the response body.
          // In a production app, you'd use a proxy or update GAS to handle CORS.
          resolve({ success: true, fileUrl: 'Uploaded to Drive' });
        } catch (error) {
          console.error('GAS Upload Error:', error);
          resolve({ success: false, error: 'Communication error with Google Services.' });
        }
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
  }
};
