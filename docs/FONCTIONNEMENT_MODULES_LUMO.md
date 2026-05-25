# Documentation interne - Fonctionnement des modules LUMO

Date de redaction: 2026-05-26  
Base d'analyse: code source `client/src` et `server`

## Objectif du document

Ce fichier explique le fonctionnement de LUMO module par module, en reliant les ecrans frontend, les routes API, les controleurs backend, les modeles de donnees et les calculs metier.

Le but est que l'equipe puisse comprendre:

- comment un utilisateur s'inscrit, verifie son email, se connecte et recupere son mot de passe;
- comment les ventes, achats, stocks, dettes, caisse et marges sont calculees;
- comment les permissions d'equipe fonctionnent;
- comment les emails, OTP, sauvegardes, notifications, statistiques et impressions sont declenches;
- quels fichiers modifier lorsqu'une fonctionnalite doit evoluer.

## Architecture generale

### Frontend

Le frontend est dans `client/src`.

Pages principales:

- `client/src/pages/Landing.tsx`: page publique, formulaire contact, tracking visite, newsletter.
- `client/src/pages/auth/Login.tsx`: connexion utilisateur.
- `client/src/pages/auth/Register.tsx`: inscription.
- `client/src/pages/auth/VerifyEmail.tsx`: verification email par OTP.
- `client/src/pages/auth/ForgotPassword.tsx`: demande de recuperation.
- `client/src/pages/auth/VerifyResetOTP.tsx`: verification OTP de reset.
- `client/src/pages/auth/ResetPassword.tsx`: nouveau mot de passe.
- `client/src/pages/Dashboard.tsx`: resume activite, CA, marges, stock, ventes recentes.
- `client/src/pages/POS.tsx`: caisse/terminal de vente.
- `client/src/pages/Sales.tsx`: historique des ventes, impression, remboursement, suppression.
- `client/src/pages/Products.tsx`: produits, prix, cout d'achat, stock, variantes, image.
- `client/src/pages/Purchases.tsx`: achats fournisseur et entree stock.
- `client/src/pages/Clients.tsx`: clients et dettes.
- `client/src/pages/Dettes.tsx`: suivi des credits/dettes.
- `client/src/pages/Cash.tsx`: ouverture, fermeture et historique de caisse.
- `client/src/pages/Stats.tsx`: statistiques avancees.
- `client/src/pages/Users.tsx`: membres d'equipe.
- `client/src/pages/Settings.tsx`: profil, entreprise, modules, devise, taux, 2FA, sauvegarde.
- `client/src/pages/SuperAdminDashboard.tsx`: supervision globale, utilisateurs, messages landing, visites.

Stores frontend:

- `client/src/store/useAuthStore.ts`: session, token, profil, theme, langue, devise, taux, modules actifs.
- `client/src/store/useCartStore.ts`: panier POS, conversion des prix produit vers la devise active.
- `client/src/store/useSettingsStore.ts`: etat local des parametres.

Utilitaires:

- `client/src/utils/currencyHelpers.ts`: conversion/normalisation devise.
- `client/src/utils/printHelpers.ts`: factures, tickets, rapports mensuels, rapports de caisse.
- `client/src/utils/exportUtils.ts`: export Excel.

### Backend

Le backend est dans `server`.

Fichiers centraux:

- `server/server.js`: demarrage Express, branchement des routes.
- `server/routes/*.js`: definition des endpoints.
- `server/controllers/*.js`: logique metier.
- `server/models/*.js`: modeles Sequelize/PostgreSQL.
- `server/middleware/authMiddleware.js`: JWT, session, permissions, tenant.
- `server/middleware/validators.js`: validation Joi des donnees entrantes.
- `server/utils/emailService.js`: emails OTP, reset, dettes, sauvegardes.
- `server/utils/cache.js`: cache Redis ou memoire.
- `server/utils/currency.js`: conversion de devises cote serveur.

## Isolation des donnees par boutique

LUMO utilise un modele multi-tenant simple.

Chaque compte admin possede ses donnees via `userId`. Les membres d'equipe ont un `parentId` pointant vers l'admin proprietaire. Dans `authMiddleware.protect`, le backend calcule:

- `req.user.tenantId = req.user.parentId || req.user.id`
- `req.tenantId = req.user.parentId || req.user.id`

Les controleurs metier utilisent normalement `req.user.tenantId` pour filtrer les donnees de la boutique.

Impact:

- un admin voit ses donnees;
- un caissier/manager voit les donnees de la boutique de son admin;
- les permissions limitent les actions, mais les donnees restent rattachees au tenant admin.

Point de vigilance: certains anciens controleurs de sauvegarde utilisent encore `req.user.id` au lieu de `req.user.tenantId`, ce qui peut limiter une sauvegarde lancee par un sous-utilisateur.

## Authentification et compte utilisateur

### Inscription

Frontend:

- `client/src/pages/auth/Register.tsx`

Backend:

- route: `POST /api/auth/register`
- route fichier: `server/routes/authRoutes.js`
- controleur: `registerAdmin` dans `server/controllers/authController.js`
- validation: `validateRegister` dans `server/middleware/validators.js`
- modele: `server/models/User.js`

Fonctionnement:

1. Le formulaire envoie nom, email, mot de passe, entreprise, type d'activite, telephone, devise, ville et taux dollar.
2. Si `nom` manque, le backend cree un nom fallback a partir de l'entreprise.
3. Joi valide les champs.
4. Le backend cherche un utilisateur existant avec le meme email, en ignorant la casse (`Op.iLike`).
5. Si c'est le premier utilisateur de toute la base, il devient `superadmin`, `isVerified=true`, `isAdminValidated=true`.
6. Sinon, le backend genere un OTP de 6 chiffres.
7. L'OTP est hash en SHA-256 et stocke dans `verificationCode`.
8. L'avatar est envoye sur Cloudinary si fourni, sinon `default_avatar.png`.
9. Le mot de passe est stocke dans `motDePasse`, puis hash automatiquement par le hook `beforeSave` du modele `User`.
10. Les preferences par defaut sont creees: theme, langue, modules actifs, taux de change.
11. Les informations entreprise sont creees: nom, devise, adresse.
12. Un email de verification est envoye avec `sendEmail` et `getVerificationTemplate`.
13. Une activite `INSCRIPTION` est journalisee.
14. Le superadmin recoit directement un token; les autres doivent verifier leur email.

