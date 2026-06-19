const fs = require('fs');

const path = 'client/src/translations.ts';
let content = fs.readFileSync(path, 'utf8');

// Map of key -> proper English translation
const properTranslations = {
  // === AUTH - LOGIN ===
  loginTitle: 'Sign in to your business',
  loginEmail: 'Email',
  loginPassword: 'Password',
  loginForgot: 'Forgot?',
  loginSubmit: 'Access my store',
  loginLoading: 'Signing in...',
  loginNoAccount: "Need access?",
  loginStart: 'Get started now',
  login2faTitle: 'Two-step verification',
  login2faSubtitle: 'Code sent to your email',
  login2faValid: 'Valid for 10 minutes',
  login2faCode: '6-digit code',
  login2faSubmit: 'Confirm access',
  login2faBack: 'Back to login',

  // === AUTH - REGISTER ===
  registerTitle: 'Launch your Business',
  registerSubtitle: 'Quick setup for unlimited management.',
  registerStep1: 'What is your business type?',
  registerStep2Title: 'Owner Identity',
  registerStep2Sub: 'This information is needed to secure your access.',
  registerStep3Title: 'Business Details',
  registerStep3Sub: 'Finalize your store profile.',
  registerNext: 'Next',
  registerBack: 'Back',
  registerFinish: 'Create my Account',
  registerLoading: 'Creating account...',
  registerHaveAccount: 'Already a Lumo partner?',
  registerLogin: 'Sign in here',
  registerFullName: 'Full Name',
  registerEmail: 'Professional Email',
  registerPhone: 'Phone',
  registerPassword: 'Password',
  registerCompanyName: "Store / Business Name",
  registerCurrency: 'Currency',
  registerExchangeRate: 'USD -> CDF Rate',
  registerCity: 'City',

  // === AUTH - FORGOT PASSWORD ===
  forgotTitle: 'Account Recovery',
  forgotSubtitle: 'Enter your email to receive a reset code.',
  forgotEmail: 'Professional email',
  forgotSubmit: 'Send code',
  forgotLoading: 'Sending...',
  forgotBack: 'Back to login',
  forgotSuccess: 'Code sent! Check your inbox.',

  // === AUTH - VERIFY ===
  verifyTitle: 'Verification',
  verifySubtitle: 'A 6-digit code has been sent to',
  verifySubmit: 'Continue to Lumo',
  verifyLoading: 'Verifying...',
  verifyResend: 'Resend a new code',

  // === PLACEHOLDERS ===
  phEmail: 'your@email.com',
  phEmailReg: 'john@business.com',
  phEmailForgot: 'name@company.com',
  phName: 'E.g. John Smith',
  phPhone: '000 000 000',
  phPassword: 'Min. 8 characters',
  phCompany: "E.g. The Elegance Store",
  phRate: 'E.g. 2800',
  phCity: 'City',

  // === DASHBOARD ===
  highPerfDashboard: 'High-performance dashboard',
  poweredBy: 'Powered by',
  systemActive: 'System active',
  updatedAt: 'Updated at',
  readyForGrowth: 'Ready for growth today?',
  revenuePeriod: 'Period revenue',
  netMargin: 'Net margin',
  clientLoyalty: 'Customer loyalty',
  stockLevel: 'Stock level',
  financialTrajectory: 'Financial trajectory',
  financialDesc: 'Revenue evolution over the selected period.',
  realTime: 'Real time',
  strategicShortcuts: 'Strategic shortcuts',
  quickSale: 'Quick sale',
  quickSaleDesc: 'Sales terminal',
  productsDesc: 'Stock management',
  suppliersDesc: 'Supplier management',
  debtsDesc: 'Payment tracking',
  activityFlow: 'Activity flow',
  fullHistory: 'Full history',
  saleNumber: 'Sale #',
  noSales: 'No sales detected yet.',
  syncing: 'Syncing Lumo',
  preparingConsole: 'Preparing your control console...',
  today: 'Today',
  last7d: 'Last 7 days',
  last30d: 'Last 30 days',
  report: 'Report',

  // === POS ===
  newSale: 'New Sale',
  cart: 'Customer Cart',
  selectedItems: '{count} items selected',
  emptyCart: 'Cart is empty',
  cashDevise: 'SALE CURRENCY',
  paymentMethod: 'Payment Method',
  changeToReturn: 'Change to Return',
  amountReceived: 'Amount received',
  changeToGive: 'Change',
  insufficientAmount: 'Insufficient amount',
  openCashFirst: 'Open the cash register first',
  finalizeSale: 'Complete sale',
  ticket: 'Receipt',
  invoiceA4: 'A4 Invoice',
  checkoutClient: 'Checkout: Customer',
  clientName: 'Customer name',
  optionalPhone: 'Phone (Optional)',
  optionalEmail: 'Email (Optional)',
  walkInCustomer: 'Walk-in Customer',
  confirm: 'Confirm',
  openSession: 'Open session',
  openingSession: 'Opening...',

  // === SALES ===
  salesTitle: 'Sales Flow',
  salesSubtitle: 'Analytical tracking of all your commercial transactions.',
  reports: 'Reports',
  excel: 'Excel',
  empty: 'Clear',
  revenue: 'REVENUE',
  averageBasket: 'AVG BASKET',
  invoices: 'Invoices',
  searchSale: 'Search by reference or customer...',
  filters: 'Filters',
  hideFilters: 'Hide Filters',
  date: 'DATE',
  method: 'METHOD',
  all: 'All',
  reset: 'Reset',
  referenceClient: 'Reference / Customer',
  dateMethod: 'Date & Method',
  seller: 'Seller',
  totalAmount: 'Total Amount',
  details: 'Full details',
  printInvoice: 'Print Invoice',
  receipt: 'Print Receipt',
  refund: 'Refund',
  deleteSale: 'Delete Sale',
  noTransactions: 'No transactions found',
  adjustFilters: 'Adjust your filters or try a different search.',
  previous: 'Previous',
  next: 'Next',

  // === STATS ===
  statsTitle: 'Advanced Analytics',
  statsSubtitle: 'Detailed reports from your real data.',
  last7Days: 'Last 7 days',
  last30Days: 'Last 30 days',
  last12Months: 'Last 12 months',
  generateMonthlyReport: 'Generate Report (PDF)',
  performanceToday: "Today's performance",
  performance30d: 'Last 30 days performance',
  performanceYear: "Year's performance",
  performance7d: 'Last 7 days performance',
  revenueLabel: 'Revenue',
  noDataPeriod: 'No data for this period',
  stockByCategory: 'Stock by category',
  stockDistribution: 'Unit distribution',
  noProducts: 'No products',

  // === SETTINGS ===
  settingsSystem: 'System Settings',
  settingsSubtitle: 'Control every aspect of your LUMO platform.',
  timeSavedMonth: 'Time saved / month',
  hours: 'Hours',
  estimatedSaving: 'Estimated savings / month',
  startSavingTime: 'Start saving time',
  roiTitle: 'Calculate your ROI with LUMO',
  roiSub: 'Discover how much time and money you lose each month without automated management.',
  teamTitle: 'The faces behind LUMO',
  teamSub: 'A passionate team dedicated to the success of African merchants.',
  contactName: 'Name',
  phContactName: 'Your name',
  contactMessage: 'Message',
  phContactMessage: 'How can we help you?',
  contactSend: 'Send message',
  systemSettings: 'System Settings',
  controlAspects: 'Control every aspect of your LUMO platform.',
  template: 'Template',
  searchReferenceCategory: 'Search by reference or category...',
  globalInventory: 'Global Inventory',

  // === SETTINGS - MODULES ===
  confirmPassword: 'Confirm password',
  newPassword: 'New password',
  currentPassword: 'Current password',
  moduleManagement: 'Module management',
  deepseekEngine: 'DeepSeek AI Engine',
  deepseekDesc: 'Predictive analytics and automated strategic suggestions.',
  supplierManagement: 'Supplier management',
  supplierDesc: 'Control your stock and supplier debts in one click.',
  clientCredit: 'Customer Credit',
  clientCreditDesc: 'Rigorous tracking of unpaid invoices and automatic reminders.',
  settingsSaved: 'Settings saved successfully!',

  // === DEBTS ===
  settleDebt: 'Settle debt',
  sendReminder: 'Send reminder',
  invoiceNumber: 'Invoice N°',
  supplierDebt: 'Supplier Debt',
  totalToRecover: 'Total to recover',
  totalToPay: 'Total to pay',
  recordInvoice: 'Record an invoice',
  
  // === BUSINESS TYPES ===
  bizStoreTitle: 'Store / Shop',
  bizStoreDesc: 'Stock management and sales',
  bizPharmacieTitle: 'Pharmacy',
  bizPharmacieDesc: 'Medical products and prescriptions',
  bizRestaurantTitle: 'Restaurant / Café',
  bizRestaurantDesc: 'Menu and table service',
  bizServicesTitle: 'Professional Services',
  bizServicesDesc: 'Services and billing',

  // === NEWLY SYNCHRONIZED/MISSING KEYS ===
  modules: 'Module management',
  aiModule: 'DeepSeek AI Engine',
  aiDesc: 'Predictive analytics and automated strategic suggestions.',
  supplierModule: 'Supplier management',
  creditModule: 'Customer Credit',
  creditDesc: 'Rigorous tracking of unpaid invoices and automatic reminders.',
  successSave: 'Settings saved successfully!',
  reminder: 'Send reminder',
  clientDebt: 'Customer Credit',
  totalToCollect: 'Total to collect',
  registerInvoice: 'Record an invoice',
  purchaseInvoices: 'Purchase Invoices',
  bizBoutiqueTitle: 'Store / Shop',
  bizBoutiqueDesc: 'Stock management and sales',
  passwordRequirements: 'Password must be between 8 and 100 characters long, containing at least one uppercase letter, one lowercase letter, one number, and one special character (@$!%*?&#).',
};

let replacedCount = 0;

// Replace each [EN] placeholder with the proper English translation
for (const [key, value] of Object.entries(properTranslations)) {
  const escapedKey = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const pattern = '(\\b' + escapedKey + '\\s*:\\s*)([\'\\"])\\[EN\\] (?:(?!\\2)[^\\\\]|\\\\.)*\\2';
  const regex = new RegExp(pattern, 'g');
  
  const before = content;
  content = content.replace(regex, function(match, p1, quote) {
    const escapedValue = value.replace(new RegExp(quote, 'g'), '\\' + quote);
    return p1 + quote + escapedValue + quote;
  });
  
  if (content !== before) {
    replacedCount++;
  }
}

fs.writeFileSync(path, content, 'utf8');
console.log(`✅ Replaced ${replacedCount} / ${Object.keys(properTranslations).length} translations.`);

// Check remaining [EN] values
const remaining = content.match(/(['"])(?:\[EN\] (?:[^\'\"\\\\]|\\\\.)*)\1/g);
if (remaining) {
  console.log(`⚠️  ${remaining.length} [EN] values still remaining:`);
  remaining.forEach(r => console.log(' ', r));
} else {
  console.log('🎉 No more [EN] placeholders!');
}
