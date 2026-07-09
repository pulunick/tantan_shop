<script lang="ts">
	/**
	 * 데스크톱 네이비 GNB. tb(820px) 미만에서는 숨기고 MobileDrawer 로 대체한다.
	 * "상품"/"고객센터" 드롭다운은 마우스 hover 뿐 아니라 focus 로도 열리고 Esc 로 닫힌다(키보드 접근성).
	 */
	import { resolve } from '$app/paths';
	import type { Category } from './types';

	let { categories = [] }: { categories?: Category[] } = $props();

	type MenuKey = 'products' | 'support';
	let openMenu = $state<MenuKey | null>(null);

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') {
			openMenu = null;
			(e.currentTarget as HTMLElement).querySelector('a')?.focus();
		}
	}

	function handleFocusOut(e: FocusEvent, menu: MenuKey) {
		const container = e.currentTarget as HTMLElement;
		const next = e.relatedTarget as Node | null;
		if (!next || !container.contains(next)) {
			if (openMenu === menu) openMenu = null;
		}
	}
</script>

<nav class="hidden bg-navy tb:block" aria-label="주 메뉴">
	<div class="mx-auto flex max-w-[1200px] items-center justify-between px-6">
		<div class="flex items-center">
			<!-- 상품 드롭다운: hover-preview 메가메뉴 컨테이너. 실제 상호작용 요소는 내부 a 태그이므로
			     이 div 는 열림 상태만 보관하는 순수 래퍼다(포커스 이동 없음) -->
			<!-- svelte-ignore a11y_no_static_element_interactions -->
			<div
				class="relative"
				onmouseenter={() => (openMenu = 'products')}
				onmouseleave={() => {
					if (openMenu === 'products') openMenu = null;
				}}
				onfocusin={() => (openMenu = 'products')}
				onfocusout={(e) => handleFocusOut(e, 'products')}
				onkeydown={handleKeydown}
			>
				<a
					href={resolve('/products')}
					aria-haspopup="true"
					aria-expanded={openMenu === 'products'}
					class="inline-block px-[22px] py-[15px] text-[16px] font-bold tracking-tight whitespace-nowrap text-white hover:bg-white/10"
				>
					상품 ▾
				</a>
				{#if openMenu === 'products'}
					<div
						class="absolute top-full left-0 z-[60] min-w-[238px] rounded-b-[10px] border border-t-0 border-line bg-surface py-1.5 shadow-[0_12px_26px_rgba(20,27,43,0.16)]"
					>
						<a
							href={resolve('/products')}
							class="block px-5 py-[11px] text-[15px] font-extrabold text-navy hover:bg-navy-tint"
						>
							전체 상품 보기
						</a>
						<div class="my-[5px] h-px bg-line"></div>
						{#each categories as category (category.id)}
							<a
								href={resolve(`/products?category=${category.id}`)}
								class="block px-5 py-[11px] text-[15px] font-semibold text-ink hover:bg-navy-tint"
							>
								{category.name}
							</a>
						{/each}
					</div>
				{/if}
			</div>

			<a
				href={resolve('/cases')}
				class="inline-block px-[22px] py-[15px] text-[16px] font-bold tracking-tight whitespace-nowrap text-white hover:bg-white/10"
			>
				시공사례
			</a>
			<a
				href={resolve('/about')}
				class="inline-block px-[22px] py-[15px] text-[16px] font-bold tracking-tight whitespace-nowrap text-white hover:bg-white/10"
			>
				회사소개
			</a>

			<!-- 고객센터 드롭다운 (상품 드롭다운과 동일한 순수 래퍼) -->
			<!-- svelte-ignore a11y_no_static_element_interactions -->
			<div
				class="relative"
				onmouseenter={() => (openMenu = 'support')}
				onmouseleave={() => {
					if (openMenu === 'support') openMenu = null;
				}}
				onfocusin={() => (openMenu = 'support')}
				onfocusout={(e) => handleFocusOut(e, 'support')}
				onkeydown={handleKeydown}
			>
				<a
					href={resolve('/notice')}
					aria-haspopup="true"
					aria-expanded={openMenu === 'support'}
					class="inline-block px-[22px] py-[15px] text-[16px] font-bold tracking-tight whitespace-nowrap text-white hover:bg-white/10"
				>
					고객센터 ▾
				</a>
				{#if openMenu === 'support'}
					<div
						class="absolute top-full left-0 z-[60] min-w-[182px] rounded-b-[10px] border border-t-0 border-line bg-surface py-1.5 shadow-[0_12px_26px_rgba(20,27,43,0.16)]"
					>
						<a
							href={resolve('/notice')}
							class="block px-5 py-[11px] text-[15px] font-semibold text-ink hover:bg-navy-tint"
						>
							공지사항
						</a>
						<a
							href={resolve('/inquiry')}
							class="block px-5 py-[11px] text-[15px] font-semibold text-ink hover:bg-navy-tint"
						>
							문의하기
						</a>
						<a
							href={resolve('/archive')}
							class="block px-5 py-[11px] text-[15px] font-semibold text-ink hover:bg-navy-tint"
						>
							자료실
						</a>
					</div>
				{/if}
			</div>
		</div>

		<a
			href={resolve('/inquiry?type=quote')}
			class="inline-flex items-center gap-[7px] rounded-lg bg-yellow px-[18px] py-[10px] text-[15px] font-extrabold text-navy hover:bg-yellow-hover"
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
				<path
					d="M6.5 4h3l1.5 4-2 1.5a11 11 0 0 0 5 5l1.5-2 4 1.5v3a2 2 0 0 1-2 2A16 16 0 0 1 4.5 6a2 2 0 0 1 2-2z"
				/>
			</svg>
			시공·견적 문의
		</a>
	</div>
</nav>
