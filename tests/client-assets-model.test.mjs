import test from 'node:test';
import assert from 'node:assert/strict';
import {assetPayload,assetDraft} from '../src/services/clientAssetModel.js';
const vehicle={licensePlate:'QA00000',brand:'Marca QA',model:'Modelo QA',manufactureYear:'2020',declaredValue:'9007199254740993.01',paidOff:true};
test('client asset form retains precision and creates only the correct subtype',()=>{
 const result=assetPayload(vehicle,'Vehicle','currency');
 assert.equal(result.declaredValue,'9007199254740993.01');
 assert.equal(result.vehicle.manufactureYear,2020);
 assert.equal(result.assetType,'Vehicle');assert.equal(result.status,'PaidOff');
 assert.equal(result.realEstate,undefined);assert.ok(!Object.hasOwn(result,'remainingBalance'));
});
test('missing required fields, currency and fractional years fail before writing',()=>{
 for(const draft of [{...vehicle,brand:''},{...vehicle,manufactureYear:'2020.5'},{...vehicle,declaredValue:-1}])assert.throws(()=>assetPayload(draft,'Vehicle','currency'));
 assert.throws(()=>assetPayload(vehicle,'Vehicle',null),/moeda/);
});
test('editing preserves review status and hidden metadata without archive actions',()=>{
 const existing={assetType:'Vehicle',status:'UnderReview',nickname:'Teste',declaredValue:100,currencyId:'currency',vehicle:{...vehicle,color:'Azul',manufactureYear:2020}};
 const draft=assetDraft(existing,'Vehicle');draft.model='Modelo novo';
 const result=assetPayload(draft,'Vehicle','currency',existing);
 assert.equal(result.status,'UnderReview');assert.equal(result.vehicle.color,'Azul');
 assert.equal(result.vehicle.model,'Modelo novo');assert.ok(!Object.hasOwn(result,'assetType'));
 assert.equal(existing.vehicle.model,'Modelo QA');
});
test('all four approved asset kinds generate their own detail and validate integer counts',()=>{
 const values={
  RealEstate:{nickname:'Imóvel QA',propertyType:'Apartamento',declaredValue:'100.50',postalCode:'00000000',addressLine:'Rua QA',number:'100',neighborhood:'Bairro QA',city:'Cidade',state:'SP',bedrooms:'2',bathrooms:'1',paidOff:true},
  Consortium:{consortiumType:'Veículo',administrator:'Administradora QA',groupNumber:'1',quotaNumber:'1',declaredValue:'100',amountPaid:'10',totalInstallments:'10',paidInstallments:'1',quotaStatus:'Ativa',remainingBalance:'90'},
  Investment:{investmentType:'Renda fixa',institution:'Instituição QA',productName:'Produto QA',initialAmount:'100',declaredValue:'110.01',startDate:'2026-10-20',hasFixedTerm:false,termMonths:'12'},
 };
 for(const [type,draft]of Object.entries(values))assert.equal(assetPayload(draft,type,'currency').assetType,type);
 assert.throws(()=>assetPayload({...values.Consortium,paidInstallments:'1.5'},'Consortium','currency'),/inteiro/);
 assert.equal(assetPayload(values.Investment,'Investment','currency').investment.maturityDate,null);
});