Donnees importantes dans `User`:

- `email`: unique.
- `motDePasse`: hash bcrypt.
- `role`: `superadmin`, `admin`, `manager`, `caissier`, `vendeur`.
- `isVerified`: email verifie.
- `isAdminValidated`: compte autorise.
- `verificationCode`: OTP email hash.
- `preferences`: theme, language, enabledModules, exchangeRate, autoBackupEnabled.
- `entreprise`: nom, logo, devise, adresse, exchangeRate.

### Verification email OTP

Frontend:

- `client/src/pages/auth/VerifyEmail.tsx`

Backend:

- route: `POST /api/auth/verify-email`
- controleur: `verifyEmail`

Fonctionnement:

1. Le frontend envoie `email` et `code`.
2. Le backend hash le code recu en SHA-256.
3. Il cherche un user avec cet email et ce hash dans `verificationCode`.
4. Si aucun user ne correspond: erreur `Code de verification invalide`.
5. Si le code est bon:
   - `isVerified=true`
   - `isAdminValidated=true`
   - `verificationCode=null`
6. Le backend genere des tokens JWT et renvoie le profil.

Point de vigilance: `resendCode` stocke `verificationCodeExpires`, mais le modele `User` ne montre pas ce champ. La verification principale ne controle pas explicitement l'expiration du premier code.

### Renvoi du code email

Backend:

- route: `POST /api/auth/resend-code`
- controleur: `resendCode`

Fonctionnement:

1. L'email est requis.
2. Le backend refuse si l'utilisateur n'existe pas.
3. Il refuse si le compte est deja verifie.
4. Il regenere un OTP 6 chiffres.
5. Il stocke le hash SHA-256 dans `verificationCode`.
6. Il tente de stocker `verificationCodeExpires` a 15 minutes.
7. Il envoie un email avec le template de verification.

### Connexion

Frontend:

- `client/src/pages/auth/Login.tsx`
- store: `useAuthStore.setAuth`

Backend:

- route: `POST /api/auth/login`
- controleur: `loginAdmin`

Fonctionnement:

1. Le frontend envoie `email` et `motDePasse`.
2. Le backend valide le payload.
3. Il cherche l'utilisateur par email.
4. Il compare le mot de passe avec `user.matchMotDePasse`, qui utilise bcrypt.
5. Il bloque:
   - email non verifie;
   - compte suspendu;
   - compte non valide par admin;
   - sauf pour le superadmin.
6. Si la 2FA est active, le backend ne renvoie pas encore de token et retourne `requires2FA=true`.
7. Sinon, il cree un `sessionId`.
8. `generateToken` genere access token et refresh token.
9. Le refresh token est aussi pose en cookie `httpOnly`.
10. La session est ajoutee dans `user.activeSessions`.
11. Le nombre de sessions est limite a 5; la plus ancienne est supprimee.
12. Une activite `CONNEXION` est journalisee.
13. Le frontend stocke profil/token dans localStorage via `useAuthStore`.

### Protection des routes

Backend:

- middleware: `server/middleware/authMiddleware.js`

Fonctionnement:

1. Le backend lit le bearer token.
2. Il refuse si absent.
3. Il verifie que le token n'est pas blacklist Redis.
4. Il verifie le JWT avec le secret serveur.
5. Il refuse un refresh token utilise comme access token.
6. Il charge l'utilisateur en base.
7. Il verifie que le `sessionId` du token existe encore dans `activeSessions`.
8. Il bloque les comptes suspendus.
9. Il applique le mode maintenance sauf superadmin.
10. Il calcule le tenant.
11. Il met a jour `lastActivity` au maximum une fois par minute.

Permissions:

- `authorize('admin', 'superadmin')`: controle par role.
- `checkPermission('products.edit')`: admin/superadmin passent toujours; les autres doivent avoir la permission exacte ou la permission parent (`products`).

### Deconnexion

Backend:

- route: `POST /api/auth/logout`
- controleur: `logoutAdmin`

Fonctionnement:

1. Le token courant est ajoute dans la blacklist Redis 24h.
2. Une activite `DECONNEXION` est creee.
3. Le cookie refresh token est supprime.
4. Le header `Clear-Site-Data` demande au navigateur de vider cache/cookies/storage.
5. Le frontend vide son localStorage et redirige vers `/login`.

### Refresh token

Backend:

- route: `POST /api/auth/refresh`
- controleur: `refreshAccessToken`

Fonctionnement:

1. Le refresh token vient du cookie ou du body.
2. Le backend verifie qu'il est bien de type `refresh`.
3. Il recharge l'utilisateur.
4. Il refuse les comptes suspendus.
5. Il regenere un access token et un refresh token avec le meme `sessionId`.
6. Il met a jour les metadonnees de session.
7. Il renvoie le nouveau token.

## Recuperation de mot de passe

### Demande de reset

Frontend:

- `client/src/pages/auth/ForgotPassword.tsx`

Backend:

- route: `POST /api/auth/forgot-password`
- controleur: `forgotPassword`

Fonctionnement:

1. L'utilisateur saisit son email.
2. Le backend cherche l'utilisateur.
3. Il genere un OTP 6 chiffres.
4. Il hash l'OTP en SHA-256 dans `resetPasswordToken`.
5. Il met `resetPasswordExpire = Date.now() + 3600000`, soit 1 heure.
6. Il sauvegarde l'utilisateur.
7. Il envoie l'email via `getResetPasswordTemplate`.
8. En cas d'echec email, il nettoie le token de reset.

### Verification OTP reset

Frontend:

- `client/src/pages/auth/VerifyResetOTP.tsx`

Backend:

- route: `POST /api/auth/verify-reset-code`
- controleur: `verifyResetCode`

Fonctionnement:

1. Le frontend envoie email et code.
2. Le backend hash le code.
3. Il cherche un utilisateur avec:
   - email correspondant;
   - token correspondant;
   - expiration superieure a maintenant.
4. Si trouve, le frontend peut afficher la page de nouveau mot de passe.

