type ServiceDocument={title:string;reference:string;company:string;address?:string;phone?:string;fields:[string,string][];notice:string;signatures?:boolean};
export function openServiceDocument():Window{
 const win=window.open('','_blank');
 if(!win)throw new Error('Autorisez les fenêtres contextuelles pour imprimer.');
 win.opener=null;
 win.document.title='Document LUMO';
 win.document.body.textContent='Préparation du document…';
 return win;
}
export function buildServiceDocument(doc:Document,data:ServiceDocument,onPrint:()=>void){
 doc.title=data.title+' — '+data.reference;
 const style=doc.createElement('style');
 style.textContent='@page{size:A4;margin:18mm}*{box-sizing:border-box}body{font:14px/1.55 Arial,sans-serif;color:#171717;background:white;margin:24px auto;max-width:760px;padding:0 18px}header{border-bottom:3px solid #c2410c;padding:12px 0 18px;margin-bottom:22px}.brand{font-weight:800;letter-spacing:.1em;color:#c2410c;font-size:12px}h1{font-size:27px;letter-spacing:-.6px;margin:8px 0}h2{font-size:17px;margin:0}p{white-space:pre-wrap;overflow-wrap:anywhere}table{width:100%;border-collapse:collapse}th,td{padding:10px;text-align:left;border-bottom:1px solid #ddd;vertical-align:top;overflow-wrap:anywhere;white-space:pre-wrap}th{width:34%;font-size:12px;color:#52525b}.notice{border:1px solid #ddd;padding:12px;margin-top:22px;font-size:12px}.sign{display:flex;gap:45px;margin-top:32px}.sign div{flex:1;border-bottom:1px solid #777;padding-bottom:44px}footer{margin-top:24px;font-size:11px;color:#52525b}button{padding:10px 15px;background:#c2410c;color:white;border:0;border-radius:6px;cursor:pointer;margin-bottom:16px}@media print{body{margin:0;padding:0;max-width:none}button{display:none}tr{break-inside:avoid}}';
 doc.head.replaceChildren(style);
 const node=(tag:string,text?:string,cls?:string)=>{const el=doc.createElement(tag);if(text!==undefined)el.textContent=text;if(cls)el.className=cls;return el;};
 const button=node('button','Imprimer / enregistrer en PDF');button.addEventListener('click',onPrint);
 const head=node('header');head.append(node('div','LUMO','brand'),node('h1',data.title),node('p',data.reference),node('h2',data.company),node('p',[data.address,data.phone].filter(Boolean).join(' · ')));
 const table=node('table');for(const [label,value] of data.fields){const tr=node('tr');tr.append(node('th',label),node('td',value||'—'));table.append(tr);}
 const children=[button,head,table,node('p',data.notice,'notice')];
 if(data.signatures){const sign=node('div',undefined,'sign');sign.append(node('div','Signature client'),node('div','Signature entreprise'));children.push(sign);}
 children.push(node('footer','Document édité par LUMO · '+new Date().toLocaleDateString('fr-FR')));
 doc.body.replaceChildren(...children);
}
export function renderServiceDocument(win:Window,data:ServiceDocument){if(win.closed)return;buildServiceDocument(win.document,data,()=>win.print());}
