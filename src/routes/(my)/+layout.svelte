<script lang="ts">
	// 마이페이지 공통 레이아웃 — (shop)과 동일한 공통 셸(Header/Gnb/Footer/모바일바/드로어) +
	// 브레드크럼 + 좌측 메뉴(PC)/상단 pill 탭(모바일). 섹션 스위칭 상태 로직 없이 라우트 분리 유지.
	import { page } from '$app/state';
	import { resolve } from '$app/paths';
	import { enhance } from '$app/forms';
	import Header from '$lib/components/layout/Header.svelte';
	import Gnb from '$lib/components/layout/Gnb.svelte';
	import MobileDrawer from '$lib/components/layout/MobileDrawer.svelte';
	import MobileBottomBar from '$lib/components/layout/MobileBottomBar.svelte';
	import ScrollTopButton from '$lib/components/layout/ScrollTopButton.svelte';
	import Footer from '$lib/components/layout/Footer.svelte';
	import type { CompanyInfo } from '$lib/components/layout/types';
	import type { LayoutProps } from './$types';

	const DEFAULT_TEL = '010-4055-3338';
	const fallbackCompany: CompanyInfo = {
		name: '탄탄',
		ceo: '',
		tel: DEFAULT_TEL,
		biz_no: '',
		address: ''
	};

	let { data, children }: LayoutProps = $props();

	const categories = $derived(data.categories ?? []);
	const company = $derived(data.company ?? fallbackCompany);
	const tel = $derived(company.tel || DEFAULT_TEL);
	const loggedIn = $derived(!!data.session);

	let drawerOpen = $state(false);

	const navItems = $derived([
		{ href: '/mypage/orders', label: '주문내역', count: data.ordersCount },
		{ href: '/mypage/addresses', label: '배송지 관리', count: 0 },
		{ href: '/mypage/profile', label: '회원정보 수정', count: 0 },
		{ href: '/mypage/inquiries', label: '내 문의', count: data.inquiriesCount }
	] as const);

	const withdrawItem = { href: '/mypage/withdraw', label: '회원탈퇴', count: 0 } as const;

	const mobileTabItems = $derived([...navItems, withdrawItem]);

	function isActive(href: string): boolean {
		return page.url.pathname === href || page.url.pathname.startsWith(`${href}/`);
	}
</script>

<div class="flex min-h-dvh flex-col pb-[66px] tb:pb-0">
	<Header {tel} {loggedIn} />
	<Gnb {categories} />

	<main class="mx-auto w-full max-w-[1200px] flex-1 px-6 py-6">
		<!-- 브레드크럼 -->
		<div class="mb-4 flex flex-wrap items-center justify-between gap-3">
			<nav
				aria-label="현재 위치"
				class="flex items-center gap-2 text-[13.5px] font-semibold text-[#8a92a3]"
			>
				<a href={resolve('/')} class="text-[#8a92a3] hover:text-navy">홈</a>
				<span class="text-[#c3c9d4]" aria-hidden="true">›</span>
				<span class="font-bold text-navy">마이페이지</span>
			</nav>
			<a
				href={resolve('/products')}
				class="inline-flex min-h-11 items-center gap-[7px] rounded-[9px] border border-[#d7deea] bg-surface px-[14px] py-2 text-[14px] font-extrabold text-navy hover:bg-navy-tint"
			>
				<svg
					width="16"
					height="16"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="1.9"
					stroke-linecap="round"
					stroke-linejoin="round"
					aria-hidden="true"
				>
					<path d="M14 6l-6 6 6 6" />
				</svg>
				쇼핑 계속하기
			</a>
		</div>

		<!-- 모바일 상단 가로 스크롤 탭 (tb 미만) -->
		<div class="mb-4 flex gap-2 overflow-x-auto pb-1 tb:hidden">
			{#each mobileTabItems as item (item.href)}
				{@const active = isActive(item.href)}
				<a
					href={resolve(item.href)}
					aria-current={active ? 'page' : undefined}
					class="flex min-h-11 flex-none items-center rounded-[22px] border px-4 py-[10px] text-[14px] font-extrabold whitespace-nowrap {active
						? 'border-navy bg-navy text-white'
						: 'border-[#d7deea] bg-surface text-[#3a4252]'}"
				>
					{item.label}
				</a>
			{/each}
		</div>

		<div class="grid items-start gap-6 tb:grid-cols-[230px_1fr]">
			<!-- 좌측 메뉴 (PC) -->
			<aside
				class="hidden overflow-hidden rounded-[14px] border border-line bg-surface shadow-[0_4px_16px_rgba(20,27,43,.05)] tb:sticky tb:top-4 tb:block"
			>
				<div class="flex items-center gap-[11px] border-b border-line-2 px-[22px] py-[18px]">
					<span
						class="flex h-[42px] w-[42px] flex-none items-center justify-center rounded-full bg-navy-tint"
					>
						<svg
							width="22"
							height="22"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="1.8"
							stroke-linecap="round"
							stroke-linejoin="round"
							class="text-navy"
							aria-hidden="true"
						>
							<circle cx="12" cy="8" r="3.2" />
							<path d="M5.5 20a6.5 6.5 0 0 1 13 0" />
						</svg>
					</span>
					<div class="min-w-0">
						<p class="truncate text-[15.5px] font-black text-ink">
							{data.profileName ? `${data.profileName} 님` : '회원 님'}
						</p>
						{#if data.email}
							<p class="truncate text-[12.5px] font-semibold text-sub">{data.email}</p>
						{/if}
					</div>
				</div>

				<nav aria-label="마이페이지 메뉴" class="flex flex-col py-[6px]">
					{#each navItems as item (item.href)}
						{@const active = isActive(item.href)}
						<a
							href={resolve(item.href)}
							aria-current={active ? 'page' : undefined}
							class="flex min-h-11 items-center justify-between gap-2 border-l-[3px] px-[21px] py-[13px] text-[15px] {active
								? 'border-yellow bg-navy-tint font-extrabold text-navy'
								: 'border-transparent font-semibold text-[#3a4252] hover:bg-bg'}"
						>
							<span>{item.label}</span>
							{#if item.count > 0}
								<span
									class="flex h-[22px] min-w-[22px] items-center justify-center rounded-full px-[6px] text-[12px] font-extrabold {active
										? 'bg-navy text-white'
										: 'bg-[#e2e7ef] text-sub'}"
								>
									{item.count}
								</span>
							{/if}
						</a>
					{/each}
					<form method="POST" action="/logout" use:enhance class="border-t border-line-2">
						<button
							type="submit"
							class="min-h-11 w-full border-l-[3px] border-transparent px-[21px] py-[13px] text-left text-[15px] font-semibold text-sub hover:bg-bg hover:text-navy"
						>
							로그아웃
						</button>
					</form>
				</nav>

				<div class="border-t border-[#f2f4f7] px-[21px] py-3 pb-4">
					<a
						href={resolve(withdrawItem.href)}
						class="text-[12.5px] font-semibold text-[#a7adb9] underline underline-offset-[3px] hover:text-navy"
					>
						회원탈퇴
					</a>
				</div>
			</aside>

			<div class="min-w-0">
				{@render children()}
			</div>
		</div>
	</main>

	<Footer {company} />
</div>

<MobileDrawer open={drawerOpen} onClose={() => (drawerOpen = false)} {categories} {tel} />
<MobileBottomBar {tel} onMenuClick={() => (drawerOpen = true)} />
<ScrollTopButton />
