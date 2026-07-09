<script lang="ts">
	/** 주문내역 목록. 최신순, 각 카드는 주문 상세로 링크된다. */
	import { resolve } from '$app/paths';
	import { formatDate, formatPrice } from '$lib/utils/format';
	import StatusPill from '$lib/components/ui/StatusPill.svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
</script>

<svelte:head>
	<title>주문내역 - 탄탄 편의시설</title>
</svelte:head>

<h1 class="mb-5 text-[22px] font-black tracking-tight text-ink">주문내역</h1>

{#if data.orders.length === 0}
	<div
		class="flex flex-col items-center justify-center gap-2 rounded-xl border border-line bg-surface px-6 py-20 text-center"
	>
		<p class="text-[16px] font-extrabold text-ink">주문 내역이 없습니다.</p>
		<a href={resolve('/products')} class="mt-1 text-[14px] font-bold text-navy hover:underline">
			상품 둘러보기
		</a>
	</div>
{:else}
	<ul class="flex flex-col gap-4">
		{#each data.orders as order (order.id)}
			<li>
				<a
					href={resolve('/(my)/mypage/orders/[id]', { id: order.id })}
					class="block overflow-hidden rounded-xl border border-line bg-surface hover:border-navy"
				>
					<div
						class="flex flex-wrap items-center justify-between gap-2 border-b border-line-2 bg-bg px-5 py-[14px]"
					>
						<span class="text-[14px] font-bold text-ink">
							주문번호 <span class="text-navy">{order.order_no}</span> · {formatDate(
								order.created_at
							)}
						</span>
						<StatusPill status={order.order_status} />
					</div>
					<div class="flex items-center justify-between gap-4 px-5 py-[18px]">
						<span class="min-w-0 flex-1 truncate text-[15.5px] font-semibold text-ink"
							>{order.itemSummary}</span
						>
						<span class="shrink-0 text-[17px] font-black tracking-tight text-navy"
							>{formatPrice(order.total_amount)}</span
						>
					</div>
				</a>
			</li>
		{/each}
	</ul>
{/if}
