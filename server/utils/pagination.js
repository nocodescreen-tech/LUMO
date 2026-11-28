// Bound the legacy list endpoints without changing their response shape.
const bounded=(value,fallback,max)=>{
 if(typeof value!=='string'&&typeof value!=='number')return fallback;
 const n=Number(value);
 return Number.isSafeInteger(n)&&n>0?Math.min(n,max):fallback;
};
const getPagination=(page,limit)=>{
 const l=bounded(limit,10,500),p=bounded(page,1,100000);
 return {limit:l,offset:(p-1)*l};
};
const getPagingData=(data,page,limit)=>{
 const l=bounded(limit,10,500),p=bounded(page,1,100000);
 return {data:data.rows,pagination:{total:data.count,page:p,limit:l,pages:Math.ceil(data.count/l)}};
};
module.exports={getPagination,getPagingData};
