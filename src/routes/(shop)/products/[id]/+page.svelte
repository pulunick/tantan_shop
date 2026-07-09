<script lang="ts">
	/**
	 * 상품 상세 페이지.
	 * 3상태: 판매중(장바구니/바로구매) · 품절(버튼 비활성) · 전화문의(가격 대신 텍스트 + 전화 버튼, 장바구니 진입 차단).
	 * 장바구니 담기·바로구매는 addToCart 헬퍼로 동작한다(비회원 localStorage / 회원 서버).
	 */
	import ProductPrice from '$lib/components/ui/ProductPrice.svelte';
	import { formatPrice } from '$lib/utils/format';
	import { addToCart as addToCartHelper } from '$lib/cart/add';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import type { PageProps } from './$types';

	// CLAUDE.md 절대 규칙: 전화문의 상품은 이 번호로 고정 (회사 설정과 무관).
	const PHONE_TEL = '010-4055-3338';

	let { data }: PageProps = $props();

	const product = $derived(data.product);
	const images = $derived(data.images);
	const options = $derived(data.options);

	type Variant = 'phone' | 'sold_out' | 'on_sale';

	let variant: Variant = $derived(
		product.is_price_hidden ? 'phone' : product.status === 'sold_out' ? 'sold_out' : 'on_sale'
	);

	let qty = $state(1);
	let selectedImageIndex = $state(0);
	let activeTab: 'detail' | 'delivery' = $state('detail');
	let selectedOptionId: string | null = $state(null);

	// 다른 상품으로 이동(같은 컴포넌트 재사용)했을 때 화면 상태 초기화.
	$effect(() => {
		void product.id;
		qty = 1;
		selectedImageIndex = 0;
		activeTab = 'detail';
	});

	// 옵션 목록이 바뀌거나(=상품 변경) 선택값이 더 이상 유효하지 않으면 기본값으로 보정.
	$effect(() => {
		const stillValid = options.some((o) => o.id === selectedOptionId);
		if (!stillValid) {
			selectedOptionId = (options.find((o) => !o.is_sold_out) ?? options[0])?.id ?? null;
		}
	});

	let mainImage = $derived(images[selectedImageIndex] ?? images[0] ?? null);
	let selectedOption = $derived(options.find((o) => o.id === selectedOptionId) ?? null);
	let selectedOptionSoldOut = $derived(selectedOption?.is_sold_out ?? false);

	// 판매중이어도 선택한 규격이 품절이면 구매 불가.
	let canPurchase = $derived(variant === 'on_sale' && !selectedOptionSoldOut);

	let unitPrice = $derived((product.price ?? 0) + (selectedOption?.extra_price ?? 0));
	let total = $derived(unitPrice * qty);

	function decreaseQty() {
		qty = Math.max(1, qty - 1);
	}
	function increaseQty() {
		qty = qty + 1;
	}

	let cartBusy = $state(false);
	let cartFeedback = $state<string | null>(null);

	// 비회원=localStorage, 회원=서버(cart_items). data.supabase/data.user 는 루트 레이아웃에서 주입.
	async function doAdd(): Promise<boolean> {
		if (!canPurchase || cartBusy) return false;
		cartBusy = true;
		cartFeedback = null;
		try {
			await addToCartHelper(data.supabase, data.user?.id ?? null, {
				productId: product.id,
				optionId: selectedOption?.id ?? null,
				quantity: qty
			});
			return true;
		} catch {
			cartFeedback = '장바구니 담기에 실패했습니다. 잠시 후 다시 시도해 주세요.';
			return false;
		} finally {
			cartBusy = false;
		}
	}

	async function addToCart() {
		if (await doAdd()) cartFeedback = '장바구니에 담았습니다.';
	}
	async function buyNow() {
		if (await doAdd()) await goto(resolve('/cart'));
	}
</script>

