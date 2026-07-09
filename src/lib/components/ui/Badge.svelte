<script lang="ts">
	/** BEST/NEW 상품 배지. 카드 썸네일 위 등에서 사용. */
	type Props = {
		variant: 'best' | 'new';
		label?: string;
	};

	let { variant, label }: Props = $props();

	let defaultLabel = $derived(variant === 'best' ? 'BEST' : 'NEW');
	let classes = $derived(variant === 'best' ? 'bg-yellow text-navy' : 'bg-navy text-white');
</script>

<span class="inline-block rounded-md px-[9px] py-[4px] text-[11.5px] font-extrabold {classes}">
	{label ?? defaultLabel}
</span>
