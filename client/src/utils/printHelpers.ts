import { normalizeAmount } from './currencyHelpers';

type Lang = 'fr' | 'en';

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

const normalizeCurrency = (currency?: string) => {
  const normalized = String(currency || '').toUpperCase();
  if (normalized === 'FC') return 'CDF';
  return normalized === 'USD' ? 'USD' : 'CDF';
};

const isRefundedSale = (data: any) => {
  const status = String(data?.statut || data?.status || '').toLowerCase();
  return status.includes('rembours');
};

const getPrintLanguage = (user: any = null): Lang => {
  // SECURITY: language preference comes from the in-memory user object only
  // (no localStorage fallback — that key is no longer persisted).
  const lang = user?.preferences?.language;
  return lang === 'en' ? 'en' : 'fr';
};

const t = (lang: Lang, fr: string, en: string) => (lang === 'en' ? en : fr);

const esc = (value: any) =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');

const formatPrintDate = (dateValue: any, lang: Lang) => {
  const d = new Date(dateValue || Date.now());
  if (Number.isNaN(d.getTime())) return lang === 'fr' ? 'Date invalide' : 'Invalid date';
  return d.toLocaleString(lang === 'fr' ? 'fr-FR' : 'en-US', {
    day: '2-digit',
    month: '2-digit',
    year: lang === 'fr' ? '2-digit' : 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: lang === 'en',
  });
};

const formatAmount = (amount: number, currency: string) =>
  `${Number(amount || 0).toLocaleString()} ${currency}`;

const formatAltAmount = (amount: number, currency: string) =>
  `${Number(amount || 0).toLocaleString(undefined, { maximumFractionDigits: 2 })} ${currency}`;

const openPrintWindow = (lang: Lang, fr: string, en: string) => {
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert(t(lang, fr, en));
    return null;
  }
  return printWindow;
};