### Nouveau mot de passe

Frontend:

- `client/src/pages/auth/ResetPassword.tsx`

Backend:

- route: `POST /api/auth/reset-password`
- controleur: `resetPassword`

Fonctionnement:

1. Le frontend envoie email, code et nouveau mot de passe.
2. Le backend revalide le code et son expiration.
3. Il affecte `user.motDePasse = motDePasse`.
4. Le hook `beforeSave` hash le nouveau mot de passe.
5. Il supprime `resetPasswordToken` et `resetPasswordExpire`.
6. Il journalise `SECURITE - Mot de passe reinitialise`.

## Double authentification 2FA

Frontend:

- `client/src/pages/Settings.tsx`

Backend:

- `GET /api/auth/2fa/setup`
- `POST /api/auth/2fa/activate`
- `POST /api/auth/2fa/disable`
- `POST /api/auth/2fa/verify`

### Setup TOTP

Controleur: `setupTOTP`

1. Le backend genere un secret avec `otplib.authenticator.generateSecret`.
2. Il cree un URI `otpauth` avec l'email et le nom `LUMO Pro`.
3. Il stocke temporairement le secret dans `twoFactorCode`.
4. Il stocke une expiration timestamp dans `twoFactorExpire`.
5. Il genere un QR code data URL avec `qrcode`.
6. Le frontend affiche le QR code.

### Activation

Controleur: `activateTOTP`

1. Le frontend envoie le code Google Authenticator.
2. Le backend relit le secret temporaire depuis `twoFactorCode`.
3. Il refuse si la session d'activation est expiree.
4. Il verifie le code TOTP avec une fenetre de tolerance de 1 pas.
5. Si le code est bon:
   - `twoFactorSecret = secret`
   - `twoFactorEnabled = true`
   - `twoFactorCode = null`
   - `twoFactorExpire = null`
6. Il journalise l'activation.

### Connexion avec 2FA

1. Lors du login, si `twoFactorEnabled=true`, le backend renvoie `requires2FA=true`.
2. Le frontend demande le code.
3. `verify2FA` verifie le code TOTP avec `twoFactorSecret`.
4. Si valide, il cree tokens + session comme un login normal.

### Desactivation

Controleur: `disable2FA`

1. L'utilisateur connecte demande la desactivation.
2. Le backend met tous les champs 2FA a false/null.
3. Il journalise la desactivation.

Point de vigilance: `twoFactorExpire` est un `BIGINT`. Il faut toujours y stocker un timestamp numerique, jamais une date string.

## Emails

Fichier:

- `server/utils/emailService.js`

Service:

1. Si `SMTP_USER` et `SMTP_PASS` existent, le systeme utilise SMTP en priorite.
2. Si SMTP echoue et `RESEND_API_KEY` existe, il tente Resend.
3. Si pas de SMTP mais Resend existe, il utilise Resend.
4. Si aucun service n'est configure, il leve une erreur.

Templates disponibles:

- `getVerificationTemplate`: OTP inscription/verif email.
- `getResetPasswordTemplate`: OTP recuperation mot de passe.
- `getNewsletterWelcomeTemplate`: bienvenue newsletter.
- `getDebtReminderTemplate`: rappel dette client.

Utilisations:

- inscription: email OTP verification;
- reset password: email OTP reset;
- dettes client: email de rappel;
- sauvegarde email: fichier JSON en piece jointe;
- newsletter: email de bienvenue selon controleur newsletter.

## Parametres, entreprise, devise et modules

Frontend:

- `client/src/pages/Settings.tsx`
- `client/src/store/useAuthStore.ts`

Backend:

- route: `PUT /api/auth/profile`
- controleur: `updateProfile`
- logo: `POST /api/auth/logo`

Fonctionnement:

1. Les preferences sont stockees dans `User.preferences`.
2. Les infos enseigne sont stockees dans `User.entreprise`.
3. Le frontend garde aussi une copie locale dans localStorage.
4. `useAuthStore` synchronise theme, langue, devise, taux et modules avec le serveur.
5. La devise legacy `FC` est normalisee en `CDF`.
6. Le taux de change principal est `preferences.exchangeRate`.

Modules:

- `enabledModules` contient les modules actifs pour l'interface.
- Les permissions d'equipe sont separees dans `User.permissions`.

## Produits et stock

Frontend:

- `client/src/pages/Products.tsx`
- `client/src/pages/StockHistory.tsx`

Backend:

- routes: `server/routes/productRoutes.js`
- controleur: `server/controllers/productController.js`
- modele: `server/models/Product.js`
- mouvements: `server/models/StockMovement.js`

Champs produit:

- `nom`
- `description`
- `prix`: prix de vente.
- `prixAchat`: cout d'achat.
- `stock`
- `stockAlerte`
- `categorie`
- `codeBarre`
- `image`
- `unite`
- `devise`: `USD` ou `CDF`.
- `metadata`
- `variantes`
- `userId`
- `creatorId`

Creation produit:

1. Le frontend envoie les donnees produit.
2. Le backend valide avec `validateProduct`.
3. Si le frontend envoie `prixVente`, le backend le mappe vers `prix`.
4. `codeBarre` vide devient `null` pour eviter les erreurs d'unicite.
5. `variantes` et `metadata` sont parses si envoyes en string.
6. L'image est uploadee sur Cloudinary si presente.
7. Le produit est cree avec `userId=tenantId`.
8. Une activite produit est creee.
9. Les caches `products` et `stats` sont invalides.

Mouvements de stock automatiques:

Dans le modele `Product`, le hook `afterSave` detecte tout changement de stock.

Si `stock` change:

- il calcule `ancienStock`;
- il calcule `nouveauStock`;
- il calcule `difference`;
- si difference > 0: mouvement `ENTREE`;
- si difference < 0: mouvement `SORTIE`;
- il cree une ligne `StockMovement`;
- il cree des notifications si stock faible, stock approvisionne ou nouveau produit.

Stock faible:

- seuil = `stockAlerte` ou 5;
- notification seulement si le stock passe d'un niveau >= seuil vers un niveau < seuil.

Suppression produit:

1. Le produit est cherche par `id` et `userId`.
2. Il est supprime en paranoid delete.
3. Une activite est journalisee.
4. Les caches sont invalides.

