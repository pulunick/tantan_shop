import { createClient } from '@supabase/supabase-js';
import { env as privateEnv } from '$env/dynamic/private';
import { env as publicEnv } from '$env/dynamic/public';

/**
 * 서버 전용 관리자 클라이언트 (secret 키 사용 → RLS 우회).
 *
 * ⚠️ 절대 클라이언트/브라우저 코드에서 import 하지 말 것.
 *    - 파일이 $lib/server 아래에 있어 SvelteKit 이 클라이언트 번들 유입을 차단한다.
 *    - SUPABASE_SECRET_KEY 는 PUBLIC_ 접두사가 없어 클라이언트로 노출되지 않는다.
 *
 * 용도: 가격 서버 재계산, 주문 생성, 상태 변경 등 RLS 밖의 신뢰된 서버 작업.
 * 일반 사용자 요청은 event.locals.supabase(publishable+RLS) 를 쓴다.
 */
export const supabaseAdmin = createClient(
	publicEnv.PUBLIC_SUPABASE_URL,
	privateEnv.SUPABASE_SECRET_KEY,
	{
		auth: {
			autoRefreshToken: false,
			persistSession: false
		}
	}
);
