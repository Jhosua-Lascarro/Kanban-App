export interface Lead {
	id: number;
	name: string;
	expected_revenue: number;
	contact_name: string;
	email_from: string;
	phone: string;
	user_id: [number, string] | false;
	date_deadline: string;
	tag_ids: number[];
	description: string;
}

export interface LeadFormData {
	name: string;
	contact_name?: string;
	email_from?: string;
	phone?: string;
	expected_revenue?: number;
	date_deadline?: string;
	description?: string;
	stage_id?: number;
}
