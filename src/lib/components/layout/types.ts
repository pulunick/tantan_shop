// 헤더/GNB/드로어/푸터가 공유하는 타입.
// categories 는 DB categories 테이블(공개 노출분), company 는 site_settings.value(jsonb) 를 매핑한다.

export type Category = {
	id: string;
	name: string;
	sort_order: number;
};

export type CompanyInfo = {
	name: string;
	ceo: string;
	tel: string;
	biz_no: string;
	address: string;
};
