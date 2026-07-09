<script lang="ts">
	import { resolve } from '$app/paths';
	import { formatPrice, formatDate } from '$lib/utils/format';
	import StatusPill from '$lib/components/ui/StatusPill.svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const cards = $derived([
		{
			label: '신규 주문',
			sub: '결제대기 중',
			value: `${data.counts.pendingOrders}건`,
			href: resolve('/admin/orders')
		},
		{
			label: '미답변 문의',
			sub: '답변 대기 중',
			value: `${data.counts.waitingInquiries}건`,
			href: resolve('/admin/boards')
		},
		{
			label: '신규 가입',
			sub: '최근 7일',
			value: `${data.counts.newMembers}명`,
			href: resolve('/admin/members')
		},
		{
			label: '판매중 상품',
			sub: '현재 노출 중',
			value: `${data.counts.onSaleProducts}개`,
			href: resolve('/admin/products')
		}
	]);
</script>

<svelte:head>
	<title>대시보드 - 탄탄 관리자</title>
</svelte:head>

<h1 class="text-[24px] font-black tracking-tight text-ink tb:text-[26px]">관리자 대시보드</h1>

<div class="mt-6 grid grid-cols-2 gap-4 tb:grid-cols-4">
	{#each cards as card (card.label)}
		<a
			href={card.href}
			class="block rounded-2xl border border-line-2 bg-surface p-5 hover:border-navy tb:p-6"
		>
			<p class="text-[14.5px] font-bold text-sub">{card.label}</p>
			<p class="mt-2.5 text-[32px] font-black tracking-tight text-navy tb:text-[38px]">
				{card.value}
			</p>
			<p class="mt-1.5 text-[13px] font-bold text-sub">{card.sub}</p>
		</a>
	{/each}
</div>

<div class="mt-6 overflow-hidden rounded-2xl border border-line-2 bg-surface">
	<div class="flex items-center justify-between border-b border-line px-5 py-4 tb:px-6">
		<h2 class="text-[18px] font-black text-ink">최근 주문</h2>
		<a
			href={resolve('/admin/orders')}
			class="min-h-11 rounded-lg border border-line-2 px-4 py-2 text-[14px] font-bold text-ink hover:bg-bg"
		>
			주문 전체보기
		</a>
	</div>

	{#if data.recentOrders.length === 0}
		<p class="px-6 py-12 text-center text-[15px] text-sub">최근 주문이 없습니다.</p>
	{:else}
		<div class="overflow-x-auto">
			<table class="w-full min-w-[640px] border-collapse text-left">
				<thead>
					<tr class="bg-bg">
						<th class="px-5 py-3 text-[13.5px] font-extrabold text-sub tb:px-6">주문번호</th>
						<th class="px-4 py-3 text-[13.5px] font-extrabold text-sub">주문자</th>
						<th class="px-4 py-3 text-right text-[13.5px] font-extrabold text-sub">금액</th>
						<th class="px-4 py-3 text-center text-[13.5px] font-extrabold text-sub">상태</th>
						<th class="px-5 py-3 text-right text-[13.5px] font-extrabold text-sub tb:px-6"
							>주문일시</th
						>
					</tr>
				</thead>
				<tbody>
					{#each data.recentOrders as order (order.id)}
						<tr class="border-t border-line">
							<td class="px-5 py-4 text-[14.5px] font-extrabold text-navy tb:px-6"
								>{order.order_no}</td
							>
							<td class="px-4 py-4 text-[14.5px] font-semibold text-ink">{order.receiver_name}</td>
							<td class="px-4 py-4 text-right text-[14.5px] font-extrabold text-ink"
								>{formatPrice(order.total_amount)}</td
							>
							<td class="px-4 py-4 text-center">
								<StatusPill status={order.order_status} />
							</td>
							<td class="px-5 py-4 text-right text-[13.5px] text-sub tb:px-6"
								>{formatDate(order.created_at)}</td
							>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	{/if}
</div>
