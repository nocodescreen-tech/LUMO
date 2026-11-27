const VALID_ROLES = ['manager', 'caissier', 'vendeur', 'inventoriste', 'superviseur', 'gerant'];

// Permissions officiellement supportées (backend whitelist)
const VALID_PERMISSIONS = new Set([
  'pos', 'sales.add', 'sales.refund', 'sales.edit', 'sales.delete', 'sales.export', 'sales',
  'products', 'products.add', 'products.edit', 'products.delete', 'products.import', 'products.export', 'products.view_purchase_price',
  'clients', 'clients.add', 'clients.edit', 'clients.delete', 'clients.settle_debt', 'clients.send_reminder',
  'suppliers', 'suppliers.add', 'suppliers.edit', 'suppliers.delete',
  'purchases', 'purchases.add', 'purchases.edit', 'purchases.delete', 'purchases.refund',
  'stock-history', 'stock-history.view', 'stock-history.export',
  'cash', 'cash.open', 'cash.close', 'cash.view', 'cash.delete_session',
  'debts', 'debts.settle', 'debts.delete', 'debts.send_reminder',
  'stats', 'activities', 'expenses.request', 'expenses.review', 'crm.manage',
  'settings', 'settings.view', 'settings.edit', 'settings.profile', 'settings.appearance', 'settings.exchange_rate',
  'team', 'team.add', 'team.edit', 'team.delete', 'team.view_activity'
]);


module.exports={VALID_ROLES,VALID_PERMISSIONS};
