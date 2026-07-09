<script lang="ts">
	/** 상품 가격 표시. 전화문의 상품은 가격 대신 "전화문의" 텍스트를 보여준다. */
	import { formatPrice } from '$lib/utils/format';

	type Props = {
		price: number | null;
		isPhoneInquiry: boolean;
	};

	let { price, isPhoneInquiry }: Props = $props();
</script>

{#if isPhoneInquiry}
	<span class="text-[21px] font-black tracking-tight text-phone-price">전화문의</span>
{:else}
	<span class="text-[21px] font-black tracking-tight text-ink">{formatPrice(price ?? 0)}</span>
{/if}
