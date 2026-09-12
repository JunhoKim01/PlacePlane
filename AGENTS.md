# PlacePlane 에이전트 작업 규칙

## 시작 순서

1. 이 파일 → [HANDOFF.md](HANDOFF.md) → [README.md](README.md)를 읽는다.
2. `git status --short --branch`, `git branch -avv`, `git log -5 --oneline`으로 실제 checkout을 확인한다. 문서의 시점 기록보다 현재 Git 상태를 우선한다.
3. 진행 중인 변경을 보존한다. 기존 변경을 자신의 작업으로 오인하거나 임의로 되돌리지 않는다.
4. 네이버 관련 작업이면 [조사 기록](docs/naver-investigation.md)을 먼저 읽는다. 실패한 접근을 근거 없이 반복하지 않는다.

## 목표와 아키텍처

- 국내 아파트 도면 위에 실제 크기의 가구를 배치하는 2D React 앱이다. 도면 자동 검색은 목표이지 현재 완성된 기능이 아니다.
- Node.js 22.12 이상, npm + package-lock.json. CI는 Node 22를 사용한다.
- `src/main.tsx`는 React StrictMode 진입점, `src/App.tsx`가 상태·배치·보정·프리셋·공유·PNG 생성을 담당한다.
- `src/floorPlanImage.ts`는 Blob 검증/디코딩과 object URL 생성, `src/FloorPlanUrlDialog.tsx`는 URL 가져오기 UI를 담당한다.
- `server/floor-plan.mjs`는 Vite 개발 서버용 middleware이다. 독립된 운영 서버가 아니다. `server/floor-plan.d.mts`는 Vite에서 import할 때의 선언이다.
- `vite.config.ts`의 `configureServer`에서만 middleware를 등록한다. `npm run preview`와 GitHub Pages에는 해당 API가 없다. URL 버튼의 `import.meta.env.DEV` 제한을 임의로 없애지 않는다.
- GitHub Pages 경로는 `/PlacePlane/`. 정적 배포와 외부 데이터 서버는 별개다. 서버 실행이나 지속 저장을 Pages에 기대하지 않는다.
- 사용자 도면/배치 데이터는 Git에 저장하지 않는다. 브라우저 저장소나 localhost는 다른 기기/클라우드와 자동 공유되지 않는다.

## 유지해야 할 인터페이스

아래는 현재 데이터와 호출자의 호환성을 위한 규칙이다. 변경 요청이 있으면 마이그레이션·회귀 검증을 함께 설계한다.

- 가구: `{ id, name, w, h, x, y, rotation, color }`. `w`, `h`, `realWidthMm`는 mm, `x/y`는 도면 너비/높이에 대한 중심점 백분율, `rotation`은 도 단위. UI 단위 `cm | mm`는 표시/입력 변환용이다.
- localStorage 키: `furniture-sim-items`, `furniture-sim-width`, `furniture-sim-unit`, `furniture-sim-presets`.
- 프리셋 슬롯 1/2/3: `null` 또는 `{ name, items, realWidthMm, unit }`. 캔버스 초기화는 프리셋을 유지한다.
- 공유 코드: `FURN-` + `btoa(encodeURIComponent(JSON.stringify(rows)))`. 행 순서는 `[name,w,h,x,y,rotation,color]`, x/y는 소수점 첫째 자리까지. 이미지·보정 너비·단위·ID는 포함되지 않는다. 읽을 때 ID를 재생성한다.
- 이미지 중계: GET `/PlacePlane/api/floor-plan/image?url=...` (또는 `/api/floor-plan/image`). 성공은 이미지 bytes, 실패는 JSON `{ error: string }`. 현재 400/405/429/502를 사용하며 upstream 429도 502 메시지로 전달된다.
- URL 중계는 HTTPS, 정확한 `landthumb-phinf.pstatic.net` 호스트, 자격 증명 없음, 비표준 포트 없음, 리다이렉트 거부를 유지한다. 20MiB 스트림 제한·15초 timeout·동시 요청 3개를 완화하지 않는다. 브라우저 디코딩은 4천만 픽셀 제한도 적용한다.
- 새 도면은 디코딩 성공 후 적용한다. 실패하면 기존 도면을 유지하고 오래된 비동기 응답이 최신 도면을 덮어쓰지 않게 한다. Blob URL의 소유자가 해제한다.
- `code_artifact.tsx`는 사용자 제공 원본이다. 런타임/타입 검사 대상이 아니며 일반 기능 수정은 `src/`에서 한다. 원본은 보존한다.

