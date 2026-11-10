import { test } from 'node:test';
import assert from 'node:assert/strict';
import { normalizeLeadPhone } from './leadPhone.js';

test('Russian autofill variants have one canonical phone', () => {
  for (const value of ['(918) 310-68-88', '89183106888', '79183106888', '+7 (918) 310-68-88']) {
    assert.equal(normalizeLeadPhone(value), '+79183106888');
  }
});
test('partial, empty and foreign input is not assigned a Russian prefix', () => {
  for (const value of ['', '918', '+7', '+12025550123', '+441234567890', '+1234567890', '9183106888 ext 5']) {
    assert.equal(normalizeLeadPhone(value), value);
  }
});
