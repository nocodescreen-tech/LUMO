const helmet=require('helmet');
// This is an API origin, not the React SPA. It does not need inline scripts/styles.
// Explicitly enabled Swagger has its own limited policy.
const strict=helmet({contentSecurityPolicy:{useDefaults:false,directives:{
 defaultSrc:["'none'"],scriptSrc:["'none'"],styleSrc:["'none'"],objectSrc:["'none'"],baseUri:["'none'"],frameAncestors:["'none'"],formAction:["'none'"]
}}});
const docs=helmet({contentSecurityPolicy:{directives:{frameAncestors:["'none'"],objectSrc:["'none'"],scriptSrc:["'self'"],styleSrc:["'self'","'unsafe-inline'"],imgSrc:["'self'","data:"],fontSrc:["'self'","data:"]}}});
function backendHeaders(req,res,next){
 const enabled=process.env.NODE_ENV!=='production'||process.env.LUMO_PUBLIC_API_DOCS==='true';
 const swagger=enabled&&(req.path==='/api-docs'||req.path.startsWith('/api-docs/'));
 return (swagger?docs:strict)(req,res,next);
}
module.exports=backendHeaders;
