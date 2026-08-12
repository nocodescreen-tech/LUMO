import { normalizeAmount, getDisplayAmount, getEffectiveRate } from './currencyHelpers';
import { openPrintWindow, writeAndPrint } from './printHelpers';

const normalizeCurrency = (currency?: string): 'USD' | 'CDF' => {
  const normalized = String(currency || '').toUpperCase();
  if (normalized === 'FC') return 'CDF';
  return normalized === 'USD' ? 'USD' : 'CDF';
};

/**
 * Générateur de rapports PDF uniformes pour LUMO.
 * Utilise l'impression HTML (aperçu → Enregistrer en PDF) comme les tickets/factures.
 * Design identique pour tous les modules : en-tête enseigne complète (logo, nom,
 * adresse, téléphone, email), titre du rapport, date, tableau, totaux, pied de page.
 */

type Lang = 'fr' | 'en';

export interface ReportColumn {
  key: string;
  label: string;
  align?: 'left' | 'right' | 'center';
  money?: boolean; // formate en double devise (main + sub)
  date?: boolean; // formate en date lisible
}

export interface ReportOptions {
  title: string;
  subtitle?: string;
  user: any;
  columns?: ReportColumn[]; // si absent : colonnes déduites des données
  moneyKeys?: string[]; // clés à traiter comme montants (heuristique)
  totals?: { label: string; value: number; devise?: string }[]; // lignes de totaux
  footerNote?: string;
}

const t = (lang: Lang, fr: string, en: string) => (lang === 'en' ? en : fr);

const esc = (value: any) =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');

const getLang = (user: any): Lang => (user?.preferences?.language === 'en' ? 'en' : 'fr');

const isMoneyKey = (key: string, moneyKeys?: string[]) => {
  const k = key.toLowerCase();
  if (moneyKeys?.some((mk) => mk.toLowerCase() === k)) return true;
  return (
    k.includes('prix') ||
    k.includes('total') ||
    k.includes('montant') ||
    k.includes('dette') ||
    k.includes('revenu') ||
    k.includes('profit') ||
    k.includes('benefice') ||
    k.includes('valeur') ||
    k.includes('cout') ||
    k.includes('cost') ||
    k.includes('price') ||
    k.includes('amount') ||
    k.includes('solde') ||
    k.includes('balance') ||
    k.includes('capital') ||
    k.includes('salaire') ||
    k.includes('salary') ||
    k.includes('commission') ||
    k.includes('gain') ||
    k.includes('perte') ||
    k.includes('loss') ||
    k === 'key' || // Dashboard { Key, Value } — Value est souvent un montant
    k === 'value'
  );
};

const isDateKey = (key: string) => {
  const k = key.toLowerCase();
  return (
    k.includes('date') ||
    k.includes('peremption') ||
    k.includes('expiry') ||
    k.includes('created') ||
    k.includes('cree') ||
    k.includes('updated') ||
    k.includes('modifie')
  );
};

const formatDate = (val: any, lang: Lang) => {
  if (val === null || val === undefined || val === '') return '';
  const d = new Date(val);
  if (Number.isNaN(d.getTime())) return String(val);
  return d.toLocaleString(lang === 'fr' ? 'fr-FR' : 'en-US', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: lang === 'en',
  });
};

// Déduit les colonnes depuis la première ligne de données
const inferColumns = (data: any[]): ReportColumn[] => {
  if (!data?.length) return [];
  return Object.keys(data[0]).map((key) => ({
    key,
    label: key,
    align: isMoneyKey(key) ? 'right' : 'left',
    money: isMoneyKey(key),
    date: isDateKey(key),
  }));
};

const formatCell = (val: any, col: ReportColumn, opts: ReportOptions, lang: Lang, shopCurrency: string, displayCurrency: string, rate: number) => {
  if (val === null || val === undefined || val === '') return '';
  if (col.date) return esc(formatDate(val, lang));
  if (col.money && typeof val === 'number' && Number.isFinite(val)) {
    const display = getDisplayAmount(val, shopCurrency, displayCurrency, rate);
    return `<span class="amt-main">${esc(display.main)}</span><span class="amt-sub">≈ ${esc(display.sub)}</span>`;
  }
  if (typeof val === 'boolean') return val ? (lang === 'fr' ? 'Oui' : 'Yes') : (lang === 'fr' ? 'Non' : 'No');
  return esc(val);
};

