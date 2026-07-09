-- =============================================================================
-- 주문 생성 서버 전용화 — 사용자 직접 INSERT 차단
--
-- createOrder 는 secret 키(supabaseAdmin)로만 orders/order_items 를 삽입하도록
-- 변경됐다. 사용자가 Data API 로 orders 를 직접 INSERT 해 total_amount/unit_price
-- 를 조작하는 경로를 막기 위해, 자기소유 INSERT 를 허용하던 정책을 제거한다.
-- 이후 orders/order_items 쓰기는 admin(is_admin) 또는 secret 키 서버만 가능하다.
-- (SELECT 정책은 유지 — 본인 주문 조회는 그대로.)
-- =============================================================================

drop policy if exists orders_insert_own on public.orders;
drop policy if exists order_items_insert_own on public.order_items;
