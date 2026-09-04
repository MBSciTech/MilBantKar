const Tesseract = require('tesseract.js');
const path = require('path');

/**
 * Normalizes text to extract numeric amounts.
 * Removes commas, spaces, currency symbols, and corrects common OCR mistakes (e.g., O->0, l->1).
 * @param {string} text - The raw text from OCR.
 * @returns {number[]} - Array of possible numbers found.
 */
function extractAmounts(text) {
  // Common OCR fixes
  let normalizedText = text
    .replace(/O/g, '0')
    .replace(/o/g, '0')
    .replace(/l/g, '1')
    .replace(/I/g, '1');

  // Regex to find potential amounts like 4,999 or 4999.00
  // Looking for numbers often preceded by Rs, INR, ₹, etc., or just numbers with commas/decimals.
  const regex = /(?:rs\.?|inr|₹)?\s*([\d,]+\.?\d*)/gi;
  let match;
  const amounts = [];

  while ((match = regex.exec(normalizedText)) !== null) {
    // Remove commas from the captured group
    const numStr = match[1].replace(/,/g, '');
    const num = parseFloat(numStr);
    if (!isNaN(num)) {
      amounts.push(num);
    }
  }

  return amounts;
}

/**
 * Verifies if the user-entered amount matches the amount found in the image via OCR.
 * @param {string} imagePath - Absolute or relative path to the image.
 * @param {number} expectedAmount - The amount entered by the user.
 * @returns {Promise<{success: boolean, foundAmounts: number[], rawText: string}>}
 */
async function verifyAmountOCR(imagePath, expectedAmount) {
  try {
    const worker = await Tesseract.createWorker('eng');
    
    // We could add preprocessing (grayscale, contrast) here if we use sharp,
    // but tesseract.js handles basic images decently out of the box.
    const result = await worker.recognize(imagePath);
    const rawText = result.data.text;
    
    await worker.terminate();

    const foundAmounts = extractAmounts(rawText);

    // Check if the expected amount is anywhere in the found amounts.
    // Allow small delta for float comparison (just in case, though usually exact)
    const success = foundAmounts.some((amt) => Math.abs(amt - expectedAmount) < 0.01);

    return { success, foundAmounts, rawText };
  } catch (error) {
    console.error('OCR Verification Error:', error);
    return { success: false, foundAmounts: [], rawText: '' };
  }
}

module.exports = {
  verifyAmountOCR,
  extractAmounts
};
