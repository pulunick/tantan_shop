-- =============================================================================
-- cart_items 유니크 제약을 NULLS NOT DISTINCT 로 변경
--
-- 옵션 없는 상품은 option_id 가 NULL 이다. 기본(NULLS DISTINCT) 유니크는 NULL 을
-- 서로 다른 값으로 취급하므로 (user, product, NULL) 조합이 중복 삽입될 수 있어,
-- addToCart 의 "있으면 수량 합산" 로직이 경합 시 중복 행을 만들 수 있다.
-- NULLS NOT DISTINCT (PG15+) 로 NULL 을 동일 값으로 보게 해 옵션 없는 상품도
-- (user, product) 당 한 행만 존재하도록 강제한다.
-- =============================================================================

alter table public.cart_items
	drop constraint cart_items_user_id_product_id_option_id_key;

alter table public.cart_items
	add constraint cart_items_user_id_product_id_option_id_key
	unique nulls not distinct (user_id, product_id, option_id);
