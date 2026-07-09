-- =============================================================================
-- 탄탄 편의시설 쇼핑몰 — 초기 스키마
-- 출처: docs/dev-spec.md 2장. 이 마이그레이션이 스키마의 단일 소스.
--
-- 구성: 확장 → 테이블(+enum CHECK) → 인덱스 → 함수 → 트리거 → RLS 정책
-- 규칙:
--   * 재고 수량 컬럼 없음 (products.status enum 으로만 관리)
--   * 전화문의 상품 = is_price_hidden=true AND price IS NULL (CHECK 로 강제)
--   * profiles 는 auth.users INSERT 트리거로 자동 생성
--   * 모든 테이블 RLS 활성화, 쓰기는 admin (public.is_admin()) 또는 서버(secret 키)
-- =============================================================================

create extension if not exists pgcrypto; -- gen_random_uuid()

-- =============================================================================
-- 1. 테이블
-- =============================================================================

-- 회원 프로필 (auth.users 1:1)
create table public.profiles (
	id uuid primary key references auth.users (id) on delete cascade,
	name text,
	phone text,
	role text not null default 'user' check (role in ('user', 'admin')),
	created_at timestamptz not null default now()
);
comment on table public.profiles is 'auth.users 와 1:1. role 로 admin 여부 판별.';

-- 카테고리 (자기참조 계층)
create table public.categories (
	id uuid primary key default gen_random_uuid(),
	name text not null,
	sort_order int not null default 0,
	is_visible boolean not null default true,
	parent_id uuid references public.categories (id) on delete set null,
	created_at timestamptz not null default now()
);

-- 상품
create table public.products (
	id uuid primary key default gen_random_uuid(),
	category_id uuid references public.categories (id) on delete set null,
	name text not null,
	price int check (price is null or price >= 0),
	is_price_hidden boolean not null default false,
	status text not null default 'on_sale' check (status in ('on_sale', 'sold_out', 'hidden')),
	description_html text,
	created_at timestamptz not null default now(),
	updated_at timestamptz not null default now(),
	-- 전화문의 상품: 가격 숨김이면 가격은 반드시 null
	constraint products_price_hidden_null check (not is_price_hidden or price is null)
);

-- 상품 이미지
create table public.product_images (
	id uuid primary key default gen_random_uuid(),
	product_id uuid not null references public.products (id) on delete cascade,
	url text not null,
	original_name text, -- 업로드 원본 파일명 보존 (한글 파일명 이슈 방지)
	sort_order int not null default 0,
	is_thumbnail boolean not null default false
);

-- 상품 옵션 (1 depth)
create table public.product_options (
	id uuid primary key default gen_random_uuid(),
	product_id uuid not null references public.products (id) on delete cascade,
	name text not null,
	extra_price int not null default 0,
	sort_order int not null default 0,
	is_sold_out boolean not null default false
);

-- 장바구니 (회원). 비회원은 localStorage → 로그인 시 병합
create table public.cart_items (
	id uuid primary key default gen_random_uuid(),
	user_id uuid not null references auth.users (id) on delete cascade,
	product_id uuid not null references public.products (id) on delete cascade,
	option_id uuid references public.product_options (id) on delete set null,
	quantity int not null default 1 check (quantity > 0),
	created_at timestamptz not null default now(),
	unique (user_id, product_id, option_id)
);

-- 주문
create table public.orders (
	id uuid primary key default gen_random_uuid(),
	order_no text not null unique,
	user_id uuid not null references auth.users (id) on delete restrict,
	receiver_name text not null,
	receiver_phone text not null,
	zip text,
	addr1 text,
	addr2 text,
	memo text,
	payment_method text not null default 'bank_transfer' check (payment_method in ('bank_transfer')),
	payment_status text not null default 'pending' check (payment_status in ('pending', 'paid', 'cancelled', 'refunded')),
	order_status text not null default 'pending' check (
		order_status in ('pending', 'paid', 'preparing', 'shipping', 'delivered', 'cancelled', 'refunded')
	),
	total_amount int not null default 0 check (total_amount >= 0),
	depositor_name text, -- 무통장 입금자명
	tracking_company text,
	tracking_no text,
	created_at timestamptz not null default now()
);

-- 주문 상품 스냅샷 (주문 시점 값 복사 저장 — 상품 변경/삭제와 무관하게 보존)
create table public.order_items (
	id uuid primary key default gen_random_uuid(),
	order_id uuid not null references public.orders (id) on delete cascade,
	product_id uuid references public.products (id) on delete set null,
	product_name text not null,
	option_name text,
	unit_price int not null check (unit_price >= 0),
	quantity int not null check (quantity > 0)
);

-- 게시글 (공지 / 자료실 / 시공사례 공용)
create table public.posts (
	id uuid primary key default gen_random_uuid(),
	board_type text not null check (board_type in ('notice', 'archive', 'case')),
	title text not null,
	content_html text,
	is_pinned boolean not null default false,
	is_visible boolean not null default true,
	created_at timestamptz not null default now()
);

