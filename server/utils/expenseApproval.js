const {ExpensePolicy}=require('../models');
const {fail}=require('./transactionSafety');
const current=(uid,transaction)=>ExpensePolicy.findOne({where:{userId:uid},order:[['id','DESC']],transaction});
async function guardDirect(ctx,transaction){const policy=await current(ctx.userId,transaction);if(policy?.threshold!=null){if(policy.currency!==ctx.base)throw fail('Devise de la politique modifiée : révisez le seuil',409);if(ctx.converted>=Number(policy.threshold))throw fail('Approbation préalable requise : utilisez une demande de dépense',409);}}
module.exports={current,guardDirect};
