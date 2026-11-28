const {getPagination,getPagingData}=require('../utils/pagination');
describe('bounded legacy paging',()=>{
 test('defaults and bounds',()=>{expect(getPagination(undefined,undefined)).toEqual({limit:10,offset:0});expect(getPagination('2','9000')).toEqual({limit:500,offset:500});expect(getPagination('-1','-2')).toEqual({limit:10,offset:0});expect(getPagination('Infinity','abc')).toEqual({limit:10,offset:0});expect(getPagination(['1'],'2.5')).toEqual({limit:10,offset:0})});
 test('metadata matches actual limits',()=>{expect(getPagingData({rows:[],count:1001},'2','9000').pagination).toEqual({total:1001,page:2,limit:500,pages:3})});
});
