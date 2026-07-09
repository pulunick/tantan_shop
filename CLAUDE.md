## Project Configuration

- **Language**: TypeScript
- **Package Manager**: npm
- **Add-ons**: prettier, eslint, vitest, tailwindcss

---

# 탄탄 편의시설 쇼핑몰 (tantan-shop)

부산 장애인편의시설·안전용품 판매/시공 업체 '탄탄'의 온라인 쇼핑몰.
1인 개발(기획·디자인·개발). 사용자 쇼핑몰 + 관리자 페이지를 단일 코드베이스로 구현한다.

## 기술 스택

- SvelteKit (Svelte 5, runes 문법) + TypeScript + Tailwind CSS v4
- Supabase Cloud 2프로젝트: tantan-dev(무료, 개발자 개인 계정) / tantan-prod(Pro, 서울 리전, 클라이언트 명의 Org)
  — 로컬 Docker 불필요. 로컬에는 npm run dev만 띄운다
- 결제: Phase 1은 무통장입금만 (PG 미연동 — 카드결제는 Phase 2)
- 배포: Vercel (prod는 클라이언트 명의 팀 + 개발자 멤버 초대)

## 명령어

- `npm run dev` — 개발 서버 (DB는 tantan-dev 클라우드에 연결, .env의 dev 키 사용)
- `npm run check` — svelte-check (타입 검사)
- `npm run lint` / `npm run format`
- `supabase migration new <name>` — 마이그레이션 SQL 생성 (레포에 커밋이 원칙)
- `supabase db push` — 링크된 프로젝트에 마이그레이션 적용. 순서: dev에 push→검증→prod에 push
- `supabase link --project-ref <ref>` — dev/prod 전환. **prod push는 사람이 직접 실행** (Claude가 임의 실행 금지)

## 환경/계정 규칙

- API 키는 신규 체계 사용: publishable(sb_publishable_..., 클라이언트 OK) / secret(sb_secret_..., 서버 전용). legacy anon/service_role 없음
- 환경변수: PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_PUBLISHABLE_KEY, SUPABASE_SECRET_KEY(PUBLIC_ 접두사 금지)
- .env(dev 키)만 로컬 보관, prod 키는 Vercel 환경변수에만. secret 키는 클라이언트 코드에 절대 노출 금지
- prod(Supabase Org·Vercel 팀·도메인)는 클라이언트(탄탄) 명의 — 고객 개인정보와 비용·소유권 귀속 때문. 개발자는 멤버 권한으로 작업

## Supabase MCP

- **tantan-dev 프로젝트 ref = `nipqixctzstukovdaapg`** (URL `https://nipqixctzstukovdaapg.supabase.co`). 이 프로젝트에만 연결. prod ref 연결 절대 금지
- ⚠️ 별도로 존재하는 `supabase-dev`/`supabase-prod` MCP는 **개발자의 다른 프로젝트(DTx)용**이다 — tantan과 무관하니 이 레포 작업에는 쓰지 말 것 (건드리거나 정리하려 하지 말 것)
- tantan DB 접근: 프로젝트 스코프 `supabase` MCP(위 ref) 또는 Supabase Management API SQL 엔드포인트
  (`POST https://api.supabase.com/v1/projects/nipqixctzstukovdaapg/database/query`, PAT Bearer)
- 용도: 스키마/데이터 조회, seed·RLS 검증, 디버깅. **스키마 변경은 MCP/API로 하지 말 것** — 반드시 마이그레이션 파일 → db push 경로 유지 (레포가 스키마의 단일 소스)

## 절대 규칙

