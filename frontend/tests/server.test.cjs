const assert = require('node:assert/strict');
const { spawn } = require('node:child_process');
const http = require('node:http');
const path = require('node:path');
const { test } = require('node:test');

test('static preview rejects malformed URLs and continues serving modules', async () => {
  const server = spawn(process.execPath, [path.join(__dirname, '../server.js')], {
    env: { ...process.env, PORT: '0' }, stdio: ['ignore', 'pipe', 'pipe'],
  });
  try {
    const base = await new Promise((resolve, reject) => {
      server.stdout.once('data', data => resolve(String(data).match(/http:\/\/[^\s]+/)[0]));
      server.once('error', reject);
      server.once('exit', code => reject(new Error(`Server exited: ${code}`)));
    });
    async function request(urlPath) {
      return new Promise((resolve, reject) => {
        const origin = new URL(base);
        http.get({ hostname: origin.hostname, port: origin.port, path: urlPath }, response => {
          response.resume();
          response.on('end', () => resolve({ status: response.statusCode, headers: response.headers }));
        }).on('error', reject);
      });
    }
    assert.equal((await request('/%')).status, 400);
    assert.equal((await request('/?preview=1')).status, 200);
    assert.match((await request('/state.mjs')).headers['content-type'], /javascript/);
    assert.equal((await request('/%2e%2e/package.json')).status, 403);
    assert.equal((await request('/server.js')).status, 404);
    assert.equal((await request('/config.js')).status, 404);
  } finally {
    server.kill();
  }
});

