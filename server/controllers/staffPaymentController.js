const { StaffPayment, User } = require('../models');
const { sendResponse } = require('../utils/response');

exports.createPayment = async (req, res) => {
  try {
    const { staffId, amount, devise, type, date, note } = req.body;
    const userId = req.tenantId;

    // Check if staff member belongs to the tenant
    const staffMember = await User.findOne({
      where: { id: staffId, parentId: userId }
    });

    if (!staffMember) {
      return res.status(404).json({ success: false, message: 'Membre d’équipe non trouvé' });
    }

    const payment = await StaffPayment.create({
      userId,
      staffId,
      amount,
      devise: devise || 'USD',
      type: type || 'SALAIRE',
      date: date || new Date(),
      note
    });

    sendResponse(res, 201, payment, 'Paiement enregistré avec succès');
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getStaffPayments = async (req, res) => {
  try {
    const userId = req.tenantId;
    const { staffId } = req.query;

    const whereClause = { userId };
    if (staffId) {
      whereClause.staffId = staffId;
    }

    const payments = await StaffPayment.findAll({
      where: whereClause,
      order: [['date', 'DESC']],
      include: [
        { model: User, as: 'member', attributes: ['nom', 'email'] }
      ]
    });

    sendResponse(res, 200, payments, 'Paiements récupérés');
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.deletePayment = async (req, res) => {
    try {
      const payment = await StaffPayment.findOne({
        where: { id: req.params.id, userId: req.tenantId }
      });
  
      if (!payment) {
        return res.status(404).json({ success: false, message: 'Paiement non trouvé' });
      }
  
      await payment.destroy();
      sendResponse(res, 200, null, 'Paiement supprimé');
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
};
