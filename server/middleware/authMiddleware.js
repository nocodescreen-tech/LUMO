const jwt = require('jsonwebtoken');
const config = require('../config');
const User = require('../models/User');

exports.protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ message: 'Non autorisé, pas de jeton' });
  }

  try {
    const decoded = jwt.verify(token, config.jwt.secret);
    req.user = await User.findByPk(decoded.id);
    if (!req.user) {
        return res.status(401).json({ message: 'Utilisateur non trouvé' });
    }
    
    // Mettre à jour la dernière activité
    req.user.lastActivity = new Date();
    await req.user.save({ hooks: false }); // Pas besoin de re-hasher le mot de passe
    
    next();
  } catch (error) {
    res.status(401).json({ message: 'Non autorisé, jeton invalide' });
  }
};

exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: `Le rôle ${req.user.role} n'est pas autorisé à accéder à cette ressource` });
    }
    next();
  };
};
