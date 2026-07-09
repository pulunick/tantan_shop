# Claude Design → Claude Code 연계 규칙

> 이 프로젝트는 **Svelte** 스택이고, `/design-sync`(claude.ai/design 컴포넌트 라이브러리 동기화)는
> **React 컴포넌트 라이브러리 전용**이라 사용하지 않는다. 연계는 **시안 수신 → Svelte 재구현** 단방향.

## 기본 경로: 시안 받기 → 토큰 기준 Svelte 구현

1. Claude Design에서 화면을 확정한다.
2. 다음 중 하나로 Claude Code에 전달:
   - **핸드오프**: Export → "Send to Claude Code" (새 세션이 열림), 또는
   - **파일**: `<화면>.dc.html`(+ `<화면>.png` / `<화면>.mobile.png`)를 이 폴더에 저장
3. Claude Code가 구현:
   - `.dc.html`은 React 런타임 번들이다 — **마크업/스크립트를 복사하지 말 것**.
   - 레이아웃 구조(섹션 순서·그리드 열 수), spacing/크기, 상태 변형(품절/전화문의/배지)을 **추출**해
     **Svelte 5 + `docs/design-system.md` 토큰**으로 새로 구현한다. 색·폰트 충돌 시 design-system.md 우선.
   - 하드코딩 데이터(상품 8개, 공지 3건 등)는 seed로 옮기고 컴포넌트는 **DB 조회**로 구현.
4. 시안에 없는 상태(빈 목록/로딩/에러/폼 검증)는 디자인 시스템 톤에 맞춰 직접 설계.

## 핸드오프/전달 전 Claude Design 쪽 체크

- 엣지 상태(빈 목록/로딩/에러/폼 검증)까지 만들면 Claude Code가 임의로 안 채워도 됨
- 상태 변형 포함: 품절, 전화문의, 배지
- 구현 지시는 캔버스 주석으로 (핸드오프 번들에 함께 실려감)

## 폴더 규칙 (기록용)

확정 시점의 export를 스냅샷으로 커밋해 시안 이력을 남긴다:

- `<화면>.dc.html` — export 원본 (마크업 복사 금지, 기록·참조용)
- `<화면>.png` / `<화면>.mobile.png` — 전체 페이지 캡처
