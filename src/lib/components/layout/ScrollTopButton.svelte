<script lang="ts">
	/**
	 * 맨 위로 버튼 (모바일 전용, P1+). 한 화면 이상 스크롤하면 나타나고,
	 * 하단 고정 바(66px) 위에 뜬다. PC(≥820px)는 표시하지 않는다.
	 */
	let visible = $state(false);

	function handleScroll() {
		visible = window.scrollY > window.innerHeight;
	}

	// 스크롤이 복원된 채 로드되는 경우(하드 리로드 복원, 해시 앵커)에도 초기 상태를 맞춘다
	$effect(() => {
		handleScroll();
	});

	function scrollToTop() {
		window.scrollTo({ top: 0, behavior: 'smooth' });
	}
</script>

<svelte:window onscroll={handleScroll} />

{#if visible}
	<button
		type="button"
		onclick={scrollToTop}
		aria-label="맨 위로"
		class="fixed right-4 bottom-[82px] z-40 flex h-11 w-11 items-center justify-center rounded-full border border-line bg-surface text-navy shadow-[0_4px_14px_rgba(20,27,43,0.18)] tb:hidden"
	>
		<svg
			width="20"
			height="20"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			stroke-width="2.2"
			stroke-linecap="round"
			stroke-linejoin="round"
			aria-hidden="true"
		>
			<path d="M12 19V6" />
			<path d="M5.5 12.5 12 6l6.5 6.5" />
		</svg>
	</button>
{/if}