Suppression de tous les produits:

1. Les mouvements de stock du tenant sont supprimes.
2. Les produits sont supprimes avec `force: true`.
3. Une activite globale est journalisee.

## Panier POS et conversion des prix

Frontend:

- `client/src/store/useCartStore.ts`
- `client/src/pages/POS.tsx`

Fonctionnement du panier:

1. Quand un produit est ajoute, le store lit `product.prixVente || product.prix`.
2. Il lit `product.devise || globalCurrency`.
3. Il convertit le prix produit vers la devise globale active.
4. Il stocke:
   - `prix`: prix normalise dans la devise globale;
   - `prixOriginal`: prix original du produit;
   - `deviseOriginal`: devise produit;
   - `quantite`;
   - `prixAchat`;
   - variantes.
5. Si le meme produit et les memes variantes existent deja, il augmente la quantite.
6. `getTotal()` retourne la somme `prix * quantite`.

Conversions panier:

- USD vers CDF: `Math.round(price * rate)`
- CDF vers USD: `Math.round((price / rate) * 100) / 100`
- EUR est partiellement prevu dans le store, mais les modeles produit valident surtout USD/CDF.

## Ventes / POS

Frontend:

- `client/src/pages/POS.tsx`
- `client/src/pages/Sales.tsx`

Backend:

- routes: `server/routes/SaleRoutes.js`
- controleur: `server/controllers/SaleController.js`
- modele: `server/models/sale.model.js`

### Finalisation d'une vente

Dans `POS.tsx`:

1. Le caissier ajoute des produits au panier.
2. Le total panier est calcule dans la devise globale active.
3. `saleCurrency` peut etre la devise de vente choisie.
4. `getSaleTotal()` convertit le total panier vers `saleCurrency` si necessaire.
5. Le client est choisi ou cree.
6. Le payload envoye a `POST /api/sales` contient:
   - `items`: id, nom, prix, prixAchat, quantite;
   - `montantTotal`: total dans la devise de vente;
   - `devise`: devise de vente;
   - `tauxChange`: taux au moment de la vente;
   - `methodePaiement`;
   - `clientInfo`.

Mode hors-ligne:

- Si le reseau est coupe, la vente est stockee dans `localStorage.pending-sales`.
- Au retour en ligne, `POS.tsx` tente de synchroniser les ventes en attente vers `/sales`.

### Creation vente backend

Controleur: `createSale`

Etapes:

1. Le payload est valide par `validateSale`.
2. Une transaction SQL est ouverte.
3. Le tenant est `req.user.tenantId`.
4. Le backend lit l'admin proprietaire pour connaitre:
   - `shopCurrency = owner.entreprise.devise || 'CDF'`;
   - `finalRate = tauxChange || owner.preferences.exchangeRate`.
5. Si le taux est invalide, la vente est refusee.
6. Si une caisse est ouverte, le montant de vente est converti dans la devise boutique avant ajout a la session.
7. Les produits vendus sont charges en une seule requete.
8. Pour chaque item:
   - le stock produit est reduit;
   - `stockUpdateRaison='Vente'`;
   - le hook produit cree le mouvement de stock.
9. `montantTotal` est normalise dans la devise boutique avant stockage.
10. Les articles sont reconstruits avec:
   - `prixUnitaire`
   - `quantite`
   - `prixAchat`
   - `deviseOrigine`
   - `tauxChange`
   - `totalLigneOrigine`
   - `totalLigneCDF`
   - `totalLigneUSD`
   - `deviseProduit`
   - `metadata`
11. Le profit est calcule.
12. Le client est resolu:
   - si `clientId` existe, il est garde;
   - sinon, si `clientInfo.nom` n'est pas `Client de passage`, le backend cherche par telephone puis par nom;
   - si pas trouve, il cree un client.
13. La vente est creee.
14. Si la methode est credit/dette, la dette client est augmentee dans la devise boutique.
15. La transaction est commit.
16. Le cache stats est invalide.

### Calcul marge / profit net

Dans `SaleController.createSale`:

Pour chaque ligne:

```text
prixUnitaire = item.prix
prixAchat = item.prixAchat
quantite = item.quantite
prixUnitaireCDF = prixUnitaire converti vers shopCurrency si besoin
profitNormalized += (prixUnitaireCDF - prixAchat) * quantite
```

Puis:

```text
profitNormalized -= remise
profitNet = Math.round(profitNormalized * 100) / 100
```

`profitNet` est stocke dans la vente.

Point important:

- Le calcul suppose que `prixAchat` est deja dans la devise boutique.
- Si un produit a un cout d'achat saisi dans une autre devise sans normalisation prealable, la marge peut etre fausse.

### Montant total et devise

La vente garde deux informations:

- `montantTotal`: montant normalise en devise boutique.
- `devise`: devise originale de la vente.
- `tauxChange`: taux utilise au moment de la vente.

Les impressions doivent donc convertir `montantTotal` vers `devise` avant affichage si la devise boutique est differente.

### Historique des ventes

Frontend:

- `client/src/pages/Sales.tsx`

Backend:

- `GET /api/sales`

Fonctionnement:

1. Le backend filtre par `userId=tenantId`.
2. Il peut filtrer par date, client, montant min/max.
3. Il inclut client et vendeur.
4. Il trie par `createdAt DESC`.
5. Le frontend reconstruit les montants affiches avec devise de vente, devise alternative et devise UI.

### Suppression vente

Backend:

- `DELETE /api/sales/:id`

Fonctionnement:

1. Le backend verifie que la vente appartient au tenant ou que l'utilisateur est superadmin.
2. Si vente non remboursee:
   - il remet les quantites dans le stock;
   - le hook produit cree les mouvements de stock.
3. Si vente credit/dette:
   - il reduit la dette client.
4. Il supprime la vente.
5. Il invalide les stats.

### Suppression massive ventes

Backend:

- `DELETE /api/sales/all`

Fonctionnement:

1. Toutes les ventes du tenant sont chargees.
2. Les quantites a restituer sont cumulees par produit.
3. Les stocks sont remis en une passe.
4. Toutes les ventes sont supprimees.
5. Une activite `PURGE_HISTORIQUE` est creee.

