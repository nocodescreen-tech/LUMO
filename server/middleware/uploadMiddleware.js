const multer=require('multer');
const path=require('path');
const types={'.jpg':'image/jpeg','.jpeg':'image/jpeg','.png':'image/png','.webp':'image/webp'};
const invalid=()=>Object.assign(new Error('Image invalide (JPEG, PNG ou WebP attendu)'),{statusCode:400});
function signature(buffer,mime){
 if(!Buffer.isBuffer(buffer))return false;
 if(mime==='image/jpeg')return buffer.length>=4&&buffer[0]===255&&buffer[1]===216&&buffer[2]===255;
 if(mime==='image/png')return buffer.length>=24&&buffer.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]))&&buffer.toString('ascii',12,16)==='IHDR';
 if(mime==='image/webp')return buffer.length>=16&&buffer.toString('ascii',0,4)==='RIFF'&&buffer.toString('ascii',8,12)==='WEBP'&&['VP8 ','VP8L','VP8X'].includes(buffer.toString('ascii',12,16));
 return false;
}
const upload=multer({storage:multer.memoryStorage(),limits:{fileSize:5*1024*1024,files:1,fields:50,parts:51,fieldSize:65536},fileFilter(req,file,cb){
 if(types[path.extname(file.originalname).toLowerCase()]!==file.mimetype)return cb(invalid());
 cb(null,true);
}});
const single=field=>{const middleware=upload.single(field);return (req,res,next)=>middleware(req,res,err=>{
 if(err){if(err instanceof multer.MulterError)err.statusCode=400;return next(err);}
 if(req.file&&!signature(req.file.buffer,req.file.mimetype))return next(invalid());
 next();
})};
module.exports={single,signature};
