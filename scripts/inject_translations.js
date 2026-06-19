const fs = require('fs');
const path = 'client/src/translations.ts';
let content = fs.readFileSync(path, 'utf8');

const dictStr = fs.readFileSync('scripts/migrate_i18n.js', 'utf8');
const dictMatch = dictStr.match(/const dict = ({[\s\S]*?});/);
const enDictMatch = dictStr.match(/const enDict = ({[\s\S]*?});/);

if(dictMatch && enDictMatch) {
  const dict = eval('(' + dictMatch[1] + ')');
  const enDict = eval('(' + enDictMatch[1] + ')');
  
  let newFrLines = [];
  let newEnLines = [];
  
  Object.keys(dict).forEach(frText => {
      const key = dict[frText];
      if (!content.includes("'" + key + "':")) {
          newFrLines.push("    '" + key + "': '" + frText.replace(/'/g, "\\'") + "',");
          newEnLines.push("    '" + key + "': '" + (enDict[key] || frText).replace(/'/g, "\\'") + "',");
      }
  });
  
  if (newFrLines.length > 0) {
      const frEndIndex = content.indexOf('  en: {');
      if (frEndIndex !== -1) {
          content = content.substring(0, frEndIndex - 4) + newFrLines.join('\n') + '\n  },\n  en: {' + content.substring(frEndIndex + 7);
          
          const enEndIndex = content.lastIndexOf('};');
          content = content.substring(0, enEndIndex - 1) + '\n' + newEnLines.join('\n') + '\n};';
          
          fs.writeFileSync(path, content, 'utf8');
          console.log('Successfully injected ' + newFrLines.length + ' keys into translations.ts');
      }
  } else {
      console.log('No new keys to inject.');
  }
}
