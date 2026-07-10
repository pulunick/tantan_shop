<script lang="ts">
	import { SUPPORT_TEL } from '$lib/constants';
	/**
	 * 주문 상세. 상태 타임라인(핵심) + 배송조회 + 상품/배송지/결제 정보 + 취소 동선.
	 * DESIGN_SPEC [10] 탄탄편의시설-마이페이지-주문상세.dc.html 재구현(마크업/스크립트 미복사, 값만 참조).
	 * 취소: 배송준비 전(pending/paid)만 다이얼로그 확인 후 기존 cancel action 호출(서버 로직 변경 없음).
	 */
	import { enhance } from '$app/forms';
	import { resolve } from '$app/paths';
	import { toast } from 'svelte-sonner';
	import { formatDate, formatPrice } from '$lib/utils/format';
	import { trackingUrl } from '$lib/utils/couriers';
	import StatusPill from '$lib/components/ui/StatusPill.svelte';
	import OrderStatusTimeline from '$lib/components/order/OrderStatusTimeline.svelte';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();

	const order = $derived(data.order);
	const items = $derived(data.items);
	const bank = $derived(data.bank);

	const isTerminal = $derived(
		order.order_status === 'cancelled' || order.order_status === 'refunded'
	);
	const canRequestCancel = $derived(
		order.order_status === 'pending' || order.order_status === 'paid'
	);
	// 취소 불가(배송준비~배송중)이면서 종료되지 않은 주문 → 전화 안내 노출.
	// delivered(배송완료)는 "배송 준비가 시작되어 취소 어렵다" 안내가 사실과 맞지 않으므로 제외.
	const showCallNotice = $derived(
		!isTerminal && !canRequestCancel && order.order_status !== 'delivered'
	);

	// 송장 정보는 상태와 무관하게 두 필드가 있으면 표시한다 (배송 후 환불된 주문,
	// 배송준비 단계에 선입력된 송장도 사용자가 확인할 수 있어야 함 — 이전 화면과 동일한 동작)
	const canShowTracking = $derived(!!order.tracking_company && !!order.tracking_no);
	const trackUrl = $derived(
		order.tracking_company && order.tracking_no
			? trackingUrl(order.tracking_company, order.tracking_no)
			: null
	);

	const itemsSubtotal = $derived(items.reduce((sum, it) => sum + it.unit_price * it.quantity, 0));

	let submitting = $state(false);
	let dialogEl: HTMLDialogElement | undefined = $state();

	function openCancelDialog() {
		dialogEl?.showModal();
	}
	function closeCancelDialog() {
		dialogEl?.close();
	}
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

<div class="mb-6 flex flex-wrap items-end justify-between gap-3">
	<div>
		<h1 class="text-[22px] font-black tracking-tight text-ink">주문 상세</h1>
		<p class="mt-2 text-[14.5px] font-semibold text-sub">
			주문번호 <span class="font-mono text-navy">{order.order_no}</span> · 주문일 {formatDate(
				order.created_at
			)}
		</p>
	</div>
	<StatusPill status={order.order_status} />
</div>