export const generateInvoice = (data: any, user: any = null) => {
  const lang = getPrintLanguage(user);
  try {
    const shopCurrency = normalizeCurrency(user?.entreprise?.devise);
    const saleCurrency = normalizeCurrency(data?.devise || data?.currency || shopCurrency);
    const rate = Number(data?.tauxChange || user?.preferences?.exchangeRate || 2800);
    const storedTotal = Number(data?.montantTotal || data?.total || 0);
    // storedTotal is already in saleCurrency (data.devise). No need to normalize it from shopCurrency!
    const displayTotal = storedTotal;

    const invoiceData: InvoiceData = {
      ...data,
      items: (() => {
        const raw = data?.items || data?.articles || [];
        if (Array.isArray(raw)) return raw;
        if (typeof raw === 'string') {
          try { return JSON.parse(raw); } catch { return []; }
        }
        return [];
      })(),
      currency: saleCurrency,
      montantTotal: displayTotal,
      total: displayTotal,
      entreprise: {
        ...(data?.entreprise || user?.entreprise || {}),
        telephone: data?.entreprise?.telephone || user?.entreprise?.telephone || user?.telephone || '',
      },
    };

    const altCurrency = invoiceData.currency === 'CDF' ? 'USD' : 'CDF';
    const getAltAmount = (amount: number) => normalizeAmount(amount, invoiceData.currency, altCurrency, rate);

    const printWindow = openPrintWindow(
      lang,
      "Le navigateur a bloqué l'ouverture de la facture. Veuillez autoriser les pop-ups pour ce site.",
      'The browser blocked invoice opening. Please allow pop-ups for this site.',
    );
    if (!printWindow) return;

    const companyName = esc(invoiceData.entreprise?.nom || 'LumoCommerce');
    const companyAddress = esc(invoiceData.entreprise?.adresse || t(lang, 'Adresse de l\'entreprise', 'Company address'));
    const companyPhone = esc(invoiceData.entreprise?.telephone || t(lang, 'Téléphone non défini', 'Phone not set'));
    const clientName = esc(invoiceData.clientName || invoiceData.clientInfo?.nom || t(lang, "Client de passage", 'Walk-in customer'));
    const invoiceNumber = esc(invoiceData.id?.toString().toUpperCase());
    const paymentMethod = esc(invoiceData.methodePaiement || t(lang, 'Espèces', 'Cash'));
    const total = Number(invoiceData.montantTotal || invoiceData.total || 0);
    const refunded = isRefundedSale(invoiceData);

    const html = `
      <html>
        <head>
          <title>${t(lang, 'Facture', 'Invoice')} #${invoiceNumber}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;800&display=swap');
            body { font-family: 'Plus Jakarta Sans', sans-serif; color: #1e293b; padding: 40px; }
            .invoice-box { max-width: 800px; margin: auto; }
            .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 40px; border-bottom: 2px solid #f1f5f9; padding-bottom: 20px; }
            .logo { font-size: 24px; font-weight: 800; color: #155E58; }
            .title { font-size: 32px; font-weight: 800; text-align: right; }
            .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-bottom: 40px; }
            .info-block h4 { margin-bottom: 8px; color: #64748b; text-transform: uppercase; font-size: 12px; letter-spacing: 1px; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 40px; }
            th { background: #f8fafc; text-align: left; padding: 12px; color: #64748b; font-size: 13px; font-weight: 600; border-bottom: 1px solid #e2e8f0; }
            td { padding: 16px 12px; border-bottom: 1px solid #f1f5f9; }
            .total-section { display: flex; justify-content: flex-end; }
            .total-card { background: #f8fafc; padding: 24px; border-radius: 12px; width: 300px; }
            .total-row { display: flex; justify-content: space-between; margin-bottom: 8px; }
            .grand-total { font-weight: 800; font-size: 24px; color: #155E58; margin-top: 16px; border-top: 1px solid #e2e8f0; padding-top: 16px; flex-direction: column; align-items: flex-end; gap: 4px; }
            @media print { body { padding: 0; } .no-print { display: none; } }
          </style>
        </head>
        <body>
          <div class="invoice-box">
            <div class="header">
              <div>
                 ${invoiceData.entreprise?.logo ? `<img src="${esc(invoiceData.entreprise.logo)}" alt="Logo" style="height: 60px; object-fit: contain; margin-bottom: 12px; display: block;">` : `<div class="logo">${companyName}</div>`}
                 <div style="font-weight: 800; font-size: 16px;">${companyName}</div>
                 <p style="color: #64748b; margin-top: 4px;">${companyAddress}</p>
                 <p style="color: #64748b;">${companyPhone}</p>
              </div>
              <div style="text-align: right;">
                 <div class="title" style="font-size: 36px; font-weight: 900; color: #1e293b; letter-spacing: -1px;">${t(lang, 'FACTURE', 'INVOICE')}</div>
                 <p style="color: #64748b; font-weight: 600; margin-top: 4px;">${t(lang, 'Paiement', 'Payment')}: ${paymentMethod}</p>
              </div>
            </div>
            ${refunded ? `<div style="background:#fef2f2;color:#b91c1c;text-align:center;padding:12px;border-radius:8px;font-weight:800;margin-bottom:20px;">${t(lang, 'VENTE REMBOURSÉE', 'REFUNDED SALE')}</div>` : ''}
            
            <div class="info-grid">
              <div class="info-block" style="background: #f8fafc; padding: 20px; border-radius: 12px;">
                <h4>${t(lang, 'Facturer à', 'Bill to')}</h4>
                <p style="font-size: 18px; font-weight: 800; color: #0f172a; margin-top: 4px;">${clientName}</p>
                ${invoiceData.clientInfo?.telephone ? `<p style="font-size: 14px; font-weight: 600; color: #64748b; margin-top: 2px;">${esc(invoiceData.clientInfo.telephone)}</p>` : ''}
              </div>
              <div class="info-block" style="text-align: right; background: #f8fafc; padding: 20px; border-radius: 12px;">
                <h4>${t(lang, 'Détails de facturation', 'Billing details')}</h4>
                <p style="font-weight: 600; color: #0f172a; margin-top: 4px;">${t(lang, 'N° Facture', 'Invoice No.')}: <span style="color: #155E58;">#${invoiceNumber}</span></p>
                <p style="font-weight: 600; color: #0f172a;">${t(lang, 'Date', 'Date')}: ${formatPrintDate(invoiceData.date || invoiceData.createdAt || Date.now(), lang)}</p>
              </div>
            </div>
    
            <table style="margin-bottom: 20px;">
              <thead>
                <tr>
                  <th style="border-radius: 8px 0 0 8px;">${t(lang, "Désignation de l'article", 'Description')}</th>
                  <th style="text-align: center;">${t(lang, 'Quantité', 'Quantity')}</th>
                  <th style="text-align: right;">${t(lang, 'Prix Unitaire', 'Unit Price')}</th>
                  <th style="text-align: right; border-radius: 0 8px 8px 0;">${t(lang, 'Total', 'Total')}</th>
                </tr>
              </thead>
              <tbody>
                ${(invoiceData.items || []).map((item: any) => {
                  const pu = Number(item.prixUnitaire || item.prix || 0);
                  const quantity = Number(item.quantite || item.quantity || 1);
                  const total = pu * quantity;
                  const metadata = item.metadata && typeof item.metadata === 'object' ? item.metadata : null;
                  const metadataLines = metadata
                    ? Object.entries(metadata)
                        .filter(([, v]) => v !== null && v !== undefined && String(v).trim() !== '')
                        .map(([k, v]) => `${esc(k)}: ${typeof v === 'boolean' ? (v ? t(lang, 'Oui', 'Yes') : t(lang, 'Non', 'No')) : esc(v)}`)
                    : [];
                  return `
                  <tr>
                    <td style="font-weight: 700; color: #0f172a;">
                      ${esc(item.nom)}
                      ${metadataLines.length ? `<div style="margin-top: 4px; font-size: 11px; font-weight: 600; color: #64748b;">${metadataLines.join(' • ')}</div>` : ''}
                    </td>
                    <td style="text-align: center; color: #475569; font-weight: 600;">${quantity}</td>
                    <td style="text-align: right; color: #475569; font-weight: 600;">
                      ${formatAmount(pu, invoiceData.currency)}<br/>
                      <span style="font-size: 10px; color: #94a3b8;">≈ ${formatAltAmount(getAltAmount(pu), altCurrency)}</span>
                    </td>
                    <td style="text-align: right; font-weight: 800; color: #0f172a;">
                      ${formatAmount(total, invoiceData.currency)}<br/>
                      <span style="font-size: 11px; color: #94a3b8; font-weight: 600;">≈ ${formatAltAmount(getAltAmount(total), altCurrency)}</span>
                    </td>
                  </tr>
                `;
                }).join('')}
              </tbody>
            </table>
    
            <div class="total-section">
              <div class="total-card" style="box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05); border: 1px solid #e2e8f0; border-radius: 16px;">
                <div class="total-row" style="color: #64748b; font-weight: 600;">
                  <span>${t(lang, 'Sous-total', 'Subtotal')}</span>
                  <span>${formatAmount(total, invoiceData.currency)}</span>
                </div>
                <div class="total-row grand-total" style="background: #1e293b; color: white; margin: 16px -24px -24px; padding: 20px 24px; border-radius: 0 0 16px 16px;">
                  <div style="display: flex; justify-content: space-between; width: 100%; align-items: center;">
                    <span style="font-size: 16px;">${t(lang, 'Net à Payer', 'Net to pay')}</span>
                    <span style="color: #4ade80;">${formatAmount(total, invoiceData.currency)}</span>
                  </div>
                  <div style="font-size: 13px; color: #94a3b8; font-weight: 600; text-align: right; width: 100%;">
                    ${t(lang, 'Soit environ', 'Approximately')} ${formatAltAmount(getAltAmount(total), altCurrency)}
                  </div>
                </div>
              </div>
            </div>
            
            <div style="margin-top: 80px; text-align: center; color: #94a3b8; font-size: 14px; padding-top: 20px; border-top: 2px dashed #e2e8f0;">
              <p style="font-weight: 600; color: #64748b; margin-bottom: 4px;">${t(lang, 'Merci pour votre confiance !', 'Thank you for your trust!')}</p>
              <p>${t(lang, "Ce document est une preuve d'achat valable.", 'This document is a valid proof of purchase.')}</p>
            </div>
          </div>
          <script>
            window.onload = () => {
              window.print();
            };
          </script>
        </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
  } catch (error) {
    console.error('Invoice generation error:', error);
    alert(t(lang, 'Une erreur est survenue lors de la génération de la facture.', 'An error occurred while generating the invoice.'));
  }
};

export const generateTicket = (data: any, user: any = null) => {
  const lang = getPrintLanguage(user);
  try {
    const shopCurrency = normalizeCurrency(user?.entreprise?.devise);
    const saleCurrency = normalizeCurrency(data?.devise || data?.currency || shopCurrency);
    const rate = Number(data?.tauxChange || user?.preferences?.exchangeRate || 2800);
    const storedTotal = Number(data?.montantTotal || data?.total || 0);
    // storedTotal is already in saleCurrency (data.devise). No need to normalize it from shopCurrency!
    const displayTotal = storedTotal;

    const ticketData = {
      ...data,
      items: (() => {
        const raw = data?.items || data?.articles || [];
        if (Array.isArray(raw)) return raw;
        if (typeof raw === 'string') {
          try { return JSON.parse(raw); } catch { return []; }
        }
        return [];
      })(),
      currency: saleCurrency,
      montantTotal: displayTotal,
      total: displayTotal,
      entreprise: data?.entreprise || user?.entreprise,
    };

    const altCurrency = ticketData.currency === 'CDF' ? 'USD' : 'CDF';
    const getAltAmount = (amount: number) => normalizeAmount(amount, ticketData.currency, altCurrency, rate);

    const printWindow = openPrintWindow(
      lang,
      "Le navigateur a bloqué l'ouverture du document. Veuillez autoriser les pop-ups pour ce site.",
      'The browser blocked document opening. Please allow pop-ups for this site.',
    );
    if (!printWindow) return;

    const companyName = esc(ticketData.entreprise?.nom || 'LumoCommerce');
    const companyAddress = esc(ticketData.entreprise?.adresse || '');
    const companyPhone = esc(ticketData.entreprise?.telephone || '');
    const ticketNumber = esc(ticketData.id?.toString().toUpperCase());
    const total = Number(ticketData.montantTotal || ticketData.total || 0);
    const clientName = esc(ticketData.clientInfo?.nom || t(lang, "Client de passage", 'Walk-in customer'));
    const paymentMethod = esc(ticketData.methodePaiement || t(lang, 'Espèces', 'Cash'));
    const amountReceived = Number(ticketData.montantRecu || total);
    const changeDue = Math.max(0, amountReceived - total);
    const refunded = isRefundedSale(ticketData);

    const html = `
      <html>
        <head>
          <title>${t(lang, 'Ticket', 'Receipt')} #${ticketNumber}</title>
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
            .bold { font-weight: bold; }
            .header { margin-bottom: 5mm; border-bottom: 1px dashed #000; padding-bottom: 2mm; }
            .logo { font-size: 16px; font-weight: bold; }
            .item-row { display: flex; justify-content: space-between; margin-bottom: 1mm; align-items: flex-start; word-break: break-word; }
            .separator { border-top: 1px dashed #000; margin: 2mm 0; }
            .total-row { display: flex; justify-content: space-between; font-size: 14px; font-weight: bold; align-items: center; }
            .footer { margin-top: 5mm; font-size: 10px; border-top: 1px dashed #000; padding-top: 2mm; }
            @media print { body { width: 80mm; } }
          </style>
        </head>
        <body>
          <div class="header text-center">
            ${ticketData.entreprise?.logo ? `<img src="${esc(ticketData.entreprise.logo)}" alt="Logo" style="height: 40px; object-fit: contain; margin-bottom: 4mm;">` : `<div class="logo">${companyName}</div>`}
            <div style="font-weight: bold; font-size: 14px;">${companyName}</div>
            <div>${companyAddress}</div>
            <div>${companyPhone ? `${t(lang, 'Tel', 'Tel')}: ${companyPhone}` : ''}</div>
            <div class="separator"></div>
            <div class="bold">${t(lang, 'TICKET', 'RECEIPT')} #${ticketNumber}</div>
            <div>${t(lang, 'Date', 'Date')}: ${formatPrintDate(ticketData.date || ticketData.createdAt || Date.now(), lang)}</div>
            <div>${t(lang, 'Client', 'Customer')}: ${clientName}</div>
            <div>${t(lang, 'Paiement', 'Payment')}: ${paymentMethod}</div>
            ${refunded ? `<div style="font-weight:bold;margin-top:2mm;">${t(lang, 'REMBOURSÉ', 'REFUNDED')}</div>` : ''}
          </div>

          <div class="items">
            ${(ticketData.items || []).map((item: any) => {
              const pu = Number(item.prixUnitaire || item.prix || 0);
              const quantity = Number(item.quantite || item.quantity || 1);
              const lineTotal = pu * quantity;
              const metadata = item.metadata && typeof item.metadata === 'object' ? item.metadata : null;
              const metaStr = metadata
                ? Object.entries(metadata).filter(([, v]) => v != null && String(v).trim()).map(([k, v]) => `${esc(k)}:${esc(v)}`).join(' ')
                : '';
              return `
              <div class="item-row">
                <div style="flex: 2;">${esc(item.nom)}${metaStr ? `<br/><span style="font-size:9px;">${metaStr}</span>` : ''}<br/><span style="font-size:9px;">${formatAmount(pu, ticketData.currency)} x${quantity}</span></div>
                <div style="flex: 1.5; text-align: right;">
                  ${formatAmount(lineTotal, ticketData.currency)}<br/>
                  <span style="font-size: 9px;">(≈${formatAltAmount(getAltAmount(lineTotal), altCurrency)})</span>
                </div>
              </div>
              `;
            }).join('')}
          </div>

          <div class="separator"></div>
          
          <div class="total-row">
            <span>${t(lang, 'TOTAL', 'TOTAL')}</span>
            <div style="text-align: right;">
              <div>${formatAmount(total, ticketData.currency)}</div>
              <div style="font-size: 11px; font-weight: normal; margin-top: 2px;">${t(lang, 'Soit ≈', 'Approx.')} ${formatAltAmount(getAltAmount(total), altCurrency)}</div>
            </div>
          </div>
          ${amountReceived > 0 ? `
          <div style="margin-top:2mm;font-size:11px;">
            <div style="display:flex;justify-content:space-between;"><span>${t(lang, 'Montant reçu', 'Amount received')}</span><span>${formatAmount(amountReceived, ticketData.currency)}</span></div>
            <div style="display:flex;justify-content:space-between;font-weight:bold;"><span>${t(lang, 'Monnaie à rendre', 'Change')}</span><span>${formatAmount(changeDue, ticketData.currency)}</span></div>
          </div>` : ''}

          <div class="footer text-center">
            <p>${t(lang, 'Merci de votre visite !', 'Thank you for your visit!')}</p>
            <p>${t(lang, 'A bientôt', 'See you soon')}</p>
            <div style="margin-top: 5mm;">${t(lang, 'Logiciel LUMO Pro', 'LUMO Pro Software')}</div>
          </div>

          <script>
            window.onload = () => {
              window.print();
            };
          </script>
        </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
  } catch (error) {
    console.error('Receipt generation error:', error);
    alert(t(lang, 'Une erreur est survenue lors de la génération du ticket.', 'An error occurred while generating the receipt.'));
  }
};

export const generateMonthlyReport = (data: any, user: any, periodLabel: string) => {
  const lang = getPrintLanguage(user);
  const displayCurrency = normalizeCurrency(user?.preferences?.currency || 'CDF');
  const altCurrency = displayCurrency === 'CDF' ? 'USD' : 'CDF';
  const exchangeRate = Number(user?.preferences?.exchangeRate || 2800);
  const baseCurrency = 'CDF';

  const getMainAmount = (amount: number) => normalizeAmount(amount, baseCurrency, displayCurrency, exchangeRate);
  const getAltAmount = (amount: number) => normalizeAmount(amount, baseCurrency, altCurrency, exchangeRate);

  try {
    const logo = user?.entreprise?.logo;
    const printWindow = openPrintWindow(
      lang,
      "Le navigateur a bloqué l'ouverture du document. Veuillez autoriser les pop-ups pour ce site.",
      'The browser blocked document opening. Please allow pop-ups for this site.',
    );
    if (!printWindow) return;

    const html = `
      <html>
        <head>
          <title>${t(lang, 'Bilan Mensuel - LUMO', 'Monthly Report - LUMO')}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;800&display=swap');
            body { font-family: 'Plus Jakarta Sans', sans-serif; color: #1e293b; padding: 40px; background: #fff; }
            .report-box { max-width: 900px; margin: auto; border: 1px solid #e2e8f0; padding: 40px; border-radius: 20px; }
            .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 40px; }
            .title { font-size: 28px; font-weight: 800; color: #1e293b; }
            .period { background: #f1f5f9; padding: 8px 16px; border-radius: 99px; font-weight: 700; font-size: 14px; color: #155E58; }
            .stats-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; margin-bottom: 40px; }
            .stat-card { padding: 24px; border-radius: 16px; border: 1px solid #f1f5f9; background: #f8fafc; }
            .stat-label { font-size: 12px; font-weight: 700; color: #64748b; text-transform: uppercase; margin-bottom: 8px; }
            .stat-value { font-size: 24px; font-weight: 800; color: #0f172a; white-space: nowrap; }
            .stat-sub { font-size: 13px; font-weight: 600; color: #94a3b8; margin-top: 4px; white-space: nowrap; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th { text-align: left; padding: 12px; border-bottom: 2px solid #f1f5f9; color: #64748b; font-size: 12px; }
            td { padding: 12px; border-bottom: 1px solid #f1f5f9; font-size: 14px; font-weight: 600; }
            .section-title { font-size: 18px; font-weight: 800; margin-top: 40px; margin-bottom: 16px; display: flex; align-items: center; gap: 10px; }
            .section-title::before { content: ""; width: 4px; height: 18px; background: #155E58; border-radius: 4px; }
            
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
              ${logo ? `<img src="${esc(logo)}" alt="Logo" style="height: 60px; object-fit: contain;">` : ''}
              <div>
                <div class="title">${t(lang, 'Bilan Financier', 'Financial Report')}</div>
                <div style="color: #64748b; font-weight: 600; margin-top: 4px;">${esc(user?.entreprise?.nom || 'LUMO Pro')}</div>
              </div>
            </div>
            <div class="period">${esc(periodLabel)}</div>
          </div>

          <div class="stats-grid">
            <div class="stat-card">
              <div class="stat-label">${t(lang, 'Revenus Totaux', 'Total Revenue')}</div>
              <div class="stat-value" style="color: #10b981;">${formatAmount(getMainAmount(Number(data?.totals?.revenue || 0)), displayCurrency)}</div>
              <div class="stat-sub">≈ ${formatAltAmount(getAltAmount(Number(data?.totals?.revenue || 0)), altCurrency)}</div>
            </div>
            <div class="stat-card">
              <div class="stat-label">${t(lang, 'Bénéfice Net', 'Net Profit')}</div>
              <div class="stat-value" style="color: #155E58;">${formatAmount(getMainAmount(Number((data?.totals?.profit ?? data?.totals?.revenue ?? 0))), displayCurrency)}</div>
              <div class="stat-sub">≈ ${formatAltAmount(getAltAmount(Number((data?.totals?.profit ?? data?.totals?.revenue ?? 0))), altCurrency)}</div>
            </div>
          </div>

          <div class="section-title">${t(lang, 'Performance Quotidienne', 'Daily Performance')}</div>
          <table>
            <thead>
              <tr>
                <th style="width: 25%; padding: 12px 6px;">${t(lang, 'Date', 'Date')}</th>
                <th style="width: 37.5%; text-align: right; padding: 12px 6px;">${t(lang, 'Revenus', 'Revenue')}</th>
                <th style="width: 37.5%; text-align: right; padding: 12px 6px;">${t(lang, 'Profit', 'Profit')}</th>
              </tr>
            </thead>
            <tbody>
              ${(data?.periodData || []).map((d: any) => `
                <tr>
                  <td style="padding: 12px 6px; vertical-align: top;">${formatPrintDate(d.date, lang)}</td>
                  <td style="text-align: right; padding: 12px 6px; white-space: nowrap; vertical-align: top;">
                    <span style="font-weight: 700;">${formatAmount(getMainAmount(Number(d.revenue)), displayCurrency)}</span><br/>
                    <span style="font-size: 11px; color: #94a3b8; font-weight: 600;">≈ ${formatAltAmount(getAltAmount(Number(d.revenue)), altCurrency)}</span>
                  </td>
                  <td style="text-align: right; padding: 12px 6px; white-space: nowrap; vertical-align: top; color: ${(d.profit ?? 0) >= 0 ? '#10b981' : '#ef4444'}">
                    <span style="font-weight: 700;">${formatAmount(getMainAmount(Number(d.profit ?? 0)), displayCurrency)}</span><br/>
                    <span style="font-size: 11px; color: #94a3b8; font-weight: 600;">≈ ${formatAltAmount(getAltAmount(Number(d.profit ?? 0)), altCurrency)}</span>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <div class="section-title">${t(lang, 'Top Produits (Ventes)', 'Top Products (Sales)')}</div>
          <table>
            <thead>
              <tr>
                <th style="width: 50%; padding: 12px 6px;">${t(lang, 'Produit', 'Product')}</th>
                <th style="width: 15%; text-align: center; padding: 12px 6px;">${t(lang, 'Quantité', 'Quantity')}</th>
                <th style="width: 35%; text-align: right; padding: 12px 6px;">${t(lang, 'Revenu', 'Revenue')}</th>
              </tr>
            </thead>
            <tbody>
              ${(data?.topProducts || []).map((p: any) => `
                <tr>
                  <td style="padding: 12px 6px; font-weight: 700; color: #0f172a; vertical-align: top;">${esc(p.nom)}</td>
                  <td style="text-align: center; padding: 12px 6px; color: #475569; font-weight: 700; vertical-align: top;">${Number(p.quantite || 0)}</td>
                  <td style="text-align: right; padding: 12px 6px; white-space: nowrap; vertical-align: top;">
                    <span style="font-weight: 700;">${formatAmount(getMainAmount(Number(p.revenu)), displayCurrency)}</span><br/>
                    <span style="font-size: 11px; color: #94a3b8; font-weight: 600;">≈ ${formatAltAmount(getAltAmount(Number(p.revenu)), altCurrency)}</span>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <div style="margin-top: 60px; text-align: center; color: #94a3b8; font-size: 12px; border-top: 1px dashed #e2e8f0; padding-top: 20px;">
            ${t(lang, 'Document généré automatiquement par LUMO ERP', 'Document automatically generated by LUMO ERP')} - ${new Date().toLocaleString(lang === 'fr' ? 'fr-FR' : 'en-US', { hour12: lang === 'en' })}
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
  } catch (error) {
    console.error('Monthly report generation error:', error);
    alert(t(lang, 'Une erreur est survenue lors de la génération du bilan.', 'An error occurred while generating the report.'));
  }
};

export const generateCashSessionReport = (session: any, user: any) => {
  const lang = getPrintLanguage(user);
  try {
    const currency = normalizeCurrency(user?.preferences?.currency || user?.entreprise?.devise || 'CDF');
    const altCurrency = currency === 'CDF' ? 'USD' : 'CDF';
    const exchangeRate = Number(user?.preferences?.exchangeRate || 2800);
    const shopCurrency = normalizeCurrency(user?.entreprise?.devise || 'CDF');

    const formatMain = (amount: number) => {
      const converted = normalizeAmount(amount, shopCurrency, currency, exchangeRate);
      return formatAmount(converted, currency);
    };

    const formatSub = (amount: number) => {
      const converted = normalizeAmount(amount, shopCurrency, altCurrency, exchangeRate);
      return formatAltAmount(converted, altCurrency);
    };

    const printWindow = openPrintWindow(
      lang,
      "Le navigateur a bloqué l'ouverture du document. Veuillez autoriser les pop-ups pour ce site.",
      'The browser blocked document opening. Please allow pop-ups for this site.',
    );
    if (!printWindow) return;

    const diff = Number(session?.closingBalance || 0) - Number(session?.expectedBalance || 0);
    const logo = user?.entreprise?.logo;

    const html = `
      <html>
        <head>
          <title>${t(lang, 'Rapport de Caisse', 'Cash Session Report')} - ${esc(session?.id)}</title>
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
              ${logo ? `<img src="${esc(logo)}" alt="Logo" style="height: 50px; object-fit: contain; margin-bottom: 15px; display: block; margin-left: auto; margin-right: auto;">` : ''}
              <h1 style="margin: 0; font-size: 24px; font-weight: 900;">${t(lang, 'RAPPORT DE CLÔTURE DE CAISSE', 'CASH SESSION CLOSING REPORT')}</h1>
              <p style="color: #64748b; font-weight: 600; margin-top: 8px;">${esc(user?.entreprise?.nom || 'LUMO Pro')}</p>
            </div>

            <div style="margin-bottom: 30px; display: grid; grid-template-columns: 1fr 1fr; gap: 40px;">
              <div>
                <p style="color: #64748b; font-size: 12px; font-weight: 800; text-transform: uppercase;">${t(lang, 'Informations Session', 'Session Information')}</p>
                <p><b>${t(lang, 'ID Session', 'Session ID')}:</b> #${esc(session?.id)}</p>
                <p><b>${t(lang, 'Ouverture', 'Opening')}:</b> ${formatPrintDate(session?.openingTime, lang)}</p>
                <p><b>${t(lang, 'Clôture', 'Closing')}:</b> ${session?.closingTime ? formatPrintDate(session.closingTime, lang) : t(lang, 'En cours', 'Open')}</p>
              </div>
              <div style="text-align: right;">
                <p style="color: #64748b; font-size: 12px; font-weight: 800; text-transform: uppercase;">${t(lang, 'Caissier', 'Cashier')}</p>
                <p><b>${t(lang, 'Nom', 'Name')}:</b> ${esc(session?.user?.nom || user?.nom || 'Admin')}</p>
              </div>
            </div>

            <div class="stat-grid">
              <div class="stat-card">
                <div class="stat-label">${t(lang, 'Fond Initial', 'Opening Balance')}</div>
                <div class="stat-value">${formatMain(Number(session?.openingBalance || 0))}</div>
                <div class="stat-sub">≈ ${formatSub(Number(session?.openingBalance || 0))}</div>
              </div>
              <div class="stat-card">
                <div class="stat-label">${t(lang, 'Ventes (+)', 'Sales (+)')}</div>
                <div class="stat-value" style="color: #10b981;">${formatMain(Number(session?.totalSales || 0))}</div>
                <div class="stat-sub">≈ ${formatSub(Number(session?.totalSales || 0))}</div>
              </div>
            </div>

            <div class="detail-row">
              <span>${t(lang, 'Solde Théorique (Attendu)', 'Expected Balance')}</span>
              <div style="text-align: right;">
                <div>${formatMain(Number(session?.expectedBalance || 0))}</div>
                <div style="font-size: 11px; color: #94a3b8; font-weight: normal; margin-top: 2px;">≈ ${formatSub(Number(session?.expectedBalance || 0))}</div>
              </div>
            </div>
            <div class="detail-row">
              <span>${t(lang, 'Solde Réel (Compté)', 'Counted Balance')}</span>
              <div style="text-align: right;">
                <div>${formatMain(Number(session?.closingBalance || 0))}</div>
                <div style="font-size: 11px; color: #94a3b8; font-weight: normal; margin-top: 2px;">≈ ${formatSub(Number(session?.closingBalance || 0))}</div>
              </div>
            </div>

             ${session?.status === 'CLOSED' || session?.closingTime ? `
               <div class="diff-box" style="background: ${diff === 0 ? '#e6f4ea' : '#fce8e6'}; color: ${diff === 0 ? '#137333' : '#c5221f'}; margin-top: 20px; padding: 16px; border-radius: 12px; text-align: center; font-weight: 800;">
                 ${diff === 0 
                   ? t(lang, 'Session équilibrée (aucun écart)', 'Session balanced (no variance)') 
                   : `${t(lang, 'Écart de caisse :', 'Cash variance:')} ${formatMain(diff)} (≈ ${formatSub(diff)})`}
               </div>
             ` : ''}

            ${session?.note ? `
              <div style="margin-top: 30px; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; background: #f8fafc;">
                <p style="color: #64748b; font-size: 11px; font-weight: 800; text-transform: uppercase; margin-bottom: 8px;">${t(lang, 'Notes de session', 'Session notes')}</p>
                <p style="margin: 0; font-size: 14px; color: #475569;">${esc(session.note)}</p>
              </div>
            ` : ''}

            <div style="margin-top: 60px; display: grid; grid-template-columns: 1fr 1fr; gap: 100px; text-align: center;">
              <div>
                <div style="border-top: 1px solid #000; padding-top: 10px; font-weight: 800; font-size: 12px;">${t(lang, 'SIGNATURE CAISSIER', 'CASHIER SIGNATURE')}</div>
              </div>
              <div>
                <div style="border-top: 1px solid #000; padding-top: 10px; font-weight: 800; font-size: 12px;">${t(lang, 'SIGNATURE RESPONSABLE', 'MANAGER SIGNATURE')}</div>
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
  } catch (error) {
    console.error('Cash report generation error:', error);
    alert(t(lang, 'Une erreur est survenue lors de la génération du rapport de caisse.', 'An error occurred while generating the cash report.'));
  }
};
