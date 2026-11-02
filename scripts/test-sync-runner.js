const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { runSync } = require('./sync-all');
const quiet = {log() {}, error() {}};
const calls = [];
assert.equal(runSync({scriptNames:['one.js','two.js'], directory:'/tmp/space ; literal', logger:quiet, spawn:(cmd,args,opts)=>{calls.push({cmd,args,opts}); return {status:0};}}),0);
assert.equal(calls.length,2);
for (const [i, c] of calls.entries()) {assert.equal(c.cmd, process.execPath); assert.deepEqual(c.args,[path.join('/tmp/space ; literal', ['one.js','two.js'][i])]); assert.equal(c.opts.shell,undefined);}
for (const bad of [{status:7},{status:null,signal:'SIGTERM'},{status:null,error:new Error('fixture timeout')}]) {
 let n=0;
 assert.equal(runSync({scriptNames:['bad.js','good.js'],logger:quiet,spawn:()=>++n===1?bad:{status:0}}),1);
 assert.equal(n,2);
}
let n=0;
assert.equal(runSync({scriptNames:['bad.js','good.js'],logger:quiet,spawn:()=>{if(++n===1)throw new Error('fixture');return {status:0};}}),1);
assert.equal(n,2);
const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'sync fixture ; '));
try {
 fs.writeFileSync(path.join(tmp,'success.js'),'process.exit(0);');
 fs.writeFileSync(path.join(tmp,'failure.js'),'process.exit(7);');
 assert.equal(runSync({scriptNames:['success.js'],directory:tmp,logger:quiet}),0);
 assert.equal(runSync({scriptNames:['failure.js','success.js'],directory:tmp,logger:quiet}),1);
} finally {fs.rmSync(tmp,{recursive:true,force:true});}
console.log('PASS: argv-only paths, child failures/signals/errors, continuation and real local fixtures');
