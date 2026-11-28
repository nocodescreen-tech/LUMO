const express = require('express');
const router = express.Router();
const { subscribe } = require('../controllers/newsletterController');

router.post('/subscribe', require('express-rate-limit')({windowMs:15*60*1000,max:5,standardHeaders:true,legacyHeaders:false}), subscribe);

module.exports = router;
