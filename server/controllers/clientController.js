const Client = require('../models/Client');

exports.getClients = async (req, res, next) => {
  try {
    const clients = await Client.findAll({ order: [['nom', 'ASC']] });
    res.status(200).json(clients);
  } catch (error) {
    next(error);
  }
};

exports.createClient = async (req, res, next) => {
  try {
    const client = await Client.create(req.body);
    res.status(201).json(client);
  } catch (error) {
    next(error);
  }
};

exports.updateClient = async (req, res, next) => {
  try {
    const client = await Client.findByPk(req.params.id);
    if (!client) return res.status(404).json({ message: 'Client non trouvé' });
    await client.update(req.body);
    res.status(200).json(client);
  } catch (error) {
    next(error);
  }
};

exports.deleteClient = async (req, res, next) => {
  try {
    const client = await Client.findByPk(req.params.id);
    if (!client) return res.status(404).json({ message: 'Client non trouvé' });
    await client.destroy();
    res.status(200).json({ message: 'Client supprimé' });
  } catch (error) {
    next(error);
  }
};

exports.settleDebt = async (req, res, next) => {
  try {
    const { montant } = req.body;
    const client = await Client.findByPk(req.params.id);
    if (!client) return res.status(404).json({ message: 'Client non trouvé' });
    client.detteTotale -= parseFloat(montant);
    await client.save();
    res.status(200).json(client);
  } catch (error) {
    next(error);
  }
};

exports.sendReminder = async (req, res, next) => {
    res.status(200).json({ success: true, message: 'Rappel envoyé' });
};
