const fs = require('fs');
const path = require('path');

const filepath = path.join(__dirname, '../client/src/translations.ts');
let content = fs.readFileSync(filepath, 'utf8');

// Parse the file string to get the `fr` and `en` blocks
const frMatch = content.match(/fr:\s*\{([\s\S]*?)\},\s*en:/);
const enMatch = content.match(/en:\s*\{([\s\S]*?)\}\s*\};/);

if (!frMatch || !enMatch) {
    console.error("Could not parse translations.ts");
    process.exit(1);
}

const frBlock = frMatch[1];
const enBlock = enMatch[1];

// Function to extract keys and their values
function extractDict(block) {
    const dict = {};
    const regex = /^\s*([a-zA-Z0-9_]+)\s*:\s*(['"`])([\s\S]*?)\2\s*,?/gm;
    let match;
    while ((match = regex.exec(block)) !== null) {
        dict[match[1]] = { quote: match[2], val: match[3], full: match[0] };
    }
    return dict;
}

const frDict = extractDict(frBlock);
const enDict = extractDict(enBlock);

let newFrBlock = frBlock;
let newEnBlock = enBlock;

// Find missing in EN
const missingInEn = Object.keys(frDict).filter(k => !enDict[k]);
// Find missing in FR
const missingInFr = Object.keys(enDict).filter(k => !frDict[k]);

// Also add explicitly requested keys if they don't exist
const explicitKeys = {
    errorLoadingDebts: "Erreur lors du chargement des dettes",
    twoFATitle: "Double Authentification (2FA)",
    twoFAEnabledDesc: "Protégez votre compte avec un code d'accès supplémentaire."
};

let addedToFr = 0;
let addedToEn = 0;

for (const [key, val] of Object.entries(explicitKeys)) {
    if (!frDict[key] && !enDict[key]) {
        // Add to both
        newFrBlock += `\n    ${key}: '${val.replace(/'/g, "\\'")}',`;
        newEnBlock += `\n    ${key}: '[EN] ${val.replace(/'/g, "\\'")}',`;
        addedToFr++;
        addedToEn++;
    }
}

for (const key of missingInEn) {
    const val = frDict[key].val;
    newEnBlock += `\n    ${key}: '[EN] ${val.replace(/'/g, "\\'")}',`;
    addedToEn++;
}

for (const key of missingInFr) {
    const val = enDict[key].val;
    // Remove the [EN] prefix if present when back-porting, though typically not present
    const cleanVal = val.replace(/^\[EN\] /, '');
    newFrBlock += `\n    ${key}: '${cleanVal.replace(/'/g, "\\'")}',`;
    addedToFr++;
}

if (addedToFr > 0 || addedToEn > 0) {
    let newContent = content.replace(frBlock, newFrBlock);
    newContent = newContent.replace(enBlock, newEnBlock);
    fs.writeFileSync(filepath, newContent, 'utf8');
    console.log(`Added ${addedToFr} keys to FR and ${addedToEn} keys to EN.`);
} else {
    console.log('No missing keys found.');
}
