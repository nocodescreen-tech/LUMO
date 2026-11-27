const ledger=require('../utils/commercialLedger');
const { pick, fail, money, currency, round }=require('../utils/transactionSafety');
const {sequelize}=require('../config/database');
const Client = require('../models/Client');
const {Op}=require('sequelize');
const { validateClient } = require('../middleware/validators');
const { sendEmail, getDebtReminderTemplate } = require('../utils/emailService');
const { logActivite } = require('./activiteController');
const { getPagination, getPagingData } = require('../utils/pagination');

exports.getClients = async (req, res, next) => {
  try {
    const userId = req.user.tenantId;
    const page=Math.max(1,Math.min(100000,parseInt(req.query.page)||1)),l=Math.max(1,Math.min(100,parseInt(req.query.limit)||10)),offset=(page-1)*l;
    const where={userId};
    if(typeof req.query.q==='string'&&req.query.q.trim()){
      const q=req.query.q.trim().slice(0,100),pattern='%'+q.replace(/[\\%_]/g,v=>'\\'+v)+'%';
      where[Op.or]=['nom','email','telephone','adresse'].map(k=>({[k]:{[Op.iLike]:pattern}}));
      if(/^#?\d+$/.test(q)&&Number.isSafeInteger(Number(q.replace('#','')))&&Number(q.replace('#',''))<=2147483647)where[Op.or].push({id:Number(q.replace('#',''))});
    }
    if(req.query.debt==='open')where.detteTotale={[Op.gt]:0};
    if(req.query.debt==='none')where.detteTotale={[Op.lte]:0};
    const data = await Client.findAndCountAll({
      where,
      order: [['nom', 'ASC'],['id','ASC']],
      limit: l,
      offset
    });

    const response = getPagingData(data, page, l);
    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

exports.createClient = async (req, res, next) => {
  const { error } = validateClient(req.body);
  if (error) return res.status(400).json({ message: error.details[0].message });

  try {
    const userId = req.user.tenantId;
    
    const client = await Client.create({ ...pick(req.body,['nom','email','telephone','adresse']), userId });
    await logActivite(req.user.id, 'CLIENT', `Nouveau client: ${client.nom}`, 'System', userId);
    const { sendResponse } = require('../utils/response');
    sendResponse(res, 201, client, 'Client créé avec succès');
  } catch (error) {
    next(error);
  }
};

exports.updateClient = async (req, res, next) => {
  const { error } = validateClient(req.body);
  if (error) return res.status(400).json({ message: error.details[0].message });

  try {
    const userId = req.user.tenantId;
    
    const client = await Client.findOne({ where: { id: req.params.id, userId } });
    if (!client) return res.status(404).json({ message: 'Client non trouvé' });
    await client.update(pick(req.body,['nom','email','telephone','adresse']));
    await logActivite(req.user.id, 'CLIENT', `Mise à jour client: ${client.nom}`, 'System', userId);
    const { sendResponse } = require('../utils/response');
    sendResponse(res, 200, client, 'Client mis à jour');
  } catch (error) {
    next(error);
  }
};

exports.deleteClient = async (req, res, next) => {
  try {
    const userId = req.user.tenantId;
    const client = await Client.findOne({ where: { id: req.params.id, userId } });
    if (!client) return res.status(404).json({ message: 'Client non trouvé' });
    const nomClient = client.nom;
    return res.status(409).json({message:'Suppression désactivée pour préserver les historiques clients.'});
    await logActivite(req.user.id, 'CLIENT', `Suppression client: ${nomClient}`, 'System', userId);
    const { sendResponse } = require('../utils/response');
    sendResponse(res, 200, null, 'Client supprimé');
  } catch (error) {
    next(error);
  }
};

exports.settleDebt=async(req,res,next)=>{try{const result=await require('../utils/receivableService').settle(req);return require('../utils/response').sendResponse(res,200,result.row,'Dette réglée');}catch(e){next(e)}};

exports.sendReminder = async (req, res, next) => {
  try {
    const userId = req.user.tenantId;
    const clientId = req.params.id;
    const client = await Client.findOne({ where: { id: clientId, userId } });

    if (!client) {
      return res.status(404).json({ message: 'Client non trouvé' });
    }
    if (!client.email) {
      return res.status(400).json({ message: 'Ce client n\'a pas d\'adresse email enregistrée.' });
    }
    if (client.detteTotale <= 0) {
      return res.status(400).json({ message: 'Ce client n\'a aucune dette.' });
    }

    const userCurrency = req.user.preferences?.currency || req.user.entreprise?.devise || 'CDF';
    const html = getDebtReminderTemplate(client.nom, client.detteTotale, userCurrency);
    
    await sendEmail({
      email: client.email,
      subject: 'Rappel de paiement - Lumo',
      html
    });

    res.status(200).json({ success: true, message: `Rappel envoyé avec succès à ${client.email}` });
  } catch (error) {
    next(error);
  }
};

const { Sale } = require('../models');

exports.getClientSales = async (req, res, next) => {
  try {
    const userId = req.user.tenantId;
    const clientId = req.params.id;
    const { page, limit } = req.query;
    const { limit: l, offset } = getPagination(page, limit);

    const client = await Client.findOne({ where: { id: clientId, userId } });
    if (!client) return res.status(404).json({ message: 'Client non trouvé' });

    const where={clientId,userId};if(req.user.parentId)where.warehouseId=(await require('../utils/staffScope').location(req.user))?.id??null;
    const data = await Sale.findAndCountAll({
      where,
      order: [['createdAt', 'DESC']],
      limit: l,
      offset
    });

    data.rows=data.rows.map(row=>require('./SaleController').publicSale(row,req.user));
    const response = getPagingData(data, page, l);
    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};

exports.deleteAllClients = async (req, res, next) => {
  try {
    const userId = req.user.tenantId;
    return res.status(409).json({message:'Purge des clients désactivée.'});
    res.status(200).json({ message: 'Tous vos clients ont été supprimés' });
  } catch (error) {
    next(error);
  }
};
