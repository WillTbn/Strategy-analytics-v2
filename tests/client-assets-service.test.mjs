import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
const source=readFileSync(new URL('../src/services/clientAssetsService.js',import.meta.url),'utf8');
async function harness(read,catalog=async()=>({currencies:[{id:'brl',value:'BRL',label:'Real Brasileiro (BRL)'}]})){
 const calls=[],writes=[];let current=true;
 const context=vm.createContext({encodeURIComponent});
 const values={
  './clientApi':{captureClientSession:()=>({}),assertClientSessionCurrent:()=>{if(!current)throw Error('session changed')}},
  './clientProfileService':{getPreferenceCatalog:catalog},
  './financeService':{financeGet:async(path,params)=>{calls.push([path,params]);return read?read(path,params):{data:{id:'asset'}}},financeWrite:async(...args)=>{writes.push(args);return {id:'asset'}}},
 };
 const mod=new vm.SourceTextModule(source,{context});
 await mod.link(name=>{const exports=values[name];return new vm.SyntheticModule(Object.keys(exports),function(){for(const[k,v]of Object.entries(exports))this.setExport(k,v)},{context})});await mod.evaluate();return{api:mod.namespace,calls,writes,invalidate:()=>{current=false}};
}
test('client assets reader consults all pages and does not turn missing pages into empty assets',async()=>{
 const rows=Array.from({length:101},(_,i)=>({id:`asset-${i}`}));
 const h=await harness((path,params)=>({data:rows.slice((params.page-1)*100,params.page*100),pagination:{page:params.page,totalItems:101,totalPages:2}}));
 assert.equal((await h.api.listClientAssets()).length,101);assert.equal(h.calls.length,2);
 const bad=await harness(()=>({data:[],pagination:{totalItems:1,totalPages:1}}));await assert.rejects(bad.api.listClientAssets());
});
test('asset currencies use catalog IDs, preserve labels and ISO codes, and exclude inactive currencies',async()=>{
 const h=await harness(undefined,async()=>({currencies:[
  {id:'brl-id',value:'BRL',label:'Real Brasileiro (BRL)'},
  {id:'brl-id',value:'BRL',label:'Real Brasileiro (BRL)'},
  {id:null,value:'USD',label:'Dólar'},
  {value:'EUR',label:'Euro'},
 ]}));
 assert.deepEqual(JSON.parse(JSON.stringify(await h.api.getClientAssetCurrencies())),[
  {value:'brl-id',label:'Real Brasileiro (BRL)',code:'BRL'},
 ]);
 assert.equal(h.calls.length,0);
});
test('asset currencies distinguish an empty catalog from invalid or failed responses',async()=>{
 const empty=await harness(undefined,async()=>({currencies:[]}));
 assert.equal((await empty.api.getClientAssetCurrencies()).length,0);
 const invalid=await harness(undefined,async()=>({}));
 await assert.rejects(invalid.api.getClientAssetCurrencies(),/consultar as moedas/);
 const failed=await harness(undefined,async()=>{throw Error('catalog unavailable')});
 await assert.rejects(failed.api.getClientAssetCurrencies(),/catalog unavailable/);
});
test('asset currencies reject catalog results after the client session changes',async()=>{
 let resolve;
 const h=await harness(undefined,()=>new Promise(done=>{resolve=done}));
 const pending=h.api.getClientAssetCurrencies();h.invalidate();
 resolve({currencies:[{id:'brl',value:'BRL',label:'Real'}]});
 await assert.rejects(pending,/session changed/);
});
test('all asset reads and writes stay in the client domain and no archive operation is exposed',async()=>{
 const h=await harness();await h.api.createClientAsset({nickname:'QA'});await h.api.updateClientAsset('id',{nickname:'QA'});await h.api.getClientAsset('id');await h.api.getClientAssetDocuments('id');await h.api.getClientAssetDocumentUrl('id','doc');
 assert.ok(h.calls.every(([path])=>path.startsWith('client/profile/assets/')));assert.ok(h.writes.every(([,path])=>path.startsWith('client/profile/assets')));
 assert.equal(h.writes[0][0],'post');assert.equal(h.writes[1][0],'patch');assert.ok(!Object.keys(h.api).some(key=>/archive/i.test(key)));
 assert.equal((await h.api.getClientAssetCurrencies()).length,1);
});
