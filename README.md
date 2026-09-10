# PlacePlane

도면 이미지 위에 실제 크기의 가구를 배치하는 React + TypeScript 앱입니다.

## 실행

Node.js 22.12 이상을 사용합니다.

```sh
npm ci
npm run dev
```

- `npm run typecheck`: 엄격한 TypeScript 검사
- `npm run build`: 타입 검사 후 `dist/`에 정적 파일 생성
- `npm run preview`: 프로덕션 빌드 로컬 확인

## 기능

도면 업로드, cm/mm 치수 입력, 두 점을 이용한 비율 보정, 가구 드래그·회전·색상 변경, 방향키 미세 이동, 프리셋 3개 저장, 공유 코드, PNG 내보내기를 지원합니다.

가구와 프리셋은 해당 브라우저의 localStorage에 저장됩니다. 도면 이미지는 서버로 업로드되지 않으며 새로고침 시 다시 선택해야 합니다. 공유 코드에는 가구 배치만 포함되므로 받는 쪽에서 도면과 비율을 별도로 설정해야 합니다. 기존 UI는 데스크톱 화면(최소 1024px)에 맞춰져 있습니다.

## 구성

- `src/App.tsx`: 원본에 TypeScript 타입과 저장 초기화 보호를 적용한 앱
- `code_artifact.tsx`: 제공받은 원본 보관
- `src/index.css`: Tailwind CSS 스타일
- `vite.config.ts`: GitHub Pages 경로 `/PlacePlane/` 설정
- `.github/workflows/deploy.yml`: main push → 의존성 설치 → 타입 검사·빌드 → Pages 배포

## GitHub Pages

저장소 Settings → Pages → Source를 **GitHub Actions**로 설정합니다.
`main`에 push하면 자동 배포됩니다. Actions 화면에서 수동 실행도 가능합니다.

배포 주소: https://JunhoKim01.github.io/PlacePlane/

배포 구성은 [Vite 공식 가이드](https://vite.dev/guide/static-deploy#github-pages)를 따릅니다.
