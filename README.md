# 탄탄 편의시설 쇼핑몰 (tantan-shop)

부산 장애인편의시설·안전용품 판매/시공 업체 '탄탄'의 온라인 쇼핑몰.
SvelteKit(Svelte 5 runes) + TypeScript + Tailwind CSS v4 + Supabase.

개발 규칙·아키텍처는 [`CLAUDE.md`](./CLAUDE.md), 스펙은 [`docs/`](./docs/) 참조.

## 기술 스택

- **프론트/백**: SvelteKit (Svelte 5 runes), TypeScript
- **스타일**: Tailwind CSS v4 (`@theme` 토큰은 `src/app.css`, 원본은 `docs/design-system.md`)
- **DB/인증**: Supabase Cloud — `tantan-dev`(개발) / `tantan-prod`(운영). 로컬 Docker 미사용
- **결제**: Phase 1 무통장입금만 (PG 미연동)
- **배포**: Vercel (`@sveltejs/adapter-vercel`)

## 구현 현황 (Phase 1, 2026-07-10 기준)

**DB**: 초기 스키마(14테이블·RLS·트리거) + `media` Storage 버킷(공개read/admin write) — dev 적용·검증 완료. 시드 데이터 반영. PK는 UUID 유지.

**사용자 쇼핑몰** — 공통 레이아웃(헤더·GNB 드롭다운·모바일 드로어/하단바·푸터) · 메인 · 상품리스트(필터/정렬/페이지네이션) · 상품상세(판매중/품절/전화문의 3상태) · **장바구니(비회원 localStorage/회원 서버)** · **체크아웃+주문생성(서버 가격재계산·주문 스냅샷·품절/전화문의 차단)** · 주문완료 · 로그인 시 카트 병합 · 회원(로그인/가입/재설정) · 마이페이지(주문내역·상세·취소요청·정보수정·내문의·탈퇴·배송지안내) · 고객센터(공지·시공사례·자료실·문의폼, 게스트 비번 scrypt 해시).

**관리자**(`/admin`, role=admin) — 셸(다크 사이드바)·대시보드·상품(품절토글·등록/수정·이미지업로드)·카테고리·주문(상태플로우·배송중=송장 필수)·회원·게시판(공지/사례/자료실 CRUD·문의답변)·배너·설정.

**테스트**: `npm run test` — 주문 서버 재계산·품절/전화문의 주문차단·비회원 카트 병합·주문번호/스냅샷 (24개).

**전체 e2e 검증 완료**(2026-07-09): 가입/로그인→상품→장바구니→체크아웃(서버 가격재계산·스냅샷)→관리자 입금확인/송장→마이페이지 배송확인. 서버레벨 HTTP 하니스(실제 엔드포인트·쿠키·RLS)와 브라우저 클릭-스루 양쪽으로 확인.

**정책 결정 반영 완료**(2026-07-09, decision-log 참조):

- 배송지: 주소록 테이블 없이 현행 유지 + 체크아웃 "최근 배송지 불러오기"(마지막 주문 주소 프리필).
- 회원탈퇴: 익명화 탈퇴(`profiles.withdrawn_at`) — 주문無 완전삭제 / 주문有 PII 비식별화+auth 밴, 주문 row 보존.

**UX 보강 구현 완료**(2026-07-10, `docs/ux-enhancements.md` P1+저비용 P1+ / 시안 `docs/handoff-ux/` [9]~[12]):

- 전역: svelte-sonner 토스트(네이비 테마), 404/에러 페이지(전화 동선), 이미지 lazy, 모바일 맨위로 버튼
- 주문: Daum 우편번호(차단 시 직접 입력 폴백), 휴대폰 자동 하이픈, 주문완료 입금 안내 카드+계좌 복사
- 주문상세: 상태 타임라인 5단계, 택배사 배송조회 링크(couriers.ts 단일 소스), 취소 다이얼로그
- 상품: 라이트박스(native dialog), 전화문의 이중 동선(문의 프리필), URL 복사, 검색 0건 전화 유도
- 비회원 문의조회 `/inquiry/check`(scrypt 서버 검증, 열거/타이밍 방어, 레이트리밋)
- 관리자: 원클릭 입금확인(이중 처리 방지), 배너 크롭 미리보기 2종+업로드 압축, 상품폼 가격 콤마+Tiptap 위지윅(서버 sanitize 다층 방어)
- 검증: check/lint/vitest 25/25 + 8앵글 코드리뷰(수정 10건 반영) + dev 스모크. **사용자 수동 테스트 대기**