### Remboursement

Backend:

- `POST /api/sales/:id/refund`

Fonctionnement:

1. Refuse si deja remboursee.
2. Remet le stock.
3. Reduit la dette client si credit.
4. Met `statut='Remboursee'`.
5. Invalide les stats.

## Factures, tickets et rapports imprimes

Fichier:

- `client/src/utils/printHelpers.ts`

Fonctions:

- `generateInvoice(data, user)`: facture A4.
- `generateTicket(data, user)`: ticket thermique.
- `generateMonthlyReport(data, user, periodLabel)`: bilan mensuel.
- `generateCashSessionReport(session, user)`: rapport de caisse.

### Facture et ticket vente

Sources:

- Depuis `POS.tsx`, apres une vente reussie.
- Depuis `Sales.tsx`, depuis l'historique.

Logique devise:

1. `shopCurrency` vient de `user.entreprise.devise`, avec `FC` normalise en `CDF`.
2. `saleCurrency` vient de `data.devise || data.currency || shopCurrency`.
3. `rate` vient de `data.tauxChange || user.preferences.exchangeRate`.
4. `storedTotal = data.montantTotal || data.total`.
5. `displayTotal = normalizeAmount(storedTotal, shopCurrency, saleCurrency, rate)`.
6. La facture affiche `displayTotal` dans `saleCurrency`.
7. L'equivalent `Soit environ` utilise le meme taux historique de vente.

Infos enseigne:

- logo: `data.entreprise.logo || user.entreprise.logo`
- nom: `data.entreprise.nom || user.entreprise.nom`
- adresse: `data.entreprise.adresse`
- telephone: `data.entreprise.telephone`

Infos client:

- `clientName`
- `clientInfo.nom`
- `clientInfo.telephone`

Point de vigilance:

- Les lignes articles utilisent `item.prixUnitaire || item.prix`. Il faut s'assurer que cette valeur correspond bien a la devise de vente au moment de l'impression.

## Achats fournisseur

Frontend:

- `client/src/pages/Purchases.tsx`

Backend:

- routes: `server/routes/purchaseRoutes.js`
- controleur: `server/controllers/purchaseController.js`
- modele: `server/models/purchase.model.js`

Creation achat:

1. Le frontend envoie articles, fournisseur, numero facture, description, montant, statut, devise.
2. Le backend valide avec `validatePurchase`.
3. La liste d'articles ne peut pas etre vide.
4. Les produits existants sont charges par id.
5. Pour chaque article:
   - si le produit existe:
     - le stock augmente;
     - `stockUpdateRaison='Achat Fournisseur'`;
     - `prixAchat` est mis a jour si fourni.
   - si l'article a un nom mais pas d'id:
     - un nouveau produit est cree;
     - stock initial = quantite;
     - prix achat = prixAchat;
     - raison stock = `Achat Fournisseur (Nouveau)`.
6. Si une caisse est ouverte:
   - le montant achat est converti vers la devise session/boutique;
   - `expectedBalance` est diminue.
7. L'achat est cree.
8. Une activite `ACHAT` est journalisee.

Modification achat:

- `PUT /api/purchases/:id`
- met a jour les champs de l'achat, mais ne recalcul pas automatiquement l'ancien impact stock.

Suppression achat:

1. L'achat est retrouve par tenant.
2. Pour chaque article, le stock produit est diminue de la quantite achetee.
3. Le stock ne descend pas sous zero.
4. L'achat est supprime.
5. Une activite est journalisee.

## Caisse / tresorerie

Frontend:

- `client/src/pages/Cash.tsx`
- `client/src/pages/POS.tsx`

Backend:

- routes: `server/routes/cashRoutes.js`
- controleur: `server/controllers/cashController.js`
- modele: `server/models/CashSession.js`

### Ouverture caisse

Route:

- `POST /api/cash/open`

Fonctionnement:

1. Le backend cherche une session `OPEN` pour le tenant.
2. Si elle existe deja, il la renvoie. Cela rend l'action idempotente.
3. Sinon, il cree une session:
   - `openingBalance`
   - `expectedBalance = openingBalance`
   - `note`
   - `status='OPEN'`

### Session courante

Route:

- `GET /api/cash/current`

Fonctionnement:

1. Le backend cherche la session ouverte.
2. S'il n'y en a pas, il renvoie `null`.
3. Il charge les ventes depuis `openingTime`.
4. Il somme `Sale.montantTotal`.
5. Il renvoie:
   - `totalSales`
   - `totalExpenses=0`
   - `expectedBalance = openingBalance + totalSales - totalExpenses`

Point de vigilance:

- Le code commente que les montants sont stockes en CDF, mais en pratique `montantTotal` est stocke dans la devise boutique. Si la boutique est USD, l'affichage doit respecter cette devise.

### Fermeture caisse

Route:

- `POST /api/cash/close`

Fonctionnement:

1. Le backend cherche la session ouverte.
2. Il charge les ventes depuis l'ouverture.
3. Il calcule `totalSales`.
4. `totalExpenses` vaut actuellement 0.
5. `expectedBalance = openingBalance + totalSales - totalExpenses`.
6. Il met:
   - `closingTime`
   - `closingBalance`
   - `expectedBalance`
   - `totalSales`
   - `totalExpenses`
   - `status='CLOSED'`
   - `note`

### Rapport de caisse

Frontend:

- `generateCashSessionReport`

Calcul affichage:

```text
diff = closingBalance - expectedBalance
```

Le rapport affiche:

- fond initial;
- ventes;
- solde theorique;
- solde reel;
- ecart;
- signature caissier et responsable.

## Clients, credits et dettes

Frontend:

- `client/src/pages/Clients.tsx`
- `client/src/pages/Dettes.tsx`

Backend:

- routes: `server/routes/clientRoutes.js`
- controleur: `server/controllers/clientController.js`
- modele: `server/models/Client.js`

Creation/modification:

1. Le backend valide avec `validateClient`.
2. Le client est cree ou mis a jour avec `userId=tenantId`.
3. Une activite est journalisee.

Dette creee par vente:

Dans `SaleController.createSale`, si la methode de paiement contient:

