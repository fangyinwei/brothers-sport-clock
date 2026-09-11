import assert from 'node:assert/strict';
import http from 'node:http';
import test from 'node:test';
import app, { createApp } from '../src/app';

test('GET /health returns the health contract', async () => {
  const server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));

  try {
    const address = server.address();
    assert.ok(address && typeof address !== 'string');

    const response = await fetch(`http://127.0.0.1:${address.port}/health`);
    const body = await response.json() as { status: string; timestamp: string };

    assert.equal(response.status, 200);
    assert.equal(body.status, 'ok');
    assert.ok(Number.isFinite(Date.parse(body.timestamp)));
  } finally {
    await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  }
});

test('business APIs reject requests without the WeChat identity context', async () => {
  const server = http.createServer(createApp());
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));

  try {
    const address = server.address();
    assert.ok(address && typeof address !== 'string');
    const response = await fetch(`http://127.0.0.1:${address.port}/api/v1/session`);
    const body = await response.json() as { error: { code: string } };
    assert.equal(response.status, 401);
    assert.equal(body.error.code, 'UNAUTHENTICATED');
  } finally {
    await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  }
});