-- 게시글 첨부파일 (자료실)
create table public.post_files (
	id uuid primary key default gen_random_uuid(),
	post_id uuid not null references public.posts (id) on delete cascade,
	url text not null,
	filename text not null,
	filesize bigint,
	sort_order int not null default 0
);

-- 게시글 이미지 (시공사례 다중 이미지)
create table public.post_images (
	id uuid primary key default gen_random_uuid(),
	post_id uuid not null references public.posts (id) on delete cascade,
	url text not null,
	sort_order int not null default 0
);

-- 문의 (일반/견적/예약 단일 폼). 비회원 작성 가능(비밀번호 해시)
create table public.inquiries (
	id uuid primary key default gen_random_uuid(),
	user_id uuid references auth.users (id) on delete set null,
	guest_name text,
	guest_phone text,
	guest_password_hash text,
	type text not null default 'general' check (type in ('general', 'quote', 'reservation')),
	title text not null,
	content text not null,
	hope_date date, -- 예약 유형만 사용
	site_address text, -- 예약 유형만 사용
	is_secret boolean not null default false,
	status text not null default 'waiting' check (status in ('waiting', 'answered')),
	answer text,
	answered_at timestamptz,
	created_at timestamptz not null default now(),
	-- 회원이거나 비회원 정보가 있어야 함
	constraint inquiries_author_present check (user_id is not null or guest_name is not null)
);

-- 배너 (메인 슬라이드)
create table public.banners (
	id uuid primary key default gen_random_uuid(),
	image_url text not null,
	link_url text,
	sort_order int not null default 0,
	is_visible boolean not null default true,
	start_at timestamptz,
	end_at timestamptz
);

-- 사이트 설정 (회사정보/계좌/배송 문구 등 — 하드코딩 금지)
create table public.site_settings (
	key text primary key,
	value jsonb not null default '{}'::jsonb
);

-- =============================================================================
-- 2. 인덱스 (FK / 조회 컬럼)
-- =============================================================================
create index idx_categories_parent on public.categories (parent_id);
create index idx_products_category on public.products (category_id);
create index idx_products_status on public.products (status);
create index idx_product_images_product on public.product_images (product_id);
create index idx_product_options_product on public.product_options (product_id);
create index idx_cart_items_user on public.cart_items (user_id);
create index idx_orders_user on public.orders (user_id);
create index idx_order_items_order on public.order_items (order_id);
create index idx_posts_board on public.posts (board_type);
create index idx_post_files_post on public.post_files (post_id);
create index idx_post_images_post on public.post_images (post_id);
create index idx_inquiries_user on public.inquiries (user_id);
create index idx_banners_visible on public.banners (is_visible);

-- =============================================================================
-- 3. 함수
-- =============================================================================

-- admin 판별. SECURITY DEFINER 로 RLS 우회 → profiles 정책과의 무한 재귀 방지
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
	select exists (
		select 1 from public.profiles
		where id = auth.uid() and role = 'admin'
	);
$$;

-- updated_at 자동 갱신
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
	new.updated_at = now();
	return new;
end;
$$;

-- auth.users INSERT 시 profiles 자동 생성
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
	insert into public.profiles (id, name, phone)
	values (
		new.id,
		nullif(new.raw_user_meta_data ->> 'name', ''),
		nullif(new.raw_user_meta_data ->> 'phone', '')
	)
	on conflict (id) do nothing;
	return new;
end;
$$;

-- role 상승 차단: API 경유(auth.uid() 존재) 일반 유저는 role 변경 불가.
-- 서버(secret 키, auth.uid() null) 및 admin 은 허용 → README 의 admin 승격 SQL 은 통과.
create or replace function public.prevent_role_escalation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
	if new.role is distinct from old.role
		and auth.uid() is not null
		and not public.is_admin() then
		raise exception 'role 변경 권한이 없습니다.';
	end if;
	return new;
end;
$$;

-- =============================================================================
-- 4. 트리거
-- =============================================================================
create trigger trg_products_updated_at
	before update on public.products
	for each row execute function public.set_updated_at();

create trigger on_auth_user_created
	after insert on auth.users
	for each row execute function public.handle_new_user();

create trigger trg_profiles_prevent_role_escalation
	before update on public.profiles
	for each row execute function public.prevent_role_escalation();

-- =============================================================================
-- 5. RLS
-- =============================================================================
alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.product_images enable row level security;
alter table public.product_options enable row level security;
alter table public.cart_items enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.posts enable row level security;
alter table public.post_files enable row level security;
alter table public.post_images enable row level security;
alter table public.inquiries enable row level security;
alter table public.banners enable row level security;
alter table public.site_settings enable row level security;

-- ---- profiles ----
create policy profiles_select_own_or_admin on public.profiles
	for select using (id = (select auth.uid()) or public.is_admin());
create policy profiles_update_own_or_admin on public.profiles
	for update using (id = (select auth.uid()) or public.is_admin())
	with check (id = (select auth.uid()) or public.is_admin());
