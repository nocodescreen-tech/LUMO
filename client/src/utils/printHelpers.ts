import { normalizeAmount } from './currencyHelpers';

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
    logo?: string;
  };
  methodePaiement?: string;
  clientInfo?: {
    nom?: string;
    email?: string;
    telephone?: string;
  };
  createdAt?: string;
  montantTotal?: number;
}

const formatCustomDate = (dateValue: any) => {
  const d = new Date(dateValue || Date.now());
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = String(d.getFullYear()).slice(-2);
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `${day}/${month}/${year}, ${hours}:${minutes}`;
};

export const generateInvoice = (data: any, user: any = null) => {
  const shopCurrency = (user?.entreprise?.devise === 'FC' ? 'CDF' : user?.entreprise?.devise) || 'CDF';
  const saleCurrency = data.devise || data.currency || shopCurrency;
  const rate = Number(data?.tauxChange || user?.preferences?.exchangeRate || 2800);
  const storedTotal = Number(data.montantTotal || data.total || 0);
  const displayTotal = normalizeAmount(storedTotal, shopCurrency, saleCurrency, rate);

  const invoiceData: InvoiceData = {
    ...data,
    items: data.items || data.articles || [],
    currency: saleCurrency,
    montantTotal: displayTotal,
    total: displayTotal,
    entreprise: data.entreprise || user?.entreprise
  };
  
  const altCurrency = invoiceData.currency === 'CDF' ? 'USD' : 'CDF';
  const exchangeRate = rate;
  const getAltAmount = (amount: number) => {
    return normalizeAmount(amount, invoiceData.currency, altCurrency, exchangeRate);
  };
  
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert("Le navigateur a bloqué l'ouverture de la facture. Veuillez autoriser les pop-ups pour ce site.");
    return;
  }

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
          .grand-total { font-weight: 800; font-size: 24px; color: #6366f1; margin-top: 16px; border-top: 1px solid #e2e8f0; padding-top: 16px; flex-direction: column; align-items: flex-end; gap: 4px; }
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
               ${invoiceData.entreprise?.logo ? `<img src="${invoiceData.entreprise.logo}" alt="Logo" style="height: 60px; object-fit: contain; margin-bottom: 12px; display: block;">` : `<div class="logo">${invoiceData.entreprise?.nom || 'LumoCommerce'}</div>`}
               <div style="font-weight: 800; font-size: 16px;">${invoiceData.entreprise?.nom || ''}</div>
               <p style="color: #64748b; margin-top: 4px;">${invoiceData.entreprise?.adresse || 'Adresse de l\'entreprise'}</p>
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
              ${invoiceData.clientInfo?.telephone ? `<p style="font-size: 14px; font-weight: 600; color: #64748b; margin-top: 2px;">${invoiceData.clientInfo.telephone}</p>` : ''}
            </div>
            <div class="info-block" style="text-align: right; background: #f8fafc; padding: 20px; border-radius: 12px;">
              <h4>Détails de facturation</h4>
              <p style="font-weight: 600; color: #0f172a; margin-top: 4px;">N° Facture: <span style="color: #6366f1;">#${invoiceData.id?.toString().toUpperCase()}</span></p>
              <p style="font-weight: 600; color: #0f172a;">Date: ${formatCustomDate(invoiceData.date || invoiceData.createdAt || Date.now())}</p>
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
              ${(invoiceData.items || []).map((item: any) => {
                const pu = item.prixUnitaire || item.prix || 0;
                const total = pu * (item.quantite || item.quantity || 1);
                const metadata = item.metadata && typeof item.metadata === 'object' ? item.metadata : null;
                const metadataLines = metadata
                  ? Object.entries(metadata)
                      .filter(([, v]) => v !== null && v !== undefined && String(v).trim() !== '')
                      .map(([k, v]) => `${k}: ${typeof v === 'boolean' ? (v ? 'Oui' : 'Non') : v}`)
                  : [];
                return `
                <tr>
                  <td style="font-weight: 700; color: #0f172a;">
                    ${item.nom}
                    ${metadataLines.length ? `<div style="margin-top: 4px; font-size: 11px; font-weight: 600; color: #64748b;">${metadataLines.join(' • ')}</div>` : ''}
                  </td>
                  <td style="text-align: center; color: #475569; font-weight: 600;">${item.quantite || item.quantity || 1}</td>
                  <td style="text-align: right; color: #475569; font-weight: 600;">
                    ${pu.toLocaleString()} ${invoiceData.currency}<br/>
                    <span style="font-size: 10px; color: #94a3b8;">≈ ${getAltAmount(pu).toLocaleString(undefined, {maximumFractionDigits: 2})} ${altCurrency}</span>
                  </td>
                  <td style="text-align: right; font-weight: 800; color: #0f172a;">
                    ${total.toLocaleString()} ${invoiceData.currency}<br/>
                    <span style="font-size: 11px; color: #94a3b8; font-weight: 600;">≈ ${getAltAmount(total).toLocaleString(undefined, {maximumFractionDigits: 2})} ${altCurrency}</span>
                  </td>
                </tr>
              `;
              }).join('')}
            </tbody>
          </table>
 
          <div class="total-section">
            <div class="total-card" style="box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05); border: 1px solid #e2e8f0; border-radius: 16px;">
              <div class="total-row" style="color: #64748b; font-weight: 600;">
                <span>Sous-total HT</span>
                <span>${(invoiceData.montantTotal || invoiceData.total || 0).toLocaleString()} ${invoiceData.currency}</span>
              </div>
              <div class="total-row grand-total" style="background: #1e293b; color: white; margin: 16px -24px -24px; padding: 20px 24px; border-radius: 0 0 16px 16px;">
                <div style="display: flex; justify-content: space-between; width: 100%; align-items: center;">
                  <span style="font-size: 16px;">Net à Payer</span>
                  <span style="color: #4ade80;">${(invoiceData.montantTotal || invoiceData.total || 0).toLocaleString()} ${invoiceData.currency}</span>
                </div>
                <div style="font-size: 13px; color: #94a3b8; font-weight: 600; text-align: right; width: 100%;">
                  Soit environ ${getAltAmount(invoiceData.montantTotal || invoiceData.total || 0).toLocaleString(undefined, {maximumFractionDigits: 2})} ${altCurrency}
                </div>
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

export const generateTicket = (data: any, user: any = null) => {
  const shopCurrency = (user?.entreprise?.devise === 'FC' ? 'CDF' : user?.entreprise?.devise) || 'CDF';
  const saleCurrency = data.devise || data.currency || shopCurrency;
  const rate = Number(data?.tauxChange || user?.preferences?.exchangeRate || 2800);
  const storedTotal = Number(data.montantTotal || data.total || 0);
  const displayTotal = normalizeAmount(storedTotal, shopCurrency, saleCurrency, rate);

  const ticketData = {
    ...data,
    items: data.items || data.articles || [],
    currency: saleCurrency,
    montantTotal: displayTotal,
    total: displayTotal,
    entreprise: data.entreprise || user?.entreprise
  };

  const altCurrency = ticketData.currency === 'CDF' ? 'USD' : 'CDF';
  const exchangeRate = rate;
  const getAltAmount = (amount: number) => {
    return normalizeAmount(amount, ticketData.currency, altCurrency, exchangeRate);
  };

  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert("Le navigateur a bloqué l'ouverture du document. Veuillez autoriser les pop-ups pour ce site.");
    return;
  }

  const html = `
    <html>
      <head>
        <title>Ticket #${ticketData.id}</title>
        <style>
          @page { margin: 0; }
          body { 
            font-family: 'Courier New', Courier, monospace; 
            width: 80mm; 
            margin: 0; 
            padding: 5mm;
            font-size: 12px;
            color: #000;
          }
          .text-center { text-align: center; }
          .text-right { text-align: right; }
          .bold { font-weight: bold; }
          .header { margin-bottom: 5mm; border-bottom: 1px dashed #000; padding-bottom: 2mm; }
          .logo { font-size: 16px; font-weight: bold; }
          .item-row { display: flex; justify-content: space-between; margin-bottom: 1mm; align-items: flex-start; }
          .separator { border-top: 1px dashed #000; margin: 2mm 0; }
          .total-row { display: flex; justify-content: space-between; font-size: 14px; font-weight: bold; align-items: center; }
          .footer { margin-top: 5mm; font-size: 10px; border-top: 1px dashed #000; padding-top: 2mm; }
          @media print {
            body { width: 80mm; }
          }
        </style>
      </head>
      <body>
        <div class="header text-center">
          ${ticketData.entreprise?.logo ? `<img src="${ticketData.entreprise.logo}" alt="Logo" style="height: 40px; object-fit: contain; margin-bottom: 4mm;">` : `<div class="logo">${ticketData.entreprise?.nom || 'LumoCommerce'}</div>`}
          <div style="font-weight: bold; font-size: 14px;">${ticketData.entreprise?.nom || ''}</div>
          <div>${ticketData.entreprise?.adresse || ''}</div>
          <div>Tel: ${ticketData.entreprise?.telephone || ''}</div>
          <div class="separator"></div>
          <div class="bold">TICKET #${ticketData.id?.toString().toUpperCase()}</div>
          <div>Date: ${formatCustomDate(ticketData.date || ticketData.createdAt || Date.now())}</div>
        </div>

        <div class="items">
          ${(ticketData.items || []).map((item: any) => {
            const pu = item.prixUnitaire || item.prix || 0;
            const total = pu * (item.quantite || item.quantity || 1);
            return `
            <div class="item-row">
              <div style="flex: 2;">${item.nom}</div>
              <div style="flex: 1; text-align: center;">x${item.quantite || item.quantity || 1}</div>
              <div style="flex: 1.5; text-align: right;">
                ${total.toLocaleString()}<br/>
                <span style="font-size: 9px;">(≈${getAltAmount(total).toLocaleString(undefined, {maximumFractionDigits: 2})})</span>
              </div>
            </div>
            `;
          }).join('')}
        </div>

        <div class="separator"></div>
        
        <div class="total-row">
          <span>TOTAL</span>
          <div style="text-align: right;">
            <div>${(ticketData.montantTotal || ticketData.total || 0).toLocaleString()} ${ticketData.currency}</div>
            <div style="font-size: 11px; font-weight: normal; margin-top: 2px;">Soit ≈ ${getAltAmount(ticketData.montantTotal || ticketData.total || 0).toLocaleString(undefined, {maximumFractionDigits: 2})} ${altCurrency}</div>
          </div>
        </div>

        <div class="footer text-center">
          <p>Merci de votre visite !</p>
          <p>A bientôt</p>
          <div style="margin-top: 5mm;">Logiciel LUMO Pro</div>
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
export const generateMonthlyReport = (data: any, user: any, periodLabel: string) => {
  const displayCurrency = user?.preferences?.currency || 'USD';
  const altCurrency = displayCurrency === 'CDF' ? 'USD' : 'CDF';
  const exchangeRate = Number(user?.preferences?.exchangeRate || 2800);
  const baseCurrency = 'CDF';

  const getMainAmount = (amount: number) => {
    return normalizeAmount(amount, baseCurrency, displayCurrency, exchangeRate);
  };
  const getAltAmount = (amount: number) => {
    return normalizeAmount(amount, baseCurrency, altCurrency, exchangeRate);
  };

  const logo = user?.entreprise?.logo;
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert("Le navigateur a bloqué l'ouverture du document. Veuillez autoriser les pop-ups pour ce site.");
    return;
  }

  const html = `
    <html>
      <head>
        <title>Bilan Mensuel - LUMO</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;800&display=swap');
          body { font-family: 'Plus Jakarta Sans', sans-serif; color: #1e293b; padding: 40px; background: #fff; }
          .report-box { max-width: 900px; margin: auto; border: 1px solid #e2e8f0; padding: 40px; border-radius: 20px; }
          .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 40px; }
          .title { font-size: 28px; font-weight: 800; color: #1e293b; }
          .period { background: #f1f5f9; padding: 8px 16px; border-radius: 99px; font-weight: 700; font-size: 14px; color: #6366f1; }
          .stats-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; margin-bottom: 40px; }
          .stat-card { padding: 24px; border-radius: 16px; border: 1px solid #f1f5f9; background: #f8fafc; }
          .stat-label { font-size: 12px; font-weight: 700; color: #64748b; text-transform: uppercase; margin-bottom: 8px; }
          .stat-value { font-size: 24px; font-weight: 800; color: #0f172a; white-space: nowrap; }
          .stat-sub { font-size: 13px; font-weight: 600; color: #94a3b8; margin-top: 4px; white-space: nowrap; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th { text-align: left; padding: 12px; border-bottom: 2px solid #f1f5f9; color: #64748b; font-size: 12px; }
          td { padding: 12px; border-bottom: 1px solid #f1f5f9; font-size: 14px; font-weight: 600; }
          .section-title { font-size: 18px; font-weight: 800; margin-top: 40px; margin-bottom: 16px; display: flex; align-items: center; gap: 10px; }
          .section-title::before { content: ""; width: 4px; height: 18px; background: #6366f1; border-radius: 4px; }
          
          @media print {
            body { padding: 0; margin: 0; background: #fff; color: #000; }
            .report-box { max-width: 100% !important; width: 100% !important; padding: 0 !important; border: none !important; border-radius: 0 !important; box-shadow: none !important; margin: 0 !important; }
            .stat-value { font-size: 20px !important; }
            .stat-sub { font-size: 11px !important; }
            @page { margin: 1.5cm 1.2cm; }
          }
        </style>
      </head>
      <body>
        <div class="report-box">
                    <div style="display: flex; align-items: center; gap: 20px;">
              ${logo ? `<img src="${logo}" alt="Logo" style="height: 60px; object-fit: contain;">` : ''}
              <div>
                <div class="title">Bilan Financier</div>
                <div style="color: #64748b; font-weight: 600; margin-top: 4px;">${user?.entreprise?.nom || 'LUMO Pro'}</div>
              </div>
            </div>
            <div class="period">${periodLabel}</div>
          </div>

          <div class="stats-grid">
            <div class="stat-card">
              <div class="stat-label">Revenus Totaux</div>
              <div class="stat-value" style="color: #10b981;">${getMainAmount(Number(data?.totals?.revenue || 0)).toLocaleString()} ${displayCurrency}</div>
              <div class="stat-sub">≈ ${getAltAmount(Number(data?.totals?.revenue || 0)).toLocaleString(undefined, {maximumFractionDigits: 2})} ${altCurrency}</div>
            </div>
            <div class="stat-card">
              <div class="stat-label">Bénéfice Net</div>
              <div class="stat-value" style="color: #6366f1;">${getMainAmount(Number((data?.totals?.profit ?? data?.totals?.revenue ?? 0))).toLocaleString()} ${displayCurrency}</div>
              <div class="stat-sub">≈ ${getAltAmount(Number((data?.totals?.profit ?? data?.totals?.revenue ?? 0))).toLocaleString(undefined, {maximumFractionDigits: 2})} ${altCurrency}</div>
            </div>
          </div>

          <div class="section-title">Performance Quotidienne</div>
          <table>
            <thead>
              <tr>
                <th style="width: 25%; padding: 12px 6px;">Date</th>
                <th style="width: 37.5%; text-align: right; padding: 12px 6px;">Revenus</th>
                <th style="width: 37.5%; text-align: right; padding: 12px 6px;">Profit</th>
              </tr>
            </thead>
            <tbody>
              ${(data?.periodData || []).map((d: any) => `
                <tr>
                  <td style="padding: 12px 6px; vertical-align: top;">${new Date(d.date).toLocaleDateString()}</td>
                  <td style="text-align: right; padding: 12px 6px; white-space: nowrap; vertical-align: top;">
                    <span style="font-weight: 700;">${getMainAmount(Number(d.revenue)).toLocaleString()} ${displayCurrency}</span><br/>
                    <span style="font-size: 11px; color: #94a3b8; font-weight: 600;">≈ ${getAltAmount(Number(d.revenue)).toLocaleString(undefined, {maximumFractionDigits: 2})} ${altCurrency}</span>
                  </td>
                  <td style="text-align: right; padding: 12px 6px; white-space: nowrap; vertical-align: top; color: ${(d.profit ?? 0) >= 0 ? '#10b981' : '#ef4444'}">
                    <span style="font-weight: 700;">${getMainAmount(Number(d.profit ?? d.revenue ?? 0)).toLocaleString()} ${displayCurrency}</span><br/>
                    <span style="font-size: 11px; color: #94a3b8; font-weight: 600;">≈ ${getAltAmount(Number(d.profit ?? d.revenue ?? 0)).toLocaleString(undefined, {maximumFractionDigits: 2})} ${altCurrency}</span>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <div class="section-title">Top Produits (Ventes)</div>
          <table>
            <thead>
              <tr>
                <th style="width: 50%; padding: 12px 6px;">Produit</th>
                <th style="width: 15%; text-align: center; padding: 12px 6px;">Quantité</th>
                <th style="width: 35%; text-align: right; padding: 12px 6px;">Revenu</th>
              </tr>
            </thead>
            <tbody>
              ${(data?.topProducts || []).map((p: any) => `
                <tr>
                  <td style="padding: 12px 6px; font-weight: 700; color: #0f172a; vertical-align: top;">${p.nom}</td>
                  <td style="text-align: center; padding: 12px 6px; color: #475569; font-weight: 700; vertical-align: top;">${p.quantite}</td>
                  <td style="text-align: right; padding: 12px 6px; white-space: nowrap; vertical-align: top;">
                    <span style="font-weight: 700;">${getMainAmount(Number(p.revenu)).toLocaleString()} ${displayCurrency}</span><br/>
                    <span style="font-size: 11px; color: #94a3b8; font-weight: 600;">≈ ${getAltAmount(Number(p.revenu)).toLocaleString(undefined, {maximumFractionDigits: 2})} ${altCurrency}</span>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <div style="margin-top: 60px; text-align: center; color: #94a3b8; font-size: 12px; border-top: 1px dashed #e2e8f0; padding-top: 20px;">
            Document généré automatiquement par LUMO ERP - ${new Date().toLocaleString('fr-FR', { hour12: false })}
          </div>
        </div>
        <script>
          window.onload = () => { window.print(); };
        </script>
      </body>
    </html>
  `;

  printWindow.document.write(html);
  printWindow.document.close();
};

export const generateCashSessionReport = (session: any, user: any) => {
  const currency = user?.preferences?.currency || 'USD';
  const altCurrency = currency === 'CDF' ? 'USD' : 'CDF';
  const exchangeRate = Number(user?.preferences?.exchangeRate || 2800);
  const getAltAmount = (amount: number) => {
    return normalizeAmount(amount, currency, altCurrency, exchangeRate);
  };

  const logo = user?.entreprise?.logo;
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert("Le navigateur a bloqué l'ouverture du document. Veuillez autoriser les pop-ups pour ce site.");
    return;
  }

  const diff = Number(session.closingBalance) - Number(session.expectedBalance);

  const html = `
    <html>
      <head>
        <title>Rapport de Caisse - Session #${session.id}</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;800&display=swap');
          body { font-family: 'Plus Jakarta Sans', sans-serif; color: #1e293b; padding: 40px; }
          .report-box { max-width: 800px; margin: auto; border: 1px solid #e2e8f0; padding: 40px; border-radius: 24px; }
          .header { text-align: center; margin-bottom: 40px; border-bottom: 2px solid #f1f5f9; padding-bottom: 20px; }
          .stat-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px; }
          .stat-card { background: #f8fafc; padding: 20px; border-radius: 16px; border: 1px solid #f1f5f9; }
          .stat-label { font-size: 11px; font-weight: 800; color: #64748b; text-transform: uppercase; margin-bottom: 5px; }
          .stat-value { font-size: 20px; font-weight: 800; color: #0f172a; }
          .stat-sub { font-size: 12px; font-weight: 600; color: #94a3b8; margin-top: 4px; }
          .detail-row { display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #f1f5f9; font-weight: 600; align-items: center; }
          .total-box { margin-top: 30px; background: #1e293b; color: white; padding: 24px; border-radius: 16px; }
          .diff-box { margin-top: 20px; padding: 16px; border-radius: 12px; text-align: center; font-weight: 800; }
        </style>
      </head>
      <body>
        <div class="report-box">
          <div class="header">
            ${logo ? `<img src="${logo}" alt="Logo" style="height: 50px; object-fit: contain; margin-bottom: 15px; display: block; margin-left: auto; margin-right: auto;">` : ''}
            <h1 style="margin: 0; font-size: 24px; font-weight: 900;">RAPPORT DE CLÔTURE DE CAISSE</h1>
            <p style="color: #64748b; font-weight: 600; margin-top: 8px;">${user?.entreprise?.nom || 'LUMO Pro'}</p>
          </div>

          <div style="margin-bottom: 30px; display: grid; grid-template-columns: 1fr 1fr; gap: 40px;">
            <div>
              <p style="color: #64748b; font-size: 12px; font-weight: 800; text-transform: uppercase;">Informations Session</p>
              <p><b>ID Session:</b> #${session.id}</p>
              <p><b>Ouverture:</b> ${new Date(session.openingTime).toLocaleString('fr-FR', { hour12: false })}</p>
              <p><b>Clôture:</b> ${session.closingTime ? new Date(session.closingTime).toLocaleString('fr-FR', { hour12: false }) : 'En cours'}</p>
            </div>
            <div style="text-align: right;">
              <p style="color: #64748b; font-size: 12px; font-weight: 800; text-transform: uppercase;">Caissier</p>
              <p><b>Nom:</b> ${session.user?.nom || user?.nom || 'Admin'}</p>
            </div>
          </div>

          <div class="stat-grid">
            <div class="stat-card">
              <div class="stat-label">Fond Initial</div>
              <div class="stat-value">${Number(session.openingBalance).toLocaleString()} ${currency}</div>
              <div class="stat-sub">≈ ${getAltAmount(Number(session.openingBalance)).toLocaleString(undefined, {maximumFractionDigits: 2})} ${altCurrency}</div>
            </div>
            <div class="stat-card">
              <div class="stat-label">Ventes (+)</div>
              <div class="stat-value" style="color: #10b981;">${Number(session.totalSales).toLocaleString()} ${currency}</div>
              <div class="stat-sub">≈ ${getAltAmount(Number(session.totalSales)).toLocaleString(undefined, {maximumFractionDigits: 2})} ${altCurrency}</div>
            </div>

          </div>

          <div class="detail-row">
            <span>Solde Théorique (Attendu)</span>
            <div style="text-align: right;">
              <div>${Number(session.expectedBalance).toLocaleString()} ${currency}</div>
              <div style="font-size: 11px; color: #94a3b8; font-weight: normal; margin-top: 2px;">≈ ${getAltAmount(Number(session.expectedBalance)).toLocaleString(undefined, {maximumFractionDigits: 2})} ${altCurrency}</div>
            </div>
          </div>
          <div class="detail-row">
            <span>Solde Réel (Compté)</span>
            <div style="text-align: right;">
              <div>${Number(session.closingBalance || 0).toLocaleString()} ${currency}</div>
              <div style="font-size: 11px; color: #94a3b8; font-weight: normal; margin-top: 2px;">≈ ${getAltAmount(Number(session.closingBalance || 0)).toLocaleString(undefined, {maximumFractionDigits: 2})} ${altCurrency}</div>
            </div>
          </div>

          <div class="diff-box" style="background: ${diff === 0 ? '#f0fdf4' : diff > 0 ? '#f0f9ff' : '#fef2f2'}; color: ${diff === 0 ? '#166534' : diff > 0 ? '#0369a1' : '#991b1b'};">
            ÉCART DE CAISSE: ${diff > 0 ? '+' : ''}${diff.toLocaleString()} ${currency} 
            <span style="font-weight: normal; font-size: 13px;">(≈ ${getAltAmount(diff).toLocaleString(undefined, {maximumFractionDigits: 2})} ${altCurrency})</span>
            <div style="font-size: 12px; font-weight: 600; margin-top: 4px;">
              ${diff === 0 ? 'Caisse parfaitement équilibrée' : diff > 0 ? 'Excédent de caisse' : 'Déficit de caisse'}
            </div>
          </div>

          ${session.note ? `
            <div style="margin-top: 30px; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; background: #f8fafc;">
              <p style="color: #64748b; font-size: 11px; font-weight: 800; text-transform: uppercase; margin-bottom: 8px;">Notes de session</p>
              <p style="margin: 0; font-size: 14px; color: #475569;">${session.note}</p>
            </div>
          ` : ''}

          <div style="margin-top: 60px; display: grid; grid-template-columns: 1fr 1fr; gap: 100px; text-align: center;">
            <div>
              <div style="border-top: 1px solid #000; padding-top: 10px; font-weight: 800; font-size: 12px;">SIGNATURE CAISSIER</div>
            </div>
            <div>
              <div style="border-top: 1px solid #000; padding-top: 10px; font-weight: 800; font-size: 12px;">SIGNATURE RESPONSABLE</div>
            </div>
          </div>
        </div>
        <script>
          window.onload = () => { window.print(); };
        </script>
      </body>
    </html>
  `;

  printWindow.document.write(html);
  printWindow.document.close();
};
