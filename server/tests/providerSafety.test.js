const {EventEmitter}=require('events');
const {safeEmailPayload,streamBudget,escapeHtml}=require('../utils/providerSafety');
describe('provider safety',()=>{
 const mail={email:'fixture@example.invalid',subject:'Test',html:'<p>Test</p>'};
 test('single recipient, bounded in-memory attachments only',()=>{
  expect(safeEmailPayload({...mail,attachments:[{filename:'archive.json',content:Buffer.from('safe'),path:'/ignored'}]}).attachments[0]).toEqual({filename:'archive.json',content:Buffer.from('safe')});
  expect(()=>safeEmailPayload({...mail,email:'a@example.invalid,b@example.invalid'})).toThrow();
  expect(()=>safeEmailPayload({...mail,subject:'Test\r\nBcc: x'})).toThrow();
  expect(()=>safeEmailPayload({...mail,attachments:[{filename:'archive.json',path:'/tmp/test'}]})).toThrow();
  expect(()=>safeEmailPayload({...mail,attachments:[{filename:'archive.json',content:Buffer.alloc(8*1024*1024+1)}]})).toThrow();
  expect(escapeHtml('<img src="x">')).toBe('&lt;img src=&quot;x&quot;&gt;');
 });
 test('stream budget bounds text and aborts disconnected clients',()=>{
  const res=new EventEmitter(),budget=streamBudget(res,{maxChars:4});
  expect(budget.take('abc')).toBe('abc');expect(budget.take('def')).toBe('d');expect(budget.full).toBe(true);res.emit('close');expect(budget.signal.aborted).toBe(true);expect(budget.take('x')).toBe('');budget.close();expect(res.listenerCount('close')).toBe(0);
 });
});
