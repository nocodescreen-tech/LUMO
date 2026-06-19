const fs = require('fs');

const fixComponent = (filePath) => {
    let content = fs.readFileSync(filePath, 'utf8');
    content = content.replace(/import \{ useTranslation \} from '\.\.\/hooks\/useTranslation';/g, "import { useTranslation } from '../../hooks/useTranslation';");
    if (!content.includes('const { t } = useTranslation();')) {
        content = content.replace(/(const [A-Za-z0-9_]+: React\.FC<[^>]+> = \([^)]+\) => {)/, "$1\n    const { t } = useTranslation();");
    }
    fs.writeFileSync(filePath, content, 'utf8');
};

fixComponent('client/src/components/common/ConfirmModal.tsx');
fixComponent('client/src/components/common/Modal.tsx');
