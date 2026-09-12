# 데스크톱 ↔ 클라우드 개발 인수인계

## 공유되는 것과 공유되지 않는 것

GitHub의 특정 브랜치에 **커밋하고 push한** 코드·문서·테스트를 공유 기준으로 사용한다. 대화 기록, 로컬 미추적 파일, localhost 서버, 브라우저 localStorage, 업로드한 도면, 시스템 임시 파일은 클라우드 에이전트가 갖고 있다고 가정하지 않는다.

로컬 PC가 꺼져 있어도 GitHub에 게시한 저장소를 클라우드에서 읽을 수 있는 연결이 있으면 인수인계 문서로 상태를 복원할 수 있다. 다만 Work 계정의 GitHub 읽기/쓰기, 브랜치 선택, 코드 실행 및 PR 생성 도구 제공 여부는 이 세션에서 확인하지 않았다. 저장소 문서를 추가하는 것만으로 연결이나 실행 권한이 생기지는 않는다. Work가 AGENTS.md를 자동 적용한다고 가정하지 말고 최초 프롬프트에서 읽도록 명시한다.

[OpenAI 공식 안내](https://learn.chatgpt.com/)는 Work의 작업/산출물 기능과 Codex의 코드 이해·수정·테스트 용도를 구분한다. 이 프로젝트의 Work 계정에서 모든 개발 기능이 가능하다는 근거로 해석하지 않는다. 실제 도구가 없으면 가능한 읽기/계획 범위와 필요한 연결을 보고하도록 한다.

## 이 브랜치를 처음 게시할 때

2026-09-12 정리 브랜치는 `codex/work-handoff`이며 아직 미커밋이다. 아래는 검토 후 실행할 절차이고, 이 문서를 만들면서 실행한 명령이 아니다.

1. `git status --short --branch`, `git diff`, `git ls-files --others --exclude-standard`로 이번 문서/CI와 기존 URL 기능 변경을 함께 확인한다.
2. `npm ci`, `npm test`, `npm run build`, `git diff --check`를 실행한다. 명령별 실패를 확인하며 실패했는데 다음 결과만 보고 성공으로 판단하지 않는다.
3. 아래 공개 전 검사 후 필요한 파일만 stage한다. `git diff --cached --stat`와 `git diff --cached`를 다시 검토한다.
4. 기능 소스와 인수인계/CI를 논리적으로 나누어 커밋할 수 있지만, Work에 넘기기 전에 이 브랜치에 모두 포함되어야 한다. 특히 server/src의 현재 미추적 파일을 누락하지 않는다.
5. `git push -u origin codex/work-handoff` 후 main 대상으로 PR을 만든다. main merge는 Pages 자동 배포를 일으킨다.
6. PR URL, 전달 브랜치, HEAD SHA, 검증 결과를 Work 최초 메시지에 명시한다. 아직 merge하지 않았다면 Work가 main 대신 해당 브랜치를 읽도록 한다.

## 이후 매 작업

- 시작: fetch 후 목표 브랜치와 SHA, dirty 상태를 확인하고 AGENTS/HANDOFF를 읽는다. 별도 작업 브랜치를 사용하되 작업 간 의존성이 있으면 기준 브랜치를 명시한다.
- 같은 파일/브랜치를 데스크톱과 Work에서 동시에 수정하지 않는다. 각 작업은 독립 브랜치를 쓰고 최신 main 반영 시 기존 작업을 보존한다.
- 종료: 코드/테스트와 함께 HANDOFF의 상태·근거·남은 작업·검증 날짜를 갱신하고 commit/push한다. 단순 문서 편집을 기능 구현 완료로 기록하지 않는다.
- PR: 변경 전후, 테스트 명령/결과, dev와 production 차이, 미해결 사항을 기입한다. 확인한 CI가 현재 PR HEAD의 결과인지 확인한다.
- 데스크톱 복귀: `git fetch origin` 후 PR diff/CI를 읽고 해당 브랜치를 checkout한다. dirty 작업이 있으면 임의 reset/clean하지 않는다.

## CI와 merge 보호

`.github/workflows/ci.yml`: PR과 main push에 `npm ci`, `npm test`, `npm run build`를 Windows/Linux에서 실행한다. 네이버 실호출이나 secret은 필요 없다. Node 테스트는 fetch를 주입해 가짜 응답으로 검증한다.

GitHub에서 이 workflow를 처음 실행한 뒤 실제 check 이름을 확인하고, main ruleset/branch protection에 두 OS의 `verify` 검사를 필수로 지정하는 것을 권장한다. PR을 통한 merge, 최신 HEAD 검사 통과를 요구한다. **규칙을 이 작업에서 설정하지 않았다.** 워크플로 파일만으로 merge가 강제 차단되지는 않는다. 기존 deploy workflow는 별도이며 main 직접 push에서 이 CI를 기다리지 않는다.

## 공개 전 검사

- `.env*`, 실제 `.npmrc` 인증 설정, 개인키/인증서, PAT/API key, Git credential, 브라우저 쿠키·검증 토큰, 네트워크 HAR를 커밋하지 않는다. `.env.example`은 실제 값 없는 예시만 허용한다.
- `node_modules/`, `dist/`, 로그, coverage, 테스트 스크린샷/산출물, 실제 사용자 도면·localStorage 덤프를 포함하지 않는다.
- dev 전용인 `server/` 소스는 **공유해야 할 코드**다. 개인 컴퓨터에서 생성된 데이터/자격 증명과 구분한다.
- `.gitignore`는 이미 추적한 파일에 적용되지 않는다. `git ls-files`와 staged diff를 검사한다. ignore 규칙만 보고 안전하다고 판단하지 않는다.
- 이 저장소에서는 정상 설치/테스트/빌드에 환경변수나 API 키가 필요 없다. 클라우드에 데스크톱의 Git 자격 증명을 복사하지 않는다.
- 문자열 검사는 알려진 패턴 중심이라 미탐 가능성이 있다. 새로운 파일을 stage할 때 다시 검토하고 GitHub secret scanning/push protection의 실제 사용 가능 여부를 별도로 확인한다.

## Work에 전달할 최초 프롬프트

아래 `<전달 브랜치>`와 `<커밋 SHA>`는 실제 push 완료 후 확인한 값으로 바꾼다. 최초 인수인계 브랜치는 `codex/work-handoff`; merge 후라면 main의 최신 SHA를 사용한다.

```text
GitHub 저장소 https://github.com/JunhoKim01/PlacePlane 의 <전달 브랜치>, <커밋 SHA>를 기준으로 PlacePlane 개발을 이어가줘.

대화 기록이나 내 로컬 PC에 의존하지 말고, AGENTS.md → HANDOFF.md → README.md → docs/cloud-workflow.md를 먼저 읽어줘. 실제 브랜치/HEAD와 git 상태를 확인하고 문서와 다르면 알려줘.

우선 구현/배포 상태, 남은 작업, 검증 가능한 범위를 요약해줘. 현재 네이버 단지 자동 검색은 미구현이고 URL 가져오기는 Vite dev 전용이라는 점을 구분해줘. 조사 작업은 docs/naver-investigation.md를 먼저 읽고, probe-naver.mjs를 자동 실행하거나 429 요청을 반복하지 마.

GitHub 접근·코드 실행·쓰기·PR 생성 도구가 실제로 제공되는지 확인해줘. 실행 가능하면 npm ci, npm test, npm run build로 기준 상태를 검증하고 결과를 보고해줘. 도구/권한이 없으면 가능한 범위와 부족한 연결만 정확히 알려줘.

아직 새 기능을 임의로 선택해 수정하지 말고 다음 작업 후보를 제안해줘. 이후 승인된 작업은 별도 브랜치/PR로 수행하고 테스트 및 HANDOFF를 갱신해줘. main 직접 push나 자동 merge는 하지 마.
```
