const logger=require('../utils/logger');
module.exports=(err,req,res,next)=>{
 if(res.headersSent)return next(err);
 const candidate=Number(err.statusCode||err.status||500),statusCode=Number.isInteger(candidate)&&candidate>=400&&candidate<=599?candidate:500;
 // Do not log raw messages, SQL, request bodies, or URL query values.
 logger[statusCode>=500?'error':'warn']('HTTP failure '+statusCode+' request='+String(req.operationRequestId||'unassigned'));
 res.status(statusCode).json({success:false,message:statusCode>=500?'Erreur Serveur Interne':(err.message||'Requête invalide'),requestId:req.operationRequestId||null});
};
