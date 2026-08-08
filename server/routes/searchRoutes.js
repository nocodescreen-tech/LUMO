const express = require('express');
const router = express.Router();
const { Op } = require('sequelize');
const { Product, Client, Sale, Fournisseur } = require('../models');
const { protect } = require('../middleware/authMiddleware');

router.get('/', protect, async (req, res) => {
  try {
    const userId = req.user.tenantId;
    const q = req.query.q?.trim();
    if (!q || q.length < 2) return res.json([]);

    const [products, clients, sales, fournisseurs] = await Promise.all([
      Product.findAll({ where: { userId, nom: { [Op.iLike]: '%' + q + '%' } }, limit: 5, attributes: ['id','nom','prix','devise','stock'] }),
      Client.findAll({ where: { userId, nom: { [Op.iLike]: '%' + q + '%' } }, limit: 5, attributes: ['id','nom','telephone'] }),
      Sale.findAll({ where: { userId, [Op.or]: [{ 'clientInfo.nom': { [Op.iLike]: '%' + q + '%' } }] }, limit: 5, order: [['createdAt','DESC']] }),
      Fournisseur.findAll({ where: { userId, nom: { [Op.iLike]: '%' + q + '%' } }, limit: 3, attributes: ['id','nom'] }),
    ]);

    res.json({ products, clients, sales: sales.map(s => ({ id: s.id, client: s.clientInfo?.nom, total: s.montantTotal, devise: s.devise })), fournisseurs });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

module.exports = router;
