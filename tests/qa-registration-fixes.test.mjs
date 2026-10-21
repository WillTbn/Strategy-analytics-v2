import test from 'node:test';
import assert from 'node:assert/strict';
import { documentRegistrationPayload, registrationRegionOptions } from '../src/services/registrationIntegration.js';
import { newRegistrationDocuments, validateRegistrationDocuments, validRegistrationCpf } from '../src/services/registrationDocuments.js';
import { availableNationalities } from '../src/services/registrationPersonal.js';
import { formatRegistrationInput } from '../src/services/registrationInputFormatting.js';
import { registrationReviewSections } from '../src/services/registrationReview.js';

test('CPF has no identification dates while RG retains its own dates', () => {
  const draft = newRegistrationDocuments('br');
  draft.values.taxNumber = '529.982.247-25';
  draft.details[draft.type] = { documentNumber: '12345X', issuedDate: '01/02/2020' };
  const base = {fields:[{code:'documentNumber',required:true,label:'Número'}]};
  const cpf = documentRegistrationPayload({...base,code:'CPF',dateRules:{issuedOn:'Forbidden',expiresOn:'Forbidden'}}, draft, 'br');
  assert.equal(cpf.issuedOn, null);
  assert.equal(cpf.expiresOn, null);
  assert.equal(cpf.data.documentNumber, '52998224725');
  assert.equal(documentRegistrationPayload({...base,code:'RG'},draft,'br').issuedOn,'2020-02-01');
  assert.equal(draft.details[draft.type].issuedDate,'01/02/2020');
});
test('document length follows its definition without prohibiting alphanumeric identifiers', () => {
  const draft = newRegistrationDocuments('br');
  draft.details[draft.type] = {documentNumber:'12345X'};
  const definition = {code:'RG', fields:[{code:'documentNumber',label:'Número',maxLength:6}]};
  assert.equal(documentRegistrationPayload(definition,draft,'br').data.documentNumber,'12345X');
  draft.details[draft.type].documentNumber='123456X';
  assert.throws(()=>documentRegistrationPayload(definition,draft,'br'),/no máximo 6/);
});
test('Brazil has all 27 UFs for new drafts; other countries are not given Brazilian states', () => {
  const states = registrationRegionOptions('br');
  assert.equal(new Set(states.map(s=>s.value)).size,27);
  assert.ok(states.some(s=>s.value==='DF'));
  assert.ok(states.some(s=>s.value==='SP'));
  assert.deepEqual(registrationRegionOptions('pt'),[]);
});
test('CPF check digits, repeated digits and malformed input are validated at the field', () => {
  assert.equal(validRegistrationCpf('529.982.247-25'),true);
  for(const value of ['11111111111','52998224724','123','abc52998224725']) assert.equal(validRegistrationCpf(value),false);
  const draft = newRegistrationDocuments('br'); draft.values.taxNumber='11111111111';
  assert.equal(validateRegistrationDocuments('br',draft).taxNumber,'CPF inválido.');
});
test('nationality choices preserve the current selection and exclude other selections', () => {
  const options = ['BR','PT','US'].map(value=>({value,label:value}));
  assert.deepEqual(availableNationalities(options,['BR','PT'],1).map(o=>o.value),['PT','US']);
  assert.equal(options.length,3);
});
test('formatting keeps precision, invalid input, zero and international numbers', () => {
  assert.equal(formatRegistrationInput('money','12345678901234567890,12'),'12.345.678.901.234.567.890,12');
  assert.equal(formatRegistrationInput('money','0'),'0,00');
  assert.equal(formatRegistrationInput('money','-1'),'-1');
  assert.equal(formatRegistrationInput('phone','11999990000'),'(11) 99999-0000');
  assert.equal(formatRegistrationInput('phone','+351 912 345 678'),'+351 912 345 678');
});
test('review distinguishes confirmed uploads from newly selected replacement files', () => {
  const document = newRegistrationDocuments('br');
  const front = {}, back = {};
  document.files = { [`${document.type}:front`]:front, [`${document.type}:back`]:back };
  document.savedDocuments[document.type] = {files:{...document.files}};
  const snapshot = {document,variant:'br'};
  assert.match(JSON.stringify(registrationReviewSections(snapshot)),/Frente enviada.*Verso enviado/);
  document.files[`${document.type}:front`] = {};
  assert.match(JSON.stringify(registrationReviewSections(snapshot)),/Frente aguardando envio/);
});