**마이페이지 리디자인 완료**(2026-07-10, 시안 `docs/design_handoff_mypage/`):

- 공통 셸(헤더/GNB/푸터/모바일바)을 (my)에도 적용 — 쇼핑 동선 연결, 브레드크럼+쇼핑 계속하기
- 좌측 메뉴(아바타·활성 보더·카운트 배지)/모바일 가로 탭, 개요 네이비 요약 카드(진행중 주문 배지)
- 주문내역 카드 리스트, 내 문의 답변 아코디언+본문 미리보기, 탈퇴 이중 게이트("탈퇴" 입력+동의)
- **비밀번호 변경 신규**(`?/password` — 현재 비번 재검증 후 변경). 배송지는 옵션 2(스타일만, CRUD는 Phase 2)
- 주문 상세는 확정 [10] 타임라인 시안 유지(무변경)

**남은 것**:

- 배포: **GitHub `pulunick/tantan_shop`(main) 반영 완료.** Vercel 배포 + prod Supabase(마이그레이션·시드·admin 승격) 미착수.
  ⚠️ prod Supabase 셋업 시 **Authentication → Sign In / Providers → Email → "Confirm email" OFF** 필수 (dev와 동일, decision-log 2026-07-10 즉시 로그인 정책).
- 이미지 업로드는 orphan storage 객체 정리 미구현(단순화).
- 클라이언트 확인 대기: 입금/환불 기한 문구(site_settings), 신규 주문/문의 이메일 알림(P1+), 무통장 계좌 실계좌 교체.
- 리팩터 백로그: ConfirmDialog 공용화, bank_account 조회 헬퍼화, 관리자 목록 invalidateAll 최적화.

## 최초 셋업 순서

> 사전 조건: Supabase 클라우드에 `tantan-dev` 프로젝트가 생성되어 있어야 함.
> Supabase CLI 는 `npx supabase ...` 로 실행(전역 설치 불필요).

1. **의존성 설치**

   ```sh
   npm install
   ```

2. **환경변수 채우기** — `.env.example` 를 `.env` 로 복사 후 `tantan-dev` 실제 키 입력
   (Supabase 대시보드 → Project Settings → API Keys, 신규 `sb_publishable_...` / `sb_secret_...`)

   ```sh
   cp .env.example .env
   # PUBLIC_SUPABASE_URL / PUBLIC_SUPABASE_PUBLISHABLE_KEY / SUPABASE_SECRET_KEY
   ```

   - `PUBLIC_*` 는 클라이언트 노출 OK. `SUPABASE_SECRET_KEY` 는 서버 전용 — `PUBLIC_` 접두사 금지, 클라이언트 코드에 절대 노출 X.

3. **dev 프로젝트 링크** — tantan-dev ref 는 `nipqixctzstukovdaapg`

   ```sh
   npx supabase link --project-ref nipqixctzstukovdaapg
   ```

   > 비대화형(non-TTY) 환경에서는 `supabase login` 대신 PAT 를 쓴다:
   > `SUPABASE_ACCESS_TOKEN=<sbp_토큰> npx supabase link --project-ref nipqixctzstukovdaapg -p "<DB비밀번호>"`
   > (PAT: 대시보드 → Account → Access Tokens. `supabase-dev` MCP 는 다른 프로젝트용이라 tantan 과 무관)

4. **마이그레이션 적용** (스키마 생성) — dev 에 push

   ```sh
   npx supabase db push
   ```

   > ⚠️ **prod push 는 사람이 직접 실행.** dev 검증 완료 후에만 prod 로 진행하며,
   > 스키마 변경은 반드시 `supabase/migrations/` 파일 → `db push` 경로로만 한다 (MCP 로 직접 변경 금지).

