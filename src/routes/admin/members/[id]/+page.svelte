<script lang="ts">
	/** 회원 상세. 프로필 정보 + 주문 이력. */
	import { resolve } from '$app/paths';
	import { formatDate, formatPrice } from '$lib/utils/format';
	import StatusPill from '$lib/components/ui/StatusPill.svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
</script>

<svelte:head>
	<title>{data.member.name ?? '회원'} 상세 - 탄탄 관리자</title>
</svelte:head>

<a
	href={resolve('/admin/members')}
	class="mb-4 inline-block text-[14.5px] font-bold text-sub hover:text-navy"
>
	← 회원 목록
</a>

<h1 class="sr-only">회원 상세</h1>

<div class="flex flex-col gap-5">
	<div class="rounded-xl border border-line bg-surface p-6">
		<div class="mb-4 flex flex-wrap items-center gap-3">
			<h2 class="text-[19px] font-black text-ink">{data.member.name ?? '(이름 없음)'}</h2>
			<span class="rounded-md bg-navy-tint px-[10px] py-[4px] text-[13px] font-bold text-navy">
				{data.member.role === 'admin' ? '관리자' : '일반회원'}
			</span>
		</div>
		<div class="grid grid-cols-1 gap-x-8 gap-y-3 text-[14.5px] sm:grid-cols-2">
			<div class="flex justify-between border-b border-line-2 pb-2">
				<span class="font-semibold text-sub">연락처</span>
				<span class="font-bold text-ink">{data.member.phone ?? '-'}</span>
			</div>
			<div class="flex justify-between border-b border-line-2 pb-2">
				<span class="font-semibold text-sub">가입일</span>
				<span class="font-bold text-ink">{formatDate(data.member.created_at)}</span>
			</div>
		</div>
	</div>

	<div class="rounded-xl border border-line bg-surface p-6">
		<h3 class="mb-3 text-[17px] font-black text-ink">주문 이력 ({data.orders.length}건)</h3>
		{#if data.orders.length === 0}
			<p class="py-6 text-center text-[14.5px] text-sub">주문 이력이 없습니다.</p>
		{:else}
			<ul>
				{#each data.orders as order (order.id)}
					<li class="flex flex-wrap items-center justify-between gap-3 border-t border-line-2 py-3">
						<div class="min-w-0">
							<a
								href={resolve('/admin/orders/[id]', { id: order.id })}
								class="text-[14.5px] font-extrabold text-navy hover:underline"
							>
								{order.order_no}
							</a>
							<span class="ml-2 text-[13px] text-sub">{formatDate(order.created_at)}</span>
						</div>
						<div class="flex items-center gap-3">
							<span class="text-[14.5px] font-black text-ink"
								>{formatPrice(order.total_amount)}</span
							>
							<StatusPill status={order.order_status} />
						</div>
					</li>
				{/each}
			</ul>
		{/if}
	</div>
</div>
