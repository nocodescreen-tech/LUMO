export const exportToExcel = (data: any[], fileName: string, moduleName: string = 'Rapport') => {
    if (!data || data.length === 0) return;

    const headers = Object.keys(data[0]);
    
    let tableHtml = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
    <head>
        <meta charset="utf-8">
        <style>
            .title { font-size: 20px; font-weight: bold; color: #ffffff; background-color: #4f46e5; text-align: center; height: 50px; vertical-align: middle; }
            .subtitle { font-size: 12px; font-style: italic; color: #64748b; text-align: right; height: 30px; vertical-align: middle; }
            .header { font-size: 14px; font-weight: bold; color: #ffffff; background-color: #1e293b; text-align: center; height: 40px; border: 1px solid #cbd5e1; vertical-align: middle; }
            .cell { font-size: 12px; border: 1px solid #cbd5e1; text-align: left; height: 25px; vertical-align: middle; padding: 5px; }
            .cell-number { font-size: 12px; border: 1px solid #cbd5e1; text-align: right; height: 25px; vertical-align: middle; padding: 5px; }
            .row-alt { background-color: #f8fafc; }
        </style>
    </head>
    <body>
        <table>
            <thead>
              <tr class="header-row">
                <th class="title" colspan="${headers.length}">${moduleName.toUpperCase()} - LUMO ERP</th>
              </tr>
              <tr class="header-row">
                <td class="subtitle" colspan="${headers.length}">Généré le : ${new Date().toLocaleString('fr-FR')}</td>
            </tr>
            <tr>
                ${headers.map(h => `<th class="header">${h.toUpperCase()}</th>`).join('')}
            </tr>
            ${data.map((item, i) => `
            <tr class="${i % 2 !== 0 ? 'row-alt' : ''}">
                ${headers.map(h => {
                    let val = item[h];
                    if (val === null || val === undefined) val = '';
                    // For dates, format nicely
                    if (val instanceof Date || (typeof val === 'string' && val.includes('T') && val.includes('Z'))) {
                        try { val = new Date(val).toLocaleString('fr-FR'); } catch(e){}
                    }
                    const isNum = typeof val === 'number';
                    return `<td class="${isNum ? 'cell-number' : 'cell'}">${val}</td>`;
                }).join('')}
            </tr>
            `).join('')}
        </table>
    </body>
    </html>
    `;

    const blob = new Blob([tableHtml], { type: 'application/vnd.ms-excel' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${fileName}_${new Date().toISOString().split('T')[0]}.xls`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
};

export const exportMultiSheetExcel = (sheetsData: { name: string, data: any[] }[], fileName: string) => {
    // Fallback to xlsx for complex multi-sheet since HTML trick is single sheet
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
        XLSX.writeFile(workbook, `${fileName}_${new Date().toISOString().split('T')[0]}.xlsx`);
    });
};
