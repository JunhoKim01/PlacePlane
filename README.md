# PlacePlane

도면 이미지 위에 실제 크기의 가구를 배치하는 React + TypeScript 앱입니다.

개발을 이어받을 때는 [AGENTS.md](AGENTS.md) → [HANDOFF.md](HANDOFF.md)를 읽으세요. 데스크톱/클라우드 간 브랜치 전달 및 Work 최초 프롬프트는 [클라우드 개발 절차](docs/cloud-workflow.md)에 있습니다. 현재 배포와 로컬 변경의 차이는 HANDOFF에 기록합니다.

## 실행

Node.js 22.12 이상을 사용합니다.

```sh
npm ci
npm run dev
```

- `npm run typecheck`: 엄격한 TypeScript 검사
- `npm test`: 외부 네트워크 없는 서버 이미지 검증 테스트
- `npm run build`: 타입 검사 후 `dist/`에 정적 파일 생성
- `npm run preview`: 프로덕션 빌드 로컬 확인

`npm run build`에는 typecheck가 포함됩니다. lint 명령은 아직 없습니다. PR용 CI는 Windows/Linux에서 테스트와 build를 실행하며, 브랜치 보호 설정 여부는 [클라우드 개발 절차](docs/cloud-workflow.md#ci와-merge-보호)를 참고하세요.

## 기능

도면 업로드, cm/mm 치수 입력, 두 점을 이용한 비율 보정, 가구 드래그·회전·색상 변경, 방향키 미세 이동, 프리셋 3개 저장, 공유 코드, PNG 내보내기를 지원합니다.

가구와 프리셋은 해당 브라우저의 localStorage에 저장됩니다. 도면 이미지는 서버로 업로드되지 않으며 새로고침 시 다시 선택해야 합니다. 공유 코드에는 가구 배치만 포함되므로 받는 쪽에서 도면과 비율을 별도로 설정해야 합니다. 기존 UI는 데스크톱 화면(최소 1024px)에 맞춰져 있습니다.

## 구성

- `src/App.tsx`: 원본에 TypeScript 타입과 저장 초기화 보호를 적용한 앱
- `code_artifact.tsx`: 제공받은 원본 보관
- `src/index.css`: Tailwind CSS 스타일
- `vite.config.ts`: GitHub Pages 경로 `/PlacePlane/` 설정
- `.github/workflows/deploy.yml`: main push → 의존성 설치 → 타입 검사·빌드 → Pages 배포

## 로컬 도면 URL 가져오기

`npm run dev`로 실행한 화면에서 **네이버 도면 URL로 가져오기**를 누르고 이미지 주소를 붙여넣습니다. 미리보기에서 도면을 확인한 뒤 **이 도면 사용**을 누르면 바로 적용됩니다. 적용 후 실제 길이를 보정하세요.

이 기능은 현재 로컬 개발 서버에서만 제공됩니다. GitHub Pages에는 서버 기능이 없어 운영 빌드에서는 URL 버튼을 표시하지 않습니다. 이미지 복사 후 Ctrl+V로 붙여넣기는 브라우저에서 동작합니다.

네이버 단지 자동 검색은 요청 제한(HTTP 429)으로 아직 연결하지 않았습니다. [검증 결과와 재현 방법](docs/naver-investigation.md)을 참고하세요.

## GitHub Pages 배포

저장소 Settings → Pages → Source를 **GitHub Actions**로 설정합니다.
`main`에 push하면 자동 배포됩니다. Actions 화면에서 수동 실행도 가능합니다.

배포 주소: https://JunhoKim01.github.io/PlacePlane/

배포 구성은 [Vite 공식 가이드](https://vite.dev/guide/static-deploy#github-pages)를 따릅니다.
