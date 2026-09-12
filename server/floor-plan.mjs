const MAX_BYTES = 20 * 1024 * 1024;

export function validateImageUrl(value) {
  let url;
  try { url = new URL(value); } catch { throw new Error('올바른 이미지 URL을 입력해주세요.'); }
  if (url.protocol !== 'https:' || url.hostname !== 'landthumb-phinf.pstatic.net' ||
      url.port || url.username || url.password) {
    throw new Error('네이버 부동산 도면 주소(https://landthumb-phinf.pstatic.net/)만 지원합니다.');
  }
  return url;
}

export async function fetchFloorPlan(value, fetcher = fetch) {
  const url = validateImageUrl(value);
  const response = await fetcher(url, { redirect: 'error', signal: AbortSignal.timeout(15000) });
  if (!response.ok) throw new Error(response.status === 429
    ? '네이버에서 요청을 제한했습니다. 잠시 후 시도하거나 이미지를 복사해 붙여넣어주세요.'
    : '이미지를 가져오지 못했습니다. 이미지 주소가 유효한지 확인해주세요.');
  const type = response.headers.get('content-type')?.split(';')[0] ?? '';
  if (!['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(type)) {
    throw new Error('지원하는 도면 이미지가 아닙니다. JPG, PNG, WebP, GIF를 사용해주세요.');
  }
  if (Number(response.headers.get('content-length')) > MAX_BYTES) {
    await response.body?.cancel();
    throw new Error('20MB 이하의 도면 이미지를 사용해주세요.');
  }
  if (!response.body) throw new Error('이미지가 비어 있습니다.');
  const reader = response.body.getReader();
  const chunks = [];
  let size = 0;
  try {
    while (true) {
      const { done, value: chunk } = await reader.read();
      if (done) break;
      size += chunk.byteLength;
      if (size > MAX_BYTES) {
        await reader.cancel();
        throw new Error('20MB 이하의 도면 이미지를 사용해주세요.');
      }
      chunks.push(Buffer.from(chunk));
    }
  } finally { reader.releaseLock(); }
  if (!size) throw new Error('이미지가 비어 있습니다.');
  return { body: Buffer.concat(chunks), type };
}

export function floorPlanMiddleware() {
  let active = 0;
  return async (req, res, next) => {
    const url = new URL(req.url ?? '/', 'http://localhost');
    if (url.pathname !== '/api/floor-plan/image' && url.pathname !== '/PlacePlane/api/floor-plan/image') return next();
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    const fail = (status, message) => {
      res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ error: message }));
    };
    if (req.method !== 'GET') return fail(405, 'GET 요청만 지원합니다.');
    try { validateImageUrl(url.searchParams.get('url')); }
    catch (error) { return fail(400, error.message); }
    if (active >= 3) return fail(429, '다른 이미지를 가져오는 중입니다. 잠시 후 다시 시도해주세요.');
    active += 1;
    try {
      const image = await fetchFloorPlan(url.searchParams.get('url'));
      res.writeHead(200, { 'Content-Type': image.type, 'Content-Length': image.body.length });
      res.end(image.body);
    } catch (error) {
      fail(502, error.name === 'TimeoutError' ? '이미지 응답이 지연되고 있습니다. 다시 시도해주세요.' : error.message);
    } finally { active -= 1; }
  };
}
