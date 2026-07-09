<script lang="ts">
	/**
	 * 주문 상세. 배송지/상품 확인 + 상태 플로우(결제대기→결제완료→배송준비→배송중→배송완료, 취소/환불).
	 * 배송중으로 변경 시 택배사·송장번호 입력이 필수(서버에서 검증).
	 */
	import { untrack } from 'svelte';
	import { resolve } from '$app/paths';
	import { enhance } from '$app/forms';
	import { formatDate, formatPrice } from '$lib/utils/format';
	import StatusPill from '$lib/components/ui/StatusPill.svelte';
	import { STATUS_TABS, TRACKING_COMPANIES } from '../shared';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();

	const statusOptions = STATUS_TABS.filter((t) => t.value !== 'all');

	// 상태/송장 입력값은 로드 시점의 주문 스냅샷 1회로 초기화한다(의도적으로 초기값만 캡처).
	const order = untrack(() => data.order);
	let selectedStatus = $state(order.order_status);
	let trackingCompany = $state(order.tracking_company ?? '');
	let trackingNo = $state(order.tracking_no ?? '');
	let submitting = $state(false);

	let requiresTracking = $derived(selectedStatus === 'shipping');
</script>

<svelte:head>
	<title>주문 {data.order.order_no} - 탄탄 관리자</title>
</svelte:head>

<a
	href={resolve('/admin/orders')}
	class="mb-4 inline-block text-[14.5px] font-bold text-sub hover:text-navy"
>
	← 주문 목록
</a>

<h1 class="sr-only">주문 상세 {data.order.order_no}</h1>

