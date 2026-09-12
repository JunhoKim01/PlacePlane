# 네이버 부동산 도면 조회 검증 — 2026-09-10

## 확인 결과

- 사용자 제공 자양우성7차 이미지 URL: 인증 없이 HTTP 200, image/jpeg, 63,751 bytes.
- 이미지 응답에 Access-Control-Allow-Origin 없음. 서버에서 이미지를 읽고 동일 출처로 전달해야 브라우저의 canvas PNG 저장을 지원할 수 있음.
- `https://new.land.naver.com/`는 HTTP 200이지만 실제 본문은 페이지를 찾을 수 없다는 안내.
- `https://fin.land.naver.com/complexes/97`의 공개 HTML과 해당 페이지의 JS를 분석.
- 공개 클라이언트의 API prefix: `/front-api/v1`.
- 단지 자동완성: `/search/autocomplete/apartmentComplexes?keyword=...&page=0`.
- 평형 목록: `/complex/pyeongList?complexNumber=97`.
- 평면도 목록: `/complex/floor-plan?complexNumber=97`.
- 위 세 요청을 서버에서 인증 없이 각 1회 호출했으며 모두 HTTP 429 응답.
- 일반 브라우저의 단지 화면에서는 정보가 표시됨. 공개 클라이언트는 API 요청에 `x-page-url`과 값이 존재할 경우 `x-attest`를 설정함.
- 429의 정확한 서버 판정 사유는 확인하지 못함. API 키가 없다는 사실만으로 외부 서버 호출 가능성을 보장할 수 없음.
- 검증 값을 복제하거나 세션을 추출하는 구현은 하지 않음. 자동 단지 검색은 미연결이며 다른 단지까지의 자동 조회 검증도 미완료.

## 로컬에서 구현한 기능

도면 URL 입력 → 제한된 호스트에서 이미지 가져오기 → 이미지 디코딩 검증 → 미리보기 → 캔버스 적용.

`npm run dev`의 Vite middleware에서만 `/PlacePlane/api/floor-plan/image`를 제공한다. GitHub Pages에는 서버가 없으므로 URL 버튼은 production 빌드에서 표시하지 않는다. 운영용 중계 서버는 아직 배포하지 않았다.

입력 URL은 HTTPS 및 `landthumb-phinf.pstatic.net` 정확히 일치하는 호스트만 허용한다. 리다이렉트, 자격 증명, 임의 포트는 허용하지 않는다. 15초 타임아웃, 20MB 최대 크기, 최대 동시 요청 3개를 적용한다.

브라우저에서 제공된 도면의 미리보기·적용, 가구 추가 후 PNG 생성, 잘못된 호스트 오류 안내와 기존 도면 보존을 확인했다.

## 재검증

```sh
node scripts/probe-naver.mjs
node --test server/floor-plan.test.mjs
```

조회 진단은 수동 실행 전용이며 실패하면 이후 요청을 중단한다. 성공 응답을 확보한 후 실제 응답 구조를 바탕으로 검색 결과와 평형 매핑을 구현해야 한다.

분석 대상: https://fin.land.naver.com/complexes/97 의 2026-09-10 공개 클라이언트. 엔드포인트는 네이버가 제공하는 공식 외부 API 계약이 아니며 변경될 수 있다.
