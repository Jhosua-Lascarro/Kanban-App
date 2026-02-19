// Read configuration from Vite environment variables (VITE_...)
// Falls back to sensible defaults when env vars are missing/invalid.

type Stage = { name: string; stageId: number };
type StageLike = { name: unknown; stageId: unknown };

const FALLBACK_STAGES: Stage[] = [
	{ name: "New", stageId: 1 },
	{ name: "Qualified", stageId: 2 },
	{ name: "Proposition", stageId: 3 },
	{ name: "Won", stageId: 4 },
];

export const API_BASE_URL: string =
	import.meta.env.VITE_API_BASE_URL ?? "http://127.0.0.1:5000/api";

/**
 * VITE_STAGES must be a JSON array string, for example:
 *   [{"name":"New","stageId":1},{"name":"Qualified","stageId":2}]
 *
 * If parsing fails the code will fall back to `FALLBACK_STAGES`.
 */
function parseStages(raw?: string | undefined): Stage[] {
	if (!raw) return FALLBACK_STAGES;
	try {
		const parsed = JSON.parse(raw);
		if (!Array.isArray(parsed)) throw new Error("not an array");
		const ok = parsed.every((p: unknown) => {
			if (!p || typeof p !== "object") return false;
			const stage = p as StageLike;
			return (
				typeof stage.name === "string" &&
				(typeof stage.stageId === "number" || typeof stage.stageId === "string")
			);
		});
		if (!ok) throw new Error("invalid stage shape");
		return parsed.map((p: unknown) => {
			const stage = p as StageLike;
			return {
				name: String(stage.name),
				stageId: Number(stage.stageId),
			};
		});
	} catch (err) {
		console.warn("VITE_STAGES invalid — using fallback STAGES", err);
		return FALLBACK_STAGES;
	}
}

export const STAGES: Stage[] = parseStages(import.meta.env.VITE_STAGES);
