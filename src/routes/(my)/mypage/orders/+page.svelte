<script lang="ts">
	/** 주문내역 목록. 최신순, 각 카드의 "상세보기" 버튼이 주문 상세로 연결된다. */
	import { resolve } from '$app/paths';
	import { formatDate, formatPrice } from '$lib/utils/format';
	import StatusPill from '$lib/components/ui/StatusPill.svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	/**
	 * 서버가 상품 개수를 별도로 내려주지 않으므로(orders/+page.server.ts는 수정 대상 아님),
	 * "{첫 상품명} 외 N건" 형태인 itemSummary에서 총 개수를 역산한다.
	 */
	function itemCount(summary: string): number {
		if (summary === '주문 상품 없음') return 0;
		const rest = summary.match(/외 (\d+)건$/);
		return rest ? Number(rest[1]) + 1 : 1;
	}
</script>

<svelte:head>
	<title>주문내역 - 탄탄 편의시설</title>
</svelte:head>

<h1 class="mb-5 text-[22px] font-black tracking-[-0.5px] text-ink">주문내역</h1>

{#if data.orders.length === 0}
	<div
		class="flex flex-col items-center gap-2 rounded-[14px] border border-line bg-surface px-6 py-16 text-center shadow-[0_3px_12px_rgba(20,27,43,.04)]"
	>
		<span class="mb-1 flex h-[60px] w-[60px] items-center justify-center rounded-full bg-bg">
			<svg
				width="28"
				height="28"
				viewBox="0 0 24 24"
				fill="none"
				stroke="#9aa4ba"
				stroke-width="1.7"
				stroke-linecap="round"
				stroke-linejoin="round"
				aria-hidden="true"
			>
				<path d="M6 6h15l-1.5 9h-12z" />
				<path d="M6 6L5 3H2" />
				<circle cx="9" cy="20" r="1.4" />
				<circle cx="18" cy="20" r="1.4" />
			</svg>
		</span>
		<p class="text-[16.5px] font-extrabold text-ink">주문 내역이 없습니다.</p>
		<p class="text-[14px] font-semibold text-sub">필요하신 편의시설 제품을 둘러보세요.</p>
		<a
			href={resolve('/products')}
			class="mt-3 inline-flex min-h-11 items-center gap-2 rounded-[10px] bg-navy px-6 py-[13px] text-[15px] font-extrabold text-white hover:bg-navy/90"
		>
			상품 보러가기
		</a>
	</div>
{:else}
	<ul class="flex flex-col gap-3.5">
		{#each data.orders as order (order.id)}
			<li
				class="overflow-hidden rounded-[14px] border border-line bg-surface shadow-[0_3px_12px_rgba(20,27,43,.04)]"
			>
				<div
					class="flex flex-wrap items-center justify-between gap-2.5 border-b border-line-2 bg-bg px-5 py-[14px]"
				>
					<span class="text-[13.5px] font-bold text-sub">
						주문번호 <span class="text-navy">{order.order_no}</span> · {formatDate(
							order.created_at
						)}
					</span>
					<StatusPill status={order.order_status} />
				</div>
				<div class="flex flex-wrap items-center gap-4 px-5 py-[18px]">
					<div
						class="flex h-[66px] w-[66px] flex-none items-center justify-center rounded-[10px] bg-[repeating-linear-gradient(45deg,#eef0f3,#eef0f3_8px,#e5e8ee_8px,#e5e8ee_16px)]"
						aria-hidden="true"
					>
						<span class="font-mono text-[9px] text-[#8a92a3]">사진</span>
					</div>
					<div class="min-w-[160px] flex-1">
						<p class="text-[15.5px] leading-[1.45] font-bold text-ink">{order.itemSummary}</p>
						<p class="mt-1 text-[13px] font-semibold text-[#8a92a3]">
							총 {itemCount(order.itemSummary)}개 상품
						</p>
					</div>
					<div class="ml-auto flex items-center gap-4">
						<span class="text-[19px] font-black tracking-[-0.5px] whitespace-nowrap text-ink"
							>{formatPrice(order.total_amount)}</span
						>
						<a
							href={resolve('/(my)/mypage/orders/[id]', { id: order.id })}
							class="inline-flex min-h-11 items-center gap-1.5 rounded-[9px] border border-navy px-4 py-2.5 text-[14px] font-extrabold whitespace-nowrap text-navy hover:bg-navy-tint"
						>
							상세보기
							<svg
								width="15"
								height="15"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								stroke-width="2"
								stroke-linecap="round"
								stroke-linejoin="round"
								aria-hidden="true"
							>
								<path d="M9 6l6 6-6 6" />
							</svg>
						</a>
					</div>
				</div>
			</li>
		{/each}
	</ul>
{/if}
