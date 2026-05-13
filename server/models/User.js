const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const bcrypt = require('bcryptjs');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  tenantId: {
    type: DataTypes.VIRTUAL,
    get() {
      return this.parentId || this.id;
    }
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
    allowNull: false,
    // NOTE: Password strength validation is done at the controller/validator level,
    // NOT here in the model, because this hook also runs on already-hashed bcrypt values
    // which would fail a regex check and corrupt the stored hash.
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
  // 2FA fields
  twoFactorEnabled: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  twoFactorCode: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  twoFactorExpire: {
    type: DataTypes.BIGINT,
    allowNull: true,
  },
  twoFactorSecret: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  entreprise: {
    type: DataTypes.JSONB,
    defaultValue: {
      nom: '',
      logo: '',
      devise: 'CDF',
      adresse: '',
      exchangeRate: 2800,
    },
  },
  preferences: {
    type: DataTypes.JSONB,
    defaultValue: {
      theme: 'light',
      language: 'fr',
      enabledModules: [],
      autoBackupEnabled: false,
    },
  },
  lastActivity: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  chatHistory: {
    type: DataTypes.JSONB,
    defaultValue: []
  },
  parentId: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  activeSessions: {
    type: DataTypes.JSONB,
    defaultValue: [], // Array of session objects
  },
  permissions: {
    type: DataTypes.JSONB,
    defaultValue: [], // Array of module IDs
  },
}, {
  timestamps: true,
  indexes: [
    { unique: true, fields: ['email'] },
    { fields: ['parentId'] },
    { fields: ['role'] }
  ],
  hooks: {
    beforeSave: async (user) => {
      // Guard: only hash if motDePasse changed AND it's not already a bcrypt hash
      // Bcrypt hashes always start with '$2a$' or '$2b$' — re-hashing them would break login
      if (user.changed('motDePasse') && user.motDePasse) {
        const alreadyHashed = user.motDePasse.startsWith('$2a$') || user.motDePasse.startsWith('$2b$');
        if (!alreadyHashed) {
          const salt = await bcrypt.genSalt(10);
          user.motDePasse = await bcrypt.hash(user.motDePasse, salt);
        }
      }
    },
  },
});

User.prototype.matchMotDePasse = async function (enteredPassword) {
  if (!this.motDePasse) return false;
  return bcrypt.compare(enteredPassword, this.motDePasse);
};

module.exports = User;

