// Configuration for the NadaBarkada Fitness Challenge app.
// TODO: Update APP_SCRIPT_URL after each Google Apps Script redeployment.

// Google Apps Script "web app" URL that writes to your Google Sheet.
// Set to null or '' to run in mock/offline mode (uses localStorage).
export const APP_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwzYpnndabkX0jzC51NOnknO4GKUhTqqaMLIjLth3UkfQg-rKR9skzka2Fim8m2p10q8g/exec';

// Challenge dates
export const CHALLENGE_CONFIG = {
  testStartDate: '2026-04-13',      // W-2 test week begins
  baselineStartDate: '2026-04-27',
  challengeStartDate: '2026-05-04',
  challengeEndDate: '2026-05-31',
};

// Admin contact (E.164 format)
export const ADMIN_PHONE_E164 = '+18186539874';

// SMS deep link body for registration
export const ADMIN_SMS_BODY =
  'Hi Jay, can you add me to the NadaBarkada Fitness Challenge? My name is [Your Name].';

// Display timezone for the app
export const APP_TIMEZONE = 'America/Los_Angeles';