## 코딩 컨벤션

- 기존 React 함수 컴포넌트/hooks, strict TypeScript, Tailwind 3, lucide-react를 따른다. 임의 프레임워크 교체나 전체 파일 포맷 변경을 하지 않는다.
- 새 TS/TSX는 명시적인 경계 타입, 2칸 들여쓰기, 작은따옴표와 세미콜론을 기본으로 하되 기존 코드 스타일을 존중한다.
- 사용자 UI와 문서는 한국어로 작성한다. 구현 세부사항은 개발 문서에 둔다.
- 서버 `.mjs`는 현재 TypeScript 검사에 포함되지 않는다. 선언 파일만으로 서버 구현까지 검사했다고 주장하지 않는다.
- 동작 수정과 무관한 리팩터링을 섞지 않는다. 중요한 실패 경로·저장 형식 변경에는 회귀 테스트를 추가한다.
- 네이버 실호출을 일반 테스트/CI에 넣지 않는다. `scripts/probe-naver.mjs`는 필요한 경우에만 수동 실행하며 제한 응답을 성공/빈 결과로 처리하지 않는다.

## 명령과 검증

| 목적 | 명령 | 범위/제약 |
| --- | --- | --- |
| 설치 | `npm ci` | lockfile 기준, 레지스트리 접근 필요 |
| 개발 | `npm run dev` | `/PlacePlane/`, URL middleware 포함 |
| 타입 검사 | `npm run typecheck` | src와 Vite 설정, 서버 JS 제외 |
| 테스트 | `npm test` | Node 내장 테스트, 외부 네트워크 없이 서버 이미지 검증 |
| 빌드 | `npm run build` | 타입 검사 + Vite 정적 빌드 |
| 배포 형태 확인 | `npm run preview` | 먼저 build, URL middleware 없음 |
| 변경 확인 | `git diff --check` | 공백 오류 확인, lint 대체 아님 |
| lint | 미구성 | `npm run lint` 없음. lint 통과라고 보고하지 않는다 |

`.github/workflows/ci.yml`은 PR 및 main push에서 Windows/Linux의 테스트·빌드를 실행한다. `.github/workflows/deploy.yml`은 main push/수동 실행 시 Pages에 배포한다. 두 workflow는 독립적이므로 main 직접 push에서 CI 실패가 배포를 막는 것은 아니다. PR의 필수 검사 설정으로 merge를 보호하는 절차는 [클라우드 인수인계](docs/cloud-workflow.md)에 있다.

## 브랜치와 작업 완료 기준

- 기본적으로 작업별 별도 브랜치/PR을 사용한다. 이어받은 미완료 브랜치가 있으면 먼저 그 상태와 목적을 확인한다. main 직접 push, 무관한 변경 포함, 강제 push를 피한다.
- 코드/문서/테스트가 해당 브랜치에 함께 있어야 다음 에이전트가 재현할 수 있다. push하지 않은 파일은 클라우드에서 볼 수 없다.
- 완료 전 관련 테스트·타입 검사·build 및 diff 검토를 실행한다. UI 변경은 실제 브라우저에서 해당 흐름과 오류 경로를 확인한다. 못 한 검증은 이유와 함께 미실행으로 기록한다.
- secret/credential/로컬 산출물을 검사하고, PR에 변경 이유·검증 결과·제약을 적는다. 허가 없이 계정 연결이나 credential 복사를 하지 않는다.
- `HANDOFF.md`의 현재 상태/남은 작업/검증 날짜를 갱신한다. 조사 근거는 docs에 기록하고 중복 대신 링크한다.
- 커밋, push, CI 성공, 배포, 기능 완료는 각각 별도로 확인한다. 로컬 성공을 클라우드 CI 성공으로 보고하지 않는다.
