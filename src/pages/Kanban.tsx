import { useState, useEffect, useCallback, useRef } from "react";
import {
	DndContext,
	DragOverlay,
	PointerSensor,
	KeyboardSensor,
	closestCorners,
	useSensor,
	useSensors,
	type DragStartEvent,
	type DragOverEvent,
	type DragEndEvent,
} from "@dnd-kit/core";
import { arrayMove, sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { STAGES } from "../config";
import { useAuth } from "../store/auth";
import type { Lead, LeadFormData } from "../types";
import {
	getLeadsByStage,
	createLead,
	updateLead,
	deleteLead,
} from "../api/leads";
import KanbanColumn from "../components/KanbanColumn";
import LeadModal from "../components/LeadModal";

type ColumnLeads = Record<number, Lead[]>;

const COLUMN_PREFIX = "col-";
const LEAD_PREFIX = "lead-";

function parseColumnId(id: unknown): number | null {
	if (typeof id !== "string" || !id.startsWith(COLUMN_PREFIX)) return null;
	const value = Number(id.slice(COLUMN_PREFIX.length));
	return Number.isFinite(value) ? value : null;
}

function parseLeadId(id: unknown): number | null {
	if (typeof id !== "string" || !id.startsWith(LEAD_PREFIX)) return null;
	const value = Number(id.slice(LEAD_PREFIX.length));
	return Number.isFinite(value) ? value : null;
}

interface ModalState {
	open: boolean;
	lead?: Lead | null;
	defaultStageId?: number;
}

export default function Kanban() {
	const { logout } = useAuth();
	const [columns, setColumns] = useState<ColumnLeads>({});
	const columnsRef = useRef<ColumnLeads>({});
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [modal, setModal] = useState<ModalState>({ open: false });
	const [deleteTarget, setDeleteTarget] = useState<Lead | null>(null);
	const [activeId, setActiveId] = useState<number | null>(null);
	const originalStageIdRef = useRef<number | null>(null);

	// Keep ref in sync so drag handlers always read the latest state
	// without relying on the closed-over `columns` value.
	useEffect(() => {
		columnsRef.current = columns;
	}, [columns]);

	const sensors = useSensors(
		useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
		useSensor(KeyboardSensor, {
			coordinateGetter: sortableKeyboardCoordinates,
		}),
	);

	const loadAll = useCallback(async () => {
		setLoading(true);
		setError(null);
		try {
			const results = await Promise.all(
				STAGES.map((s) => getLeadsByStage(s.name)),
			);
			const map: ColumnLeads = {};
			STAGES.forEach((s, i) => {
				map[s.stageId] = results[i];
			});
			setColumns(map);
		} catch (e) {
			console.error(e);
			setError(e instanceof Error ? e.message : String(e));
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => {
		loadAll();
	}, [loadAll]);

	function findStageIdOfLead(
		leadId: number,
		cols?: ColumnLeads,
	): number | null {
		const source = cols ?? columnsRef.current;
		for (const [stageId, leads] of Object.entries(source)) {
			if (leads.some((l) => l.id === leadId)) return Number(stageId);
		}
		return null;
	}

	function findLeadById(id: number): Lead | undefined {
		for (const leads of Object.values(columnsRef.current)) {
			const found = leads.find((l) => l.id === id);
			if (found) return found;
		}
	}

	function handleDragStart({ active }: DragStartEvent) {
		const id = parseLeadId(active.id);
		if (id === null) return;
		setActiveId(id);
		// Read from ref so we always get the freshest state
		originalStageIdRef.current = findStageIdOfLead(id, columnsRef.current);
	}

	function handleDragOver({ active, over }: DragOverEvent) {
		if (!over) return;

		const activeId = parseLeadId(active.id);
		if (activeId === null) return;

		const overColumnId = parseColumnId(over.id);
		const overLeadId = parseLeadId(over.id);
		if (overColumnId === null && overLeadId === null) return;

		setColumns((prev) => {
			const fromStageId = findStageIdOfLead(activeId, prev);
			if (fromStageId === null) return prev;

			const toStageId =
				overColumnId ??
				(overLeadId !== null ? findStageIdOfLead(overLeadId, prev) : null);

			if (toStageId === null) return prev;

			if (fromStageId === toStageId) return prev;

			const fromCol = [...(prev[fromStageId] ?? [])];
			const toCol = [...(prev[toStageId] ?? [])];

			const leadIdx = fromCol.findIndex((l) => l.id === activeId);
			if (leadIdx === -1) return prev;
			const [lead] = fromCol.splice(leadIdx, 1);

			const overCardIdx =
				overLeadId !== null ? toCol.findIndex((l) => l.id === overLeadId) : -1;
			if (overCardIdx !== -1) {
				toCol.splice(overCardIdx, 0, lead);
			} else {
				toCol.push(lead);
			}

			return { ...prev, [fromStageId]: fromCol, [toStageId]: toCol };
		});
	}

	async function handleDragEnd({ active, over }: DragEndEvent) {
		const id = parseLeadId(active.id);
		const origStage = originalStageIdRef.current;

		setActiveId(null);
		originalStageIdRef.current = null;

		if (id === null) return;

		if (!over) {
			loadAll();
			return;
		}

		const overLeadId = parseLeadId(over.id);

		// Use ref snapshot — avoids stale-closure reading an outdated `columns`
		const currentStageId = findStageIdOfLead(id, columnsRef.current);
		if (currentStageId === null) return;

		if (origStage !== null && origStage !== currentStageId) {
			// Cross-column: onDragOver already moved it visually, persist to API
			try {
				await updateLead(id, { stage_id: currentStageId });
			} catch (e) {
				console.error("Failed to update stage", e);
				loadAll();
			}
		} else {
			// Same column: reorder
			if (overLeadId === null) return;
			setColumns((prev) => {
				const col = [...(prev[currentStageId] ?? [])];
				const oldIdx = col.findIndex((l) => l.id === id);
				const newIdx = col.findIndex((l) => l.id === overLeadId);
				if (oldIdx === -1 || newIdx === -1 || oldIdx === newIdx) return prev;
				return { ...prev, [currentStageId]: arrayMove(col, oldIdx, newIdx) };
			});
		}
	}

	function handleDragCancel() {
		setActiveId(null);
		originalStageIdRef.current = null;
		loadAll();
	}

	function openCreate(stageId: number) {
		setModal({ open: true, lead: null, defaultStageId: stageId });
	}

	function openEdit(lead: Lead) {
		setModal({ open: true, lead });
	}

	function closeModal() {
		setModal({ open: false });
	}

	async function handleSave(data: LeadFormData) {
		if (modal.lead) {
			await updateLead(modal.lead.id, data);
		} else {
			await createLead({ ...data, stage_id: modal.defaultStageId });
		}
		closeModal();
		await loadAll();
	}

	function openDeleteModal(lead: Lead) {
		setDeleteTarget(lead);
	}

	function closeDeleteModal() {
		setDeleteTarget(null);
	}

	async function confirmDelete() {
		if (!deleteTarget) return;
		const id = deleteTarget.id;
		setDeleteTarget(null);
		await deleteLead(id);
		setColumns((prev) => {
			const next = { ...prev };
			for (const sid of Object.keys(next)) {
				next[Number(sid)] = next[Number(sid)].filter((l) => l.id !== id);
			}
			return next;
		});
	}

	return (
		<div className="min-h-screen flex flex-col">
			{/* Header */}
			<header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
				<h1 className="text-sm font-semibold tracking-wide text-gray-800 uppercase">
					Kanban
				</h1>
				<button
					type="button"
					onClick={logout}
					className="text-sm px-3 py-1.5 rounded-md border border-gray-200 text-gray-600 hover:bg-gray-50 hover:text-gray-800 transition-colors cursor-pointer"
				>
					Logout
				</button>
			</header>

			{/* Board */}
			<main className="flex-1 overflow-x-auto px-6 py-6 bg-gray-100">
				{loading ? (
					<p className="text-sm text-gray-400">Loading…</p>
				) : error ? (
					<div className="flex flex-col items-start gap-2">
						<p className="text-sm text-red-500 font-medium">
							Error loading leads: {error}
						</p>
						<button
							type="button"
							onClick={loadAll}
							className="text-sm text-blue-500 hover:text-blue-700 underline cursor-pointer"
						>
							Retry
						</button>
					</div>
				) : (
					<DndContext
						collisionDetection={closestCorners}
						sensors={sensors}
						onDragStart={handleDragStart}
						onDragOver={handleDragOver}
						onDragEnd={handleDragEnd}
						onDragCancel={handleDragCancel}
					>
						<div className="flex gap-4 items-start pb-1">
							{STAGES.map((stage) => (
								<KanbanColumn
									key={stage.stageId}
									stageId={stage.stageId}
									title={stage.name}
									leads={columns[stage.stageId] ?? []}
									onEdit={openEdit}
									onDelete={openDeleteModal}
									onAddLead={openCreate}
								/>
							))}
						</div>

						<DragOverlay dropAnimation={null}>
							{activeId !== null
								? (() => {
										const lead = findLeadById(activeId);
										return lead ? (
											<div className="bg-white border border-gray-200 rounded-lg p-3.5 shadow-xl w-72 flex flex-col gap-1 rotate-1 opacity-95">
												<p className="text-sm font-medium leading-tight text-gray-900">
													{lead.name}
												</p>
												{lead.contact_name && (
													<p className="text-xs text-gray-500">
														{lead.contact_name}
													</p>
												)}
												{lead.expected_revenue > 0 && (
													<p className="text-xs text-gray-700">
														${lead.expected_revenue.toLocaleString()}
													</p>
												)}
											</div>
										) : null;
									})()
								: null}
						</DragOverlay>
					</DndContext>
				)}
			</main>

			{modal.open && (
				<LeadModal
					lead={modal.lead}
					defaultStageId={modal.defaultStageId}
					onSave={handleSave}
					onClose={closeModal}
				/>
			)}

			{deleteTarget && (
				<div
					className="fixed inset-0 bg-black/30 flex items-center justify-center z-50"
					onMouseDown={closeDeleteModal}
				>
					<div
						className="bg-white rounded-xl p-6 w-full max-w-sm flex flex-col gap-4 shadow-xl"
						onMouseDown={(e) => e.stopPropagation()}
					>
						<h2 className="text-lg font-semibold text-gray-900">Delete lead</h2>
						<p className="text-sm text-gray-600">
							Are you sure you want to delete{" "}
							<span className="font-medium text-gray-800">
								{deleteTarget.name}
							</span>
							?
						</p>

						<div className="flex justify-end gap-2">
							<button
								type="button"
								onClick={closeDeleteModal}
								className="text-sm px-4 py-2 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
							>
								Cancel
							</button>
							<button
								type="button"
								onClick={confirmDelete}
								className="text-sm px-4 py-2 rounded-md bg-red-600 text-white hover:bg-red-700 transition-colors cursor-pointer"
							>
								Delete
							</button>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
