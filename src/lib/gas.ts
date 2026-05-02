/**
 * Google Apps Script Proxy Utility
 */

const GAS_WEB_APP_URL = import.meta.env.VITE_GAS_WEB_APP_URL || '';

export async function callGasAction(action: string, payload: any) {
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
    return callGasAction('upload_to_drive', {
      base64Data: fileData.base64Data,
      fileName: fileData.fileName,
      contentType: fileData.contentType,
      category: fileData.category,
      entityIdentifier: fileData.entityIdentifier
    });
  },

  async exportData(sheetName: string, rows: any[][]) {
    return callGasAction('sync_to_sheet', {
      reservations: rows.map(row => ({
        id: row[0],
        customer_name: row[1],
        car: { brand: row[2], model: '' }, // Shim for existing export pattern
        start_date: row[3],
        end_date: row[4],
        total_price: row[5],
        status: row[6]
      }))
    });
  },

  async generateContract(filename: string, placeholders: any) {
    return callGasAction('generate_contract', {
      reservation: { id: filename, ...placeholders },
      customer: { name: placeholders.customer_name, phone: placeholders.customer_phone },
      car: { brand: placeholders.car_brand, model: placeholders.car_model, plate: placeholders.license_plate }
    });
  }
};
