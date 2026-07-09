<script lang="ts">
	import Header from '$lib/components/layout/Header.svelte';
	import Gnb from '$lib/components/layout/Gnb.svelte';
	import MobileDrawer from '$lib/components/layout/MobileDrawer.svelte';
	import MobileBottomBar from '$lib/components/layout/MobileBottomBar.svelte';
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

	let drawerOpen = $state(false);
</script>

<div class="flex min-h-dvh flex-col pb-[66px] tb:pb-0">
	<Header {tel} />
	<Gnb {categories} />

	<main class="mx-auto w-full max-w-[1200px] flex-1 px-6 py-6">
		{@render children()}
	</main>

	<Footer {company} />
</div>

<MobileDrawer open={drawerOpen} onClose={() => (drawerOpen = false)} {categories} {tel} />
<MobileBottomBar {tel} onMenuClick={() => (drawerOpen = true)} />
