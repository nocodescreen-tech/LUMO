const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const bcrypt = require('bcryptjs');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  nom: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: { msg: 'Le nom est requis' },
    },
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      isEmail: { msg: 'Veuillez entrer un email valide' },
      notNull: { msg: "L'email est requis" },
    },
  },
  motDePasse: {
    type: DataTypes.STRING,
    // Autorisé à NULL pour supporter d'anciens enregistrements sans mot de passe
    allowNull: true,
  },
  // Rôle stocké en texte simple pour éviter les problèmes de migration ENUM
  role: {
    type: DataTypes.STRING,
    defaultValue: 'admin',
  },
  telephone: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  typeActivite: {
    type: DataTypes.STRING,
    defaultValue: 'Boutique',
  },
  avatar: {
    type: DataTypes.STRING,
    defaultValue: 'default_avatar.png',
  },
  isVerified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  isAdminValidated: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  isSuspended: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  verificationCode: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  resetPasswordToken: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  resetPasswordExpire: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  entreprise: {
    type: DataTypes.JSONB,
    defaultValue: {
      nom: '',
      logo: '',
      devise: 'FC',
      adresse: '',
    },
  },
  preferences: {
    type: DataTypes.JSONB,
    defaultValue: {
      theme: 'light',
      language: 'fr',
      enabledModules: [],
    },
  },
  lastActivity: {
    type: DataTypes.DATE,
    allowNull: true,
  },
}, {
  timestamps: true,
  hooks: {
    beforeSave: async (user) => {
      if (user.changed('motDePasse')) {
        const salt = await bcrypt.genSalt(10);
        user.motDePasse = await bcrypt.hash(user.motDePasse, salt);
      }
    },
  },
});

User.prototype.matchMotDePasse = async function (enteredPassword) {
  if (!this.motDePasse) return false;
  return bcrypt.compare(enteredPassword, this.motDePasse);
};

module.exports = User;

