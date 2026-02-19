import { API_BASE_URL } from "../config";
import { saveToken } from "./client";

export interface LoginResponse {
	token: string;
}

export async function login(username: string, password: string): Promise<void> {
	const response = await fetch(`${API_BASE_URL}/login`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ username, api_key: password }),
	});

	if (!response.ok) {
		const data = await response.json().catch(() => ({}));
		throw new Error(data.error ?? "Login failed");
	}

	const data: LoginResponse = await response.json();
	saveToken(data.token);
}
