<script lang="ts">
	/**
	 * 장바구니. 비회원=localStorage, 회원=서버(cart_items). 표시는 브라우저 Supabase 로 하이드레이트.
	 * 주문은 로그인 필요 → 비회원은 /login?redirect=/checkout 로 유도(로그인 시 로컬→서버 병합됨).
	 * 품절/전화문의 등 주문 불가 항목이 있으면 주문 진입 차단.
	 */
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { formatPrice } from '$lib/utils/format';
	import { hydrateCart, type CartDisplayRow } from '$lib/cart/hydrate';
	import { readLocalCart, setLocalQuantity, removeFromLocalCart } from '$lib/cart/local';
	import type { CartItem } from '$lib/cart/ops';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
	const uid = $derived(data.user?.id ?? null);

	let rows = $state<CartDisplayRow[]>([]);
	let loading = $state(true);

	async function loadServerItems(): Promise<CartItem[]> {
		const { data: cart } = await data.supabase
			.from('cart_items')
			.select('product_id, option_id, quantity')
			.eq('user_id', uid);
		return (cart ?? []).map((r) => ({
			productId: r.product_id,
			optionId: r.option_id,
			quantity: r.quantity
		}));
	}

	async function reload() {
		loading = true;
		const items = uid ? await loadServerItems() : readLocalCart();
		rows = await hydrateCart(data.supabase, items);
		loading = false;
	}

	// 로그인 상태(uid)가 정해지면 로드/재로드
	$effect(() => {
		void uid;
		reload();
	});

	function sameRow(a: CartDisplayRow, b: CartDisplayRow) {
		return a.productId === b.productId && (a.optionId ?? null) === (b.optionId ?? null);
	}

	async function changeQty(row: CartDisplayRow, next: number) {
		const qty = Math.max(1, next);
		if (uid) {
			let q = data.supabase
				.from('cart_items')
				.update({ quantity: qty })
				.eq('user_id', uid)
				.eq('product_id', row.productId);
			q = row.optionId ? q.eq('option_id', row.optionId) : q.is('option_id', null);
			await q;
		} else {
			setLocalQuantity(row.productId, row.optionId, qty);
		}
		rows = rows.map((r) =>
			sameRow(r, row) ? { ...r, quantity: qty, lineTotal: r.unitPrice * qty } : r
		);
	}

	async function removeRow(row: CartDisplayRow) {
		if (uid) {
			let q = data.supabase
				.from('cart_items')
				.delete()
				.eq('user_id', uid)
				.eq('product_id', row.productId);
			q = row.optionId ? q.eq('option_id', row.optionId) : q.is('option_id', null);
			await q;
		} else {
			removeFromLocalCart(row.productId, row.optionId);
		}
		rows = rows.filter((r) => !sameRow(r, row));
	}

	const hasBlocked = $derived(rows.some((r) => !r.orderable));
	const total = $derived(rows.filter((r) => r.orderable).reduce((s, r) => s + r.lineTotal, 0));

	function goCheckout() {
		if (rows.length === 0 || hasBlocked) return;
		if (uid) {
			goto(resolve('/checkout'));
		} else {
			// 로그인 후 체크아웃으로 복귀시키는 쿼리 — resolve()는 쿼리 조합을 지원하지 않아 예외 처리
			// eslint-disable-next-line svelte/no-navigation-without-resolve
			goto(resolve('/login') + '?redirect=%2Fcheckout');
		}
	}
</script>

<svelte:head><title>장바구니 - 탄탄 편의시설</title></svelte:head>

<h1 class="py-7 text-[26px] font-black tracking-tight text-navy tb:text-[30px]">장바구니</h1>

