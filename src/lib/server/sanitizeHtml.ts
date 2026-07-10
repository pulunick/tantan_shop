/**
 * 상품 상세설명(Tiptap 위지윅) 저장 전 서버측 HTML 정제.
 * admin 전용 입력이지만 계정 탈취 등에 대비해 XSS 방어를 저장 시점에 강제한다.
 * 허용 태그는 RichTextEditor.svelte 툴바가 실제로 생성하는 마크업(+ StarterKit 기본 노드)만 포함한다.
 */
import sanitizeHtml from 'sanitize-html';

const ALLOWED_TAGS = [
	'p',
	'h2',
	'h3',
	'strong',
	'em',
	's',
	'code',
	'pre',
	'ul',
	'ol',
	'li',
	'blockquote',
	'hr',
	'br',
	'img'
];

/** 상품 상세설명 HTML을 정제한다. script/style/이벤트 핸들러/알 수 없는 태그를 제거한다. */
export function sanitizeDescriptionHtml(html: string): string {
	return sanitizeHtml(html, {
		allowedTags: ALLOWED_TAGS,
		allowedAttributes: {
			img: ['src', 'alt']
		},
		allowedSchemesByTag: {
			img: ['http', 'https']
		},
		allowProtocolRelative: false,
		// 빈 태그(예: 빈 <p></p>)도 위지윅 편집 중 흔하므로 제거하지 않는다.
		nonTextTags: ['style', 'script', 'textarea', 'noscript']
	});
}
