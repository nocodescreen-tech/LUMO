const Depense = require('../models/Depense');
const { validateDepense } = require('../middleware/validators');
const { logActivite } = require('./activiteController');
const { getPagination, getPagingData } = require('../utils/pagination');
const { convertCurrency } = require('../utils/currency');
const { User } = require('../models');

exports.getDepenses = async (req, res, next) => {
  try {
    const userId = req.user.tenantId;
    const { page, limit } = req.query;
    const { limit: l, offset } = getPagination(page, limit);

    const data = await Depense.findAndCountAll({ 
      where: { userId },
      order: [['date', 'DESC']],
      limit: l,
      offset
    });

    const response = getPagingData(data, page, l);
    const { sendResponse } = require('../utils/response');
    sendResponse(res, 200, response, 'Dépenses récupérées');
  } catch (error) {
    next(error);
  }
};

exports.createDepense = async (req, res, next) => {
  const { error } = validateDepense(req.body);
  if (error) return res.status(400).json({ message: error.details[0].message });

  try {
    const userId = req.user.tenantId;
    const depense = await Depense.create({ ...req.body, userId });

    // Mise à jour de la session de caisse active
    const { CashSession } = require('../models');
    const activeSession = await CashSession.findOne({ 
      where: { userId, status: 'OPEN' } 
    });

    if (activeSession) {
      // Récupérer le taux de change de l'entreprise
      const owner = await User.findByPk(userId);
      const rate = owner.entreprise?.exchangeRate || 2800;
      const sessionDevise = owner.entreprise?.devise || 'CDF';

      // Convertir le montant de la dépense dans la devise de la session
      const montantConverti = convertCurrency(
        req.body.montant || 0, 
        req.body.devise || 'USD', 
        sessionDevise, 
        rate
      );

      activeSession.expectedBalance = Number(activeSession.expectedBalance || 0) - Number(montantConverti);
      await activeSession.save();
    }

    await logActivite(req.user.id, 'DEPENSE', `Nouvelle dépense: ${depense.titre} (${depense.montant} ${depense.devise})`, 'System', userId);
    const { sendResponse } = require('../utils/response');
    sendResponse(res, 201, depense, 'Dépense créée');
  } catch (error) {
    next(error);
  }
};

exports.updateDepense = async (req, res, next) => {
  const { error } = validateDepense(req.body);
  if (error) return res.status(400).json({ message: error.details[0].message });

  try {
    const userId = req.user.tenantId;
    const depense = await Depense.findOne({ where: { id: req.params.id, userId } });
    if (!depense) return res.status(404).json({ message: 'Dépense non trouvée' });
    await depense.update(req.body);
    const { sendResponse } = require('../utils/response');
    sendResponse(res, 200, depense, 'Dépense mise à jour');
  } catch (error) {
    next(error);
  }
};

exports.deleteDepense = async (req, res, next) => {
  try {
    const userId = req.user.tenantId;
    const depense = await Depense.findOne({ where: { id: req.params.id, userId } });
    if (!depense) return res.status(404).json({ message: 'Dépense non trouvée' });
    const titreDepense = depense.titre;
    await depense.destroy();
    await logActivite(req.user.id, 'DEPENSE', `Suppression dépense: ${titreDepense}`, 'System', userId);
    const { sendResponse } = require('../utils/response');
    sendResponse(res, 200, null, 'Dépense supprimée');
  } catch (error) {
    next(error);
  }
};
