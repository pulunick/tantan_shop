<script lang="ts">
	/** 주문 상태 배지. 마이페이지 주문내역/관리자 주문관리 공용. */
	import type { OrderStatus } from '$lib/types';

	type Props = {
		status: OrderStatus;
	};

	let { status }: Props = $props();

	const config: Record<OrderStatus, { label: string; classes: string }> = {
		pending: { label: '결제대기', classes: 'bg-bg text-sub' },
		paid: { label: '결제완료', classes: 'bg-status-paid-bg text-status-paid-fg' },
		preparing: { label: '배송준비', classes: 'bg-status-preparing-bg text-status-preparing-fg' },
		shipping: { label: '배송중', classes: 'bg-status-shipping-bg text-status-shipping-fg' },
		delivered: { label: '배송완료', classes: 'bg-status-delivered-bg text-status-delivered-fg' },
		cancelled: { label: '취소', classes: 'bg-status-cancelled-bg text-status-cancelled-fg' },
		refunded: { label: '환불', classes: 'bg-status-cancelled-bg text-status-cancelled-fg' }
	};

	let current = $derived(config[status]);
</script>

<span class="inline-block rounded-md px-[10px] py-[5px] text-[13px] font-bold {current.classes}">
	{current.label}
</span>