- `credit`
- `credit` sans accent
- `dette`
- ou statut `Dette` / `Credit`

Alors:

1. Le montant a ajouter est `montantTotal - remise`.
2. Il est converti vers la devise boutique si besoin.
3. `client.detteTotale += amountToAdd`.

Reglement dette:

Route:

- `POST /api/clients/:id/regler`

Fonctionnement:

1. Le montant doit etre numerique et > 0.
2. Le client doit appartenir au tenant.
3. `detteTotale = Math.max(0, detteTotale - montant)`.
4. Une activite est creee.

Rappel dette par email:

Route:

- `POST /api/clients/:id/rappel`

Fonctionnement:

1. Le client doit exister.
2. Le client doit avoir un email.
3. Sa dette doit etre > 0.
4. Le backend genere `getDebtReminderTemplate`.
5. Il envoie l'email.

Point de vigilance:

- Le template de rappel dette utilise actuellement `CDF` en dur dans le controleur client. Il faut l'adapter a la devise boutique pour une precision parfaite.

## Fournisseurs

Frontend:

- `client/src/pages/Fournisseurs.tsx`

Backend:

- routes: `server/routes/fournisseurRoutes.js`
- controleur: `server/controllers/fournisseurController.js`
- modele: `server/models/Fournisseur.js`

Fonctionnement:

- CRUD fournisseur filtre par tenant.
- Permissions:
  - `suppliers`
  - `suppliers.add`
  - `suppliers.edit`
  - `suppliers.delete`
- Les fournisseurs sont utilises dans les achats pour identifier la source.

## Statistiques et dashboard

Frontend:

- `client/src/pages/Dashboard.tsx`
- `client/src/pages/Stats.tsx`
- `client/src/components/DashboardCharts.tsx`

Backend:

- routes: `server/routes/statsRoutes.js`
- controleur: `server/controllers/statsController.js`

### Dashboard

Route:

- `GET /api/stats/dashboard`

Calculs:

1. Exclut les ventes remboursees avec `notRefunded`.
2. Calcule:
   - nombre total de ventes;
   - revenu total: somme `Sale.montantTotal`;
   - revenu complete;
   - nombre produits;
   - nombre clients;
   - nombre produits stock < 10;
   - profit total: somme `Sale.profitNet`;
   - ventes recentes.
3. Marge:

```text
marginPercent = revenue > 0 ? (profit / revenue) * 100 : 0
```

4. Panier moyen:

```text
averageOrderValue = revenue / totalSales
```

Important:

- Les montants stats sont bases sur les montants normalises en devise boutique.
- Le frontend doit convertir/afficher selon la devise active utilisateur.

### Graphique de ventes

Route:

- `GET /api/stats/sales-chart?period=...`

Periodes:

- `today`: jour courant.
- `7d` ou `day`: 7 jours.
- `30d`: 30 jours.
- `week`: semaines sur environ 180 jours.
- defaut: mois sur environ 183 jours.

Le backend groupe avec `DATE_TRUNC` et retourne:

- `period`
- `totalCommandes`
- `revenue`
- `prixMoyen`

### Analytics avancees

Route:

- `GET /api/stats/analytics`

Calculs:

1. Filtre par periode/date.
2. Charge les ventes.
3. Calcule `totalRevenue`.
4. Groupe les revenus par jour.
5. Construit les top produits depuis `sale.articles`.
6. Calcule stock par categorie depuis `Product`.
7. Calcule revenus mensuels sur 183 jours.

Point de vigilance:

- Dans le payload actuel, `totals.profit` est mis egal a `totalRevenue`. Ce n'est pas une vraie marge nette. Pour une marge exacte, il faudrait sommer `Sale.profitNet`.

## Activites et journal

Frontend:

- `client/src/pages/Activities.tsx`

Backend:

- route: `server/routes/activiteRoutes.js`
- controleur utilitaire: `server/controllers/activiteController.js`
- modele: `server/models/Activite.js`

Fonctionnement:

- Plusieurs operations creent des activites:
  - inscription;
  - connexion/deconnexion;
  - produit cree/modifie/supprime;
  - achat;
  - vente;
  - purge historique;
  - profil/parametres;
  - securite/2FA/reset.
- `Product` et `Sale` ont aussi des hooks qui creent des activites automatiquement.

## Notifications

Frontend:

- probablement consommees dans layout/header.

Backend:

- routes: `server/routes/notificationRoutes.js`
- controleur: `server/controllers/notificationController.js`
- modele: `server/models/notification.model.js`

Fonctionnement:

- Le backend permet:
  - lister notifications;
  - marquer une notification lue;
  - tout marquer lu;
  - supprimer une notification;
  - tout supprimer.
- Des notifications sont creees automatiquement par le hook `Product.afterSave`:
  - stock faible;
  - stock approvisionne;
  - nouveau produit.

## Equipe / membres

Frontend:

- `client/src/pages/Users.tsx`

Backend:

- routes: `server/routes/subUserRoutes.js`
- controleur: `server/controllers/subUserController.js`
- modele: `server/models/User.js`

Creation membre:

1. Route protegee admin/superadmin.
2. Roles autorises:
   - `manager`
   - `caissier`
   - `vendeur`
3. Email unique.
4. Permissions par defaut:
   - manager: `products`, `sales`, `clients`, `stats`, `pos`, `cash`
   - caissier/vendeur: `pos`, `sales.add`, `products`, `clients`
5. Le membre recoit:
   - `parentId = req.tenantId`
   - meme entreprise que l'admin
   - meme typeActivite
   - `isAdminValidated=true`
   - `isVerified=true`

Modification:

- Permet nom, email, role, telephone, suspension, permissions.
- Si le role change sans permissions explicites, le backend applique les permissions par defaut du role.

Suppression:

- Le backend supprime le membre si `parentId` correspond au tenant.

Impact permissions:

- Les routes utilisent `checkPermission`.
- Admin et superadmin ignorent ces restrictions.
- Les sous-utilisateurs doivent avoir la permission exacte ou le module parent.

## Sauvegarde et restauration

Frontend:

- `client/src/pages/Settings.tsx`

Backend:

- routes: `server/routes/backupRoutes.js`
- controleur: `server/controllers/backupController.js`

