import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';
import { mkdtemp, writeFile, rm } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import path from 'node:path';
import test from 'node:test';

const require = createRequire(import.meta.url);
const { fetchInternalImage } = require('next/dist/server/image-optimizer');
const { serveStatic } = require('next/dist/server/serve-static');

// Regression for https://github.com/vercel/next.js/pull/98168 (MIT).
// A dead request socket must not cancel the shared internal source response.
test('an image source finishes even after its requesting client disconnects', async () => {
  const directory = await mkdtemp(path.join(tmpdir(), 'image-disconnect-'));
  const body = Buffer.alloc(1024 * 1024, 1);
  await writeFile(path.join(directory, 'source.bin'), body);
  const socket = Object.assign(new EventEmitter(), { writable: false, destroyed: true });
  let deadline;
  try {
    const result = await Promise.race([
      fetchInternalImage('/source.bin', { method: 'GET', socket }, {}, 2 * body.length, (req, res) => {
        assert.equal(req.socket, socket, 'protocol/address detection keeps the original request socket');
        return serveStatic(req, res, 'source.bin', { root: directory });
      }),
      new Promise((_, reject) => { deadline = setTimeout(() => reject(new Error('Internal image source wedged after requester disconnected')), 1500); }),
    ]);
    assert.deepEqual(result.buffer, body);
  } finally {
    clearTimeout(deadline);
    await rm(directory, { recursive: true, force: true });
  }
});
