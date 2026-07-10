<script lang="ts">
	/**
	 * 상품 상세 이미지 라이트박스. 외부 라이브러리 없이 native <dialog>로 직접 구현.
	 * - 키보드: ←/→ 이전·다음, Esc 는 <dialog>가 네이티브로 처리(→ close 이벤트로 open 동기화).
	 * - 모바일 터치: touchstart/touchend 좌표차로 스와이프 이전·다음을 판정한다(touchmove는 건드리지 않음).
	 * - 핀치줌: 스테이지 이미지에 touch-action: pinch-zoom 만 적용해 브라우저 네이티브 핀치줌 제스처를
	 *   그대로 살려둔다(우리 쪽 스와이프 판정은 preventDefault를 호출하지 않으므로 서로 간섭하지 않음).
	 */
	type LightboxImage = { url: string; alt?: string };

	type Props = {
		images: LightboxImage[];
		title: string;
		open: boolean;
		index?: number;
	};

	let { images, title, open = $bindable(false), index = $bindable(0) }: Props = $props();

	let dialogEl = $state<HTMLDialogElement | undefined>();
	let touchStartX = 0;
	let touchStartY = 0;

	const hasMultiple = $derived(images.length > 1);
	const current = $derived(images[index] ?? images[0] ?? null);

	// open prop <-> 실제 <dialog> 상태를 동기화한다.
	$effect(() => {
		if (!dialogEl) return;
		if (open && !dialogEl.open) {
			dialogEl.showModal();
		} else if (!open && dialogEl.open) {
			dialogEl.close();
		}
	});

	// Esc 등 네이티브 닫힘 시 close 이벤트가 발생 — 바인딩된 open 값도 맞춰 내린다.
	function handleDialogClose() {
		open = false;
	}

	function go(delta: number) {
		if (!hasMultiple) return;
		index = (index + delta + images.length) % images.length;
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'ArrowLeft') {
			e.preventDefault();
			go(-1);
		} else if (e.key === 'ArrowRight') {
			e.preventDefault();
			go(1);
		}
	}

	function handleTouchStart(e: TouchEvent) {
		const t = e.touches[0];
		if (!t) return;
		touchStartX = t.clientX;
		touchStartY = t.clientY;
	}

	function handleTouchEnd(e: TouchEvent) {
		const t = e.changedTouches[0];
		if (!t) return;
		const dx = t.clientX - touchStartX;
		const dy = t.clientY - touchStartY;
		// 가로 이동이 40px 이상이고 세로 이동보다 뚜렷하게 클 때만 스와이프로 인정(핀치줌 오인 방지)
		if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy) * 1.5) {
			go(dx < 0 ? 1 : -1);
		}
	}
</script>

<dialog
	bind:this={dialogEl}
	onclose={handleDialogClose}
	onkeydown={handleKeydown}
	aria-label="{title} 이미지 크게 보기"
	class="m-0 h-dvh max-h-none w-dvw max-w-none border-0 bg-[rgba(10,14,22,0.94)] p-0 open:flex open:flex-col backdrop:bg-transparent"
>
	{#if current}
		<!-- 상단 바 -->
		<div class="flex flex-none items-center justify-between gap-3 px-4 py-4 tb:px-6">
			<span class="min-w-0 truncate text-[15px] font-bold text-white">{title}</span>
			<div class="flex flex-none items-center gap-3">
				{#if hasMultiple}
					<span
						class="rounded-full bg-white/15 px-3 py-1.5 font-mono text-[14px] font-extrabold whitespace-nowrap text-white"
					>
						{index + 1} / {images.length}
					</span>
				{/if}
				<button
					type="button"
					onclick={() => (open = false)}
					aria-label="닫기"
					class="flex h-11 w-11 flex-none items-center justify-center rounded-[10px] bg-white/15 text-white hover:bg-white/25"
				>
					<svg
						width="22"
						height="22"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2.2"
						stroke-linecap="round"
						stroke-linejoin="round"
						aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" /></svg
					>
				</button>
			</div>
		</div>

		<!-- 스테이지 -->
		<div class="relative flex min-h-0 flex-1 items-center justify-center px-3 tb:px-4">
			{#if hasMultiple}
				<button
					type="button"
					onclick={() => go(-1)}
					aria-label="이전 이미지"
					class="absolute left-2 z-10 flex h-11 w-11 flex-none items-center justify-center rounded-full bg-white/15 text-white hover:bg-white/30 tb:left-6 tb:h-[52px] tb:w-[52px]"
				>
					<svg
						width="24"
						height="24"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2.4"
						stroke-linecap="round"
						stroke-linejoin="round"
						aria-hidden="true"><path d="M15 5l-7 7 7 7" /></svg
					>
				</button>
			{/if}

			<img
				src={current.url}
				alt={current.alt ?? title}
				ontouchstart={handleTouchStart}
				ontouchend={handleTouchEnd}
				class="max-h-[74vh] max-w-[88vw] touch-pinch-zoom rounded-xl object-contain tb:max-w-[78vw]"
			/>

			{#if hasMultiple}
				<button
					type="button"
					onclick={() => go(1)}
					aria-label="다음 이미지"
					class="absolute right-2 z-10 flex h-11 w-11 flex-none items-center justify-center rounded-full bg-white/15 text-white hover:bg-white/30 tb:right-6 tb:h-[52px] tb:w-[52px]"
				>
					<svg
						width="24"
						height="24"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2.4"
						stroke-linecap="round"
						stroke-linejoin="round"
						aria-hidden="true"><path d="M9 5l7 7-7 7" /></svg
					>
				</button>
			{/if}
		</div>

		{#if hasMultiple}
			<!-- 모바일 스와이프 힌트 -->
			<p class="flex-none pb-1 text-center text-[13px] font-semibold text-white/60 tb:hidden">
				← 좌우로 밀어 사진을 넘겨보세요 →
			</p>

			<!-- 썸네일 스트립 -->
			<div class="flex flex-none justify-center gap-2.5 overflow-x-auto px-4 py-4 tb:py-6">
				{#each images as img, i (img.url + i)}
					<button
						type="button"
						onclick={() => (index = i)}
						aria-label="{i + 1}번째 이미지로 이동"
						aria-current={i === index}
						class="h-[58px] w-[58px] flex-none overflow-hidden rounded-[9px] border-2 tb:h-[66px] tb:w-[66px] {i ===
						index
							? 'border-yellow opacity-100'
							: 'border-transparent opacity-50'}"
					>
						<img src={img.url} alt="" class="h-full w-full object-cover" />
					</button>
				{/each}
			</div>
		{/if}
	{/if}
</dialog>
