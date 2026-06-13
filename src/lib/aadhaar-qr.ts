/**
 * Client-side Aadhaar QR scanning and parsing utilities.
 * Attempts BarcodeDetector API first (Chrome/Edge/Android), then falls back
 * to html5-qrcode scanFile.  Parses old XML-format QR data into structured fields.
 */
import type { AadhaarParsedResult } from './clamflow-api';

/**
 * Decode a QR code from an image File using available browser APIs.
 * Returns the raw decoded string, or null if nothing was detected.
 */
export async function scanQRFromImageFile(file: File): Promise<string | null> {
  // Method 1: BarcodeDetector (Chrome 83+, Edge 83+, Android Chrome)
  if (typeof window !== 'undefined' && 'BarcodeDetector' in window) {
    try {
      const detector = new (window as any).BarcodeDetector({ formats: ['qr_code'] });
      const bitmap = await createImageBitmap(file);
      const barcodes: any[] = await detector.detect(bitmap);
      if (barcodes.length > 0) return barcodes[0].rawValue as string;
    } catch {
      // fall through to next method
    }
  }

  // Method 2: html5-qrcode scanFile (all modern browsers via canvas)
  try {
    const { Html5Qrcode } = await import('html5-qrcode');
    // Html5Qrcode requires a real DOM element — create a hidden one, use it, then remove it
    const container = document.createElement('div');
    container.id = '_aadhaar_qr_tmp';
    container.style.display = 'none';
    document.body.appendChild(container);
    try {
      const scanner = new Html5Qrcode('_aadhaar_qr_tmp', { verbose: false });
      const text = await scanner.scanFile(file, /* showImage */ false);
      scanner.clear();
      return text;
    } finally {
      document.body.removeChild(container);
    }
  } catch {
    return null;
  }
}

/**
 * Parse old-format Aadhaar QR XML into structured AadhaarParsedResult.
 * Returns null for new Secure QR binary format (can't be parsed in browser).
 */
export function parseAadhaarXML(text: string): AadhaarParsedResult | null {
  if (!text?.trim().startsWith('<')) return null;
  try {
    const doc = new DOMParser().parseFromString(text, 'text/xml');
    const uidData = doc.querySelector('UidData');
    if (!uidData) return null;

    const poi = uidData.querySelector('Poi');
    const poa = uidData.querySelector('Poa');

    const uid     = poi?.getAttribute('uid')    ?? uidData.getAttribute('uid')    ?? undefined;
    const name    = poi?.getAttribute('name')   ?? uidData.getAttribute('name')   ?? undefined;
    const dob     = poi?.getAttribute('dob')    ?? uidData.getAttribute('dob')    ?? undefined;
    const gender  = poi?.getAttribute('gender') ?? uidData.getAttribute('gender') ?? undefined;

    const addrParts = poa
      ? [poa.getAttribute('house'), poa.getAttribute('street'), poa.getAttribute('lm'),
         poa.getAttribute('loc'),   poa.getAttribute('vtc'),    poa.getAttribute('po'),
         poa.getAttribute('subdist'), poa.getAttribute('dist'), poa.getAttribute('state')]
      : [uidData.getAttribute('co'),   uidData.getAttribute('house'), uidData.getAttribute('street'),
         uidData.getAttribute('lm'),   uidData.getAttribute('loc'),   uidData.getAttribute('vtc'),
         uidData.getAttribute('po'),   uidData.getAttribute('dist'),  uidData.getAttribute('state')];

    const pincode  = poa?.getAttribute('pc')    ?? uidData.getAttribute('pc')    ?? undefined;
    const state    = poa?.getAttribute('state') ?? uidData.getAttribute('state') ?? undefined;
    const district = poa?.getAttribute('dist')  ?? uidData.getAttribute('dist')  ?? undefined;
    const address  = addrParts.filter(Boolean).join(', ') || undefined;

    if (!uid && !name) return null;
    return { uid, name, dob, gender, address, pincode, state, district, rawText: text };
  } catch {
    return null;
  }
}
