<script lang="ts">
	// 마이페이지 공통 레이아웃 — 사이드/탭 내비 + 콘텐츠 영역.
	// 사이트 공통 헤더/GNB/푸터는 이후 단계에서 구현(현재는 (shop) 그룹 전용).
	import { page } from '$app/state';
	import { resolve } from '$app/paths';
	import { enhance } from '$app/forms';
	import type { LayoutProps } from './$types';

	let { data, children }: LayoutProps = $props();

	const navItems = [
		{ href: '/mypage/orders', label: '주문내역' },
		{ href: '/mypage/addresses', label: '배송지' },
		{ href: '/mypage/profile', label: '정보수정' },
		{ href: '/mypage/inquiries', label: '내 문의' },
		{ href: '/mypage/withdraw', label: '회원탈퇴' }
	] as const;

	function isActive(href: string): boolean {
		return page.url.pathname === href || page.url.pathname.startsWith(`${href}/`);
	}
</script>

<div class="mx-auto max-w-[1200px] px-6 py-7">
	<div class="grid items-start gap-6 tb:grid-cols-[230px_1fr]">
		<aside class="overflow-hidden rounded-xl border border-line bg-surface tb:sticky tb:top-4">
			<div class="border-b border-line-2 px-[22px] py-5">
				<p class="text-base font-black text-ink">
					{data.profileName ? `${data.profileName} 님` : '회원 님'}
				</p>
				{#if data.email}
					<p class="mt-[3px] text-[13px] font-semibold text-sub">{data.email}</p>
				{/if}
			</div>
			<nav aria-label="마이페이지 메뉴" class="flex flex-col py-2 tb:py-0">
				{#each navItems as item (item.href)}
					<a
						href={resolve(item.href)}
						aria-current={isActive(item.href) ? 'page' : undefined}
						class="min-h-11 border-l-[3px] px-[22px] py-[13px] text-[15px] {isActive(item.href)
							? 'border-yellow bg-navy-tint font-extrabold text-navy'
							: 'border-transparent font-semibold text-ink hover:bg-bg'}"
					>
						{item.label}
					</a>
				{/each}
				<form method="POST" action="/logout" use:enhance class="border-t border-line-2">
					<button
						type="submit"
						class="min-h-11 w-full border-l-[3px] border-transparent px-[22px] py-[13px] text-left text-[15px] font-semibold text-sub hover:bg-bg hover:text-navy"
					>
						로그아웃
					</button>
				</form>
			</nav>
		</aside>

		<main>
			{@render children()}
		</main>
	</div>
</div>
