const test = require('node:test');
const assert = require('node:assert/strict');
const { normalizeEmail, createHttpError } = require('../services/otp.service');

test('normalizeEmail trims whitespace and lowercases addresses', () => {
  assert.equal(normalizeEmail('  Example.User@Campus.EDU  '), 'example.user@campus.edu');
});

test('normalizeEmail safely handles empty input', () => {
  assert.equal(normalizeEmail(null), '');
  assert.equal(normalizeEmail(undefined), '');
});

test('createHttpError preserves the status code and retry delay', () => {
  const error = createHttpError('Try again later', 429, 30);
  assert.equal(error.message, 'Try again later');
  assert.equal(error.statusCode, 429);
  assert.equal(error.retryAfter, 30);
});
