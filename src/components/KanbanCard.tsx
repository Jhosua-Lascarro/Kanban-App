import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { Lead } from "../types";
import { useAuth } from "../store/auth";

interface Props {
	lead: Lead;
	onEdit: (lead: Lead) => void;
	onDelete: (lead: Lead) => void;
}

export default function KanbanCard({ lead, onEdit, onDelete }: Props) {
	const { isAdmin } = useAuth();
	const {
		attributes,
		listeners,
		setNodeRef,
		transform,
		transition,
		isDragging,
	} = useSortable({ id: `lead-${lead.id}` });

	const style = {
		transform: CSS.Transform.toString(transform),
		transition,
		opacity: isDragging ? 0.4 : 1,
	};

	return (
		<div
			ref={setNodeRef}
			style={style}
			{...attributes}
			{...listeners}
			className="bg-white border border-gray-200 rounded-lg p-3.5 flex flex-col gap-1 shadow-sm hover:shadow-md transition-shadow duration-150 cursor-grab active:cursor-grabbing select-none"
		>
			<p className="text-sm font-medium leading-tight text-gray-900">
				{lead.name}
			</p>
			{lead.contact_name && (
				<p className="text-xs text-gray-500">{lead.contact_name}</p>
			)}
			{lead.expected_revenue > 0 && (
				<p className="text-xs text-gray-700 font-medium">
					${lead.expected_revenue.toLocaleString()}
				</p>
			)}
			{lead.date_deadline && (
				<p className="text-xs text-gray-400">{lead.date_deadline}</p>
			)}
			<div
				className="flex gap-2 mt-1.5"
				onPointerDown={(e) => e.stopPropagation()}
			>
				<button
					type="button"
					onClick={() => onEdit(lead)}
					className="text-xs px-2 py-1 rounded-md border border-gray-200 text-gray-600 hover:bg-gray-50 hover:text-gray-800 transition-colors cursor-pointer"
				>
					Edit
				</button>
				{isAdmin && (
					<button
						type="button"
						onClick={() => onDelete(lead)}
						className="text-xs px-2 py-1 rounded-md border border-red-100 text-red-500 hover:bg-red-50 hover:text-red-600 transition-colors cursor-pointer"
					>
						Delete
					</button>
				)}
			</div>
		</div>
	);
}