<div class="grid grid-cols-1 gap-10 tb:grid-cols-[1fr_440px] tb:items-start">
	<!-- 갤러리 -->
	<div>
		<div class="relative aspect-square overflow-hidden rounded-xl border border-line bg-bg">
			{#if mainImage}
				<img src={mainImage.url} alt={product.name} class="h-full w-full object-cover" />
			{:else}
				<div class="flex h-full w-full items-center justify-center text-sub">
					<svg
						width="56"
						height="56"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="1.5"
						stroke-linecap="round"
						stroke-linejoin="round"
						aria-hidden="true"
					>
						<rect x="3" y="3" width="18" height="18" rx="2" />
						<circle cx="8.5" cy="8.5" r="1.5" />
						<path d="M21 15l-5-5L5 21" />
					</svg>
				</div>
			{/if}

			{#if variant === 'sold_out'}
				<div class="absolute inset-0 flex items-center justify-center bg-bg/60">
					<span class="rounded-lg bg-navy-dark px-6 py-2 text-lg font-extrabold text-white"
						>품절</span
					>
				</div>
			{/if}
		</div>

		{#if images.length > 1}
			<div class="mt-3 grid grid-cols-4 gap-3">
				{#each images as img, i (img.url + i)}
					<button
						type="button"
						class="aspect-square overflow-hidden rounded-lg border-2 {i === selectedImageIndex
							? 'border-navy'
							: 'border-line'}"
						onclick={() => (selectedImageIndex = i)}
						aria-label="{product.name} 이미지 {i + 1}"
						aria-pressed={i === selectedImageIndex}
					>
						<img src={img.url} alt="" class="h-full w-full object-cover" />
					</button>
				{/each}
			</div>
		{/if}
	</div>

	<!-- 구매 패널 -->
	<div class="rounded-xl border border-line bg-surface p-7">
		{#if product.category}
			<span class="mb-2 block text-[13px] font-bold text-sub">{product.category.name}</span>
		{/if}
		<h1 class="mb-2 text-[25px] leading-snug font-black tracking-tight text-ink">
			{product.name}
		</h1>

		<div class="my-5 h-px bg-line"></div>

		<div class="flex flex-wrap items-baseline gap-2">
			<ProductPrice price={product.price} isPhoneInquiry={product.is_price_hidden} />
			{#if !product.is_price_hidden}
				<span class="text-[13px] font-semibold text-sub">(VAT 포함)</span>
			{/if}
		</div>
		{#if product.is_price_hidden}
			<p class="mt-2 text-[14px] leading-relaxed text-sub">
				주문제작 · 시공 포함 상품으로, 규격과 수량에 따라 전화 상담 후 정확한 견적을 안내드립니다.
			</p>
		{/if}

		{#if options.length > 0 && !product.is_price_hidden}
			<div class="mt-6">
				<label for="option-select" class="mb-2 block text-[14px] font-extrabold text-ink"
					>규격 선택</label
				>
				<select
					id="option-select"
					class="w-full rounded-lg border border-line-2 bg-surface px-4 py-3 text-[15px] font-semibold text-ink"
					bind:value={selectedOptionId}
				>
					{#each options as option (option.id)}
						<option value={option.id} disabled={option.is_sold_out}>
							{option.name}{option.extra_price
								? ` (+${formatPrice(option.extra_price)})`
								: ''}{option.is_sold_out ? ' - 품절' : ''}
						</option>
					{/each}
				</select>
			</div>
		{/if}

		{#if !product.is_price_hidden}
			<div class="mt-6">
				<div class="flex items-center justify-between gap-3">
					<span class="text-[14px] font-extrabold text-ink">수량</span>
					<div class="flex items-center overflow-hidden rounded-lg border border-line-2">
						<button
							type="button"
							onclick={decreaseQty}
							disabled={qty <= 1}
							aria-label="수량 감소"
							class="flex h-11 w-11 items-center justify-center bg-bg text-xl font-bold text-navy disabled:text-sub"
							>−</button
						>
						<span class="w-14 text-center text-[16px] font-extrabold text-ink" aria-live="polite"
							>{qty}</span
						>
						<button
							type="button"
							onclick={increaseQty}
							aria-label="수량 증가"
							class="flex h-11 w-11 items-center justify-center bg-bg text-xl font-bold text-navy"
							>+</button
						>
					</div>
				</div>
				<div class="mt-5 flex items-baseline justify-between border-t border-line pt-[18px]">
					<span class="text-[15px] font-bold text-sub">합계 금액</span>
					<span class="text-[28px] font-black tracking-tight text-navy">{formatPrice(total)}</span>
				</div>
			</div>
		{/if}

		{#if variant === 'on_sale'}
			{#if !canPurchase}
				<div
					class="mt-4 rounded-lg border border-line-2 bg-status-cancelled-bg px-4 py-3 text-[14px] leading-relaxed font-semibold text-status-cancelled-fg"
				>
					선택하신 규격은 일시 품절입니다. 다른 규격을 선택하거나 <b>{PHONE_TEL}</b> 로 문의해 주세요.
				</div>
			{/if}
			<div class="mt-6 flex gap-3">
				<button
					type="button"
					disabled={!canPurchase}
					onclick={addToCart}
					class="min-h-11 flex-1 rounded-lg border-2 border-navy bg-surface py-[15px] text-[16px] font-extrabold text-navy disabled:cursor-not-allowed disabled:border-line-2 disabled:bg-bg disabled:text-sub"
					>장바구니 담기</button
				>
				<button
					type="button"
					disabled={!canPurchase}
					onclick={buyNow}
					class="min-h-11 flex-1 rounded-lg bg-navy py-[15px] text-[16px] font-extrabold text-white disabled:cursor-not-allowed disabled:bg-line-2 disabled:text-sub"
					>바로 구매</button
				>
			</div>
			{#if cartFeedback}
				<p role="status" aria-live="polite" class="mt-3 text-[14px] font-semibold text-navy">
					{cartFeedback}
				</p>
			{/if}
		{:else if variant === 'sold_out'}
			<div
				class="mt-6 rounded-lg border border-line-2 bg-status-cancelled-bg px-4 py-3 text-[14px] leading-relaxed font-semibold text-status-cancelled-fg"
			>
				일시 품절된 상품입니다. 재입고 및 대량 구매 문의는 <b>{PHONE_TEL}</b> 로 연락 주세요.
			</div>
			<div class="mt-4 flex gap-3">
				<button
					type="button"
					disabled
					aria-disabled="true"
					class="min-h-11 flex-1 rounded-lg border border-line-2 bg-bg py-[15px] text-[16px] font-extrabold text-sub"
					>장바구니 담기</button
				>
				<button
					type="button"
					disabled
					aria-disabled="true"
					class="min-h-11 flex-1 rounded-lg bg-line-2 py-[15px] text-[16px] font-extrabold text-white"
					>품절</button
				>
			</div>
		{:else}
			<a
				href="tel:{PHONE_TEL}"
				class="mt-6 flex min-h-11 items-center justify-center gap-2 rounded-lg bg-yellow py-4 text-[17px] font-extrabold text-navy hover:bg-yellow-hover"
			>
				<svg
					width="20"
					height="20"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"
					aria-hidden="true"
				>
					<path
						d="M6.5 4h3l1.5 4-2 1.5a11 11 0 0 0 5 5l1.5-2 4 1.5v3a2 2 0 0 1-2 2A16 16 0 0 1 4.5 6a2 2 0 0 1 2-2z"
					/>
				</svg>
				전화 문의하기 {PHONE_TEL}
			</a>
		{/if}

		<p class="mt-5 text-[12.5px] leading-relaxed text-sub">
			· 배송비 착불 · 중량/대량 주문은 화물 배송으로 안내드립니다.<br />
			· 세금계산서 발행 및 관공서 견적 상담 가능합니다.
		</p>
	</div>
</div>

<!-- 상세/배송 탭 -->
<div class="mt-11">
	<div class="flex border-b-2 border-line" role="tablist" aria-label="상품 정보 탭">
		<button
			type="button"
			role="tab"
			aria-selected={activeTab === 'detail'}
			class="-mb-[2px] border-b-[3px] px-6 py-3 text-[16px] font-extrabold {activeTab === 'detail'
				? 'border-navy text-navy'
				: 'border-transparent text-sub'}"
			onclick={() => (activeTab = 'detail')}
		>
			상세정보
		</button>
		<button
			type="button"
			role="tab"
			aria-selected={activeTab === 'delivery'}
			class="-mb-[2px] border-b-[3px] px-6 py-3 text-[16px] font-extrabold {activeTab === 'delivery'
				? 'border-navy text-navy'
				: 'border-transparent text-sub'}"
			onclick={() => (activeTab = 'delivery')}
		>
			배송 · 교환/반품 안내
		</button>
	</div>

	{#if activeTab === 'detail'}
		<div class="prose prose-headings:text-ink max-w-none py-7 text-ink">
			{#if product.description_html}
				<!-- 상세설명은 관리자(admin)만 작성하는 신뢰된 HTML (위지윅). Phase 1 admin 전용 -->
				<!-- eslint-disable-next-line svelte/no-at-html-tags -->
				{@html product.description_html}
			{:else}
				<p class="text-[15px] text-sub">등록된 상세설명이 없습니다.</p>
			{/if}
		</div>
	{:else}
		<div class="max-w-[760px] py-7">
			<h3 class="mb-3 text-[19px] font-black text-ink">배송 안내</h3>
			<ul class="mb-6 list-disc space-y-2 pl-5 text-[15px] leading-relaxed text-ink">
				<li>배송 방법 : 택배 / 중량·대량 주문은 화물(용달) 배송</li>
				<li>배송비 : 착불 (지역 및 수량에 따라 협의)</li>
				<li>배송 기간 : 결제 확인 후 3~7일 (주문제작 상품은 별도 안내)</li>
			</ul>
			<h3 class="mb-3 text-[19px] font-black text-ink">교환 · 반품 안내</h3>
			<ul class="list-disc space-y-2 pl-5 text-[15px] leading-relaxed text-ink">
				<li>상품 수령 후 7일 이내 교환·반품 접수 가능 (사전 전화 접수)</li>
				<li>단순 변심에 의한 반품 시 왕복 배송비는 구매자 부담입니다.</li>
				<li>주문제작 · 시공 포함 상품, 사용·설치된 상품은 교환·반품이 제한됩니다.</li>
				<li>파손 상품 수령 시 수령일 기준 3일 이내 사진과 함께 연락 주세요.</li>
			</ul>
		</div>
	{/if}
</div>

<!-- 모바일 하단 고정 구매 바 여백(스크롤 시 탭 콘텐츠가 가려지지 않도록) -->
<div class="h-16 tb:hidden" aria-hidden="true"></div>

<!-- 모바일 구매 고정바 : MobileBottomBar(66px) 바로 위에 위치 -->
<div
	class="fixed inset-x-0 bottom-[66px] z-40 border-t border-line-2 bg-surface p-3 shadow-[0_-2px_12px_rgba(20,27,43,0.08)] tb:hidden"
>
	{#if variant === 'on_sale'}
		<div class="flex gap-3">
			<button
				type="button"
				disabled={!canPurchase}
				onclick={addToCart}
				class="min-h-11 flex-1 rounded-lg border-2 border-navy bg-surface py-[13px] text-[15px] font-extrabold text-navy disabled:cursor-not-allowed disabled:border-line-2 disabled:bg-bg disabled:text-sub"
				>장바구니</button
			>
			<button
				type="button"
				disabled={!canPurchase}
				onclick={buyNow}
				class="min-h-11 flex-1 rounded-lg bg-navy py-[13px] text-[15px] font-extrabold text-white disabled:cursor-not-allowed disabled:bg-line-2 disabled:text-sub"
				>바로 구매</button
			>
		</div>
	{:else if variant === 'sold_out'}
		<button
			type="button"
			disabled
			aria-disabled="true"
			class="min-h-11 w-full rounded-lg bg-line-2 py-[14px] text-[15px] font-extrabold text-white"
		>
			일시 품절
		</button>
	{:else}
		<a
			href="tel:{PHONE_TEL}"
			class="flex min-h-11 items-center justify-center gap-2 rounded-lg bg-yellow py-[14px] text-[16px] font-extrabold text-navy"
		>
			<svg
				width="18"
				height="18"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="2"
				stroke-linecap="round"
				stroke-linejoin="round"
				aria-hidden="true"
			>
				<path
					d="M6.5 4h3l1.5 4-2 1.5a11 11 0 0 0 5 5l1.5-2 4 1.5v3a2 2 0 0 1-2 2A16 16 0 0 1 4.5 6a2 2 0 0 1 2-2z"
				/>
			</svg>
			전화 문의하기
		</a>
	{/if}
</div>
