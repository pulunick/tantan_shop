/**
 * 게시글 본문(content_html) ↔ 일반 텍스트 변환 헬퍼.
 * 관리자는 줄바꿈 있는 일반 텍스트만 입력하고, 저장 시 문단(<p>)/줄바꿈(<br>)으로 감싼
 * content_html 을 만든다. 이 모듈이 만든 HTML 만 되돌릴 수 있음을 전제로 한다(비가역 파서 아님).
 * 공지/시공사례/자료실 관리 화면이 공유해서 쓴다.
 */

function escapeHtml(raw: string): string {
	return raw
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&#39;');
}

function unescapeHtml(raw: string): string {
	return raw
		.replace(/&lt;/g, '<')
		.replace(/&gt;/g, '>')
		.replace(/&quot;/g, '"')
		.replace(/&#39;/g, "'")
		.replace(/&amp;/g, '&');
}

/** 일반 텍스트 → content_html. 빈 입력이면 null. */
export function textToHtml(raw: string): string | null {
	const trimmed = raw.replace(/\r\n/g, '\n').trim();
	if (!trimmed) return null;

	const blocks = trimmed.split(/\n{2,}/);
	return blocks.map((block) => `<p>${escapeHtml(block).replace(/\n/g, '<br>')}</p>`).join('');
}

/** content_html(이 모듈이 생성한 형태) → 편집용 일반 텍스트. */
export function htmlToText(html: string | null): string {
	if (!html) return '';
	const paragraphs = [...html.matchAll(/<p>([\s\S]*?)<\/p>/g)].map((m) => m[1]);
	const source = paragraphs.length > 0 ? paragraphs : [html];
	return source.map((p) => unescapeHtml(p.replace(/<br\s*\/?>/g, '\n'))).join('\n\n');
}
