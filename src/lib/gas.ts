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
    const response = await fetch(GAS_WEB_APP_URL, {
      method: 'POST',
      mode: 'no-cors', // GAS Web Apps often require no-cors or redirect handling
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ action, payload }),
    });

    // Note: with 'no-cors', we can't read the response body directly in some environments.
    // However, if the GAS script is set to allow CORS or we use a different approach, we can.
    // For AI Studio apps, we'll try standard fetch first.
    
    // If we need the result (like Drive URLs), standard fetch with proper CORS is better.
    // Re-trying with standard fetch:
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

    return await corsResponse.json();
  } catch (err) {
    console.error('GAS call failed:', err);
    throw err;
  }
}
