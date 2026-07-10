<script lang="ts">
	// 전역 에러 페이지 — DESIGN_SPEC [9]-(3). 막다른 길에서 이탈 방지를 위해 전화 동선 강조.
	import { page } from '$app/state';
	import { resolve } from '$app/paths';
	import { SUPPORT_TEL } from '$lib/constants';

	const is404 = $derived(page.status === 404);
	const title = $derived(is404 ? '페이지를 찾을 수 없습니다' : '일시적인 오류가 발생했습니다');
	const desc = $derived(
		is404
			? '주소가 바뀌었거나 삭제된 페이지일 수 있습니다.\n아래 버튼으로 이동하시거나, 전화 주시면 바로 도와드리겠습니다.'
			: '잠시 후 다시 시도해 주세요.\n문제가 계속되면 전화 주시면 바로 도와드리겠습니다.'
	);
</script>

<svelte:head>
	<title>{page.status} | 탄탄 편의시설</title>
</svelte:head>

<main class="flex min-h-dvh flex-col items-center justify-center px-5 py-16 text-center">
	<!-- 대형 상태 코드 + 옐로 하이라이트 바 -->
	<p class="relative text-[96px] leading-none font-black text-navy" aria-hidden="true">
		{page.status}
		<span class="absolute -bottom-2 left-1/2 h-3 w-28 -translate-x-1/2 rounded-full bg-yellow/70"
		></span>
	</p>

	<h1 class="mt-8 text-2xl font-bold text-navy">{title}</h1>
	<p class="mt-3 text-[15px] whitespace-pre-line text-sub">{desc}</p>

	<div class="mt-8 flex w-full max-w-90 flex-col gap-3 sm:max-w-none sm:flex-row sm:justify-center">
		<a
			href={resolve('/')}
			class="inline-flex min-h-12 items-center justify-center gap-2 rounded-[10px] bg-navy px-6 text-[15px] font-bold text-white hover:opacity-90"
		>
			<svg
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="1.8"
				stroke-linecap="round"
				stroke-linejoin="round"
				class="h-5 w-5"
				aria-hidden="true"
			>
				<path d="M3 10.5 12 3l9 7.5" />
				<path d="M5 9.5V21h14V9.5" />
			</svg>
			홈으로 가기
		</a>
		<a
			href="tel:{SUPPORT_TEL}"
			class="inline-flex min-h-12 items-center justify-center gap-2 rounded-[10px] bg-yellow px-6 text-[15px] font-bold text-navy hover:bg-yellow-hover"
		>
			<svg
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="1.8"
				stroke-linecap="round"
				stroke-linejoin="round"
				class="h-5 w-5"
				aria-hidden="true"
			>
				<path
					d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 2 .7 2.9a2 2 0 0 1-.5 2.1L8 10a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.5c.9.3 1.9.6 2.9.7a2 2 0 0 1 1.7 2Z"
				/>
			</svg>
			{SUPPORT_TEL} 전화하기
		</a>
	</div>

	<p class="mt-5 text-[13.5px] text-sub">전화 상담: 평일 09:00 ~ 18:00</p>
</main>
