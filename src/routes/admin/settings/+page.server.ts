import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

type CompanyInfo = { name: string; ceo: string; tel: string; biz_no: string; address: string };
type BankAccount = { bank: string; holder: string; number: string };
type Shipping = { notice: string };

const emptyCompany: CompanyInfo = { name: '', ceo: '', tel: '', biz_no: '', address: '' };
const emptyBank: BankAccount = { bank: '', holder: '', number: '' };
const emptyShipping: Shipping = { notice: '' };

/**
 * site_settings 3행(company/bank_account/shipping)을 읽어 폼 초기값으로 매핑한다.
 * 값이 아직 없으면 빈 기본값을 사용한다(하드코딩 금지 규칙 — 화면엔 항상 DB 값만 표시).
 */
export const load: PageServerLoad = async ({ locals: { supabase } }) => {
	const { data } = await supabase
		.from('site_settings')
		.select('key, value')
		.in('key', ['company', 'bank_account', 'shipping']);

	const map = new Map<string, Record<string, unknown>>((data ?? []).map((r) => [r.key, r.value]));

	return {
		company: { ...emptyCompany, ...(map.get('company') ?? {}) } as CompanyInfo,
		bankAccount: { ...emptyBank, ...(map.get('bank_account') ?? {}) } as BankAccount,
		shipping: { ...emptyShipping, ...(map.get('shipping') ?? {}) } as Shipping
	};
};

export const actions: Actions = {
	save: async ({ request, locals: { supabase } }) => {
		const fd = await request.formData();
		const str = (key: string) => String(fd.get(key) ?? '').trim();

		const company: CompanyInfo = {
			name: str('company_name'),
			ceo: str('company_ceo'),
			tel: str('company_tel'),
			biz_no: str('company_biz_no'),
			address: str('company_address')
		};
		const bank_account: BankAccount = {
			bank: str('bank_name'),
			holder: str('bank_holder'),
			number: str('bank_number')
		};
		const shipping: Shipping = { notice: str('shipping_notice') };

		if (!company.name || !company.tel) {
			return fail(400, { message: '회사명과 대표번호는 필수입니다.' });
		}
		if (!bank_account.bank || !bank_account.number) {
			return fail(400, { message: '입금 은행과 계좌번호는 필수입니다.' });
		}

		const { error } = await supabase.from('site_settings').upsert([
			{ key: 'company', value: company },
			{ key: 'bank_account', value: bank_account },
			{ key: 'shipping', value: shipping }
		]);

		if (error) return fail(500, { message: `저장에 실패했습니다: ${error.message}` });
		return { success: true };
	}
};
