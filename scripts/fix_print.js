const fs = require('fs');
let content = fs.readFileSync('client/src/utils/printHelpers.ts', 'utf8');
content = content.replace(/t\('walkInClient'\)/g, '"Client de passage"');
content = content.replace(/t\('totalAmount'\)/g, '"Montant Total"');
fs.writeFileSync('client/src/utils/printHelpers.ts', content, 'utf8');
