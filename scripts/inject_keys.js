const fs = require('fs');
const path = 'client/src/translations.ts';
let content = fs.readFileSync(path, 'utf8');

const dictStr = fs.readFileSync('scripts/migrate_i18n.js', 'utf8');
const dictMatch = dictStr.match(/const dict = ({[\s\S]*?});/);
const enDictMatch = dictStr.match(/const enDict = ({[\s\S]*?});/);

if(dictMatch && enDictMatch) {
  const dict = eval('(' + dictMatch[1] + ')');
  const enDict = eval('(' + enDictMatch[1] + ')');
  
  let frBlockMatch = content.match(/fr:\s*{([\s\S]*?)},\n\s*en:/);
  let enBlockMatch = content.match(/en:\s*{([\s\S]*?)}\n};/);
  
  if (frBlockMatch && enBlockMatch) {
    let frBlock = frBlockMatch[1];
    let enBlock = enBlockMatch[1];
    
    Object.keys(dict).forEach(frText => {
      const key = dict[frText];
      if (!frBlock.includes("'" + key + "':")) {
        frBlock += "\n    '" + key + "': '" + frText.replace(/'/g, "\\'") + "',";
      }
      if (!enBlock.includes("'" + key + "':")) {
        const enText = enDict[key] || frText;
        enBlock += "\n    '" + key + "': '" + enText.replace(/'/g, "\\'") + "',";
      }
    });
    
    content = content.replace(frBlockMatch[1], frBlock);
    content = content.replace(enBlockMatch[1], enBlock);
    
    fs.writeFileSync(path, content, 'utf8');
    console.log('Successfully injected keys into translations.ts');
  } else {
    console.log('Could not match blocks in translations.ts');
  }
}
