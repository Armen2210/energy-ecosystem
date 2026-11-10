import { test } from 'node:test';
import assert from 'node:assert/strict';
import { normalizeLeadPhone, formatLeadPhoneInput } from './leadPhone.js';

test('Russian autofill variants have one canonical phone', () => {
  for (const value of ['(918) 310-68-88', '89183106888', '79183106888', '+7 (918) 310-68-88']) {
    assert.equal(normalizeLeadPhone(value), '+79183106888');
  }
});

test('phone editor prefixes partial input and limits national digits', () => {
  for (const [input, expected] of [
    ['', ''], ['8', '+7'], ['7', '+7'], ['918', '+7918'],
    ['8918', '+7918'], ['7918', '+7918'], ['+7', '+7'],
    ['(918) 310-68-88', '+79183106888'], ['8 (918) 310-68-88', '+79183106888'],
    ['+7 (918) 310-68-88', '+79183106888'], ['79183106888', '+79183106888'],
    ['+791831068881234', '+79183106888'], ['89183106888123', '+79183106888'],
    ['9183106888123', '+79183106888'],
    // A pasted ten-digit national number can itself start with 7 or 8.
    ['8123456789', '+78123456789'], ['7123456789', '+77123456789'],
  ]) assert.equal(formatLeadPhoneInput(input), expected, input);
});

test('phone editor rejects foreign prefixes and extension text', () => {
  for (const input of ['+12025550123', '+441234567890', '9183106888 ext 5', '+7+918', 'abc'])
    assert.equal(formatLeadPhoneInput(input), null, input);
});
test('partial, empty and foreign input is not assigned a Russian prefix', () => {
  for (const value of ['', '918', '+7', '+12025550123', '+441234567890', '+1234567890', '9183106888 ext 5']) {
    assert.equal(normalizeLeadPhone(value), value);
  }
});