<div class="flex flex-col gap-5">
	{#if form?.message}
		<p
			role="alert"
			class="rounded-lg border border-line-2 bg-status-preparing-bg px-4 py-3 text-[14.5px] font-semibold text-phone-price"
		>
			{form.message}
		</p>
	{/if}

	<div class="rounded-xl border border-line bg-surface p-6">
		<div class="mb-4 flex flex-wrap items-center justify-between gap-3">
			<h2 class="text-[19px] font-black text-ink">주문번호 {data.order.order_no}</h2>
			<StatusPill status={data.order.order_status} />
		</div>
		<div class="grid grid-cols-1 gap-x-8 gap-y-3 text-[14.5px] sm:grid-cols-2">
			<div class="flex justify-between border-b border-line-2 pb-2">
				<span class="font-semibold text-sub">주문일시</span>
				<span class="font-bold text-ink">{formatDate(data.order.created_at)}</span>
			</div>
			<div class="flex justify-between border-b border-line-2 pb-2">
				<span class="font-semibold text-sub">받는분</span>
				<span class="font-bold text-ink">{data.order.receiver_name}</span>
			</div>
			<div class="flex justify-between border-b border-line-2 pb-2">
				<span class="font-semibold text-sub">결제수단</span>
				<span class="font-bold text-ink">무통장입금 ({data.order.depositor_name ?? '-'})</span>
			</div>
			<div class="flex justify-between border-b border-line-2 pb-2">
				<span class="font-semibold text-sub">결제금액</span>
				<span class="font-black text-navy">{formatPrice(data.order.total_amount)}</span>
			</div>
		</div>
	</div>

	<div class="rounded-xl border border-line bg-surface p-6">
		<h3 class="mb-3 text-[17px] font-black text-ink">배송지</h3>
		<div class="text-[14.5px] leading-relaxed text-ink">
			<p><b>{data.order.receiver_name}</b> &nbsp; {data.order.receiver_phone}</p>
			<p>
				{#if data.order.zip}[{data.order.zip}]
				{/if}{data.order.addr1 ?? ''}
				{data.order.addr2 ?? ''}
			</p>
			{#if data.order.memo}
				<p class="mt-1 text-sub">요청사항 : {data.order.memo}</p>
			{/if}
		</div>
	</div>

	<div class="rounded-xl border border-line bg-surface p-6">
		<h3 class="mb-2 text-[17px] font-black text-ink">주문 상품</h3>
		<ul>
			{#each data.items as item (item.id)}
				<li class="flex items-center justify-between gap-4 border-t border-line-2 py-3">
					<div class="min-w-0 flex-1">
						<p class="truncate text-[15px] font-bold text-ink">{item.product_name}</p>
						<p class="mt-1 text-[13px] text-sub">
							{#if item.option_name}옵션 : {item.option_name} /
							{/if}수량 {item.quantity}개
						</p>
					</div>
					<p class="text-[15px] font-black whitespace-nowrap text-ink">
						{formatPrice(item.unit_price * item.quantity)}
					</p>
				</li>
			{/each}
		</ul>
	</div>

	<div class="rounded-xl border border-line bg-surface p-6">
		<h3 class="mb-4 text-[17px] font-black text-ink">주문 상태 변경</h3>
		<form
			method="POST"
			action="?/updateStatus"
			use:enhance={() => {
				submitting = true;
				return async ({ update }) => {
					await update();
					submitting = false;
				};
			}}
			class="flex flex-col gap-4"
		>
			<div>
				<label for="order-status" class="mb-2 block text-[14px] font-extrabold text-ink"
					>주문 상태</label
				>
				<select
					id="order-status"
					name="order_status"
					bind:value={selectedStatus}
					class="min-h-12 rounded-lg border border-line-2 bg-surface px-4 py-3 text-[15px] font-bold text-ink focus:ring-2 focus:ring-navy focus:outline-none"
				>
					{#each statusOptions as opt (opt.value)}
						<option value={opt.value}>{opt.label}</option>
					{/each}
				</select>
			</div>

			<div class="flex flex-wrap items-end gap-4 border-t border-line-2 pt-4">
				<div>
					<label for="tracking-company" class="mb-2 block text-[14px] font-extrabold text-ink"
						>택배사{#if requiresTracking}<span class="text-status-cancelled-fg">*</span>{/if}</label
					>
					<select
						id="tracking-company"
						name="tracking_company"
						bind:value={trackingCompany}
						class="min-h-12 rounded-lg border border-line-2 bg-surface px-4 py-3 text-[15px] text-ink focus:ring-2 focus:ring-navy focus:outline-none"
					>
						<option value="">선택 안 함</option>
						{#each TRACKING_COMPANIES as company (company)}
							<option value={company}>{company}</option>
						{/each}
					</select>
				</div>
				<div class="min-w-[200px] flex-1">
					<label for="tracking-no" class="mb-2 block text-[14px] font-extrabold text-ink"
						>송장번호{#if requiresTracking}<span class="text-status-cancelled-fg">*</span
							>{/if}</label
					>
					<input
						id="tracking-no"
						name="tracking_no"
						type="text"
						bind:value={trackingNo}
						placeholder="송장번호 입력"
						class="min-h-12 w-full rounded-lg border border-line-2 px-4 py-3 text-[15px] text-ink focus:ring-2 focus:ring-navy focus:outline-none"
					/>
				</div>
				<button
					type="submit"
					disabled={submitting}
					class="min-h-12 rounded-lg bg-navy px-6 text-[16px] font-extrabold whitespace-nowrap text-white hover:bg-navy/90 disabled:cursor-not-allowed disabled:bg-line-2 disabled:text-sub"
				>
					{submitting ? '저장 중…' : '상태 저장'}
				</button>
			</div>
			{#if requiresTracking}
				<p class="text-[13px] text-sub">배송중으로 저장하려면 택배사와 송장번호가 필요합니다.</p>
			{/if}
		</form>

		<div class="mt-4 flex flex-wrap gap-3 border-t border-line-2 pt-4">
			<form method="POST" action="?/cancel" use:enhance>
				<button
					type="submit"
					class="min-h-11 rounded-lg border border-status-cancelled-fg/40 bg-status-cancelled-bg px-5 text-[14.5px] font-extrabold text-status-cancelled-fg"
				>
					주문 취소
				</button>
			</form>
			<form method="POST" action="?/refund" use:enhance>
				<button
					type="submit"
					class="min-h-11 rounded-lg border border-line-2 bg-surface px-5 text-[14.5px] font-extrabold text-ink hover:bg-bg"
				>
					환불 처리
				</button>
			</form>
		</div>
	</div>
</div>
