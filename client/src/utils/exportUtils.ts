import { useAuthStore } from '../store/useAuthStore';
import { getDisplayAmount, getEffectiveRate } from './currencyHelpers';

const isTauriEnv = () =>
  typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;

// Sauvegarde un Blob : boîte "Enregistrer sous" native dans Tauri, téléchargement classique sur le web.
const saveBlob = async (blob: Blob, fileName: string) => {
  if (isTauriEnv()) {
    const { save } = await import('@tauri-apps/plugin-dialog');
    const { writeFile } = await import('@tauri-apps/plugin-fs');
    const path = await save({
      defaultPath: fileName,
      filters: [
        { name: 'Excel', extensions: ['xls', 'xlsx'] },
        { name: 'Tous les fichiers', extensions: ['*'] },
      ],
    });
    if (!path) return;
    const bytes = new Uint8Array(await blob.arrayBuffer());
    await writeFile(path, bytes);
    return;
  }
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

export const exportToExcel = (data: any[], fileName: string, moduleName: string = 'Rapport') => {
    if (!data || data.length === 0) return;

    const { user, language } = useAuthStore.getState() as any;
    const currency = user?.preferences?.currency || 'USD';
    const shopCurrency = user?.entreprise?.devise || 'CDF';
    const exchangeRate = getEffectiveRate();
    const dateLocale = language === 'en' ? 'en-US' : 'fr-FR';

    const headers = Object.keys(data[0]);

    const headerCells = headers.map(h => '<th class="header">' + h.toUpperCase() + '</th>').join('');

    const bodyRows = data.map((item, i) => {
        const rowClass = i % 2 !== 0 ? 'row-alt' : '';
        const cells = headers.map(h => {
            let val = item[h];
            if (val === null || val === undefined) val = '';

            if (val instanceof Date || (typeof val === 'string' && val.includes('T') && val.includes('Z'))) {
                try { val = new Date(val).toLocaleString(dateLocale); } catch (e) { }
            }

            const isNum = typeof val === 'number';
            let cellClass = isNum ? 'cell-number' : 'cell';

            if (isNum && (
                h.toLowerCase().includes('prix') ||
                h.toLowerCase().includes('total') ||
                h.toLowerCase().includes('dette') ||
                h.toLowerCase().includes('revenu') ||
                h.toLowerCase().includes('montant')
            )) {
                const display = getDisplayAmount(val as number, shopCurrency, currency, exchangeRate);
                val = display.main + ' (\u2248 ' + display.sub + ')';
                cellClass = 'cell';
            }

            return '<td class="' + cellClass + '">' + val + '</td>';
        }).join('');

        return '<tr class="' + rowClass + '">' + cells + '</tr>';
    }).join('');

    const tableHtml = [
        '<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">',
        '<head><meta charset="utf-8"><style>',
        '.title { font-size: 20px; font-weight: bold; color: #ffffff; background-color: #0F4A45; text-align: center; height: 50px; vertical-align: middle; }',
        '.subtitle { font-size: 12px; font-style: italic; color: #64748b; text-align: right; height: 30px; vertical-align: middle; }',
        '.header { font-size: 14px; font-weight: bold; color: #ffffff; background-color: #1e293b; text-align: center; height: 40px; border: 1px solid #cbd5e1; vertical-align: middle; }',
        '.cell { font-size: 12px; border: 1px solid #cbd5e1; text-align: left; height: 25px; vertical-align: middle; padding: 5px; }',
        '.cell-number { font-size: 12px; border: 1px solid #cbd5e1; text-align: right; height: 25px; vertical-align: middle; padding: 5px; }',
        '.row-alt { background-color: #f8fafc; }',
        '</style></head><body><table><thead>',
        '<tr><th class="title" colspan="' + headers.length + '">' + moduleName.toUpperCase() + ' - LUMO ERP</th></tr>',
        '<tr><td class="subtitle" colspan="' + headers.length + '">' + (language === 'en' ? 'Generated on: ' : 'Généré le : ') + new Date().toLocaleString(dateLocale) + '</td></tr>',
        '<tr>' + headerCells + '</tr>',
        '</thead><tbody>',
        bodyRows,
        '</tbody></table></body></html>'
    ].join('');

    const blob = new Blob([tableHtml], { type: 'application/vnd.ms-excel' });
    saveBlob(blob, fileName + '_' + new Date().toISOString().split('T')[0] + '.xls');
};

export const exportMultiSheetExcel = (sheetsData: { name: string, data: any[] }[], fileName: string) => {
    import('xlsx').then(XLSX => {
        const workbook = XLSX.utils.book_new();
        sheetsData.forEach((sheetInfo) => {
            if (!sheetInfo.data || sheetInfo.data.length === 0) return;
            const worksheet = XLSX.utils.json_to_sheet(sheetInfo.data);

            const colWidths = Object.keys(sheetInfo.data[0]).map(key => ({
                wch: Math.max(key.length, ...sheetInfo.data.map(d => (d[key] ? d[key].toString().length : 0))) + 2
            }));
            worksheet['!cols'] = colWidths;

            XLSX.utils.book_append_sheet(workbook, worksheet, sheetInfo.name.substring(0, 31));
        });
        const out = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
        const blob = new Blob([out], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        saveBlob(blob, fileName + '_' + new Date().toISOString().split('T')[0] + '.xlsx');
    });
};
