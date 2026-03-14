const Fournisseur = require('../models/Fournisseur');

exports.getFournisseurs = async (req, res, next) => {
  try {
    const fournisseurs = await Fournisseur.findAll({ order: [['entreprise', 'ASC']] });
    res.status(200).json(fournisseurs);
  } catch (error) {
    next(error);
  }
};

exports.createFournisseur = async (req, res, next) => {
  try {
    const fournisseur = await Fournisseur.create(req.body);
    res.status(201).json(fournisseur);
  } catch (error) {
    next(error);
  }
};

exports.updateFournisseur = async (req, res, next) => {
  try {
    const fournisseur = await Fournisseur.findByPk(req.params.id);
    if (!fournisseur) return res.status(404).json({ message: 'Fournisseur non trouvé' });
    await fournisseur.update(req.body);
    res.status(200).json(fournisseur);
  } catch (error) {
    next(error);
  }
};

exports.deleteFournisseur = async (req, res, next) => {
  try {
    const fournisseur = await Fournisseur.findByPk(req.params.id);
    if (!fournisseur) return res.status(404).json({ message: 'Fournisseur non trouvé' });
    await fournisseur.destroy();
    res.status(200).json({ message: 'Fournisseur supprimé' });
  } catch (error) {
    next(error);
  }
};
