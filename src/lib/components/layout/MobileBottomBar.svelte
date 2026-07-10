<script lang="ts">
	/**
	 * tb(820px) 미만 전용 하단 고정 바. 높이 66px, 4칸(전화하기/메뉴/내정보/장바구니).
	 * 터치 타깃 44px 이상 확보. "메뉴"는 MobileDrawer 를 여는 콜백을 호출한다(부모가 open 상태 소유).
	 * "내정보" 탭은 /mypage 하위 라우트에 있을 때 활성(navy-tint 배경) 표시된다.
	 */
	import { page } from '$app/state';
	import { resolve } from '$app/paths';

	let {
		tel = '010-4055-3338',
		onMenuClick
	}: {
		tel?: string;
		onMenuClick: () => void;
	} = $props();

	const mypageActive = $derived(page.url.pathname.startsWith('/mypage'));
</script>

<div
	class="fixed inset-x-0 bottom-0 z-50 grid h-[66px] grid-cols-4 border-t border-line-2 bg-surface shadow-[0_-2px_12px_rgba(20,27,43,0.08)] tb:hidden"
>
	<a
		href="tel:{tel}"
		class="flex flex-col items-center justify-center gap-1 bg-yellow"
		aria-label="전화하기 {tel}"
	>
		<svg
			width="21"
			height="21"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			stroke-width="1.9"
			stroke-linecap="round"
			stroke-linejoin="round"
			class="text-navy"
			aria-hidden="true"
		>
			<path
				d="M6.5 4h3l1.5 4-2 1.5a11 11 0 0 0 5 5l1.5-2 4 1.5v3a2 2 0 0 1-2 2A16 16 0 0 1 4.5 6a2 2 0 0 1 2-2z"
			/>
		</svg>
		<span class="text-[11.5px] font-extrabold text-navy">전화하기</span>
	</a>

	<button
		type="button"
		class="flex flex-col items-center justify-center gap-1"
		aria-label="전체 메뉴 열기"
		onclick={onMenuClick}
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
			<path d="M4 7h16M4 12h16M4 17h16" />
		</svg>
		<span class="text-[11.5px] font-bold text-navy">메뉴</span>
	</button>

	<a
		href={resolve('/mypage')}
		class="flex flex-col items-center justify-center gap-1 {mypageActive ? 'bg-navy-tint' : ''}"
		aria-label="내정보"
		aria-current={mypageActive ? 'page' : undefined}
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
			<circle cx="12" cy="8" r="3.2" />
			<path d="M5.5 20a6.5 6.5 0 0 1 13 0" />
		</svg>
		<span class="text-[11.5px] font-bold text-navy">내정보</span>
	</a>

	<a
		href={resolve('/cart')}
		class="flex flex-col items-center justify-center gap-1"
		aria-label="장바구니"
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
		<span class="text-[11.5px] font-bold text-navy">장바구니</span>
	</a>
</div>
