<script lang="ts">
	/** 클립보드 복사 버튼(아웃라인, 네이비) + 성공/실패 토스트. 계좌번호 등 값 복사용. */
	import { toast } from 'svelte-sonner';

	type Props = {
		/** 복사할 값(포맷 제거된 원시값을 넘길 것) */
		value: string;
		label?: string;
		successMessage?: string;
		class?: string;
	};

	let {
		value,
		label = '복사',
		successMessage = '복사되었습니다',
		class: className = ''
	}: Props = $props();

	async function copy() {
		try {
			await navigator.clipboard.writeText(value);
			toast.success(successMessage);
		} catch {
			toast.error('복사에 실패했습니다.');
		}
	}
</script>

<button
	type="button"
	onclick={copy}
	class="inline-flex shrink-0 items-center gap-1 rounded-lg border border-navy bg-navy-tint px-3 py-[7px] text-[13px] font-extrabold whitespace-nowrap text-navy hover:bg-navy hover:text-white {className}"
>
	<svg
		width="14"
		height="14"
		viewBox="0 0 24 24"
		fill="none"
		stroke="currentColor"
		stroke-width="2"
		stroke-linecap="round"
		stroke-linejoin="round"
		aria-hidden="true"
	>
		<rect x="9" y="9" width="11" height="11" rx="2" />
		<path d="M5 15V5a2 2 0 0 1 2-2h8" />
	</svg>
	{label}
</button>
