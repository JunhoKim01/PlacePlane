// Manual diagnostic only. Stop on an upstream restriction; never retry automatically.
const requests = [
  ['/search/autocomplete/apartmentComplexes', { keyword: '자양우성7차', page: '0' }],
  ['/complex/pyeongList', { complexNumber: '97' }],
  ['/complex/floor-plan', { complexNumber: '97' }],
];
for (const [path, params] of requests) {
  const response = await fetch(`https://fin.land.naver.com/front-api/v1${path}?${new URLSearchParams(params)}`, {
    redirect: 'error', signal: AbortSignal.timeout(15000),
  });
  console.log(`${path}: HTTP ${response.status}, ${response.headers.get('content-type')}`);
  if (!response.ok) {
    await response.body?.cancel();
    console.log('조회가 제한되거나 실패했습니다. 이후 요청을 중단합니다.');
    process.exitCode = 1;
    break;
  }
  const data = await response.json();
  console.log(JSON.stringify(data, null, 2));
}
