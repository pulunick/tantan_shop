# 개발 스펙 (기획서 v1.1 요약본)

원본: tantan_shoppingmall_planning.docx v1.1. 이 파일이 코드 기준이며, 충돌 시 decision-log.md 최신 항목이 우선.

## 1. 화면 목록

### 사용자

| 라우트                               | 화면        | 핵심 요건                                                                                                                               |
| ------------------------------------ | ----------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| `/`                                  | 메인        | 배너 슬라이드(banners), 카테고리 카드, 추천상품, 시공사례 4, 공지 3                                                                     |
| `/products?category=&q=&sort=`       | 상품 리스트 | 카테고리 필터, 검색, 정렬(최신/저가/고가), 페이지네이션, 품절 오버레이                                                                  |
| `/products/[id]`                     | 상품 상세   | 이미지 갤러리, 옵션(1 depth), 수량, 장바구니/바로구매. 상태 3종: 판매중/품절(버튼 비활성)/전화문의(tel 버튼)                            |
| `/cart`                              | 장바구니    | 비회원 localStorage, 로그인 병합, 품절 상품 주문 차단                                                                                   |
| `/checkout` → `/checkout/complete`   | 주문/결제   | 배송지(Daum 우편번호), 무통장(입금자명), 약관 동의, 주문번호 발급                                                                       |
| `/cases`, `/cases/[id]`              | 시공사례    | 갤러리 그리드, 다중 이미지 상세                                                                                                         |
| `/notice`, `/notice/[id]`            | 공지        | 고정 공지 상단                                                                                                                          |
| `/inquiry`                           | 문의하기    | 단일 폼. type: 일반/견적/예약. 예약 시 hope_date+site_address 표시. `?type=quote` 프리셀렉트. 비회원 작성(이름/연락처/비밀번호), 비밀글 |
| `/archive`                           | 자료실      | 파일 다운로드 목록                                                                                                                      |
| `/about`                             | 회사소개    | 인사말, 오시는길(지도), 취급품목                                                                                                        |
| `/login` `/signup` `/reset-password` | 회원        | 이메일+비밀번호, 약관 동의                                                                                                              |
| `/mypage/*`                          | 마이페이지  | 주문내역·상세(송장), 취소 요청(배송준비 전), 배송지, 정보수정, 내 문의, 탈퇴                                                            |
| `/terms` `/privacy`                  | 약관        | 정적                                                                                                                                    |

### 관리자 (`/admin`, role=admin)

| 라우트              | 화면     | 핵심 요건                                                                                                                                |
| ------------------- | -------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `/admin`            | 대시보드 | 신규주문/미답변문의/신규가입/판매중 상품 수, 최근 주문 5                                                                                 |
| `/admin/products`   | 상품     | 목록 필터, 등록/수정 폼, **판매중↔품절 토글**, 전화문의 체크(가격 입력 비활성), 이미지 드래그앤드롭 업로드(모바일 포함), 위지윅 상세설명 |
| `/admin/categories` | 카테고리 | 추가/이름변경/순서 드래그/노출 토글                                                                                                      |
| `/admin/orders`     | 주문     | 상태 탭, 상태 플로우: 결제대기→결제완료→배송준비→배송중(택배사+송장)→배송완료, 취소/환불                                                 |
| `/admin/members`    | 회원     | 목록/검색/상세(주문이력)/메모/탈퇴                                                                                                       |
| `/admin/boards`     | 게시판   | 공지(고정), 문의 답변(답변완료 처리), 시공사례(다중 이미지), 자료실 파일                                                                 |
| `/admin/banners`    | 배너     | 이미지+링크+노출기간+순서+토글                                                                                                           |
| `/admin/settings`   | 사이트   | 회사정보/계좌/배송 문구                                                                                                                  |

## 2. DB 스키마 (Supabase)

```
profiles        id uuid PK (auth.users FK), name, phone, role text default 'user', created_at
categories      id, name, sort_order, is_visible bool, parent_id nullable
products        id, category_id FK, name, price int null, is_price_hidden bool,
                status text check in ('on_sale','sold_out','hidden'), description_html,
                created_at, updated_at
product_images  id, product_id FK, url, sort_order, is_thumbnail
product_options id, product_id FK, name, extra_price int, sort_order, is_sold_out
cart_items      id, user_id FK, product_id, option_id nullable, quantity
orders          id, order_no text unique, user_id FK, receiver_name/phone/zip/addr1/addr2,
                memo, payment_method text, payment_status, order_status text,
                total_amount int, depositor_name, tracking_company, tracking_no, created_at
order_items     id, order_id FK, product_id, product_name, option_name, unit_price, quantity
posts           id, board_type check in ('notice','archive','case'), title, content_html,
                is_pinned, is_visible, created_at
post_files      id, post_id FK, url, filename, filesize, sort_order
post_images     id, post_id FK, url, sort_order
inquiries       id, user_id nullable, guest_name, guest_phone, guest_password_hash,
                type check in ('general','quote','reservation'), title, content,
                hope_date date null, site_address null, is_secret, status('waiting','answered'),
                answer, answered_at, created_at
banners         id, image_url, link_url, sort_order, is_visible, start_at, end_at
site_settings   key text PK, value jsonb
```

RLS: products/categories/posts/banners = public read(is_visible/on_sale 조건), write는 admin.
orders/cart_items/inquiries = 본인 row만, admin 전체. 상태 변경은 admin 또는 서버 라우트만.

## 3. 운영 정책

- 품절: status 토글 즉시 구매 차단 + 배지. 장바구니 내 품절 상품은 주문 단계 차단
- 주문 상태 흐름과 취소: 배송준비 전 취소 요청 가능, 이후 전화 협의
- 개인정보 최소 수집, 비밀글 비밀번호 해시, 탈퇴 시 법정 보존기간 외 파기
- 배송비: 정책 미확정 — site_settings로 문구 관리, 하드코딩 금지

## 4. Phase 1 완료 기준 (DoD)

비회원 브라우징 → 회원가입 → 장바구니 → 무통장 주문 → 관리자 입금확인 → 송장 입력 →
마이페이지에서 배송 상태 확인, 관리자에서 상품 등록(사진 업로드)·품절 토글·문의 답변이
모바일 크롬/사파리에서 동작할 것.
