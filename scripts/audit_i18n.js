const fs = require('fs');
const pages = ['Dashboard', 'Sales', 'Products', 'POS', 'Stats', 'Settings'];

for (const page of pages) {
  try {
    const content = fs.readFileSync('client/src/pages/' + page + '.tsx', 'utf8');
    const tCalls = (content.match(/\bt\(/g) || []).length;
    // Count single-quoted strings with French accented characters
    const frStrings = (content.match(/'[^']{2,80}[éèêëàâùûîïôçÉÈÀÂÙÛÎÏÔÇ][^']{0,80}'/g) || []);
    // Filter out import paths and comments
    const realFr = frStrings.filter(s => !s.includes('/') && !s.includes('var(--') && !s.includes('rgba'));
    console.log(page + '.tsx => t() calls: ' + tCalls + ' | possible FR hardcoded: ' + realFr.length);
    if (realFr.length > 0 && realFr.length <= 10) {
      realFr.forEach(s => console.log('  >> ' + s.substring(0, 70)));
    }
  } catch(e) { console.log(page + '.tsx: ERROR - ' + e.message); }
}
