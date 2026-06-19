const fs = require('fs');
let content = fs.readFileSync('client/src/pages/Settings.tsx', 'utf8');

// Fix react-dom import
content = content.replace(
  /import \{\s*Lock,\s*createPortal\s*\} from 'react-dom';/,
  "import { createPortal } from 'react-dom';"
);

// Add Lock to lucide-react if missing
if (!content.includes('Lock,') && !content.includes('Lock as')) {
  content = content.replace(
    /import \{\s*User as UserIcon,/,
    "import {\n  Lock,\n  User as UserIcon,"
  );
}

fs.writeFileSync('client/src/pages/Settings.tsx', content, 'utf8');
console.log('Fixed imports in Settings.tsx');
