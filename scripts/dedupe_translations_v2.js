const fs = require('fs');

const path = 'client/src/translations.ts';
let content = fs.readFileSync(path, 'utf8');

const lines = content.split('\n');
const frKeys = new Set();
const enKeys = new Set();
let currentBlock = null;

const newLines = [];

for (let line of lines) {
    if (line.trim() === 'fr: {') currentBlock = 'fr';
    else if (line.trim() === 'en: {') currentBlock = 'en';
    else if (line.trim() === '};') currentBlock = null;

    // Match both quoted and unquoted keys
    const match = line.match(/^\s*(?:'([^']+)'|"([^"]+)"|([A-Za-z0-9_]+))\s*:/);
    if (match && currentBlock) {
        const key = match[1] || match[2] || match[3];
        if (currentBlock === 'fr') {
            if (frKeys.has(key)) {
                console.log('Skipping duplicate FR:', key);
                continue; 
            }
            frKeys.add(key);
        } else if (currentBlock === 'en') {
            if (enKeys.has(key)) {
                console.log('Skipping duplicate EN:', key);
                continue; 
            }
            enKeys.add(key);
        }
    }
    
    // Check for inline append:  walkInCustomerBtn: 'Walk-in Customer',    'salesFlow': 'Flux des Ventes',
    // It's a hack but it works for this specific mess I made
    if (line.includes('walkInCustomerBtn:') && line.includes('salesFlow')) {
        // Strip the appended part
        line = line.substring(0, line.indexOf(`'salesFlow'`));
    }
    if (line.includes('passwordRequirements:') && line.includes('[EN]')) {
       const matchNoQuote = line.match(/^\s*([^']+)\s*:/);
       if (matchNoQuote) {
            const key = matchNoQuote[1].trim();
            if (currentBlock === 'fr') {
                if (frKeys.has(key)) continue;
                frKeys.add(key);
            } else if (currentBlock === 'en') {
                if (enKeys.has(key)) continue;
                enKeys.add(key);
            }
       }
    }
    
    newLines.push(line);
}

fs.writeFileSync(path, newLines.join('\n'), 'utf8');
console.log('Deduped translations successfully.');
