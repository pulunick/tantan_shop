<script lang="ts">
	/**
	 * 주문 상세. 배송준비 전(pending/paid) 주문은 취소 요청 가능
	 * (서버 cancel 액션 → requestOrderCancel 로 본인·상태 검증 후 처리).
	 */
	import { enhance } from '$app/forms';
	import { resolve } from '$app/paths';
	import { formatDate, formatPrice } from '$lib/utils/format';
	import StatusPill from '$lib/components/ui/StatusPill.svelte';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();

	const order = $derived(data.order);
	const items = $derived(data.items);

	const paymentStatusLabel: Record<string, string> = {
		pending: '결제대기',
		paid: '결제완료',
		cancelled: '취소',
		refunded: '환불'
	};

	const canRequestCancel = $derived(
		order.order_status === 'pending' || order.order_status === 'paid'
	);

	let submitting = $state(false);
</script>

<svelte:head>
	<title>주문 상세 - 탄탄 편의시설</title>
</svelte:head>

<div class="mb-4">
	<a
		href={resolve('/mypage/orders')}
		class="inline-flex items-center gap-1 text-[13.5px] font-bold text-sub hover:text-navy"
	>
		<svg
			width="16"
			height="16"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			stroke-width="2"
			stroke-linecap="round"
			stroke-linejoin="round"
			aria-hidden="true"
		>
			<path d="M15 5l-7 7 7 7" />
		</svg>
		주문내역으로
	</a>
</div>

<div class="mb-5 flex flex-wrap items-center justify-between gap-2">
	<h1 class="text-[22px] font-black tracking-tight text-ink">
		주문번호 <span class="text-navy">{order.order_no}</span>
	</h1>
	<StatusPill status={order.order_status} />
</div>

<p class="mb-6 text-[13.5px] font-semibold text-sub">주문일시 {formatDate(order.created_at)}</p>

{#if form?.message}
	<p
		class="mb-5 rounded-lg bg-status-cancelled-bg px-4 py-3 text-[14px] font-semibold text-status-cancelled-fg"
		role="alert"
	>
		{form.message}
	</p>
{/if}

<div class="flex flex-col gap-5">
	<section class="rounded-xl border border-line bg-surface p-5">
		<h2 class="mb-3 text-[16px] font-black text-ink">배송지 정보</h2>
		<dl class="grid grid-cols-1 gap-x-6 gap-y-2 text-[14.5px] tb:grid-cols-2">
			<div class="flex gap-2">
				<dt class="w-20 shrink-0 font-bold text-sub">받는 분</dt>
				<dd class="text-ink">{order.receiver_name}</dd>
			</div>
			<div class="flex gap-2">
				<dt class="w-20 shrink-0 font-bold text-sub">연락처</dt>
				<dd class="text-ink">{order.receiver_phone}</dd>
			</div>
			<div class="flex gap-2 tb:col-span-2">
				<dt class="w-20 shrink-0 font-bold text-sub">주소</dt>
				<dd class="text-ink">
					{#if order.zip}<span class="mr-1 text-sub">[{order.zip}]</span>{/if}
					{order.addr1 ?? ''}
					{order.addr2 ?? ''}
				</dd>
			</div>
			{#if order.memo}
				<div class="flex gap-2 tb:col-span-2">
					<dt class="w-20 shrink-0 font-bold text-sub">배송 메모</dt>
					<dd class="text-ink">{order.memo}</dd>
				</div>
			{/if}
		</dl>
	</section>

	{#if order.tracking_company || order.tracking_no}
		<section class="rounded-xl border border-line bg-surface p-5">
			<h2 class="mb-3 text-[16px] font-black text-ink">배송 조회</h2>
			<p class="text-[14.5px] text-ink">
				<span class="font-bold text-sub">택배사</span>
				{order.tracking_company ?? '-'} ・
				<span class="font-bold text-sub">송장번호</span>
				{order.tracking_no ?? '-'}
			</p>
		</section>
	{/if}

	<section class="overflow-hidden rounded-xl border border-line bg-surface">
		<h2 class="border-b border-line-2 bg-bg px-5 py-4 text-[16px] font-black text-ink">
			주문 상품
		</h2>
		<div class="overflow-x-auto">
			<table class="w-full text-left text-[14.5px]">
				<thead>
					<tr class="border-b border-line-2 text-[13px] font-bold text-sub">
						<th scope="col" class="px-5 py-3">상품명</th>
						<th scope="col" class="px-5 py-3">옵션</th>
						<th scope="col" class="px-5 py-3 text-right">단가</th>
						<th scope="col" class="px-5 py-3 text-right">수량</th>
						<th scope="col" class="px-5 py-3 text-right">금액</th>
					</tr>
				</thead>
				<tbody>
					{#each items as item (item.id)}
						<tr class="border-b border-line-2 last:border-b-0">
							<td class="px-5 py-3 font-semibold text-ink">{item.product_name}</td>
							<td class="px-5 py-3 text-sub">{item.option_name ?? '-'}</td>
							<td class="px-5 py-3 text-right text-ink">{formatPrice(item.unit_price)}</td>
							<td class="px-5 py-3 text-right text-ink">{item.quantity}</td>
							<td class="px-5 py-3 text-right font-bold text-ink"
								>{formatPrice(item.unit_price * item.quantity)}</td
							>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
		<div class="flex items-baseline justify-between border-t border-line-2 px-5 py-4">
			<span class="text-[15px] font-bold text-sub">결제 금액</span>
			<span class="text-[22px] font-black text-navy">{formatPrice(order.total_amount)}</span>
		</div>
	</section>

	<section class="rounded-xl border border-line bg-surface p-5">
		<h2 class="mb-3 text-[16px] font-black text-ink">결제 정보</h2>
		<dl class="grid grid-cols-1 gap-x-6 gap-y-2 text-[14.5px] tb:grid-cols-2">
			<div class="flex gap-2">
				<dt class="w-24 shrink-0 font-bold text-sub">결제수단</dt>
				<dd class="text-ink">무통장입금</dd>
			</div>
			<div class="flex gap-2">
				<dt class="w-24 shrink-0 font-bold text-sub">결제상태</dt>
				<dd class="text-ink">
					{paymentStatusLabel[order.payment_status] ?? order.payment_status}
				</dd>
			</div>
			{#if order.depositor_name}
				<div class="flex gap-2">
					<dt class="w-24 shrink-0 font-bold text-sub">입금자명</dt>
					<dd class="text-ink">{order.depositor_name}</dd>
				</div>
			{/if}
		</dl>
	</section>

	{#if canRequestCancel}
		<section class="rounded-xl border border-line bg-surface p-5">
			<h2 class="mb-2 text-[16px] font-black text-ink">주문 취소</h2>
			<p class="mb-4 text-[13.5px] text-sub">
				상품 준비 전에는 취소를 요청할 수 있습니다. 접수 후 담당자가 확인 연락을 드립니다.
			</p>
			<form
				method="POST"
				action="?/cancel"
				use:enhance={() => {
					submitting = true;
					return async ({ update }) => {
						await update();
						submitting = false;
					};
				}}
			>
				<button
					type="submit"
					disabled={submitting}
					class="min-h-11 rounded-lg border-2 border-status-cancelled-fg px-5 py-3 text-[15px] font-extrabold text-status-cancelled-fg hover:bg-status-cancelled-bg disabled:opacity-60"
				>
					{submitting ? '요청 처리 중…' : '주문 취소 요청'}
				</button>
			</form>
		</section>
	{/if}
</div>
