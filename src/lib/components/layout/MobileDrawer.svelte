<script lang="ts">
	/**
	 * tb(820px) 미만에서 MobileBottomBar 의 "메뉴" 버튼으로 여는 햄버거 드로어.
	 * 열림 상태는 부모(+layout.svelte)가 소유하고 open/onClose 로 제어한다(콜백 prop 패턴).
	 */
	import { resolve } from '$app/paths';
	import type { Category } from './types';

	let {
		open = false,
		onClose,
		categories = [],
		tel = '010-4055-3338'
	}: {
		open?: boolean;
		onClose: () => void;
		categories?: Category[];
		tel?: string;
	} = $props();

	let panelEl: HTMLDivElement | undefined = $state();

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') onClose();
	}

	$effect(() => {
		if (!open) return;
		document.body.style.overflow = 'hidden';
		panelEl?.focus();
		return () => {
			document.body.style.overflow = '';
		};
	});
</script>

{#if open}
	<div class="fixed inset-0 z-[80] tb:hidden">
		<button
			type="button"
			aria-label="메뉴 닫기"
			class="absolute inset-0 bg-[rgba(10,15,25,0.5)]"
			onclick={onClose}
		></button>
		<div
			bind:this={panelEl}
			class="absolute top-0 bottom-0 left-0 flex w-[300px] max-w-[86%] flex-col overflow-y-auto bg-surface shadow-[2px_0_24px_rgba(0,0,0,0.22)]"
			role="dialog"
			aria-modal="true"
			aria-label="모바일 메뉴"
			tabindex="-1"
			onkeydown={handleKeydown}
		>
			<div class="flex items-center justify-between bg-navy px-5 py-[18px] text-white">
				<span class="text-[18px] font-black tracking-tight">탄탄 편의시설</span>
				<button
					type="button"
					aria-label="메뉴 닫기"
					class="flex h-[34px] w-[34px] items-center justify-center rounded-lg bg-white/15 text-white"
					onclick={onClose}
				>
					<svg
						width="16"
						height="16"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"
						aria-hidden="true"
					>
						<path d="M6 6l12 12M18 6L6 18" />
					</svg>
				</button>
			</div>

			<a
				href={resolve('/login')}
				class="flex items-center gap-[9px] border-b border-line bg-bg px-5 py-[15px] text-[15px] font-bold text-navy"
				onclick={onClose}
			>
				<svg
					width="18"
					height="18"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="1.8"
					stroke-linecap="round"
					stroke-linejoin="round"
					aria-hidden="true"
				>
					<circle cx="12" cy="8" r="3.2" />
					<path d="M5.5 20a6.5 6.5 0 0 1 13 0" />
				</svg>
				로그인 / 회원가입
			</a>

			<div class="px-5 pt-4 pb-1.5 text-[12.5px] font-extrabold tracking-wide text-sub">
				상품 카테고리
			</div>
			<a
				href={resolve('/products')}
				class="block border-b border-line px-5 py-3.5 text-[15.5px] font-extrabold text-navy"
				onclick={onClose}
			>
				전체 상품 보기
			</a>
			{#each categories as category (category.id)}
				<a
					href={resolve(`/products?category=${category.id}`)}
					class="block border-b border-line py-3.5 pr-5 pl-7 text-[15px] font-semibold text-ink"
					onclick={onClose}
				>
					{category.name}
				</a>
			{/each}

			<div class="px-5 pt-4 pb-1.5 text-[12.5px] font-extrabold tracking-wide text-sub">
				고객지원
			</div>
			<a
				href={resolve('/cases')}
				class="block border-b border-line px-5 py-3.5 text-[15px] font-semibold text-ink"
				onclick={onClose}
			>
				시공사례
			</a>
			<a
				href={resolve('/about')}
				class="block border-b border-line px-5 py-3.5 text-[15px] font-semibold text-ink"
				onclick={onClose}
			>
				회사소개
			</a>
			<a
				href={resolve('/notice')}
				class="block border-b border-line px-5 py-3.5 text-[15px] font-semibold text-ink"
				onclick={onClose}
			>
				공지사항
			</a>
			<a
				href={resolve('/inquiry')}
				class="block border-b border-line px-5 py-3.5 text-[15px] font-semibold text-ink"
				onclick={onClose}
			>
				문의하기
			</a>
			<a
				href={resolve('/archive')}
				class="block border-b border-line px-5 py-3.5 text-[15px] font-semibold text-ink"
				onclick={onClose}
			>
				자료실
			</a>

			<div class="mt-auto px-5 py-[18px]">
				<a
					href={resolve('/inquiry?type=quote')}
					class="flex items-center justify-center gap-2 rounded-[9px] bg-yellow px-4 py-[13px] text-[15px] font-extrabold text-navy"
					onclick={onClose}
				>
					<svg
						width="17"
						height="17"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"
						aria-hidden="true"
					>
						<path
							d="M6.5 4h3l1.5 4-2 1.5a11 11 0 0 0 5 5l1.5-2 4 1.5v3a2 2 0 0 1-2 2A16 16 0 0 1 4.5 6a2 2 0 0 1 2-2z"
						/>
					</svg>
					시공·견적 문의
				</a>
				<a
					href="tel:{tel}"
					class="mt-2 block text-center text-[13px] font-semibold text-sub"
					onclick={onClose}
				>
					또는 전화로 문의: {tel}
				</a>
			</div>
		</div>
	</div>
{/if}
