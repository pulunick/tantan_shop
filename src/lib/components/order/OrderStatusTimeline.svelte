<script lang="ts">
	/**
	 * 주문 처리 현황 5단계 스텝퍼 (입금대기→입금확인→배송준비→배송중→배송완료).
	 * DESIGN_SPEC [10]. PC 가로 스텝퍼(연결선 위 진행률 라인) / 모바일(≤820px) 세로 스텝퍼.
	 * cancelled/refunded 상태는 이 컴포넌트를 쓰지 않고 호출부에서 별도 안내로 대체한다.
	 */
	import type { OrderStatus } from '$lib/types';

	type ActiveStatus = 'pending' | 'paid' | 'preparing' | 'shipping' | 'delivered';

	// 호출부에서 cancelled/refunded 는 이 컴포넌트를 렌더하지 않지만(타입 편의상) 전체 OrderStatus 를 받는다.
	type Props = { status: OrderStatus };
	let { status }: Props = $props();

	// 라벨은 사이트 공통 표기(StatusPill·관리자 상태 탭·dev-spec 상태 플로우)와 통일한다.
	// 시안 [10]은 '입금대기→입금확인'이었으나 같은 화면의 StatusPill('결제대기')과 충돌해 맞춤.
	const STEPS: { key: ActiveStatus; label: string }[] = [
		{ key: 'pending', label: '결제대기' },
		{ key: 'paid', label: '결제완료' },
		{ key: 'preparing', label: '배송준비' },
		{ key: 'shipping', label: '배송중' },
		{ key: 'delivered', label: '배송완료' }
	];

	const currentIndex = $derived(
		Math.max(
			0,
			STEPS.findIndex((s) => s.key === status)
		)
	);
	// 진행 라인은 연결선 구간(좌우 10%씩 여백) 폭의 (현재/전체 4단계) 만큼 채운다.
	const progressPct = $derived((currentIndex / (STEPS.length - 1)) * 80);
</script>

{#snippet dot(done: boolean, active: boolean)}
	{#if done}
		<svg
			width="18"
			height="18"
			viewBox="0 0 24 24"
			fill="none"
			stroke="#fff"
			stroke-width="3"
			stroke-linecap="round"
			stroke-linejoin="round"
			aria-hidden="true"
		>
			<path d="M5 12.5l4.5 4.5L19 7.5" />
		</svg>
	{:else if active}
		<span class="h-3.5 w-3.5 rounded-full bg-yellow"></span>
	{:else}
		<span class="h-[11px] w-[11px] rounded-full bg-sub/40"></span>
	{/if}
{/snippet}

<!-- PC: 가로 스텝퍼 -->
<div class="hidden tb:block">
	<div class="relative grid grid-cols-5">
		<div class="absolute top-[19px] right-[10%] left-[10%] h-[3px] rounded-full bg-line"></div>
		<div
			class="absolute top-[19px] left-[10%] h-[3px] rounded-full bg-navy transition-[width] duration-300"
			style:width="{progressPct}%"
		></div>
		{#each STEPS as step, i (step.key)}
			{@const done = i < currentIndex}
			{@const active = i === currentIndex}
			<div class="relative z-[2] flex flex-col items-center gap-2.5">
				<span
					class="flex h-10 w-10 items-center justify-center rounded-full {done || active
						? 'bg-navy'
						: 'bg-line'} {active ? 'shadow-[0_0_0_4px_rgba(242,183,5,.2)]' : ''}"
				>
					{@render dot(done, active)}
				</span>
				<span
					class="text-center text-[14.5px] whitespace-nowrap {active
						? 'font-extrabold text-navy'
						: done
							? 'font-bold text-ink'
							: 'font-semibold text-sub'}"
				>
					{step.label}
				</span>
			</div>
		{/each}
	</div>
</div>

<!-- 모바일(≤820px): 세로 스텝퍼 -->
<div class="flex flex-col tb:hidden">
	{#each STEPS as step, i (step.key)}
		{@const done = i < currentIndex}
		{@const active = i === currentIndex}
		{@const isLast = i === STEPS.length - 1}
		<div class="flex items-start gap-3.5">
			<div class="flex flex-none flex-col items-center">
				<span
					class="flex h-9 w-9 items-center justify-center rounded-full {done || active
						? 'bg-navy'
						: 'bg-line'} {active ? 'shadow-[0_0_0_4px_rgba(242,183,5,.2)]' : ''}"
				>
					{@render dot(done, active)}
				</span>
				{#if !isLast}
					<span class="min-h-[22px] w-[3px] flex-1 {done ? 'bg-navy' : 'bg-line'}"></span>
				{/if}
			</div>
			<div class="pb-3.5">
				<div
					class="text-[15.5px] {active
						? 'font-extrabold text-navy'
						: done
							? 'font-bold text-ink'
							: 'font-semibold text-sub'}"
				>
					{step.label}
				</div>
			</div>
		</div>
	{/each}
</div>
