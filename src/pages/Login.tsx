import { useState, type FormEvent } from "react";
import { useAuth } from "../store/auth";

export default function Login() {
	const { login } = useAuth();
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [error, setError] = useState<string | null>(null);
	const [loading, setLoading] = useState(false);

	async function handleSubmit(e: FormEvent) {
		e.preventDefault();
		setError(null);
		setLoading(true);
		try {
			await login(email, password);
		} catch (err) {
			setError(err instanceof Error ? err.message : "Login failed");
		} finally {
			setLoading(false);
		}
	}

	return (
		<div className="min-h-screen flex items-center justify-center bg-gray-100">
			<div className="w-full max-w-sm bg-white border border-gray-200 rounded-xl shadow-sm px-8 py-10">
				<h1 className="text-xl font-semibold mb-7 text-gray-900">Sign in</h1>
				<form onSubmit={handleSubmit} className="flex flex-col gap-4">
					<div className="flex flex-col gap-1.5">
						<label className="text-sm text-gray-600" htmlFor="email">
							Email
						</label>
						<input
							id="email"
							type="email"
							autoComplete="email"
							required
							value={email}
							onChange={(e) => setEmail(e.target.value)}
							className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-gray-500 transition-colors"
						/>
					</div>

					<div className="flex flex-col gap-1.5">
						<label className="text-sm text-gray-600" htmlFor="password">
							Password
						</label>
						<input
							id="password"
							type="password"
							autoComplete="current-password"
							required
							value={password}
							onChange={(e) => setPassword(e.target.value)}
							className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-gray-500 transition-colors"
						/>
					</div>

					{error && <p className="text-sm text-red-600">{error}</p>}

					<button
						type="submit"
						disabled={loading}
						className="bg-gray-900 text-white rounded-md px-4 py-2 text-sm font-medium hover:bg-gray-700 transition-colors disabled:opacity-50 cursor-pointer"
					>
						{loading ? "Signing in…" : "Sign in"}
					</button>
				</form>
			</div>
		</div>
	);
}
