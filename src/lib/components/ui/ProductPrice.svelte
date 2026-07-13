<script lang="ts">
	/** 상품 가격 표시. 전화문의 상품은 가격 대신 "전화문의" 텍스트를 보여준다. */
	import { formatPrice } from '$lib/utils/format';

	type Props = {
		price: number | null;
		isPhoneInquiry: boolean;
		/** 상품 카드용. 모바일 2열(카드 내부 ≈96px)에서 6자리 가격이 '원'만 다음 줄로
		 *  떨어지는 것을 막기 위해 작은 화면에서만 글자를 줄인다. 상세 페이지는 21px 유지. */
		compact?: boolean;
	};

	let { price, isPhoneInquiry, compact = false }: Props = $props();

	const size = $derived(compact ? 'text-[18px] sm:text-[21px]' : 'text-[21px]');
</script>

{#if isPhoneInquiry}
	<span class="{size} font-black tracking-tight text-phone-price">전화문의</span>
{:else}
	<span class="{size} font-black tracking-tight text-ink">{formatPrice(price ?? 0)}</span>
{/if}
