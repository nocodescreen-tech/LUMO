export interface InvoiceData {
  id: string | number;
  date: string;
  items: any[];
  total: number;
  currency: string;
  clientName?: string;
  entreprise?: {
    nom?: string;
    adresse?: string;
    telephone?: string;
    email?: string;
  };
}

export const generateInvoice = (data: any, user: any = null) => {
  const invoiceData: InvoiceData = {
    ...data,
    items: data.items || data.articles || [],
    currency: data.currency || (user?.preferences?.currency) || 'FC',
    entreprise: data.entreprise || user?.entreprise
  };
  
  const printWindow = window.open('', '_blank');
  if (!printWindow) return;

  const html = `
    <html>
      <head>
        <title>Facture #${invoiceData.id}</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;800&display=swap');
          body { font-family: 'Plus Jakarta Sans', sans-serif; color: #1e293b; padding: 40px; }
          .invoice-box { max-width: 800px; margin: auto; }
          .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 40px; border-bottom: 2px solid #f1f5f9; padding-bottom: 20px; }
          .logo { font-size: 24px; font-weight: 800; color: #6366f1; }
          .title { font-size: 32px; font-weight: 800; text-align: right; }
          .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-bottom: 40px; }
          .info-block h4 { margin-bottom: 8px; color: #64748b; text-transform: uppercase; font-size: 12px; letter-spacing: 1px; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 40px; }
          th { background: #f8fafc; text-align: left; padding: 12px; color: #64748b; font-size: 13px; font-weight: 600; border-bottom: 1px solid #e2e8f0; }
          td { padding: 16px 12px; border-bottom: 1px solid #f1f5f9; }
          .total-section { display: flex; justify-content: flex-end; }
          .total-card { background: #f8fafc; padding: 24px; border-radius: 12px; width: 300px; }
          .total-row { display: flex; justify-content: space-between; margin-bottom: 8px; }
          .grand-total { font-weight: 800; font-size: 24px; color: #6366f1; margin-top: 16px; border-top: 1px solid #e2e8f0; padding-top: 16px; }
          @media print {
            body { padding: 0; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="invoice-box">
          <div class="header">
            <div>
               <div class="logo">${invoiceData.entreprise?.nom || 'LumoCommerce'}</div>
               <p>${invoiceData.entreprise?.adresse || ''}</p>
               <p>${invoiceData.entreprise?.telephone || ''}</p>
            </div>
            <div class="title">FACTURE</div>
          </div>
          
          <div class="info-grid">
            <div class="info-block">
              <h4>Facturer à</h4>
              <p><strong>${invoiceData.clientName || 'Client de passage'}</strong></p>
            </div>
            <div class="info-block" style="text-align: right;">
              <h4>Détails</h4>
              <p>N° Facture: #${invoiceData.id}</p>
              <p>Date: ${new Date(invoiceData.date || Date.now()).toLocaleDateString()}</p>
            </div>
          </div>
 
          <table>
            <thead>
              <tr>
                <th>Désignation</th>
                <th>Quantité</th>
                <th>Prix Unitaire</th>
                <th style="text-align: right;">Total</th>
              </tr>
            </thead>
            <tbody>
              ${(invoiceData.items || []).map((item: any) => `
                <tr>
                  <td style="font-weight: 600;">${item.nom}</td>
                  <td>${item.quantite}</td>
                  <td>${(item.prix || item.prixUnitaire)?.toLocaleString()} ${invoiceData.currency}</td>
                  <td style="text-align: right; font-weight: 600;">${((item.prix || item.prixUnitaire) * item.quantite).toLocaleString()} ${invoiceData.currency}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
 
          <div class="total-section">
            <div class="total-card">
              <div class="total-row">
                <span>Sous-total</span>
                <span>${(invoiceData.total || 0).toLocaleString()} ${invoiceData.currency}</span>
              </div>
              <div class="total-row">
                <span>Taxe (0%)</span>
                <span>0 ${invoiceData.currency}</span>
              </div>
              <div class="total-row grand-total">
                <span>TOTAL</span>
                <span>${(invoiceData.total || 0).toLocaleString()} ${invoiceData.currency}</span>
              </div>
            </div>
          </div>
          
          <div style="margin-top: 60px; text-align: center; color: #94a3b8; font-size: 14px;">
            Merci pour votre confiance !
          </div>
        </div>
        <script>
          window.onload = () => {
            window.print();
            // window.close();
          };
        </script>
      </body>
    </html>
  `;

  printWindow.document.write(html);
  printWindow.document.close();
};