- **재고 수량 개념 없음.** products.status enum(on_sale/sold_out/hidden)으로만 관리. quantity/stock 컬럼을 만들지 말 것 (클라이언트 확정 요구사항)
- **가격 서버 재계산.** 주문 금액은 클라이언트 값을 신뢰하지 않고 서버에서 DB 가격 기준으로 재계산
- **주문 스냅샷.** order_items에 주문 시점의 product_name/option_name/unit_price 복사 저장
- **admin 권한은 서버에서 검증.** +page.server.ts / hooks에서 profiles.role='admin' 확인. 프론트 가드만으로 처리 금지. 모든 테이블 RLS 필수
- **전화문의 상품**: price null + is_price_hidden=true → 구매 버튼 대신 tel:010-4055-3338 링크. 장바구니/주문 진입 차단
- **비회원**: 열람·검색·장바구니(localStorage) 가능, 주문은 로그인 필수. 로그인 시 로컬 장바구니를 서버로 병합
- 업로드 이미지 파일명은 uuid, 원본명은 DB 컬럼에 보존 (한글 파일명 이슈 방지). 저장소는 Supabase Storage `media` 공개 버킷, 업로드는 `src/lib/upload.ts`의 `uploadToMedia()` 사용
- PK는 UUID(`gen_random_uuid`) 유지 — int8 자동증가로 바꾸지 말 것 (auth.users 참조·주문/문의 URL 열거 방지. 근거: decision-log 2026-07-09)

## 디자인 시스템 (docs/design-system.md 가 원본)

- Navy #1F3864 / Safety Yellow #F2B705 / BG #F7F8FA / 폰트 Pretendard
- 접근성: 대비 4.5:1 이상 (전화문의 텍스트 #8F6A00, 보조 #6B7488, 네이비 위 #A8B2C7)
- 본문 15px+, 상품명 16px+, 아이콘은 라인 SVG (이모지 금지), 페이지당 h1 1개, html lang="ko"
- 관리자 UI: 60대 대표가 사용 — 버튼·글자 크게, 한 화면에 한 작업

## IA (확정)

- GNB: [상품▾ | 시공사례 | 회사소개 | 고객센터▾] + 우측 '시공·견적 문의' 옐로 CTA
  - 상품 드롭다운: 전체 상품 보기 + 카테고리(DB categories 테이블에서 동적 로드)
  - 고객센터 드롭다운: 공지사항 / 문의하기 / 자료실
- 문의는 단일 폼 (inquiries.type: general/quote/reservation). 예약 유형만 hope_date, site_address 필드 표시. CTA 진입 시 quote 프리셀렉트
- 모바일: 하단 고정 바 4칸 (전화하기/메뉴 드로어/내정보/장바구니) + 헤더 검색 아이콘

## 라우트 구조

- `(shop)/` — 메인, 상품, 장바구니, 주문, 시공사례, 고객센터, 회사소개, 약관
- `(auth)/` — 로그인, 회원가입, 비밀번호 재설정
- `(my)/mypage/` — 주문내역, 배송지, 정보수정, 내 문의
- `admin/` — 대시보드, 상품, 카테고리, 주문, 회원, 게시판, 배너, 사이트설정 (role=admin 전용)

## 참고 문서

- docs/dev-spec.md — 화면·기능 정의, ERD, 운영 정책 (기획서 요약본)
- docs/design-system.md — 컬러/타이포/컴포넌트 토큰
- docs/decision-log.md — 확정 사항 이력 (변경 시 여기에 추가)
- docs/design/ — Claude Design 연계 규칙 + 확정 시안 백업(.dc.html/.png, 기록용). 연계는 시안 수신(핸드오프/export)→토큰 기준 Svelte 재구현. **`/design-sync` 미사용**(React 전용, 스택 불일치) (README 참조)

## Phase 1 범위 밖 (구현하지 말 것)

적립금, 찜, 상품후기, 상품Q&A, 카카오 로그인, 알림톡/SMS, PG 카드결제, 실시간 캘린더 예약, 관리자 매출 통계

## 테스트 (vitest)

- 필수 테스트 대상: 주문 금액 서버 재계산, 품절/전화문의 상품 주문 차단, 비회원 장바구니 병합, RLS 정책
- UI 컴포넌트는 테스트 강제하지 않음. 위 로직 변경 시 테스트 없이 커밋 금지
