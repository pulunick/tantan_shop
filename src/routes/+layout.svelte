<script lang="ts">
	import '../app.css';
	import favicon from '$lib/assets/favicon.svg';
	import { invalidate } from '$app/navigation';
	import { onMount } from 'svelte';
	import { syncLocalCartToServer } from '$lib/cart/sync';

	let { data, children } = $props();

	// 로그인/로그아웃/토큰 갱신 시 서버 로드를 무효화해 세션을 동기화
	onMount(() => {
		const { data: sub } = data.supabase.auth.onAuthStateChange((_event, newSession) => {
			if (newSession?.expires_at !== data.session?.expires_at) {
				invalidate('supabase:auth');
			}
		});
		return () => sub.subscription.unsubscribe();
	});

	// 로그인 상태가 되면(비회원→회원) 로컬 장바구니를 서버로 1회 병합
	let mergedForUser = $state<string | null>(null);
	$effect(() => {
		const uid = data.user?.id ?? null;
		if (uid && mergedForUser !== uid) {
			mergedForUser = uid;
			void syncLocalCartToServer(data.supabase, uid);
		}
	});
</script>

<svelte:head><link rel="icon" href={favicon} /></svelte:head>
{@render children()}
