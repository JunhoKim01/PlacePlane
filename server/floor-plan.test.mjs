import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fetchFloorPlan, validateImageUrl } from './floor-plan.mjs';

const url = 'https://landthumb-phinf.pstatic.net/example.jpg?type=m1024';
test('only the exact public image host is permitted', () => {
  assert.equal(validateImageUrl(url).hostname, 'landthumb-phinf.pstatic.net');
  for (const invalid of ['http://landthumb-phinf.pstatic.net/a.jpg', 'https://localhost/a',
    'https://landthumb-phinf.pstatic.net.evil.test/a', 'https://landthumb-phinf.pstatic.net:8080/a',
    'https://user:pass@landthumb-phinf.pstatic.net/a', 'file:///tmp/a', 'not-a-url']) {
    assert.throws(() => validateImageUrl(invalid));
  }
});
test('returns image bytes and disallows redirects', async () => {
  const result = await fetchFloorPlan(url, async (_, options) => {
    assert.equal(options.redirect, 'error');
    return new Response(new Uint8Array([255, 216, 255]), { headers: { 'content-type': 'image/jpeg' } });
  });
  assert.equal(result.type, 'image/jpeg');
  assert.deepEqual([...result.body], [255, 216, 255]);
});
test('rejects upstream restrictions, HTML, empty and oversized responses', async () => {
  for (const response of [new Response('', { status: 429 }), new Response('<html/>', { headers: { 'content-type': 'text/html' } }),
    new Response('', { headers: { 'content-type': 'image/png' } }),
    new Response('x', { headers: { 'content-type': 'image/png', 'content-length': '20971521' } }),
    new Response(new Uint8Array(20971521), { headers: { 'content-type': 'image/png' } })]) {
    await assert.rejects(fetchFloorPlan(url, async () => response));
  }
});
