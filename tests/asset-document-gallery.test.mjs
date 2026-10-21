import test from "node:test";
import assert from "node:assert/strict";
import vm from "node:vm";
import { readFileSync } from "node:fs";
import { ref, reactive } from "vue";
const source = readFileSync(new URL("../src/system/components/profile/AssetDocumentGallery.vue", import.meta.url),"utf8").match(/<script setup>([\s\S]*?)<\/script>/)[1].replace(/load\(\);\s*$/, "const ready = load();");
async function harness(urlFor = async () => ({url:"https://example.test/file.png"})) {
 const calls=[],disposed=[];
 const resource={state:reactive({data:null,loading:false,error:""}),async load(fn){this.state.loading=true;try{return this.state.data=await fn()}finally{this.state.loading=false}},reset(){this.state.data=null}};
 const docs=[{documentId:"image",contentType:"image/png",fileName:"ficticio.png"},{documentId:"pdf",contentType:"application/pdf",fileName:"ficticio.pdf"}];
 const values={vue:{ref,onScopeDispose:fn=>disposed.push(fn)},"src/system/components/finance/ResourceState.vue":{default:{}},"src/composables/useFinanceResource":{useFinanceResource:()=>resource},"src/services/clientAssetsService":{getClientAssetDocuments:async()=>docs,getClientAssetDocumentUrl:async(asset,id)=>{calls.push([asset,id]);return urlFor(id)}},"src/services/clientApi":{captureClientSession:()=>({}),assertClientSessionCurrent(){}}};
 const context=vm.createContext({defineProps:()=>({assetId:"asset"})});
 const mod=new vm.SourceTextModule(source+"\nexport { ready, previews, previewErrors };",{context});
 await mod.link(name=>{const exports=values[name];return new vm.SyntheticModule(Object.keys(exports),function(){for(const[k,v]of Object.entries(exports))this.setExport(k,v)},{context})}); await mod.evaluate();
 return {m:mod.namespace,calls,dispose:()=>disposed.forEach(fn=>fn())};
}
test("image previews use the bound asset and only request image files",async()=>{
 const h=await harness();await h.m.ready;
 assert.deepEqual(h.calls,[["asset","image"]]);assert.equal(h.m.previews.value.image,"https://example.test/file.png");assert.equal(h.m.previews.value.pdf,undefined);
 h.dispose();assert.equal(Object.keys(h.m.previews.value).length,0);
});
test("an invalid temporary URL leaves a retryable preview error",async()=>{
 const h=await harness(async()=>({url:"javascript:alert(1)"}));await h.m.ready;
 assert.equal(h.m.previewErrors.value.image,true);assert.equal(h.m.previews.value.image,undefined);
});
test("a late preview cannot repopulate a disposed gallery",async()=>{
 let resolve;const h=await harness(()=>new Promise(done=>resolve=done));
 for(let i=0;i<8;i++)await Promise.resolve();
 h.dispose();resolve({url:"https://example.test/file.png"});await h.m.ready;
 assert.equal(Object.keys(h.m.previews.value).length,0);
});