{#if form?.message}
	<p
		class="mb-5 rounded-lg bg-status-cancelled-bg px-4 py-3 text-[14px] font-semibold text-status-cancelled-fg"
		role="alert"
	>
		{form.message}
	</p>
{/if}

{#snippet trackingBox()}
	<div
		class="mt-6 flex flex-wrap items-center justify-between gap-4 rounded-xl bg-navy-tint px-5 py-[18px]"
	>
		<div class="flex items-center gap-3">
			<span
				class="flex h-[42px] w-[42px] flex-none items-center justify-center rounded-[10px] border border-line-2 bg-surface"
			>
				<svg
					width="22"
					height="22"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="1.8"
					stroke-linecap="round"
					stroke-linejoin="round"
					class="text-navy"
					aria-hidden="true"
				>
					<path d="M3 7h11v9H3z" />
					<path d="M14 10h4l3 3v3h-7z" />
					<circle cx="7" cy="18" r="1.6" />
					<circle cx="17.5" cy="18" r="1.6" />
				</svg>
			</span>
			<div>
				<div class="mb-[3px] text-[13px] font-bold text-sub">배송 정보</div>
				<div class="text-[16px] font-extrabold text-ink">
					{order.tracking_company}
					<span class="ml-1.5 font-mono tracking-[.3px]">{order.tracking_no}</span>
				</div>
			</div>
		</div>
		{#if trackUrl}
			<!-- 택배사 외부 조회 URL — 내부 라우트 아님 -->
			<!-- eslint-disable svelte/no-navigation-without-resolve -->
			<a
				href={trackUrl}
				target="_blank"
				rel="noopener noreferrer"
				class="inline-flex min-h-11 items-center gap-2 rounded-[10px] bg-navy px-5 py-3 text-[15px] font-extrabold whitespace-nowrap text-white hover:opacity-90"
			>
				<!-- eslint-enable svelte/no-navigation-without-resolve -->
				배송 조회
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
					<path d="M7 17L17 7" />
					<path d="M8 7h9v9" />
				</svg>
			</a>
		{/if}
	</div>
{/snippet}

{#if isTerminal}
	<section class="mb-5 rounded-xl border border-line bg-surface p-6 text-center">
		<span
			class="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-status-cancelled-bg"
		>
			<svg
				width="22"
				height="22"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="2.2"
				stroke-linecap="round"
				stroke-linejoin="round"
				class="text-status-cancelled-fg"
				aria-hidden="true"
			>
				<circle cx="12" cy="12" r="9" />
				<path d="M12 7.5v5.5" />
				<path d="M12 16.5v.01" />
			</svg>
		</span>
		<p class="text-[16px] font-extrabold text-status-cancelled-fg">
			{order.order_status === 'cancelled' ? '취소된 주문입니다' : '환불 처리된 주문입니다'}
		</p>
		<p class="mt-1.5 text-[14px] font-semibold text-sub">
			문의사항이 있으시면 전화({SUPPORT_TEL})로 연락해 주세요.
		</p>
		{#if canShowTracking}
			{@render trackingBox()}
		{/if}
	</section>
{:else}
	<section
		class="mb-5 rounded-xl border border-line bg-surface p-7 shadow-[0_4px_16px_rgba(20,27,43,.05)]"
	>
		<h2 class="mb-6 text-[18px] font-black text-ink">주문 처리 현황</h2>

		<OrderStatusTimeline status={order.order_status} />

		{#if canShowTracking}
			{@render trackingBox()}
		{/if}
	</section>
{/if}

<div class="grid items-start gap-[18px] tb:grid-cols-[1fr_340px]">
	<div class="flex flex-col gap-[18px]">
		<!-- 주문 상품 스냅샷 -->
		<section class="rounded-xl border border-line bg-surface p-6">
			<h2 class="mb-3.5 text-[18px] font-black text-ink">
				주문 상품 <span class="text-[15px] font-bold text-sub">{items.length}건</span>
			</h2>
			{#each items as item, i (item.id)}
				<div class="flex items-center gap-4 py-[15px] {i > 0 ? 'border-t border-line-2' : ''}">
					<div class="h-[66px] w-[66px] flex-none overflow-hidden rounded-[9px] bg-bg">
						{#if item.thumbnail_url}
							<img
								src={item.thumbnail_url}
								alt={item.product_name}
								loading="lazy"
								class="h-full w-full object-cover"
							/>
						{:else}
							<div
								class="flex h-full w-full items-center justify-center text-[10px] font-semibold text-sub"
							>
								사진 없음
							</div>
						{/if}
					</div>
					<div class="min-w-0 flex-1">
						<div class="text-[15.5px] font-bold text-ink">{item.product_name}</div>
						<div class="mt-[5px] text-[13.5px] font-semibold text-sub">
							{#if item.option_name}옵션 : {item.option_name} /
							{/if}수량 {item.quantity}개
						</div>
					</div>
					<div class="text-[17px] font-black whitespace-nowrap text-ink">
						{formatPrice(item.unit_price * item.quantity)}
					</div>
				</div>
			{/each}
		</section>

		<!-- 배송지 정보 -->
		<section class="rounded-xl border border-line bg-surface p-6">
			<h2 class="mb-4 text-[18px] font-black text-ink">배송지 정보</h2>
			<dl class="grid grid-cols-[88px_1fr] gap-y-3 text-[15px]">
				<dt class="font-bold text-sub">받는 분</dt>
				<dd class="font-bold text-ink">{order.receiver_name}</dd>
				<dt class="font-bold text-sub">연락처</dt>
				<dd class="font-bold text-ink">{order.receiver_phone}</dd>
				<dt class="font-bold text-sub">주소</dt>
				<dd class="font-bold leading-relaxed text-ink">
					{#if order.zip}<span class="mr-1 text-sub">[{order.zip}]</span>{/if}
					{order.addr1 ?? ''}
					{order.addr2 ?? ''}
				</dd>
				{#if order.memo}
					<dt class="font-bold text-sub">요청사항</dt>
					<dd class="font-bold text-ink">{order.memo}</dd>
				{/if}
			</dl>
		</section>
	</div>

	<!-- 결제 정보 + 취소 동선 (PC sticky) -->
	<div class="flex flex-col gap-3.5 tb:sticky tb:top-5">
		<section class="rounded-xl border border-line bg-surface p-5">
			<h2 class="mb-4 text-[18px] font-black text-ink">결제 정보</h2>
			<div class="mb-[11px] flex justify-between text-[14.5px]">
				<span class="font-semibold text-sub">결제수단</span>
				<span class="font-extrabold text-ink">무통장입금</span>
			</div>
			<div class="mb-[11px] flex justify-between text-[14.5px]">
				<span class="font-semibold text-sub">상품금액</span>
				<span class="font-extrabold text-ink">{formatPrice(itemsSubtotal)}</span>
			</div>
			<div class="mb-3.5 flex justify-between text-[14.5px]">
				<span class="font-semibold text-sub">배송비</span>
				<span class="font-extrabold text-navy">착불</span>
			</div>

			{#if bank?.bank || bank?.number}
				<div class="mb-3.5 rounded-[10px] bg-bg px-[15px] py-3.5 text-[13.5px] leading-[1.7]">
					<div class="font-bold text-sub">입금 계좌</div>
					<div class="mt-[2px] font-mono font-extrabold text-ink">
						{bank.bank}
						{bank.number}
					</div>
					<div class="mt-1 font-semibold text-sub">
						예금주 {bank.holder} · 입금자명 <b class="text-ink">{order.depositor_name ?? '-'}</b>
					</div>
				</div>
			{/if}

			<div class="flex items-baseline justify-between border-t-2 border-line-2 pt-3.5">
				<span class="text-[15px] font-extrabold text-ink">총 결제금액</span>
				<span class="text-[24px] font-black tracking-tight text-navy">
					{formatPrice(order.total_amount)}
				</span>
			</div>
		</section>

		{#if canRequestCancel}
			<button
				type="button"
				onclick={openCancelDialog}
				class="min-h-11 w-full rounded-[11px] border border-status-cancelled-fg bg-surface px-5 py-3.5 text-[15px] font-extrabold text-status-cancelled-fg hover:bg-status-cancelled-bg"
			>
				주문 취소 요청
			</button>
		{:else if showCallNotice}
			<div class="rounded-[11px] bg-status-preparing-bg p-[18px]">
				<div class="mb-3 flex items-start gap-2.5">
					<svg
						width="18"
						height="18"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"
						class="mt-[1px] flex-none text-status-preparing-fg"
						aria-hidden="true"
					>
						<circle cx="12" cy="12" r="9" />
						<path d="M12 8v5" />
						<path d="M12 16.5v.01" />
					</svg>
					<p class="m-0 text-[14px] leading-relaxed font-bold text-status-preparing-fg">
						배송 준비가 시작되어 온라인 취소가 어렵습니다. 취소는 전화로 문의해 주세요.
					</p>
				</div>
				<a
					href="tel:{SUPPORT_TEL}"
					class="flex min-h-11 items-center justify-center gap-2 rounded-[9px] bg-yellow px-5 py-3 text-[15px] font-black text-navy hover:bg-yellow-hover"
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
						<path
							d="M6.5 4h3l1.5 4-2 1.5a11 11 0 0 0 5 5l1.5-2 4 1.5v3a2 2 0 0 1-2 2A16 16 0 0 1 4.5 6a2 2 0 0 1 2-2z"
						/>
					</svg>
					{SUPPORT_TEL} 전화하기
				</a>
			</div>
		{/if}
	</div>
</div>

<!-- 주문 취소 확인 다이얼로그 -->
<dialog
	bind:this={dialogEl}
	onclick={(e) => {
		if (e.target === dialogEl) closeCancelDialog();
	}}
	class="m-auto w-[400px] max-w-[90%] rounded-2xl border-none p-0 shadow-[0_20px_50px_rgba(0,0,0,.32)] backdrop:bg-[rgba(10,15,25,.55)]"
>
	<div class="p-7">
		<span
			class="mx-auto mb-4 flex h-[52px] w-[52px] items-center justify-center rounded-full bg-status-cancelled-bg"
		>
			<svg
				width="26"
				height="26"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="2.2"
				stroke-linecap="round"
				stroke-linejoin="round"
				class="text-status-cancelled-fg"
				aria-hidden="true"
			>
				<circle cx="12" cy="12" r="9" />
				<path d="M12 7.5v5.5" />
				<path d="M12 16.5v.01" />
			</svg>
		</span>
		<h3 class="mb-2.5 text-center text-[19px] font-black text-ink">주문을 취소하시겠습니까?</h3>
		<!-- 취소는 즉시 확정(requestOrderCancel), 환불 기한은 정책 미확정 — 단정 표기 금지 -->
		<p class="mb-6 text-center text-[14.5px] leading-relaxed font-semibold text-sub">
			취소 시 주문이 바로 취소됩니다. 이미 입금하셨다면 확인 후 환불해 드리며, 환불 관련 문의는
			대표번호({SUPPORT_TEL})로 연락 주세요.
		</p>
		<div class="grid grid-cols-2 gap-2.5">
			<button
				type="button"
				onclick={closeCancelDialog}
				class="min-h-11 rounded-[10px] border border-line-2 bg-surface text-[15px] font-extrabold text-ink hover:bg-bg"
			>
				돌아가기
			</button>
			<form
				method="POST"
				action="?/cancel"
				use:enhance={() => {
					submitting = true;
					return async ({ result, update }) => {
						submitting = false;
						closeCancelDialog();
						if (result.type === 'success') {
							toast.success('주문이 취소되었습니다');
						} else {
							// 서버가 준 구체 사유(예: 배송 준비 시작)를 그대로 보여준다
							const msg =
								result.type === 'failure' && typeof result.data?.message === 'string'
									? result.data.message
									: '취소 처리에 실패했습니다. 다시 시도해 주세요.';
							toast.error(msg);
						}
						await update();
					};
				}}
			>
				<button
					type="submit"
					disabled={submitting}
					class="min-h-11 w-full rounded-[10px] bg-status-cancelled-fg text-[15px] font-extrabold text-white disabled:opacity-60"
				>
					{submitting ? '처리 중…' : '주문 취소'}
				</button>
			</form>
		</div>
	</div>
</dialog>
