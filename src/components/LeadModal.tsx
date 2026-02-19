import { useState, useEffect, type FormEvent } from "react";
import type { Lead, LeadFormData } from "../types";

interface Props {
	lead?: Lead | null;
	defaultStageId?: number;
	onSave: (data: LeadFormData) => Promise<void>;
	onClose: () => void;
}

const empty = (): LeadFormData => ({
	name: "",
	contact_name: "",
	email_from: "",
	phone: "",
	expected_revenue: undefined,
	date_deadline: "",
	description: "",
});

// Función para limpiar HTML problemático de la descripción
function cleanDescription(text: string): string {
	if (!text) return "";
	// Remover todas las etiquetas HTML
	return text.replace(/<[^>]*>/g, "").trim();
}

export default function LeadModal({
	lead,
	defaultStageId,
	onSave,
	onClose,
}: Props) {
	const [form, setForm] = useState<LeadFormData>(empty);
	const [error, setError] = useState<string | null>(null);
	const [saving, setSaving] = useState(false);

	useEffect(() => {
		if (lead) {
			setForm({
				name: lead.name ?? "",
				contact_name: lead.contact_name ?? "",
				email_from: lead.email_from ?? "",
				phone: lead.phone ?? "",
				expected_revenue: lead.expected_revenue || undefined,
				date_deadline: lead.date_deadline ?? "",
				description: cleanDescription(lead.description ?? ""),
			});
		} else {
			setForm({ ...empty(), stage_id: defaultStageId });
		}
	}, [lead, defaultStageId]);

	function set(key: keyof LeadFormData, value: string | number) {
		setForm((f) => ({ ...f, [key]: value }));
	}

	async function handleSubmit(e: FormEvent) {
		e.preventDefault();
		setError(null);
		setSaving(true);
		try {
			await onSave(form);
		} catch (err) {
			setError(err instanceof Error ? err.message : "Error saving lead");
		} finally {
			setSaving(false);
		}
	}

	return (
		<div
			className="fixed inset-0 bg-black/30 flex items-center justify-center z-50"
			onMouseDown={onClose}
		>
			<div
				className="bg-white rounded-xl p-6 w-full max-w-md flex flex-col gap-4 shadow-xl"
				onMouseDown={(e) => e.stopPropagation()}
			>
				<h2 className="text-lg font-semibold">
					{lead ? "Edit Lead" : "New Lead"}
				</h2>

				<form onSubmit={handleSubmit} className="flex flex-col gap-3">
					<Field label="Title *" required>
						<input
							type="text"
							required
							value={form.name}
							onChange={(e) => set("name", e.target.value)}
							className={inputCls}
						/>
					</Field>
					<div className="grid grid-cols-2 gap-3">
						<Field label="Contact name">
							<input
								type="text"
								value={form.contact_name ?? ""}
								onChange={(e) => set("contact_name", e.target.value)}
								className={inputCls}
							/>
						</Field>
						<Field label="Phone">
							<input
								type="tel"
								value={form.phone ?? ""}
								onChange={(e) => set("phone", e.target.value)}
								className={inputCls}
							/>
						</Field>
					</div>
					<Field label="Email">
						<input
							type="email"
							value={form.email_from ?? ""}
							onChange={(e) => set("email_from", e.target.value)}
							className={inputCls}
						/>
					</Field>
					<div className="grid grid-cols-2 gap-3">
						<Field label="Expected revenue">
							<input
								type="number"
								min="0"
								step="0.01"
								value={form.expected_revenue ?? ""}
								onChange={(e) => {
									const value = Number.parseFloat(e.target.value);
									if (
										e.target.value === "" ||
										(value >= 0 && !Number.isNaN(value))
									) {
										set(
											"expected_revenue",
											e.target.value === "" ? undefined : value,
										);
									}
								}}
								className={inputCls}
							/>
						</Field>
						<Field label="Deadline">
							<input
								type="date"
								value={form.date_deadline ?? ""}
								onChange={(e) => set("date_deadline", e.target.value)}
								className={inputCls}
							/>
						</Field>
					</div>
					<Field label="Description">
						<textarea
							value={form.description ?? ""}
							onChange={(e) => set("description", e.target.value)}
							rows={3}
							className={`${inputCls} resize-none`}
						/>
					</Field>

					{error && <p className="text-sm text-red-600">{error}</p>}

					<div className="flex justify-end gap-2 mt-1">
						<button
							type="button"
							onClick={onClose}
							className="text-sm px-4 py-2 rounded border border-gray-300 hover:bg-gray-50 cursor-pointer"
						>
							Cancel
						</button>
						<button
							type="submit"
							disabled={saving}
							className="text-sm px-4 py-2 rounded bg-gray-900 text-white hover:bg-gray-700 disabled:opacity-50 cursor-pointer"
						>
							{saving ? "Saving…" : "Save"}
						</button>
					</div>
				</form>
			</div>
		</div>
	);
}

const inputCls =
	"border border-gray-300 rounded-md px-2.5 py-1.5 text-sm w-full focus:outline-none focus:border-gray-500 transition-colors";

function Field({
	label,
	required,
	children,
}: {
	label: string;
	required?: boolean;
	children: React.ReactNode;
}) {
	return (
		<div className="flex flex-col gap-1">
			<span className="text-xs text-gray-600">
				{label}
				{required && <span className="text-red-500 ml-0.5">*</span>}
			</span>
			{children}
		</div>
	);
}