-- INSERT 는 handle_new_user 트리거(SECURITY DEFINER)만 수행. DELETE 는 auth.users cascade.

-- ---- categories ---- (노출 카테고리 public read, 쓰기 admin)
create policy categories_public_read on public.categories
	for select using (is_visible or public.is_admin());
create policy categories_admin_write on public.categories
	for all using (public.is_admin()) with check (public.is_admin());

-- ---- products ---- (hidden 제외 public read, 쓰기 admin)
create policy products_public_read on public.products
	for select using (status <> 'hidden' or public.is_admin());
create policy products_admin_write on public.products
	for all using (public.is_admin()) with check (public.is_admin());

-- ---- product_images ---- (부모 상품이 노출이면 read)
create policy product_images_public_read on public.product_images
	for select using (
		public.is_admin()
		or exists (
			select 1 from public.products p
			where p.id = product_id and p.status <> 'hidden'
		)
	);
create policy product_images_admin_write on public.product_images
	for all using (public.is_admin()) with check (public.is_admin());

-- ---- product_options ----
create policy product_options_public_read on public.product_options
	for select using (
		public.is_admin()
		or exists (
			select 1 from public.products p
			where p.id = product_id and p.status <> 'hidden'
		)
	);
create policy product_options_admin_write on public.product_options
	for all using (public.is_admin()) with check (public.is_admin());

-- ---- cart_items ---- (본인 것만, admin 전체)
create policy cart_items_own on public.cart_items
	for all using (user_id = (select auth.uid()) or public.is_admin())
	with check (user_id = (select auth.uid()) or public.is_admin());

-- ---- orders ---- (본인 read/insert, 상태변경은 admin/서버. 일반 유저 update/delete 불가)
create policy orders_select_own_or_admin on public.orders
	for select using (user_id = (select auth.uid()) or public.is_admin());
create policy orders_insert_own on public.orders
	for insert with check (user_id = (select auth.uid()));
create policy orders_admin_update on public.orders
	for update using (public.is_admin()) with check (public.is_admin());
create policy orders_admin_delete on public.orders
	for delete using (public.is_admin());

-- ---- order_items ---- (부모 주문 소유자 또는 admin)
create policy order_items_select on public.order_items
	for select using (
		public.is_admin()
		or exists (
			select 1 from public.orders o
			where o.id = order_id and o.user_id = (select auth.uid())
		)
	);
create policy order_items_insert_own on public.order_items
	for insert with check (
		exists (
			select 1 from public.orders o
			where o.id = order_id and o.user_id = (select auth.uid())
		)
	);
create policy order_items_admin_write on public.order_items
	for all using (public.is_admin()) with check (public.is_admin());

-- ---- posts ---- (노출 글 public read, 쓰기 admin)
create policy posts_public_read on public.posts
	for select using (is_visible or public.is_admin());
create policy posts_admin_write on public.posts
	for all using (public.is_admin()) with check (public.is_admin());

-- ---- post_files / post_images ---- (부모 글 노출이면 read)
create policy post_files_public_read on public.post_files
	for select using (
		public.is_admin()
		or exists (
			select 1 from public.posts p where p.id = post_id and p.is_visible
		)
	);
create policy post_files_admin_write on public.post_files
	for all using (public.is_admin()) with check (public.is_admin());

create policy post_images_public_read on public.post_images
	for select using (
		public.is_admin()
		or exists (
			select 1 from public.posts p where p.id = post_id and p.is_visible
		)
	);
create policy post_images_admin_write on public.post_images
	for all using (public.is_admin()) with check (public.is_admin());

-- ---- inquiries ----
-- 작성: 누구나(비회원 포함). 단 로그인 상태면 user_id 는 본인이어야 함.
-- 조회: 회원 본인 또는 admin. 비회원 비밀글은 앱 레이어에서 비밀번호 검증(서버 라우트).
create policy inquiries_insert_any on public.inquiries
	for insert with check (
		user_id is null or user_id = (select auth.uid())
	);
create policy inquiries_select_own_or_admin on public.inquiries
	for select using (
		public.is_admin()
		or (user_id is not null and user_id = (select auth.uid()))
	);
create policy inquiries_admin_update on public.inquiries
	for update using (public.is_admin()) with check (public.is_admin());
create policy inquiries_admin_delete on public.inquiries
	for delete using (public.is_admin());

-- ---- banners ---- (노출 배너 public read, 날짜창 필터는 쿼리에서. 쓰기 admin)
create policy banners_public_read on public.banners
	for select using (is_visible or public.is_admin());
create policy banners_admin_write on public.banners
	for all using (public.is_admin()) with check (public.is_admin());

-- ---- site_settings ---- (public read, 쓰기 admin)
create policy site_settings_public_read on public.site_settings
	for select using (true);
create policy site_settings_admin_write on public.site_settings
	for all using (public.is_admin()) with check (public.is_admin());
