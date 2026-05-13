const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'client/src/pages/Settings.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// Find and replace lines 271-282 using line-based approach
const lines = content.split('\n');

// Find the fetchSubUsers function start
let startIdx = -1;
let endIdx = -1;
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('const fetchSubUsers = async') && startIdx === -1) {
    startIdx = i;
  }
  if (startIdx !== -1 && i > startIdx && lines[i].trim() === '};') {
    endIdx = i;
    break;
  }
}

console.log(`Found fetchSubUsers at lines ${startIdx + 1} to ${endIdx + 1}`);
console.log('Current block:');
for (let i = startIdx; i <= endIdx; i++) {
  console.log(`  ${i + 1}: ${lines[i]}`);
}

const newBlock = [
  '  const fetchSubUsers = async () => {',
  '    setLoading(true);',
  '    try {',
  '      const { data: resData } = await api.get(`/subusers?_t=${Date.now()}`);',
  '      // Handle standardized API response: { success: true, data: [...] }',
  '      let usersList = [];',
  '      if (resData && resData.success && resData.data) {',
  '        usersList = Array.isArray(resData.data) ? resData.data : [];',
  '      } else if (Array.isArray(resData)) {',
  '        usersList = resData;',
  '      } else if (resData && Array.isArray(resData.data)) {',
  '        usersList = resData.data;',
  '      }',
  "      setSubUsers(usersList);",
  '    } catch (err) {',
  "      toast.error(\"Erreur lors de la récupération de l'équipe\");",
  '      setSubUsers([]);',
  '    } finally {',
  '      setLoading(false);',
  '    }',
  '  };',
];

// Replace lines from startIdx to endIdx
lines.splice(startIdx, endIdx - startIdx + 1, ...newBlock);

fs.writeFileSync(filePath, lines.join('\n'), 'utf8');
console.log('\nSUCCESS: Settings.tsx patched successfully!');
