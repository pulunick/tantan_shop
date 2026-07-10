<script lang="ts">
	/**
	 * 주문 관리 목록. 상태 탭 · 검색(주문번호/받는분) · 페이지네이션.
	 * 각 행은 주문 상세(/admin/orders/[id])로 연결된다.
	 * 결제대기 행은 원클릭 입금확인(확인 다이얼로그 → confirmPayment action) 버튼도 노출한다.
	 * DESIGN_SPEC [12](1) 탄탄편의시설-관리자-보강.dc.html 재구현(마크업/스크립트 미복사, 값만 참조).
	 */
	import { enhance } from '$app/forms';
	import { resolve } from '$app/paths';
	import { toast } from 'svelte-sonner';
	import { formatDate, formatPrice } from '$lib/utils/format';
	import StatusPill from '$lib/components/ui/StatusPill.svelte';
	import Pagination from '$lib/components/ui/Pagination.svelte';
	import { STATUS_TABS } from './shared';
	import type { PageData } from './$types';
	import type { OrderListItem } from './+page.server';

	let { data }: { data: PageData } = $props();

	let totalPages = $derived(Math.ceil(data.total / data.pageSize));

	let confirmOrder: OrderListItem | null = $state(null);
	let dialogEl: HTMLDialogElement | undefined = $state();
	let submitting = $state(false);

	function openConfirm(order: OrderListItem) {
		confirmOrder = order;
		dialogEl?.showModal();
	}
	function closeConfirm() {
		dialogEl?.close();
	}

	/**
	 * URLSearchParams 인스턴스 없이(svelte/prefer-svelte-reactivity) 쿼리 문자열을 직접 조립.
	 * resolve() 의 타입 추론이 리터럴 '?' 를 정적으로 인식해야 하므로, '?' 없는 쿼리 문자열을 반환하고
	 * 호출부에서 삼항으로 정적 경로/템플릿 리터럴을 분기한다(공지 목록 페이지네이션과 동일한 패턴).
	 */
	function buildQuery(parts: Record<string, string | number | undefined>): string {
		return Object.entries(parts)
			.filter(([, v]) => v !== undefined && v !== '')
			.map(([k, v]) => `${k}=${encodeURIComponent(String(v))}`)
			.join('&');
	}

	function tabHref(status: string) {
		const qs = buildQuery({
			status: status !== 'all' ? status : undefined,
			q: data.q || undefined
		});
		return qs ? resolve(`/admin/orders?${qs}`) : resolve('/admin/orders');
	}

	function makeHref(targetPage: number) {
		const qs = buildQuery({
			status: data.status !== 'all' ? data.status : undefined,
			q: data.q || undefined,
			page: targetPage > 1 ? targetPage : undefined
		});
		return qs ? resolve(`/admin/orders?${qs}`) : resolve('/admin/orders');
	}
</script>

<svelte:head>
	<title>주문 관리 - 탄탄 관리자</title>
</svelte:head>

<h1 class="mb-6 text-[24px] font-black tracking-tight text-ink">주문 관리</h1>

<div class="mb-5 flex flex-wrap gap-2">
	{#each STATUS_TABS as tab (tab.value)}
		<a
			href={tabHref(tab.value)}
			class="min-h-11 rounded-lg border px-4 py-[10px] text-[14.5px] font-extrabold whitespace-nowrap {data.status ===
			tab.value
				? 'border-navy bg-navy text-white'
				: 'border-line-2 bg-surface text-ink hover:bg-bg'}"
		>
			{tab.label} <span class="opacity-70">{data.countMap[tab.value] ?? 0}</span>
		</a>
	{/each}
</div>

<form
	method="GET"
	class="mb-5 flex flex-wrap items-center gap-3 rounded-xl border border-line bg-surface p-4"
