import { API_BASE_URL } from "../config";

const TOKEN_KEY = "kanban_token";

export function getToken(): string | null {
	return localStorage.getItem(TOKEN_KEY);
}

export function saveToken(token: string): void {
	localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken(): void {
	localStorage.removeItem(TOKEN_KEY);
}

type RequestOptions = Omit<RequestInit, "headers"> & {
	headers?: Record<string, string>;
};

export async function apiFetch(
	path: string,
	options: RequestOptions = {},
): Promise<Response> {
	const token = getToken();
	const headers: Record<string, string> = {
		"Content-Type": "application/json",
		...(options.headers ?? {}),
	};
	if (token) {
		headers.Authorization = `Bearer ${token}`;
	}

	const response = await fetch(`${API_BASE_URL}${path}`, {
		...options,
		headers,
	});

	if (response.status === 401) {
		clearToken();
		window.location.href = "/login";
	}

	return response;
}
