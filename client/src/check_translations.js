const fs = require('fs');
const path = require('path');

const settingsPath = path.resolve('client/src/pages/Settings.tsx');
const translationsPath = path.resolve('client/src/translations.ts');

const settingsContent = fs.readFileSync(settingsPath, 'utf8');
const translationsContent = fs.readFileSync(translationsPath, 'utf8');

// Parse the file contents using a simpler method: regex matching for keys
// OR clean up translations.ts to be parsed by eval
let cleaned = translationsContent
  .replace('export const translations: Record<string, Record<string, string>> =', '')
  .trim();

if (cleaned.endsWith(';')) {
  cleaned = cleaned.slice(0, -1);
}

let translations;
try {
  translations = eval('(' + cleaned + ')');
} catch (e) {
  console.error('Failed to parse translations.ts using eval:', e);
  process.exit(1);
}

const frKeys = new Set(Object.keys(translations.fr || {}));
const enKeys = new Set(Object.keys(translations.en || {}));

// Find all t('key') or t("key") or t(`key`) in Settings.tsx
const regex = /t\((['"`])(.*?)\1\)/g;
let match;
const keysInSettings = new Set();
while ((match = regex.exec(settingsContent)) !== null) {
  keysInSettings.add(match[2]);
}

console.log('Keys in Settings.tsx:', keysInSettings.size);
console.log('\nMissing keys in translations (FR):');
let missingFr = [];
for (const key of keysInSettings) {
  if (!frKeys.has(key)) {
    missingFr.push(key);
  }
}
console.log(JSON.stringify(missingFr, null, 2));

console.log('\nMissing keys in translations (EN):');
let missingEn = [];
for (const key of keysInSettings) {
  if (!enKeys.has(key)) {
    missingEn.push(key);
  }
}
console.log(JSON.stringify(missingEn, null, 2));