5. **시드 데이터 적용** — `supabase/seed.sql` (데이터 전용, 재실행 안전)

   - Supabase 대시보드 **SQL Editor** 에 `supabase/seed.sql` 내용을 붙여넣어 실행, 또는
   - `psql "<connection-string>" -f supabase/seed.sql` (psql 설치 시), 또는
   - **Management API** (psql 없이): 파일을 `{"query": ...}` 로 감싸 POST
     ```sh
     node -e "const fs=require('fs');process.stdout.write(JSON.stringify({query:fs.readFileSync('supabase/seed.sql','utf8')}))" \
       | curl -X POST "https://api.supabase.com/v1/projects/nipqixctzstukovdaapg/database/query" \
         -H "Authorization: Bearer <sbp_토큰>" -H "Content-Type: application/json" --data @-
     ```

6. **관리자 계정 승격** — `auth.users` 직접 INSERT 금지. 아래 순서로 승격한다.

   1. 앱에서 `/signup` 으로 관리자용 계정을 회원가입 (이메일/비밀번호)
   2. Supabase SQL Editor 에서 해당 계정을 admin 으로 승격:

      ```sql
      update public.profiles
      set role = 'admin'
      where id = (select id from auth.users where email = '관리자이메일@example.com');
      ```

      > 이 SQL 은 SQL Editor(서버 컨텍스트, `auth.uid()`=null)에서 실행되어
      > role 상승 차단 트리거를 통과한다. 일반 사용자는 자기 role 을 바꿀 수 없다.

7. **개발 서버 실행**

   ```sh
   npm run dev
   ```

## 자주 쓰는 명령

| 명령                                    | 설명                                     |
| --------------------------------------- | ---------------------------------------- |
| `npm run dev`                           | 개발 서버 (DB 는 `tantan-dev` 클라우드)  |
| `npm run check`                         | svelte-check 타입 검사                   |
| `npm run lint` / `npm run format`       | Prettier + ESLint                        |
| `npm run test`                          | vitest (단위 테스트)                     |
| `npx supabase migration new <name>`     | 마이그레이션 SQL 생성                    |
| `npx supabase db push`                  | 링크된(dev) 프로젝트에 마이그레이션 적용 |
| `npx supabase link --project-ref <ref>` | dev/prod 전환 (**prod push 는 수동**)    |

## 디렉터리

```
src/
  app.css                  # Tailwind v4 @theme 디자인 토큰 (design-system.md 원본)
  app.d.ts                 # App.Locals 타입 (supabase, session, user)
  hooks.server.ts          # Supabase SSR 클라이언트 + /admin·/mypage 인증 가드
  lib/server/
    supabase-admin.ts      # 서버 전용 secret 키 클라이언트 (RLS 우회) — 클라 import 금지
  routes/
    +layout.ts / .server.ts / .svelte   # isomorphic Supabase 클라이언트 + 세션 전달
    (shop)/                # 메인·상품·장바구니·주문·시공사례·고객센터·회사소개·약관
    (auth)/                # 로그인·회원가입·비밀번호 재설정
    (my)/mypage/           # 주문내역·배송지·정보수정·내 문의·탈퇴 (로그인 필요)
    admin/                 # 관리자 (role=admin 서버 검증)
supabase/
  config.toml
  migrations/              # 스키마 단일 소스
  seed.sql                 # 시연용 데이터
docs/                      # dev-spec / design-system / decision-log / design
```

## 인증/권한 개요

- 세션은 `@supabase/ssr` 로 쿠키에 저장. `hooks.server.ts` 가 요청마다 서버 클라이언트를 생성하고
  `safeGetSession()` 으로 `getUser()` 재검증까지 수행한다.
- `/mypage/*` 는 로그인 필요, `/admin/*` 는 `profiles.role='admin'` 을 **서버에서** 검증
  (hooks + `admin/+layout.server.ts` 이중 방어).
- 모든 테이블 RLS 활성화. 공개 읽기(노출 상품/글/배너 등)와 admin 쓰기,
  본인 소유 row 접근을 정책으로 강제한다.
