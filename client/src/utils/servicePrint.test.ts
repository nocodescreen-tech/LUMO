import {describe,it,expect,vi} from 'vitest';
import {buildServiceDocument} from './servicePrint';
describe('service document',()=>{
 it('renders customer values as text and exposes printing',()=>{
  const doc=document.implementation.createHTMLDocument('test'),print=vi.fn();
  buildServiceDocument(doc,{title:'Réception',reference:'SAV #1',company:'Test',fields:[['Client','<img src=x onerror=alert(1)>']],notice:'Non encaissé',signatures:true},print);
  expect(doc.body.textContent).toContain('<img src=x onerror=alert(1)>');expect(doc.querySelector('img')).toBeNull();expect(doc.querySelector('table')?.rows.length).toBe(1);
  doc.querySelector('button')?.click();expect(print).toHaveBeenCalledTimes(1);
 });
});
