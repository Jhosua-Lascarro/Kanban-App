import {
	createContext,
	useContext,
	useState,
	useCallback,
	type ReactNode,
} from "react";
import { clearToken, getToken } from "../api/client";
import { login as apiLogin } from "../api/auth";

interface AuthState {
	token: string | null;
	isAdmin: boolean;
	userId: number | null;
}

interface AuthContextValue extends AuthState {
	login: (username: string, password: string) => Promise<void>;
	logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function decodeToken(token: string): {
	isAdmin: boolean;
	userId: number | null;
} {
	try {
		const payload = JSON.parse(atob(token.split(".")[1]));
		return { isAdmin: !!payload.is_admin, userId: payload.user_id ?? null };
	} catch {
		return { isAdmin: false, userId: null };
	}
}

function initialState(): AuthState {
	const token = getToken();
	if (!token) return { token: null, isAdmin: false, userId: null };
	const { isAdmin, userId } = decodeToken(token);
	return { token, isAdmin, userId };
}

export function AuthProvider({ children }: { children: ReactNode }) {
	const [state, setState] = useState<AuthState>(initialState);

	const login = useCallback(async (username: string, password: string) => {
		await apiLogin(username, password);
		const token = getToken();
		if (!token) {
			throw new Error("Token was not saved after login");
		}
		const { isAdmin, userId } = decodeToken(token);
		setState({ token, isAdmin, userId });
	}, []);

	const logout = useCallback(() => {
		clearToken();
		setState({ token: null, isAdmin: false, userId: null });
	}, []);

	return (
		<AuthContext.Provider value={{ ...state, login, logout }}>
			{children}
		</AuthContext.Provider>
	);
}

export function useAuth(): AuthContextValue {
	const ctx = useContext(AuthContext);
	if (!ctx) throw new Error("useAuth must be inside AuthProvider");
	return ctx;
}