### Export fichier

Route:

- `GET /api/backup/export`

Fonctionnement:

1. Le backend charge:
   - produits;
   - ventes;
   - clients;
   - fournisseurs;
   - achats;
   - mouvements stock;
   - sessions caisse;
   - activites;
   - notifications;
   - sous-utilisateurs;
   - feedbacks.
2. Il retire `motDePasse` des sous-utilisateurs.
3. Il construit un JSON versionne.
4. Il renvoie un fichier `lumo_sauvegarde_YYYY-MM-DD.json`.

### Export email

Route:

- `GET /api/backup/email`

Fonctionnement:

1. Meme collecte que l'export fichier.
2. Le JSON est attache a un email.
3. L'email est envoye a `req.user.email`.

### Import sauvegarde

Route:

- `POST /api/backup/import`

Fonctionnement:

1. Ouvre une transaction SQL.
2. Valide que le fichier contient `version` et `data`.
3. Restaure:
   - produits par upsert;
   - clients par telephone;
   - fournisseurs par email;
   - achats si pas de doublon apparent;
   - ventes si pas de doublon apparent;
   - mouvements;
   - sessions;
   - activites;
   - notifications;
   - feedbacks;
   - sous-utilisateurs avec mot de passe temporaire `Lumo1234`.
4. Commit si tout passe, rollback sinon.

### Preview sauvegarde

Route:

- `POST /api/backup/preview`

Retourne seulement version, date export et compteurs par collection.

Point de vigilance:

- Le document de code montre `autoBackupEnabled` et `backupTime` dans les preferences frontend, mais aucun cron automatique par utilisateur n'est visible dans les controleurs/routes analyses. La sauvegarde email existe, mais l'automatisation planifiee doit etre confirmee ou implementee cote serveur.

## Landing page, contact, visites et newsletter

Frontend:

- `client/src/pages/Landing.tsx`

Backend:

- `server/routes/contactRoutes.js`
- `server/routes/newsletterRoutes.js`
- `server/controllers/newsletterController.js`

Visites:

1. Au chargement landing, le frontend cree une cle sessionStorage par jour.
2. Il envoie `POST /api/contact/visit` avec:
   - path;
   - referrer;
   - user agent;
   - langue navigateur.
3. Le backend stocke/compte ces donnees selon la route contact.

Messages contact:

1. Le formulaire envoie nom, email, message.
2. Le backend cree un message landing.
3. Le superadmin peut les consulter via `landing-inbox`.

Newsletter:

1. Le formulaire envoie email a `/newsletter/subscribe`.
2. Le backend enregistre l'email.
3. Il peut envoyer un email de bienvenue via `getNewsletterWelcomeTemplate`.

## Super admin

Frontend:

- `client/src/pages/SuperAdminDashboard.tsx`

Backend:

- routes: `server/routes/superadminRoutes.js`
- controleur: `server/controllers/superAdminController.js`
- modeles: `User`, `GlobalSetting`, `Newsletter`, `Feedback` et autres selon stats.

Routes principales:

- `GET /api/superadmin/users`
- `PUT /api/superadmin/users/:id/suspend`
- `PUT /api/superadmin/users/:id/validate`
- `PUT /api/superadmin/users/:id/verify`
- `POST /api/superadmin/users/:id/impersonate`
- `DELETE /api/superadmin/users/:id`
- `GET /api/superadmin/logs`
- `GET /api/superadmin/stats`
- `GET /api/superadmin/newsletter`
- `GET /api/superadmin/landing-inbox`
- `POST /api/superadmin/notify`
- `GET /api/superadmin/settings`
- `POST /api/superadmin/settings`

Fonctionnement:

- Toutes les routes superadmin passent par `protect` puis `authorize('superadmin')`.
- Le superadmin gere:
  - utilisateurs;
  - suspension;
  - validation;
  - verification email;
  - impersonation;
  - logs;
  - stats globales;
  - newsletter;
  - messages landing;
  - notifications globales;
  - settings globaux, dont maintenance.

## IA

Frontend:

- selon integration assistant/chat.

Backend:

- routes: `server/routes/aiRoutes.js`
- controleur: `server/controllers/aiController.js`

Routes:

- `GET /api/ai/insights`
- `POST /api/ai/chat`
- `GET /api/ai/chat/history`
- `POST /api/ai/feedback`
- `POST /api/ai/public-chat`

Fonctionnement general:

- Les endpoints proteges utilisent les donnees du tenant.
- L'historique de chat peut etre stocke dans `User.chatHistory`.
- Le chat public sert probablement au landing ou a une aide non connectee.

## Modules de securite serveur

Fichier:

- `server/middleware/security.js`

Fonctions:

- Helmet.
- XSS clean.
- HPP.
- CORS.
- Cookie parser.
- Rate limiting global `/api`.
- Rate limiting auth sur login, register, forgot-password.

CSRF:

- `server/middleware/csrfMiddleware.js`
- Le middleware CSRF existe mais la protection est commentee dans le fichier analyse.

## Cache

Fichier:

- `server/utils/cache.js`

Utilisation:

- `statsRoutes` met en cache:
  - dashboard 600 secondes;
  - sales-chart 300 secondes;
  - analytics 300 secondes.
- `productRoutes` met en cache la liste produits 300 secondes.
- Les controleurs produits/ventes invalident `products` et/ou `stats`.

Point de vigilance:

- Si un module modifie des donnees sans invalider le cache correspondant, le dashboard peut afficher des anciennes valeurs jusqu'a expiration du cache.

## Devises et logique de conversion

Frontend:

- `client/src/utils/currencyHelpers.ts`
- `client/src/store/useAuthStore.ts`
- `client/src/store/useCartStore.ts`
- `client/src/utils/printHelpers.ts`

Backend:

- `server/utils/currency.js`
- conversions manuelles dans `SaleController`, `purchaseController`, `cashController`.

Regles principales:

- La devise boutique vient de `user.entreprise.devise`.
- La devise d'affichage UI vient souvent de `user.preferences.currency`.
- Le taux vient de `user.preferences.exchangeRate`.
- Une vente garde aussi son `tauxChange` historique.
- `FC` doit etre traite comme `CDF`.

