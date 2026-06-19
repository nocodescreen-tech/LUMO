const fs = require('fs');
let content = fs.readFileSync('client/src/components/common/ConfirmModal.tsx', 'utf8');

if (!content.includes('useTranslation')) {
    content = "import { useTranslation } from '../../hooks/useTranslation';\n" + content;
}

content = content.replace(/confirmText = t\('confirmBtn'\)/g, 'confirmText');
content = content.replace(/cancelText = t\('cancelBtn'\)/g, 'cancelText');

content = content.replace(/(const ConfirmModal: React\.FC<ConfirmModalProps> = \(\{[^}]+\}\) => \{)/s, "$1\n    const { t } = useTranslation();\n    const finalConfirmText = confirmText || t('confirmBtn');\n    const finalCancelText = cancelText || t('cancelBtn');");

content = content.replace(/\{cancelText\}/g, '{finalCancelText}');
content = content.replace(/\{confirmText\}/g, '{finalConfirmText}');

fs.writeFileSync('client/src/components/common/ConfirmModal.tsx', content, 'utf8');
