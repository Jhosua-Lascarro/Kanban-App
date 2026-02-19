import { useDroppable } from "@dnd-kit/core";
import {
	SortableContext,
	verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import type { Lead } from "../types";
import KanbanCard from "./KanbanCard";

interface Props {
	stageId: number;
	title: string;
	leads: Lead[];
	onEdit: (lead: Lead) => void;
	onDelete: (lead: Lead) => void;
	onAddLead: (stageId: number) => void;
}

export default function KanbanColumn({
	stageId,
	title,
	leads,
	onEdit,
	onDelete,
	onAddLead,
}: Props) {
	const columnDndId = `col-${stageId}`;
	const { setNodeRef, isOver } = useDroppable({ id: columnDndId });

	return (
		<div className="flex flex-col w-72 shrink-0 bg-gray-50/70 border border-gray-200 rounded-xl p-2.5">
			<div className="flex items-center justify-between mb-2.5 px-1">
				<span className="text-sm font-semibold text-gray-700 tracking-wide">
					{title}
					<span className="ml-1.5 inline-flex items-center px-2 py-0.5 rounded-full bg-gray-200 text-[11px] font-medium text-gray-600">
						{leads.length}
					</span>
				</span>
				<button
					type="button"
					onClick={() => onAddLead(stageId)}
					className="text-xs text-gray-400 hover:text-gray-700 transition-colors cursor-pointer"
					title="Add lead"
				>
					+ Add
				</button>
			</div>

			<div
				ref={setNodeRef}
				className={`flex flex-col gap-2 min-h-24 p-2 rounded-lg border border-transparent transition-colors ${
					isOver ? "bg-blue-50 ring-2 ring-blue-200" : "bg-gray-100/90"
				}`}
			>
				<SortableContext
					items={leads.map((l) => `lead-${l.id}`)}
					strategy={verticalListSortingStrategy}
				>
					{leads.map((lead) => (
						<KanbanCard
							key={lead.id}
							lead={lead}
							onEdit={onEdit}
							onDelete={onDelete}
						/>
					))}
				</SortableContext>
			</div>
		</div>
	);
}
