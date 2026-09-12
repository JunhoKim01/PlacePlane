# PlacePlane 인수인계

기록일: 2026-09-12. 근거: 현재 코드, Git 상태, 이 프로젝트의 2026-09-10~12 개발 대화. 의도가 확인되지 않은 부분은 문제/미결정으로 구분했다.

후속 지시(2026-09-12): 사용자는 PC 사용 중에는 이 Codex 작업에서 개발을 계속하고, 준비된 변경을 push한 뒤 CI를 확인해 main으로 머지하도록 승인했다. 아래 미커밋/미게시 설명은 문서 작성 당시의 스냅샷이다. 게시 이후의 현재 상태는 Git 커밋과 GitHub PR/Actions 결과를 기준으로 확인한다. main에서 이 문서를 읽는 에이전트는 예전 작업 브랜치로 되돌아가지 말고 최신 main에서 새 작업 브랜치를 만든다.

## 목표

- 국내 아파트 도면에 실제 크기로 가구를 배치한다.
- 궁극적으로 단지·주소 검색 → 평형/타입 선택 → 도면 미리보기 → 캔버스 적용을 지원해 수동 파일 다운로드를 줄인다.
- 개발은 데스크톱 Codex와 이동 중 ChatGPT Work를 오가되 GitHub 브랜치·PR·문서·CI를 공통 기준으로 삼는다. 스마트폰에서 개발을 지시한다는 목표와 앱 자체의 모바일 UI 지원은 별개다.

## 최신 공유 상태

