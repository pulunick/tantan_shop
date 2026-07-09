<script lang="ts">
	import { resolve } from '$app/paths';
	import type { CompanyInfo } from './types';

	let {
		company = {
			name: '탄탄',
			ceo: '',
			tel: '010-4055-3338',
			biz_no: '',
			address: ''
		}
	}: { company?: CompanyInfo } = $props();
</script>

<footer class="mt-14 bg-navy-dark text-footer-text">
	<div class="mx-auto grid max-w-[1200px] gap-8 px-6 py-10 tb:grid-cols-[1.5fr_1fr_1fr]">
		<div>
			<div class="mb-4 flex items-center gap-[11px]">
				<span
					class="flex h-[38px] w-[38px] rotate-45 items-center justify-center rounded-[5px] bg-yellow"
				>
					<span class="-rotate-45 text-[12px] font-black text-navy">탄탄</span>
				</span>
				<span class="text-[18px] font-black tracking-tight text-white">탄탄 편의시설</span>
			</div>
			<div class="text-[13.5px] leading-loose">
				상호 <span class="text-white">{company.name}</span>
				{#if company.ceo}
					&nbsp;·&nbsp; 대표 <span class="text-white">{company.ceo}</span>
				{/if}
				<br />
				{#if company.biz_no}
					사업자등록번호 <span class="text-white">{company.biz_no}</span>
					<br />
				{/if}
				{#if company.address}
					{company.address}
					<br />
				{/if}
				대표번호 <span class="text-white">{company.tel}</span>
			</div>
			<div class="mt-4 flex items-center gap-3.5 text-[13.5px] font-semibold">
				<a href={resolve('/terms')} class="text-white hover:text-white">이용약관</a>
				<span class="text-footer-text/50" aria-hidden="true">|</span>
				<a href={resolve('/privacy')} class="text-white hover:text-white">개인정보처리방침</a>
			</div>
		</div>

		<div>
			<div class="mb-3.5 text-[14px] font-extrabold text-white">바로가기</div>
			<div class="grid gap-2 text-[13.5px]">
				<a href={resolve('/about')} class="hover:text-white">회사소개</a>
				<a href={resolve('/products')} class="hover:text-white">상품 전체보기</a>
				<a href={resolve('/cases')} class="hover:text-white">시공사례</a>
				<a href={resolve('/notice')} class="hover:text-white">공지사항</a>
				<a href={resolve('/inquiry')} class="hover:text-white">온라인 문의</a>
			</div>
		</div>

		<div>
			<div class="mb-3.5 text-[14px] font-extrabold text-white">고객센터</div>
			<div class="text-[13.5px] leading-relaxed">
				<a href="tel:{company.tel}" class="font-bold text-white hover:text-yellow">{company.tel}</a>
				<div class="mt-1">평일 09:00 – 18:00</div>
				<div>토요일 09:00 – 12:00</div>
				<div>일요일 · 공휴일 휴무</div>
			</div>
		</div>
	</div>
	<div class="border-t border-white/10">
		<div class="mx-auto max-w-[1200px] px-6 py-4 text-[12.5px] text-sub">
			© 2026 {company.name || '탄탄'} 편의시설. All rights reserved.
		</div>
	</div>
</footer>
