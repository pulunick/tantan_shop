<script lang="ts">
	// 그룹 공통 레이아웃 (헤더/푸터 등은 이후 단계에서 구현)
	let { children } = $props();
</script>

{@render children()}
