const Fournisseur = require('../models/Fournisseur');

exports.getFournisseurs = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const fournisseurs = await Fournisseur.findAll({ 
      where: { userId },
      order: [['entreprise', 'ASC']] 
    });
    res.status(200).json(fournisseurs);
  } catch (error) {
    next(error);
  }
};

exports.createFournisseur = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const fournisseur = await Fournisseur.create({ ...req.body, userId });
    res.status(201).json(fournisseur);
  } catch (error) {
    next(error);
  }
};

exports.updateFournisseur = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const fournisseur = await Fournisseur.findOne({ where: { id: req.params.id, userId } });
    if (!fournisseur) return res.status(404).json({ message: 'Fournisseur non trouvé' });
    await fournisseur.update(req.body);
    res.status(200).json(fournisseur);
  } catch (error) {
    next(error);
  }
};

exports.deleteFournisseur = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const fournisseur = await Fournisseur.findOne({ where: { id: req.params.id, userId } });
    if (!fournisseur) return res.status(404).json({ message: 'Fournisseur non trouvé' });
    await fournisseur.destroy();
    res.status(200).json({ message: 'Fournisseur supprimé' });
  } catch (error) {
    next(error);
  }
};