2026-09-12 기능·문서·CI가 `d4bc0a7`로 커밋되어 GitHub에 게시되었다. [PR #1](https://github.com/JunhoKim01/PlacePlane/pull/1)에서 CI를 확인한 뒤 main으로 머지하는 작업이다. 이 PR을 통해 main에 들어온 경우 아래의 미커밋 기록은 과거 상태이며, 다음 개발은 최신 main을 기준으로 한다. 현재 merge/배포 결과는 PR과 Actions에서 확인한다.

## 게시 전 Git/배포 스냅샷 (과거 기록)

2026-09-12 `git fetch origin` 후 확인한 기록이며 이후에는 실제 Git/Actions 상태를 다시 확인한다.

- 저장소: https://github.com/JunhoKim01/PlacePlane
- 최초/현재 기준 커밋: `cbb5987` — `Bootstrap PlacePlane with React TypeScript and GitHub Pages`. 확인 시 main과 origin/main 모두 이 커밋이며 다른 기존 브랜치는 없었다.
- 이번 문서 정리는 `codex/work-handoff` 브랜치에서 수행했다. 기존 작업 트리 변경을 보존했고 커밋/push/PR 생성은 하지 않았다.
- 최초 배포는 2026-09-10 Actions 성공 및 사이트 HTTP 200을 확인했다: https://junhokim01.github.io/PlacePlane/ . 9월 12일 실서비스 동작을 새로 검증한 기록은 아니다.
- URL 가져오기/붙여넣기 확장과 아래 인수인계 파일은 아직 미커밋 상태에서 작성되었다. GitHub main만 읽으면 이 상태가 복원되지 않는다. 이 파일들과 관련 코드를 함께 커밋/push해야 한다.

## 구현 상태와 완료된 작업

| 기능/작업 | 상태 |
| --- | --- |
| React + TS + Vite + Tailwind 3 + Lucide 부트스트랩 | 기준 커밋에 포함 |
| 업로드, cm/mm, 2점 비율 보정, 드래그/45도 회전/색상/삭제, 방향키 이동 | 기준 커밋에 포함 |
| 가구/너비/단위 localStorage, 프리셋 3개, FURN 공유 코드, PNG 생성 | 기준 커밋에 포함 |
| StrictMode 초기 저장 덮어쓰기 방지 및 strict TS 타입 추가 | 기준 커밋에 포함 |
| GitHub Pages main 자동 배포 | 기준 커밋에 포함, 최초 배포 확인 |
| 이미지 Ctrl+V 붙여넣기, 공통 파일 검증, object URL 수명/오래된 요청 보호 | 이전 세션의 로컬 변경, 아직 미커밋 |
| 네이버 이미지 URL → 중계 → 미리보기 → 적용 | 이전 세션의 로컬 변경, Vite dev 전용 |
| 단지명/주소 자동 검색 및 평형 매핑 | 미구현. 조회 경로는 찾았으나 실호출 429 |
| 운영용 이미지 중계 서버 | 미구현/미배포 |
| AGENTS/HANDOFF/클라우드 절차, npm test, PR CI/템플릿 | 이번 정리에서 추가. GitHub 실행은 아직 미확인 |

이번 정리 시작 전에 수정되어 있던 파일: `README.md`, `src/App.tsx`, `vite.config.ts`.
당시 미추적 파일: `docs/naver-investigation.md`, `scripts/probe-naver.mjs`, `server/floor-plan.mjs`, `server/floor-plan.d.mts`, `server/floor-plan.test.mjs`, `src/FloorPlanUrlDialog.tsx`, `src/floorPlanImage.ts`, `src/vite-env.d.ts`.
이들은 폐기할 임시 파일이 아니라 이전 세션의 실제 구현/조사 결과다. 이번 문서 작업에서 앱 소스나 기존 배포 workflow는 수정하지 않았다.

## 중요한 결정과 이유

- 원본 `code_artifact.tsx`를 보존하고 `src/App.tsx`를 실행 코드로 사용한다. 제공된 UI/기능을 유지하는 부트스트랩이었다.
- GitHub Pages가 사용자 지정 호스팅이므로 정적 Vite 빌드와 `/PlacePlane/` base를 사용한다.
- URL 가져오기는 Vite dev middleware로 먼저 검증했다. 외부 이미지에 CORS 허용 헤더가 없어 Blob으로 전달해야 기존 canvas PNG 생성과 함께 동작했다. 현재 운영 서버는 선택하지 않았다.
- API가 없는 production/preview에서는 URL 버튼을 숨긴다. 이 개발 전용 동작을 클라우드/Pages에서도 작동한다고 설명하지 않는다.
- 비율은 2점의 실제 길이로 보정한다. 단순 면적(59㎡ 등)만으로 전체 이미지 너비를 결정하지 않았다.
- 도면은 메모리의 Blob URL, 배치/프리셋은 localStorage에 둔다. 도면의 기기 간 동기화나 영속 저장은 구현하지 않았다. 원래 구조를 유지한 상태이지, 영구적으로 금지한 기능은 아니다.
- 프리셋을 남기는 캔버스 초기화는 원본 주석으로 명시된 의도다. 공유 코드에 이미지/비율이 없는 것은 현재 포맷의 제약이다.
- 이제 AI 작업은 별도 브랜치/PR, 검증 결과와 문서 갱신을 기본으로 한다(2026-09-12 사용자 요청).

## 시도/보류한 접근과 조사 근거

- 공식 네이버 이미지 검색 API: 키가 필요한 방식으로 제안했으나 사용자가 선택/키를 제공한 적 없다. 이것만이 유일한 방법이라는 초기 설명은 대화에서 정정했다.
- 전문 도면 API(KOVI 등): 존재를 조사했지만 계약/통합하지 않았다.
- 오늘의집: 아키스케치의 도면 검색·제작 시스템을 활용한다는 공식 안내를 확인했다. 아키스케치는 건물 정보를 네이버 부동산 기준으로 관리한다고 안내한다. 오늘의집이 검색 시마다 네이버 이미지를 실시간 수집한다는 증거는 없으며, 외부에서 사용 가능한 무료 검색 API도 확보하지 않았다.
  - [오늘의집 공식 가이드](https://ohou.se/advices/5234)
  - [아키스케치 도면 등록 가이드](https://docs.channel.io/archisketch/ko/articles/3D-도면-요청-가이드-dc035b8a)
- 네이버 직접 조회: 상세 요청 경로, 이미지 성공, 429 및 x-attest 관찰은 [조사 기록](docs/naver-investigation.md)이 원본이다. 429 원인이 x-attest 부재라고 확정하지 않았다. 검증 토큰 복제·세션 추출·자동 재시도는 구현하지 않았다.
- 외부 검색창 + 이미지 복사/붙여넣기도 제안했으나 외부 검색 UI는 구현하지 않았다. 현재 버튼은 URL 입력이며 검색이 아니다.

## 남은 작업 (우선순위)

1. 이 브랜치의 기존 기능 변경과 인수인계/CI 변경을 검토해 함께 GitHub에 게시한다. 문서만 push하면 소스 링크가 깨지고 기능 상태가 누락된다. [동기화 절차](docs/cloud-workflow.md) 참고.
2. PR에서 Windows/Linux CI 성공을 확인하고 main 필수 검사/PR 보호를 설정한다. 저장소 규칙은 이번 작업에서 변경하지 않았다.
3. 다음 기능 작업 전에 아래 입력 검증과 오류 전달 문제를 재현하고 작게 분리해 수정할 수 있다. 이번 정리에서는 동작을 바꾸지 않았다.
4. 네이버 자동 검색은 안정적인 접근/응답을 확보한 뒤 구현한다. 429를 반복 호출해 성공을 기대하지 않는다. 필요하면 다른 데이터 제공 경로를 사용자와 결정한다.
5. 선택한 데이터 소스에 맞춰 단지/주소 구분, 공급·전용면적/타입, 없음·제한·오류 상태, 출처와 미리보기를 구현한다. 실제 응답 구조를 추측해 작성하지 않는다.
6. 운영에서 URL/검색 기능을 제공할 경우 별도 서버 호스팅·원본 접근·CORS·운영 제한을 결정하고 Pages UI를 연결한다. 공급자/계정/비용은 미결정이다.

## 알려진 제약과 코드 검토상 문제

- GitHub Pages/preview에는 URL API가 없다. 개발 서버가 꺼지면 로컬 URL 가져오기도 종료된다. 클라우드 개발 환경은 자체 dev 서버와 네트워크 접근이 필요하다.
- 도면은 새로고침 시 사라진다. localhost/Pages/다른 기기의 localStorage는 서로 공유되지 않는다.
- UI 최소 너비 1024px. 앱 모바일 최적화는 미구현이다.
- 저장 JSON은 parse 오류를 잡지만 구조 검증은 없다. 공유 코드도 행 길이만 확인하며 원소 타입·수치 범위를 검증하지 않는다. 잘못된 입력이 렌더링/저장을 깨뜨릴 가능성이 있다(코드 검토 근거, 이번 턴 재현 테스트는 안 함).
- 수동 전체 너비 입력은 0/음수 등을 막지 않는다. 0이면 스케일 계산이 유효하지 않을 수 있다. 2점 보정의 입력 검증과 별개다.
- `importFloorPlan`은 실패를 toast로 처리하고 Promise를 정상 종료한다. URL dialog는 이를 성공/실패 구분 없이 받아 닫힐 수 있다(코드 검토 근거).
- 서버 테스트는 URL/fetch 함수 위주다. HTTP middleware의 상태 코드/동시성, UI/붙여넣기/저장 포맷을 모두 자동 검증하지 않는다. `.mjs`는 tsc 검사 밖이다.
- ESLint/formatter 설정과 lint 명령은 없다. UI E2E 테스트 도구도 설치되지 않았다.
- CI와 배포는 별도 workflow다. PR 보호 없이 main에 직접 push하면 CI 성공 전에도 배포될 수 있다.

## 이번 작업 범위에서 제외

앱 리팩터링/디자인 변경, 위 문제의 수정, 새 검색 데이터 소스 도입, 인증 우회, 운영 서버 배포, GitHub 계정/Work 연결 설정, repository rules 변경, 모바일 앱 UI, 3D 엔진, 유료 API 계약, 자동 merge. 커밋/push/PR도 아직 수행하지 않았다.

## 다음 에이전트가 읽을 파일

1. `AGENTS.md`: 호환성 규칙, 검증/완료 기준.
2. 이 파일: 현재 상태와 남은 작업.
3. `docs/cloud-workflow.md`: 브랜치 전달, 공개 전 검사, Work 최초 프롬프트.
4. `package.json`, `.github/workflows/ci.yml`, `.github/workflows/deploy.yml`: 실행/검증/배포 경계.
5. `src/App.tsx`, `src/floorPlanImage.ts`, `src/FloorPlanUrlDialog.tsx`: 상태와 가져오기 흐름.
6. `vite.config.ts`, `server/floor-plan.mjs`, `server/floor-plan.test.mjs`: dev 중계와 테스트.
7. `docs/naver-investigation.md`, `scripts/probe-naver.mjs`: 외부 연동 근거. 스크립트는 자동 실행하지 않는다.

## 검증 기록과 재현

명령의 기준 목록은 [AGENTS.md](AGENTS.md#명령과-검증)에 있다. 새 환경에서는 `npm ci` → `npm test` → `npm run build` 순서로 실행한다. build에 typecheck가 포함된다.

- 2026-09-10: 타입 검사, build, 서버 단위 테스트 3개 통과. 실제 로컬 브라우저에서 사용자 도면 URL 미리보기/적용, 가구 추가 후 PNG 생성, 잘못된 호스트 오류/기존 도면 보존 확인. 최초 배포 때 가구 추가와 새로고침 후 localStorage 유지 확인.
- 2026-09-12: Git 공유 대상 27개 파일만 시스템 임시 폴더에 복사한 새 소스 스냅샷에서 `npm ci`, `npm test`(3개), `npm run build`(typecheck 포함) 모두 통과. Windows, Node 22.20.0 / npm 10.9.3. 설치 시 npm audit는 취약점 0개를 보고했다. 기존 node_modules나 dist, 네이버 조사 임시 파일을 복사하지 않아도 재현되었다.
- 같은 날 `git diff --check` 통과. 공유 대상 파일 및 기존 전체 커밋(1개)에 대해 주요 토큰/개인키 패턴 검사에서 발견 사항 없음. 추적 중인 credential/빌드 산출물 파일명도 발견하지 못했다. 이는 알려진 패턴 검사이며 모든 secret 부재를 보증하는 검사는 아니다. `.gitignore` 제외 규칙도 확인했다.
- 이번 정리는 앱 동작을 수정하지 않았으므로 UI/네이버 실호출을 반복하지 않았다. Linux 실행, GitHub CI 실행, Work 계정의 실제 연결·실행은 미검증이다. 최초 PR에서 확인한다.

저장소만으로 복원 가능한지 검토한 결과, 실행 설정·코드·실패한 조회 경로·미구현 범위·검증 절차는 이 브랜치의 파일에 포함되어 있다. 제외한 임시 조사 파일은 현재 실행에 필요하지 않다. 다만 이 브랜치를 push하기 전에는 Work가 해당 파일을 읽을 수 없으며, push 이후에도 Work의 저장소 접근/실행 도구는 별도 확인이 필요하다.

수동 UI 재현: `npm run dev` → `/PlacePlane/` → 파일 업로드 또는 이미지 Ctrl+V → URL 미리보기/적용 → 가구 추가/회전 → 2점 보정 → PNG 생성 → 잘못된 URL 후 기존 도면 보존. 사용자 개인 배치를 시험 데이터로 덮어쓰지 않는다. production 확인은 build 후 preview에서 URL 버튼이 없는지 확인한다.

개인 도면 없이 사용할 공개 재현 주소(사용자가 제공한 자양우성7차 59타입, 내용/현재 접근 가능 여부는 재확인):
https://landthumb-phinf.pstatic.net/20120124_252/land_system_1327401110403OJgcz_JPEG/112_97_1_82_GA1_1283409952580.jpg?type=m1024

이 이미지 파일 자체, 브라우저 저장 내용, 네이버 HTML/JS 임시 분석 파일은 저장소에 포함하지 않는다.
