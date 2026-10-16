import assert from 'node:assert/strict';
import { onboardingBlockMessage } from '../src/services/onboardingBlock.js';
const error = (code, current=1, required=2) => ({response:{status:403,data:{data:{blockingCode:code,current:{documentLevel:current},required:{documentLevel:required}}}}});
assert.match(onboardingBlockMessage(error('DocumentLevelInsufficient')), /nível documental 1.*nível 2/);
assert.doesNotMatch(onboardingBlockMessage(error('DocumentLevelInsufficient')), /depósito/i);
assert.match(onboardingBlockMessage(error('PreferencesRequired')), /preferências/);
for (const code of ['EmailConfirmationRequired','PhoneVerificationRequired','RequiredConsentsPending','RequiredConsentsConfigurationInvalid','ProfileIncomplete']) {
  assert.ok(onboardingBlockMessage(error(code)));
  assert.doesNotMatch(onboardingBlockMessage(error(code)), /depósito/i);
}
assert.match(onboardingBlockMessage(error('ProfileIncomplete')), /dados pessoais/);
assert.equal(onboardingBlockMessage(error('Unknown')), '');
assert.equal(onboardingBlockMessage({response:{status:500}}), '');
assert.match(onboardingBlockMessage(error('DocumentLevelInsufficient',null,null)), /nível documental/);
console.log('Structured onboarding errors: passed');
