<script lang="ts">
	/**
	 * 관리자 셸: 좌측 다크 네이비 사이드바 + 상단바 + 콘텐츠(bg-admin).
	 * tb(820px) 미만에서는 사이드바가 상단 가로 스크롤 내비로 접힌다.
	 * role 검증은 +layout.server.ts 가 서버에서 수행(프론트 가드만으로 처리 금지 규칙).
	 */
	import { enhance } from '$app/forms';
	import { page } from '$app/state';
	import { resolve } from '$app/paths';
	import type { LayoutProps } from './$types';

	let { data, children }: LayoutProps = $props();

	const navItems = [
		{ href: '/admin', label: '대시보드' },
		{ href: '/admin/products', label: '상품' },
		{ href: '/admin/categories', label: '카테고리' },
		{ href: '/admin/orders', label: '주문' },
		{ href: '/admin/members', label: '회원' },
		{ href: '/admin/boards', label: '게시판' },
		{ href: '/admin/banners', label: '배너' },
		{ href: '/admin/settings', label: '설정' }
	] as const;

	function isActive(href: string): boolean {
		if (href === '/admin') return page.url.pathname === '/admin';
		return page.url.pathname === href || page.url.pathname.startsWith(`${href}/`);
	}
</script>

<div class="flex min-h-dvh flex-col bg-admin tb:flex-row">
	<!-- 사이드바 -->
	<aside class="w-full shrink-0 bg-navy-dark tb:sticky tb:top-0 tb:h-dvh tb:w-64">
		<div class="flex items-center gap-3 border-b border-white/10 px-5 py-4 tb:px-6 tb:py-6">
			<span
				class="flex h-10 w-10 flex-none rotate-45 items-center justify-center rounded-md bg-yellow"
			>
				<span class="-rotate-45 text-[13px] font-black text-navy">탄탄</span>
			</span>
			<div class="min-w-0 leading-tight">
				<p class="truncate text-[16px] font-black text-white">탄탄 관리자</p>
				<p class="text-[11.5px] font-semibold text-footer-text">ADMIN CONSOLE</p>
			</div>
		</div>

		<nav
			aria-label="관리자 메뉴"
			class="flex gap-1 overflow-x-auto px-2 py-2 tb:flex-col tb:overflow-visible tb:px-3 tb:py-3"
		>
			{#each navItems as item (item.href)}
				<a
					href={resolve(item.href)}
					aria-current={isActive(item.href) ? 'page' : undefined}
					class="shrink-0 rounded-lg px-4 py-3 text-[15px] font-extrabold whitespace-nowrap tb:w-full tb:px-4 tb:py-[14px] tb:text-[16px] {isActive(
						item.href
					)
						? 'bg-white/10 text-white'
						: 'text-footer-text hover:bg-white/5 hover:text-white'}"
				>
					{item.label}
				</a>
			{/each}
		</nav>
	</aside>

	<!-- 콘텐츠 -->
	<div class="flex min-w-0 flex-1 flex-col">
		<div
			class="flex items-center justify-end gap-4 border-b border-line bg-surface px-5 py-3 tb:px-8 tb:py-4"
		>
			{#if data.name}
				<span class="hidden text-[14px] font-bold text-ink tb:inline">{data.name} 님</span>
			{/if}
			<a
				href={resolve('/')}
				class="text-[14px] font-bold text-sub hover:text-navy"
				aria-label="쇼핑몰 홈으로 이동"
			>
				쇼핑몰로 이동 ↗
			</a>
			<form method="POST" action="/admin?/logout" use:enhance>
				<button
					type="submit"
					class="min-h-11 rounded-lg border border-line-2 px-4 py-2 text-[14px] font-extrabold text-ink hover:bg-bg"
				>
					로그아웃
				</button>
			</form>
		</div>

		<main class="flex-1 px-5 py-6 tb:px-8 tb:py-8">
			{@render children()}
		</main>
	</div>
</div>
