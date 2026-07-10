import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { sanitizeDescriptionHtml } from '$lib/server/sanitizeHtml';

/**
 * 상품 상세설명(Tiptap HTML) 서버측 정제 엔드포인트.
 * ProductForm.svelte 는 브라우저 Supabase 클라이언트로 products 를 직접 저장하므로
 * (관리자 저장 흐름 — CLAUDE.md의 "주문 생성 서버 전용" 규칙과는 무관, products 는 admin RLS로 client write 허용),
 * 저장 직전 이 엔드포인트를 호출해 HTML을 정제한 뒤 그 결과만 저장한다.
 * 인증/인가: /admin/* 는 hooks.server.ts authGuard 에서 role=admin 을 이미 검증한다.
 */
export const POST: RequestHandler = async ({ request }) => {
	const body = await request.json().catch(() => null);
	const html = typeof body?.html === 'string' ? body.html : '';

	return json({ html: sanitizeDescriptionHtml(html) });
};