export const generateReportPDF = (data: any[], opts: ReportOptions) => {
  const lang = getLang(opts.user);
  const rows = Array.isArray(data) ? data : [];
  if (!rows.length) return;

  const columns = opts.columns && opts.columns.length ? opts.columns : inferColumns(rows);
  const shopCurrency = normalizeCurrency(opts.user?.entreprise?.devise || 'CDF');
  const displayCurrency = normalizeCurrency(opts.user?.preferences?.currency || shopCurrency);
  const rate = getEffectiveRate();
  const entreprise = opts.user?.entreprise || {};

  const printWindow = openPrintWindow(
    lang,
    "Le navigateur a bloqué l'ouverture du rapport. Veuillez autoriser les pop-ups pour ce site.",
    'The browser blocked report opening. Please allow pop-ups for this site.',
  );
  if (!printWindow) return;

  const altCurrency = displayCurrency === 'CDF' ? 'USD' : 'CDF';

  const logo = entreprise.logo
    ? `<img src="${esc(entreprise.logo)}" alt="Logo" style="height:64px;width:64px;object-fit:contain;border-radius:14px;border:1px solid #e2e8f0;padding:6px;background:#fff;"/>`
    : `<div style="width:64px;height:64px;border-radius:14px;background:#155E58;color:#fff;display:flex;align-items:center;justify-content:center;font-weight:900;font-size:24px;">${esc((entreprise.nom || 'L').charAt(0).toUpperCase())}</div>`;

  const headerRows = [
    entreprise.nom && `<div style="font-size:22px;font-weight:900;color:#0f172a;letter-spacing:-0.5px;">${esc(entreprise.nom)}</div>`,
    entreprise.adresse && `<div style="color:#64748b;font-size:13px;font-weight:600;">${esc(entreprise.adresse)}</div>`,
    (entreprise.telephone || opts.user?.telephone) && `<div style="color:#64748b;font-size:13px;font-weight:600;">📞 ${esc(entreprise.telephone || opts.user?.telephone)}</div>`,
    entreprise.email && `<div style="color:#64748b;font-size:13px;font-weight:600;">✉ ${esc(entreprise.email)}</div>`,
  ].filter(Boolean);

  const thead = columns.map((c) => `<th style="text-align:${c.align || 'left'}">${esc(c.label)}</th>`).join('');

  const tbody = rows
    .map((row, i) => {
      const cells = columns
        .map((c) => {
          const val = row[c.key];
          const align = c.align || 'left';
          if (c.money && typeof val === 'number' && Number.isFinite(val)) {
            const display = getDisplayAmount(val, shopCurrency, displayCurrency, rate);
            return `<td style="text-align:right;padding:10px 12px;border-bottom:1px solid #eef2f7;">
              <span style="font-weight:700;color:#0f172a;">${esc(display.main)}</span>
              <span style="display:block;font-size:10px;color:#94a3b8;font-weight:600;">≈ ${esc(display.sub)}</span>
            </td>`;
          }
          if (c.date) {
            return `<td style="text-align:${align};padding:10px 12px;border-bottom:1px solid #eef2f7;color:#475569;font-weight:600;">${esc(formatDate(val, lang))}</td>`;
          }
          const text = val === null || val === undefined ? '' : String(val);
          return `<td style="text-align:${align};padding:10px 12px;border-bottom:1px solid #eef2f7;color:#334155;font-weight:600;">${esc(text)}</td>`;
        })
        .join('');
      return `<tr style="background:${i % 2 === 1 ? '#f8fafc' : '#ffffff'};">${cells}</tr>`;
    })
    .join('');

  const totalsHtml = (opts.totals || [])
    .map((tot) => {
      const display = getDisplayAmount(Number(tot.value) || 0, shopCurrency, displayCurrency, rate);
      return `
        <div style="display:flex;justify-content:space-between;align-items:center;padding:10px 18px;border-bottom:1px solid #e2e8f0;">
          <span style="font-weight:800;color:#475569;font-size:13px;text-transform:uppercase;letter-spacing:0.5px;">${esc(tot.label)}</span>
          <span style="font-weight:900;color:#155E58;font-size:15px;">${esc(display.main)}</span>
        </div>
        <div style="text-align:right;padding:0 18px 8px;font-size:11px;color:#94a3b8;font-weight:600;">≈ ${esc(display.sub)}</div>`;
    })
    .join('');

  const html = `
  <html>
    <head>
      <title>${esc(opts.title)} - ${esc(entreprise.nom || 'LUMO Pro')}</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800;900&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'Plus Jakarta Sans', sans-serif; color: #1e293b; padding: 32px 40px; }
        .report-box { max-width: 900px; margin: auto; }
        .topbar { display: flex; justify-content: space-between; align-items: flex-start; gap: 24px; margin-bottom: 28px; padding-bottom: 24px; border-bottom: 3px solid #155E58; }
        .brand { display: flex; align-items: center; gap: 14px; }
        .brand-info { display: flex; flex-direction: column; gap: 2px; }
        .title-block { text-align: right; }
        .title-block h1 { font-size: 26px; font-weight: 900; color: #0f172a; letter-spacing: -0.5px; }
        .title-block .badge { display: inline-block; margin-top: 6px; background: #155E58; color: #fff; font-size: 11px; font-weight: 800; letter-spacing: 1px; padding: 5px 12px; border-radius: 99px; text-transform: uppercase; }
        .meta { display: flex; justify-content: space-between; align-items: center; margin-bottom: 22px; font-size: 12px; color: #64748b; font-weight: 700; }
        .meta .date { background: #f1f5f9; padding: 6px 14px; border-radius: 99px; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
        th { background: #1e293b; color: #fff; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.6px; padding: 11px 12px; }
        th:first-child { border-radius: 10px 0 0 0; }
        th:last-child { border-radius: 0 10px 0 0; }
        td { font-size: 12.5px; }
        .totals-card { margin-left: auto; width: 340px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 14px; overflow: hidden; margin-bottom: 24px; }
        .totals-title { background: #1e293b; color: #fff; font-weight: 800; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; padding: 10px 18px; }
        .footer { margin-top: 40px; border-top: 2px dashed #e2e8f0; padding-top: 16px; text-align: center; color: #94a3b8; font-size: 12px; font-weight: 600; }
        .footer .brand { justify-content: center; font-weight: 800; color: #64748b; margin-bottom: 4px; }
        @media print {
          body { padding: 0; }
          .report-box { max-width: 100%; }
          @page { margin: 14mm 12mm; }
        }
      </style>
    </head>
    <body>
      <div class="report-box">
        <div class="topbar">
          <div class="brand">
            ${logo}
            <div class="brand-info">
              ${headerRows.join('\n')}
            </div>
          </div>
          <div class="title-block">
            <h1>${esc(opts.title)}</h1>
            <span class="badge">${t(lang, 'Rapport officiel', 'Official Report')}</span>
            ${opts.subtitle ? `<div style="margin-top:8px;font-size:12px;color:#64748b;font-weight:700;">${esc(opts.subtitle)}</div>` : ''}
          </div>
        </div>

        <div class="meta">
          <span>${t(lang, 'Période', 'Period')} : ${esc(opts.subtitle || t(lang, 'Toutes les données', 'All data'))}</span>
          <span class="date">${t(lang, 'Généré le', 'Generated on')} : ${formatDate(new Date(), lang)}</span>
        </div>

        <table>
          <thead><tr>${thead}</tr></thead>
          <tbody>${tbody}</tbody>
        </table>

        ${totalsHtml ? `<div class="totals-card"><div class="totals-title">${t(lang, 'Synthèse', 'Summary')}</div>${totalsHtml}</div>` : ''}

        <div class="footer">
          <div class="brand">${esc(entreprise.nom || 'LUMO Pro')} — ${t(lang, 'Document généré par LUMO ERP', 'Document generated by LUMO ERP')}</div>
          <div>${esc(entreprise.adresse || '')}${entreprise.telephone ? ' · ' + esc(entreprise.telephone) : ''}</div>
          ${opts.footerNote ? `<div style="margin-top:6px;">${esc(opts.footerNote)}</div>` : ''}
        </div>
      </div>
    </body>
  </html>`;

  writeAndPrint(printWindow, html);
};

// Raccourci : rapport simple depuis une liste d'objets (comme exportToExcel avant)
export const exportToPDF = (data: any[], title: string, user: any, opts?: Partial<ReportOptions>) => {
  generateReportPDF(data, {
    title,
    user,
    ...(opts || {}),
  });
};
