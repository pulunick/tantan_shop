<script lang="ts">
	/**
	 * 데스크톱 헤더 상단 2단(유틸바 + 메인바). 3번째 단(네이비 GNB)은 Gnb.svelte 가 별도로 담당.
	 * tb(820px) 미만에서는 유틸바/검색폼/전화버튼을 숨기고, 로고 + 검색아이콘 + 장바구니 아이콘만 남긴다.
	 * (모바일 전화 노출은 MobileBottomBar 가 담당 — 디자인 시스템 "전화 상시 노출" 규칙)
	 */
	import { resolve } from '$app/paths';
	import { enhance } from '$app/forms';

	let { tel = '010-4055-3338', loggedIn = false }: { tel?: string; loggedIn?: boolean } = $props();
</script>

<div class="border-b border-line bg-surface">
	<!-- 상단 유틸바 (데스크톱 전용) -->
	<div class="hidden bg-navy-dark tb:block">
		<div class="mx-auto flex max-w-[1200px] items-center justify-between px-6 py-[7px] text-[13px]">
			<span class="text-footer-text"
				>부산 장애인편의시설 · 안전용품 전문 &nbsp;|&nbsp; 제품 판매 및 시공</span
			>
			<nav aria-label="유틸리티 메뉴" class="flex items-center gap-[18px]">
				{#if loggedIn}
					<a href={resolve('/mypage/orders')} class="text-footer-text hover:text-white"
						>마이페이지</a
					>
					<form method="POST" action="/logout" use:enhance class="contents">
						<button type="submit" class="text-footer-text hover:text-white">로그아웃</button>
					</form>
				{:else}
					<a href={resolve('/login')} class="text-footer-text hover:text-white">로그인</a>
					<a href={resolve('/signup')} class="text-footer-text hover:text-white">회원가입</a>
					<a href={resolve('/mypage/orders')} class="text-footer-text hover:text-white">주문조회</a>
				{/if}
				<a href={resolve('/inquiry')} class="text-footer-text hover:text-white">고객센터</a>
			</nav>
		</div>
	</div>

	<!-- 메인바: 로고 + 검색 + 전화 + 장바구니 -->
	<header class="mx-auto flex max-w-[1200px] items-center gap-7 px-6 py-5">
		<a
			href={resolve('/')}
			class="flex flex-none items-center gap-3"
			aria-label="탄탄 편의시설 홈으로 이동"
		>
			<span
				class="flex h-[46px] w-[46px] rotate-45 items-center justify-center rounded-md bg-yellow"
			>
				<span class="-rotate-45 text-[15px] font-black tracking-tight text-navy">탄탄</span>
			</span>
			<span class="hidden flex-col leading-tight sm:flex">
				<span class="text-[22px] font-black tracking-tight text-navy">탄탄 편의시설</span>
				<span class="text-[11px] font-semibold tracking-wide text-sub"
					>TANTAN CONVENIENCE FACILITIES</span
				>
			</span>
		</a>

		<form action="/products" role="search" class="mx-auto hidden max-w-[520px] flex-1 tb:block">
			<div class="flex overflow-hidden rounded-[9px] border-2 border-navy">
				<label for="header-search" class="sr-only">상품 검색</label>
				<input
					id="header-search"
					name="q"
					type="search"
					placeholder="점자블럭, 카스토퍼, 안전손잡이 검색"
					class="flex-1 border-0 px-4 py-3 text-[15px] outline-none"
				/>
				<button
					type="submit"
					class="bg-navy px-[22px] text-[15px] font-bold text-white hover:bg-navy/90"
				>
					검색
				</button>
			</div>
		</form>

		<div class="ml-auto flex flex-none items-center gap-4">
			<a
				href="tel:{tel}"
				class="hidden items-center gap-[10px] rounded-[9px] bg-yellow px-4 py-[9px] font-extrabold text-navy hover:bg-yellow-hover tb:flex"
			>
				<span
					class="flex h-[30px] w-[30px] items-center justify-center rounded-full bg-navy text-white"
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
				</span>
				<span class="flex flex-col leading-tight">
					<span class="text-[10.5px] font-bold opacity-75">대표번호 · 시공문의</span>
					<span class="text-[18px] font-black tracking-tight">{tel}</span>
				</span>
			</a>

			<a
				href={resolve('/products')}
				aria-label="상품 검색"
				class="flex h-[42px] w-[42px] items-center justify-center rounded-[9px] border border-line-2 tb:hidden"
			>
				<svg
					width="20"
					height="20"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="1.9"
					stroke-linecap="round"
					stroke-linejoin="round"
					class="text-navy"
					aria-hidden="true"
				>
					<circle cx="10.5" cy="10.5" r="6" />
					<path d="M15 15l4.5 4.5" />
				</svg>
			</a>

			<a
				href={resolve('/cart')}
				aria-label="장바구니"
				class="flex h-[42px] w-[42px] items-center justify-center rounded-[9px] border border-line-2"
			>
				<svg
					width="21"
					height="21"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="1.8"
					stroke-linecap="round"
					stroke-linejoin="round"
					class="text-navy"
					aria-hidden="true"
				>
					<circle cx="9" cy="20" r="1.4" />
					<circle cx="17" cy="20" r="1.4" />
					<path d="M3 4h2.2l2.1 11h10l2-8H6" />
				</svg>
			</a>
		</div>
	</header>
</div>
