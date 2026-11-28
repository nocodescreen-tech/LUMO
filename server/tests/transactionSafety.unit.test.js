const {pick,positiveQuantity,money,trustedLine,rateFor,isCredit}=require('../utils/transactionSafety');
describe('Commercial safety',()=>{
 test('immutable tenant fields cannot be updated',()=>expect(pick({nom:'A',userId:99,id:3},['nom'])).toEqual({nom:'A'}));
 test('invalid quantity and money rejected',()=>{expect(()=>positiveQuantity(-1)).toThrow();expect(()=>positiveQuantity(1.5)).toThrow();expect(()=>money(-1)).toThrow()});
 test('server catalogue price is authoritative',()=>{const p={prix:10,prixAchat:3,devise:'USD'};expect(trustedLine(p,{prix:22500,quantite:2},'CDF',2250).unit).toBe(22500);expect(()=>trustedLine(p,{prix:1,quantite:2},'CDF',2250)).toThrow()});
 test('tenant rate and credit detection',()=>{expect(rateFor({preferences:{exchangeRate:2500}})).toBe(2500);expect(()=>rateFor({})).toThrow();expect(isCredit('Crédit')).toBe(true)});
});
