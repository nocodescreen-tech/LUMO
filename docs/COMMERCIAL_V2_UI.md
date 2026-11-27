# LUMO Commercial V2 — UI foundation
This iteration adds shared semantic tokens, light/dark surfaces, compact responsive workspace shell, mobile navigation, shared accessible dialog, skeletons, dashboard error/retry and actual refresh timestamps, inventory toolbar and frontend CI. Existing business API and data contracts are unchanged. No production deployment or database migration is included.
## Next acceptance gates
- Run the frontend workflow and resolve failures before merging.
- Test widths 360, 390, 768, 1024, 1440, both themes, keyboard navigation, role permissions, real API errors.
- Split large screens into feature components; migrate landing, auth, onboarding, POS, inventory, sales, purchases, customers, debts, cash, analytics, team, settings and superadmin individually.
- Build organizations, subscriptions and offline sync only with real backend contracts.
- Fix tenant isolation, transaction integrity, authentication, backups and accounting before release.

Second increment: POS compact catalog, mobile cart shortcut, accessible product buttons, login/register surfaces, form label associations, marketing removal of unverified store counts, uptime, support promises and testimonial cards. Existing offline sales implementation remains unsafe for commercial deployment and must be redesigned before release.

Third increment: common request failure/retry state across sales, purchases, products, clients, suppliers, cash, debts, activities, stock history, analytics, team, users and platform administration; compact headers and tables, responsive record toolbars and settings navigation. No business logic changes. Data completeness, role rules, pagination and actual browser rendering remain acceptance gates.