{#if loading}
	<p class="py-16 text-center text-[15px] text-sub">장바구니를 불러오는 중…</p>
{:else if rows.length === 0}
	<div class="rounded-xl border border-line bg-surface py-16 text-center">
		<p class="text-[16px] font-bold text-ink">장바구니가 비어 있습니다.</p>
		<a
			href={resolve('/products')}
			class="mt-5 inline-block min-h-11 rounded-lg bg-navy px-6 py-3 text-[15px] font-extrabold text-white"
			>상품 보러 가기</a
		>
	</div>
{:else}
	<div class="grid gap-6 pb-10 tb:grid-cols-[1fr_320px] tb:items-start">
		<ul class="space-y-3">
			{#each rows as row (row.productId + (row.optionId ?? ''))}
				<li
					class="flex gap-4 rounded-xl border p-4 {row.orderable
						? 'border-line bg-surface'
						: 'border-status-cancelled-fg/40 bg-status-cancelled-bg/40'}"
				>
					<div class="h-20 w-20 shrink-0 overflow-hidden rounded-lg border border-line bg-bg">
						{#if row.thumbnailUrl}
							<img
								src={row.thumbnailUrl}
								alt={row.productName}
								loading="lazy"
								class="h-full w-full object-cover"
							/>
						{/if}
					</div>
					<div class="min-w-0 flex-1">
						<p class="truncate text-[15px] font-bold text-ink">{row.productName}</p>
						{#if row.optionName}
							<p class="mt-0.5 text-[13px] text-sub">옵션: {row.optionName}</p>
						{/if}
						{#if row.orderable}
							<p class="mt-1 text-[15px] font-black text-navy">{formatPrice(row.unitPrice)}</p>
						{:else}
							<p
								class="mt-1 flex items-start gap-1.5 text-[13px] font-bold text-status-cancelled-fg"
							>
								<svg
									width="15"
									height="15"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									stroke-width="2"
									stroke-linecap="round"
									stroke-linejoin="round"
									class="mt-0.5 flex-none"
									aria-hidden="true"
								>
									<circle cx="12" cy="12" r="9" />
									<path d="M12 8v5" />
									<path d="M12 16.5v.01" />
								</svg>
								<span>{row.reason} — 주문할 수 없는 상품입니다. 삭제 후 다시 담아주세요.</span>
							</p>
						{/if}
					</div>
					<div class="flex flex-col items-end justify-between">
						<button
							type="button"
							onclick={() => removeRow(row)}
							aria-label="삭제"
							class="flex h-8 w-8 items-center justify-center text-sub hover:text-ink"
						>
							<svg
								width="18"
								height="18"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								stroke-width="2"
								stroke-linecap="round"
								aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" /></svg
							>
						</button>
						{#if row.orderable}
							<div class="flex items-center rounded-lg border border-line-2">
								<button
									type="button"
									onclick={() => changeQty(row, row.quantity - 1)}
									aria-label="수량 감소"
									class="flex h-9 w-9 items-center justify-center text-lg font-bold text-navy"
									>−</button
								>
								<span class="w-9 text-center text-[15px] font-bold">{row.quantity}</span>
								<button
									type="button"
									onclick={() => changeQty(row, row.quantity + 1)}
									aria-label="수량 증가"
									class="flex h-9 w-9 items-center justify-center text-lg font-bold text-navy"
									>+</button
								>
							</div>
							<p class="text-[15px] font-black text-ink">{formatPrice(row.lineTotal)}</p>
						{/if}
					</div>
				</li>
			{/each}
		</ul>

		<aside class="rounded-xl border border-line bg-surface p-5 tb:sticky tb:top-4">
			<h2 class="text-[16px] font-black text-ink">결제 예정 금액</h2>
			<div class="mt-4 flex items-baseline justify-between border-t border-line pt-4">
				<span class="text-[15px] font-bold text-sub">상품 합계</span>
				<span class="text-[24px] font-black text-navy">{formatPrice(total)}</span>
			</div>
			<p class="mt-2 text-[13px] text-sub">배송비는 주문/상품에 따라 안내됩니다.</p>
			{#if hasBlocked}
				<p
					class="mt-4 rounded-lg bg-status-cancelled-bg px-3 py-2.5 text-[13px] font-semibold text-status-cancelled-fg"
				>
					주문할 수 없는 상품이 있습니다. 해당 상품을 삭제한 뒤 주문해 주세요.
				</p>
			{/if}
			<button
				type="button"
				onclick={goCheckout}
				disabled={hasBlocked}
				class="mt-5 min-h-11 w-full rounded-lg bg-navy py-[15px] text-[16px] font-extrabold text-white disabled:cursor-not-allowed disabled:bg-line-2 disabled:text-sub"
			>
				{uid ? '주문하기' : '로그인하고 주문하기'}
			</button>
		</aside>
	</div>
{/if}
