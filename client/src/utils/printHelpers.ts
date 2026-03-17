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
  methodePaiement?: string;
  clientInfo?: {
    nom?: string;
    email?: string;
  };
  createdAt?: string;
  montantTotal?: number;
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
               <p style="color: #64748b; margin-top: 8px;">${invoiceData.entreprise?.adresse || 'Adresse de l\'entreprise'}</p>
               <p style="color: #64748b;">${invoiceData.entreprise?.telephone || 'Téléphone non défini'}</p>
            </div>
            <div style="text-align: right;">
               <div class="title" style="font-size: 36px; font-weight: 900; color: #1e293b; letter-spacing: -1px;">FACTURE</div>
               <p style="color: #64748b; font-weight: 600; margin-top: 4px;">Paiement: ${invoiceData.methodePaiement || 'Validé'}</p>
            </div>
          </div>
          
          <div class="info-grid">
            <div class="info-block" style="background: #f8fafc; padding: 20px; border-radius: 12px;">
              <h4>Facturer à</h4>
              <p style="font-size: 18px; font-weight: 800; color: #0f172a; margin-top: 4px;">${invoiceData.clientName || invoiceData.clientInfo?.nom || 'Client de passage'}</p>
            </div>
            <div class="info-block" style="text-align: right; background: #f8fafc; padding: 20px; border-radius: 12px;">
              <h4>Détails de facturation</h4>
              <p style="font-weight: 600; color: #0f172a; margin-top: 4px;">N° Facture: <span style="color: #6366f1;">#${invoiceData.id?.toString().toUpperCase()}</span></p>
              <p style="font-weight: 600; color: #0f172a;">Date: ${new Date(invoiceData.date || invoiceData.createdAt || Date.now()).toLocaleDateString()}</p>
            </div>
          </div>
 
          <table style="margin-bottom: 20px;">
            <thead>
              <tr>
                <th style="border-radius: 8px 0 0 8px;">Désignation de l'article</th>
                <th style="text-align: center;">Quantité</th>
                <th style="text-align: right;">Prix Unitaire</th>
                <th style="text-align: right; border-radius: 0 8px 8px 0;">Total</th>
              </tr>
            </thead>
            <tbody>
              ${(invoiceData.items || []).map((item: any) => `
                <tr>
                  <td style="font-weight: 700; color: #0f172a;">${item.nom}</td>
                  <td style="text-align: center; color: #475569; font-weight: 600;">${item.quantite || item.quantity || 1}</td>
                  <td style="text-align: right; color: #475569; font-weight: 600;">${(item.prixUnitaire || item.prix || 0).toLocaleString()} ${invoiceData.currency}</td>
                  <td style="text-align: right; font-weight: 800; color: #0f172a;">${((item.prixUnitaire || item.prix || 0) * (item.quantite || item.quantity || 1)).toLocaleString()} ${invoiceData.currency}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
 
          <div class="total-section">
            <div class="total-card" style="box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05); border: 1px solid #e2e8f0; border-radius: 16px;">
              <div class="total-row" style="color: #64748b; font-weight: 600;">
                <span>Sous-total HT</span>
                <span>${(invoiceData.montantTotal || invoiceData.total || 0).toLocaleString()} ${invoiceData.currency}</span>
              </div>
              <div class="total-row" style="color: #64748b; font-weight: 600;">
                <span>TVA (0%)</span>
                <span>0 ${invoiceData.currency}</span>
              </div>
              <div class="total-row grand-total" style="background: #1e293b; color: white; margin: 16px -24px -24px; padding: 20px 24px; border-radius: 0 0 16px 16px;">
                <span style="font-size: 16px;">Net à Payer</span>
                <span style="color: #4ade80;">${(invoiceData.montantTotal || invoiceData.total || 0).toLocaleString()} ${invoiceData.currency}</span>
              </div>
            </div>
          </div>
          
          <div style="margin-top: 80px; text-align: center; color: #94a3b8; font-size: 14px; padding-top: 20px; border-top: 2px dashed #e2e8f0;">
            <p style="font-weight: 600; color: #64748b; margin-bottom: 4px;">Merci pour votre confiance !</p>
            <p>Ce document est une preuve d'achat valable.</p>
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
