import test from 'node:test';
import assert from 'node:assert/strict';
import { invocationSchema, driverMessageSchema } from './connector-preview/protocol.mjs';

test('Connector invocation accepts nested JSON arguments after the Zod security update', () => {
  const invocation = { connectorId: 'test', actionName: 'read', arguments: { song: 'Song', options: { count: 3 } } };
  assert.deepEqual(invocationSchema.parse(invocation), invocation);
});
test('Connector invocation rejects account and provider overrides', () => {
  assert.equal(invocationSchema.safeParse({ connectorId: 'test', actionName: 'read', arguments: {}, accountId: 'other' }).success, false);
});
test('Connector driver accepts a JSON result with unknown properties', () => {
  const message = { jsonrpc: '2.0', id: '6c090964-57f4-4235-a505-d2752f7b82be', result: { content: [{ type: 'text', text: 'ok' }], extra: null } };
  assert.deepEqual(driverMessageSchema.parse(message), message);
});
