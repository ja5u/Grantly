import assert from 'node:assert/strict';
import { test } from 'node:test';
import { daysUntil, match, rank, setStatus, type Scheme } from '../src/domain.ts';
import { demoProfile, demoSchemes, demoWorkspace, newApplication } from '../src/demo.ts';

test('matching uses weighted fields, inclusive bounds and explicit missing outcomes', () => {
  const scheme = demoSchemes[0];
  assert.equal(match(demoProfile, scheme).status, 'Eligible');
  assert.equal(match({ ...demoProfile, income: 300000 }, scheme).status, 'Eligible');
  assert.equal(match({ ...demoProfile, income: 300001 }, scheme).status, 'Not eligible');
  assert.equal(match({ ...demoProfile, income: 0 }, scheme).status, 'Eligible');
  const missing = match({ ...demoProfile, income: undefined }, scheme);
  assert.equal(missing.status, 'Almost there');
  assert.equal(missing.score, 0.8);
  assert.equal(match({ ...demoProfile, documents: [] }, scheme).status, 'Eligible');
});

test('a partial source reference cannot produce an eligible decision', () => {
  const scheme: Scheme = { ...demoSchemes[0], partial: true };
  assert.equal(match(demoProfile, scheme).status, 'Needs information');
  assert.equal(match(null, scheme).status, 'Needs information');
});

test('ranking ignores unknown and expired deadlines and uses the search weights', () => {
  assert.equal(rank(0.8, undefined, null), rank(0.8, undefined, -1));
  assert.ok(rank(0.8, undefined, 1) > rank(0.8, undefined, 12));
  assert.equal(rank(0, 1, null, 500, 1000), 0.25);
  assert.equal(daysUntil('2026-11-07', new Date(2026, 10, 6, 23, 30)), 1);
});

test('application history records explicit changes and demo seeds are independent', () => {
  const saved = newApplication('example');
  const submitted = setStatus(saved, 'Submitted', '2026-11-07');
  const approved = setStatus(submitted, 'Approved', '2026-12-01');
  assert.equal(saved.applied, undefined);
  assert.equal(approved.applied, '2026-11-07');
  assert.equal(approved.result, '2026-12-01');
  assert.equal(setStatus(approved, 'Saved', '2026-12-02').result, undefined);
  const demo = demoWorkspace();
  demo.profile!.documents.push('Temporary');
  assert.ok(!demoWorkspace().profile!.documents.includes('Temporary'));
});