>
	{#if data.status !== 'all'}
		<input type="hidden" name="status" value={data.status} />
	{/if}
	<label for="order-search" class="sr-only">주문번호 또는 받는분 이름 검색</label>
	<input
		id="order-search"
		type="text"
		name="q"
		value={data.q}
		placeholder="주문번호 또는 받는분 이름 검색"
		class="min-h-11 min-w-[220px] flex-1 rounded-lg border border-line-2 px-4 py-2.5 text-[15px] text-ink focus:ring-2 focus:ring-navy focus:outline-none"
	/>
	<button
		type="submit"
		class="min-h-11 rounded-lg bg-navy px-6 text-[15px] font-extrabold text-white hover:bg-navy/90"
	>
		검색
	</button>
</form>

{#if data.orders.length === 0}
	<div
		class="flex flex-col items-center justify-center gap-2 rounded-xl border border-line bg-surface px-6 py-20 text-center"
	>
		<p class="text-[16px] font-extrabold text-ink">조건에 맞는 주문이 없습니다.</p>
	</div>
{:else}
	<div class="overflow-x-auto rounded-xl border border-line bg-surface">
		<table class="w-full min-w-[820px] border-collapse text-left">
			<thead>
				<tr class="bg-bg text-[14px] font-extrabold text-sub">
					<th class="px-5 py-[14px]">주문번호</th>
					<th class="px-3 py-[14px]">일시</th>
					<th class="px-3 py-[14px]">받는분</th>
					<th class="px-3 py-[14px]">상품 요약</th>
					<th class="px-3 py-[14px] text-right">금액</th>
					<th class="px-3 py-[14px] text-center">상태</th>
					<th class="px-5 py-[14px] text-center">관리</th>
				</tr>
			</thead>
			<tbody>
				{#each data.orders as order (order.id)}
					<tr class="border-t border-line-2">
						<td class="px-5 py-[14px] text-[14.5px] font-extrabold whitespace-nowrap text-navy"
							>{order.order_no}</td
						>
						<td class="px-3 py-[14px] text-[13.5px] whitespace-nowrap text-sub"
							>{formatDate(order.created_at)}</td
						>
						<td class="px-3 py-[14px] text-[14.5px] font-semibold text-ink"
							>{order.receiver_name}</td
						>
						<td class="max-w-[220px] truncate px-3 py-[14px] text-[14px] text-ink"
							>{order.itemSummary}</td
						>
						<td
							class="px-3 py-[14px] text-right text-[14.5px] font-extrabold whitespace-nowrap text-ink"
							>{formatPrice(order.total_amount)}</td
						>
						<td class="px-3 py-[14px] text-center"><StatusPill status={order.order_status} /></td>
						<td class="px-5 py-[14px] text-center">
							<div class="flex items-center justify-center gap-2">
								{#if order.order_status === 'pending'}
									<button
										type="button"
										onclick={() => openConfirm(order)}
										class="inline-flex min-h-11 items-center gap-1.5 rounded-lg bg-yellow px-4 text-[14px] font-extrabold whitespace-nowrap text-navy hover:bg-yellow-hover"
									>
										<svg
											width="16"
											height="16"
											viewBox="0 0 24 24"
											fill="none"
											stroke="currentColor"
											stroke-width="2.4"
											stroke-linecap="round"
											stroke-linejoin="round"
											aria-hidden="true"
										>
											<path d="M5 12.5l4.5 4.5L19 7.5" />
										</svg>
										입금확인
									</button>
								{/if}
								<a
									href={resolve('/admin/orders/[id]', { id: order.id })}
									class="inline-flex min-h-11 items-center rounded-lg border border-navy px-4 text-[14px] font-extrabold text-navy hover:bg-navy-tint"
								>
									상세
								</a>
							</div>
						</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>

	{#if totalPages > 1}
		<div class="mt-8">
			<Pagination currentPage={data.page} {totalPages} {makeHref} />
		</div>
	{/if}
{/if}

<!-- 입금확인 확인 다이얼로그 -->
<dialog
	bind:this={dialogEl}
	onclick={(e) => {
		if (e.target === dialogEl) closeConfirm();
	}}
	class="m-auto w-[440px] max-w-[92%] rounded-2xl border-none p-0 shadow-[0_20px_50px_rgba(0,0,0,.32)] backdrop:bg-[rgba(10,15,25,.55)]"
>
	<div class="p-7">
		<span
			class="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-status-preparing-bg"
		>
			<svg
				width="28"
				height="28"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="2.2"
				stroke-linecap="round"
				stroke-linejoin="round"
				class="text-status-preparing-fg"
				aria-hidden="true"
			>
				<rect x="3" y="6" width="18" height="13" rx="2" />
				<path d="M3 10h18" />
			</svg>
		</span>
		<h3 class="mb-3 text-center text-[20px] font-black text-ink">입금확인 처리할까요?</h3>
		<p class="mb-2 text-center text-[16px] leading-relaxed font-semibold text-sub">
			주문 <b class="font-mono text-navy">{confirmOrder?.order_no}</b> 을(를)<br />입금확인
			처리합니다.
		</p>
		<div class="my-4 text-center">
			<span class="text-[14px] font-bold text-sub">입금 금액</span>
			<div class="mt-0.5 text-[30px] font-black tracking-tight text-navy">
				{confirmOrder ? formatPrice(confirmOrder.total_amount) : ''}
			</div>
		</div>
		<div class="grid grid-cols-2 gap-2.5">
			<button
				type="button"
				onclick={closeConfirm}
				class="min-h-[52px] rounded-[11px] border border-line-2 bg-surface text-[16px] font-extrabold text-ink hover:bg-bg"
			>
				돌아가기
			</button>
			<form
				method="POST"
				action="?/confirmPayment"
				use:enhance={() => {
					submitting = true;
					return async ({ result, update }) => {
						submitting = false;
						closeConfirm();
						if (result.type === 'success') {
							toast.success('입금확인 처리되었습니다');
						} else {
							const msg =
								result.type === 'failure' && typeof result.data?.message === 'string'
									? result.data.message
									: '입금확인 처리에 실패했습니다. 다시 시도해 주세요.';
							toast.error(msg);
						}
						await update();
					};
				}}
			>
				<input type="hidden" name="id" value={confirmOrder?.id ?? ''} />
				<button
					type="submit"
					disabled={submitting}
					class="min-h-[52px] w-full rounded-[11px] bg-yellow text-[16px] font-black text-navy hover:bg-yellow-hover disabled:opacity-60"
				>
					{submitting ? '처리 중…' : '입금확인'}
				</button>
			</form>
		</div>
	</div>
</dialog>
