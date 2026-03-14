const User = require('../models/User');
const jwt = require('jsonwebtoken');
const config = require('../config');

const generateToken = (id) => {
  return jwt.sign({ id }, config.jwt.secret, {
    expiresIn: config.jwt.expire
  });
};

exports.register = async (req, res, next) => {
  try {
    const { nom, email, password, role } = req.body;
    const user = await User.create({ nom, email, password, role });
    const token = generateToken(user.id);
    res.status(201).json({ success: true, token, user: { id: user.id, nom: user.nom, email: user.email, role: user.role } });
  } catch (error) {
    next(error);
  }
};

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ where: { email } });

    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: 'Identifiants invalides' });
    }

    const token = generateToken(user.id);
    res.status(200).json({ success: true, token, user: { id: user.id, nom: user.nom, email: user.email, role: user.role } });
  } catch (error) {
    next(error);
  }
};

exports.getProfile = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.user.id, { attributes: { exclude: ['password'] } });
    res.status(200).json({ success: true, user });
  } catch (error) {
    next(error);
  }
};