Regle recommandee:

- Pour les donnees stockees: utiliser la devise boutique.
- Pour les donnees affichees: convertir vers la devise choisie par l'utilisateur.
- Pour les documents historiques: utiliser le taux stocke sur la vente, pas le taux actuel.

## Donnees principales par modele

### User

- Identite: nom, email, telephone, avatar.
- Auth: motDePasse, activeSessions, resetPasswordToken, resetPasswordExpire.
- Verification: isVerified, isAdminValidated, verificationCode.
- Role: role, permissions, parentId.
- 2FA: twoFactorEnabled, twoFactorCode, twoFactorExpire, twoFactorSecret.
- Business: entreprise, typeActivite.
- Preferences: theme, language, enabledModules, exchangeRate, autoBackupEnabled.

### Product

- nom, description, prix, prixAchat, stock, stockAlerte.
- categorie, codeBarre, image, unite, devise.
- metadata, variantes.
- userId, creatorId.

### Sale

- userId, clientId, sellerId.
- articles JSONB.
- montantTotal.
- remise.
- profitNet.
- methodePaiement.
- statut.
- clientInfo.
- devise.
- tauxChange.
- devisePaiement.
- montantRecu.

### Purchase

- userId.
- fournisseurId.
- numeroFacture.
- description.
- montantTotal.
- statut.
- devise.
- articles.

### CashSession

- userId.
- openingBalance.
- expectedBalance.
- closingBalance.
- totalSales.
- totalExpenses.
- openingTime.
- closingTime.
- status.
- note.

### Client

- userId.
- nom.
- email.
- telephone.
- adresse.
- detteTotale.

### StockMovement

- productId.
- userId.
- type `ENTREE` ou `SORTIE`.
- quantite.
- ancienStock.
- nouveauStock.
- raison.

## Points de vigilance detectes pendant l'analyse

1. Analytics avancees: `totals.profit` vaut actuellement `totalRevenue`, donc ce n'est pas une vraie marge nette.
2. Rappel dette: la devise email est codee en `CDF`.
3. Sauvegarde automatique planifiee: les preferences existent, l'export email existe, mais le cron par utilisateur n'est pas visible dans les fichiers analyses.
4. Facture/ticket: les totaux ont ete corriges pour utiliser la devise de vente et le taux historique; il faut verifier que chaque ligne article suit toujours la bonne devise.
5. Caisse: les commentaires disent parfois CDF alors que la logique devrait parler de devise boutique.
6. Backup: plusieurs requetes utilisent `req.user.id`; pour un sous-utilisateur, il faut preferer `req.user.tenantId`.
7. Verification email: l'expiration du premier OTP n'est pas clairement appliquee dans `verifyEmail`.

## Carte rapide des endpoints

Auth:

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/profile`
- `PUT /api/auth/profile`
- `POST /api/auth/verify-email`
- `POST /api/auth/resend-code`
- `POST /api/auth/forgot-password`
- `POST /api/auth/verify-reset-code`
- `POST /api/auth/reset-password`
- `POST /api/auth/refresh`
- `POST /api/auth/logout`
- `GET /api/auth/2fa/setup`
- `POST /api/auth/2fa/activate`
- `POST /api/auth/2fa/disable`
- `POST /api/auth/2fa/verify`

Produits:

- `GET /api/products`
- `POST /api/products`
- `PUT /api/products/:id`
- `DELETE /api/products/:id`
- `POST /api/products/bulk`
- `DELETE /api/products/all`
- `GET /api/products/:id/history`
- `GET /api/products/all/history`

Ventes:

- `GET /api/sales`
- `POST /api/sales`
- `PUT /api/sales/:id`
- `DELETE /api/sales/:id`
- `DELETE /api/sales/all`
- `POST /api/sales/:id/refund`

Achats:

- `GET /api/purchases`
- `POST /api/purchases`
- `PUT /api/purchases/:id`
- `DELETE /api/purchases/:id`

Caisse:

- `GET /api/cash/current`
- `POST /api/cash/open`
- `POST /api/cash/close`
- `GET /api/cash/history`
- `DELETE /api/cash/:id`

Clients:

- `GET /api/clients`
- `POST /api/clients`
- `PUT /api/clients/:id`
- `DELETE /api/clients/:id`
- `DELETE /api/clients/all`
- `GET /api/clients/:id/sales`
- `POST /api/clients/:id/regler`
- `POST /api/clients/:id/rappel`

Stats:

- `GET /api/stats/dashboard`
- `GET /api/stats/sales-chart`
- `GET /api/stats/analytics`

Equipe:

- `POST /api/sub-users`
- `GET /api/sub-users`
- `PUT /api/sub-users/:id`
- `DELETE /api/sub-users/:id`

Sauvegardes:

- `GET /api/backup/export`
- `GET /api/backup/email`
- `POST /api/backup/import`
- `POST /api/backup/preview`

Superadmin:

- `GET /api/superadmin/users`
- `PUT /api/superadmin/users/:id/suspend`
- `PUT /api/superadmin/users/:id/validate`
- `PUT /api/superadmin/users/:id/verify`
- `POST /api/superadmin/users/:id/impersonate`
- `DELETE /api/superadmin/users/:id`
- `GET /api/superadmin/logs`
- `GET /api/superadmin/stats`
- `GET /api/superadmin/newsletter`
- `GET /api/superadmin/landing-inbox`
- `POST /api/superadmin/notify`
- `GET /api/superadmin/settings`
- `POST /api/superadmin/settings`

Landing/newsletter/contact:

- `POST /api/contact`
- `POST /api/contact/visit`
- `POST /api/newsletter/subscribe`

IA:

- `GET /api/ai/insights`
- `POST /api/ai/chat`
- `GET /api/ai/chat/history`
- `POST /api/ai/feedback`
- `POST /api/ai/public-chat`

## Methode pour maintenir cette documentation

Quand une fonctionnalite change:

1. Modifier le code.
2. Mettre a jour la section du module concerne.
3. Ajouter les nouveaux endpoints dans la carte rapide.
4. Documenter les nouveaux calculs.
5. Ajouter les points de vigilance si une logique depend d'une devise, d'un role, d'un cache ou d'un cron.

