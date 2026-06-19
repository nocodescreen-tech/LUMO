const fs = require('fs');

const path = 'client/src/translations.ts';
let content = fs.readFileSync(path, 'utf8');

// The file has two blocks: fr: { ... } and en: { ... }
// We can use a simple line parser to remove duplicate keys from bottom to top.
const lines = content.split('\n');
const frKeys = new Set();
const enKeys = new Set();
let currentBlock = null;

const newLines = [];
// Go bottom up so we keep the first occurrence (which is original) or top down to keep last occurrence.
// Since my script appended at the end, I want to keep the FIRST occurrence (the original one) or delete the duplicates at the end.
// Let's just traverse top down. If we see a key we already saw in this block, we drop the line.

for (let line of lines) {
    if (line.trim() === 'fr: {') currentBlock = 'fr';
    else if (line.trim() === 'en: {') currentBlock = 'en';
    else if (line.trim() === '};') currentBlock = null;

    const match = line.match(/^\s*'([^']+)'\s*:/);
    if (match && currentBlock) {
        const key = match[1];
        if (currentBlock === 'fr') {
            if (frKeys.has(key)) continue; // skip duplicate
            frKeys.add(key);
        } else if (currentBlock === 'en') {
            if (enKeys.has(key)) continue; // skip duplicate
            enKeys.add(key);
        }
    }
    
    // Also skip the weird 'passwordRequirements' line duplicate I made
    if (line.includes('passwordRequirements') && line.includes('[EN]')) {
       // Only keep if not duplicate (handled by above regex if it starts with 'password...:')
       // But it doesn't start with quote. Let's handle manually:
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
console.log('Deduped translations.');
