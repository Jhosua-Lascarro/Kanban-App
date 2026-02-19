import { apiFetch } from "./client";
import type { Lead, LeadFormData } from "../types";

export async function getLeadsByStage(stage: string): Promise<Lead[]> {
	const response = await apiFetch(
		`/crm/leads?stage=${encodeURIComponent(stage)}`,
	);
	if (!response.ok) {
		const err = await response.json().catch(() => ({}));
		throw new Error(
			err.error ??
				`Failed to fetch leads for stage "${stage}" (HTTP ${response.status})`,
		);
	}
	return response.json();
}

export async function createLead(data: LeadFormData): Promise<{ id: number }> {
	const response = await apiFetch("/crm/leads", {
		method: "POST",
		body: JSON.stringify(data),
	});
	if (!response.ok) {
		const err = await response.json().catch(() => ({}));
		throw new Error(err.error ?? "Failed to create lead");
	}
	return response.json();
}

export async function updateLead(
	id: number,
	data: Partial<LeadFormData>,
): Promise<void> {
	const response = await apiFetch(`/crm/leads/${id}`, {
		method: "PUT",
		body: JSON.stringify(data),
	});
	if (!response.ok) {
		const err = await response.json().catch(() => ({}));
		throw new Error(err.error ?? "Failed to update lead");
	}
}

export async function deleteLead(id: number): Promise<void> {
	const response = await apiFetch(`/crm/leads/${id}`, { method: "DELETE" });
	if (!response.ok) {
		const err = await response.json().catch(() => ({}));
		throw new Error(err.error ?? "Failed to delete lead");
	}
}
