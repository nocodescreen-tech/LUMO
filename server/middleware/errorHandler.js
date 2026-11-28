const logger=require('../utils/logger');
module.exports=(err,req,res,next)=>{
 if(res.headersSent)return next(err);
 const candidate=Number(err.statusCode||err.status||500),statusCode=Number.isInteger(candidate)&&candidate>=400&&candidate<=599?candidate:500;
 // Do not log raw messages, SQL, request bodies, or URL query values.
 logger[statusCode>=500?'error':'warn']('HTTP failure '+statusCode+' request='+String(req.operationRequestId||'unassigned'));
 const message=statusCode>=500?'Erreur Serveur Interne':err.type==='entity.parse.failed'?'Corps JSON invalide':err.type==='entity.too.large'?'Corps de requête trop volumineux':(err.message||'Requête invalide');
 res.status(statusCode).json({success:false,message,requestId:req.operationRequestId||null});
};
