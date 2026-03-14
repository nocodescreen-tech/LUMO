const Depense = require('../models/Depense');

exports.getDepenses = async (req, res, next) => {
  try {
    const depenses = await Depense.findAll({ order: [['date', 'DESC']] });
    res.status(200).json(depenses);
  } catch (error) {
    next(error);
  }
};

exports.createDepense = async (req, res, next) => {
  try {
    const depense = await Depense.create(req.body);
    res.status(201).json(depense);
  } catch (error) {
    next(error);
  }
};

exports.updateDepense = async (req, res, next) => {
  try {
    const depense = await Depense.findByPk(req.params.id);
    if (!depense) return res.status(404).json({ message: 'Dépense non trouvée' });
    await depense.update(req.body);
    res.status(200).json(depense);
  } catch (error) {
    next(error);
  }
};

exports.deleteDepense = async (req, res, next) => {
  try {
    const depense = await Depense.findByPk(req.params.id);
    if (!depense) return res.status(404).json({ message: 'Dépense non trouvée' });
    await depense.destroy();
    res.status(200).json({ message: 'Dépense supprimée' });
  } catch (error) {
    next(error);
  }
};
