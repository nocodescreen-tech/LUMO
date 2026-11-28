const { pick }=require('../utils/transactionSafety');
const Fournisseur = require('../models/Fournisseur');
const { validateFournisseur } = require('../middleware/validators');
const { getPagination, getPagingData } = require('../utils/pagination');

exports.getFournisseurs = async (req, res, next) => {
  try {
    const userId = req.user.tenantId;
    const { page, limit } = req.query;
    const { limit: l, offset } = getPagination(page, limit);

    const data = await Fournisseur.findAndCountAll({ 
      where: { userId },
      order: [['entreprise', 'ASC']],
      limit: l,
      offset
    });

    const response = getPagingData(data, page, l);
    const { sendResponse } = require('../utils/response');
    sendResponse(res, 200, response, 'Fournisseurs récupérés');
  } catch (error) {
    next(error);
  }
};

exports.createFournisseur = async (req, res, next) => {
  // Normalize: if frontend doesn't send 'entreprise', derive it from 'nom'
  if (!req.body.entreprise && req.body.nom) {
    req.body.entreprise = req.body.nom;
  }
  const { error } = validateFournisseur(req.body);
  if (error) return res.status(400).json({ message: error.details[0].message });

  try {
    const userId = req.user.tenantId;
    const fournisseur = await Fournisseur.create({ ...pick(req.body,['nom','entreprise','email','telephone','adresse','categorie']), userId });
    await logActivite(req.user.id, 'FOURNISSEUR', `Nouveau fournisseur: ${req.body.nom || req.body.entreprise}`, 'Achats', userId);
    const { sendResponse } = require('../utils/response');
    sendResponse(res, 201, fournisseur, 'Fournisseur créé');
  } catch (error) {
    next(error);
  }
};

exports.updateFournisseur = async (req, res, next) => {
  // Normalize: if frontend doesn't send 'entreprise', derive it from 'nom'
  if (!req.body.entreprise && req.body.nom) {
    req.body.entreprise = req.body.nom;
  }
  const { error } = validateFournisseur(req.body);
  if (error) return res.status(400).json({ message: error.details[0].message });

  try {
    const userId = req.user.tenantId;
    const fournisseur = await Fournisseur.findOne({ where: { id: req.params.id, userId } });
    if (!fournisseur) return res.status(404).json({ message: 'Fournisseur non trouvé' });
    await fournisseur.update(pick(req.body,['nom','entreprise','email','telephone','adresse','categorie']));
    await logActivite(req.user.id, 'FOURNISSEUR', `Mise à jour fournisseur: ${fournisseur.nom}`, 'Achats', userId);
    const { sendResponse } = require('../utils/response');
    sendResponse(res, 200, fournisseur, 'Fournisseur mis à jour');
  } catch (error) {
    next(error);
  }
};

exports.deleteFournisseur = async (req, res, next) => {
  try {
    const userId = req.user.tenantId;
    const fournisseur = await Fournisseur.findOne({ where: { id: req.params.id, userId } });
    if (!fournisseur) return res.status(404).json({ message: 'Fournisseur non trouvé' });
        const fNom = fournisseur.nom;
    await fournisseur.destroy();
    await logActivite(req.user.id, 'FOURNISSEUR', `Suppression fournisseur: ${fNom}`, 'Achats', fournisseur.userId);
    const { sendResponse } = require('../utils/response');
    sendResponse(res, 200, null, 'Fournisseur supprimé');
  } catch (error) {
    next(error);
  }
};
