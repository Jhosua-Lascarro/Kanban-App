import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./store/auth";
import Login from "./pages/Login";
import Kanban from "./pages/Kanban";
import type { ReactNode } from "react";

function PrivateRoute({ children }: { children: ReactNode }) {
	const { token } = useAuth();
	return token ? <>{children}</> : <Navigate to="/login" replace />;
}

function AppRoutes() {
	const { token } = useAuth();
	return (
		<Routes>
			<Route
				path="/login"
				element={token ? <Navigate to="/" replace /> : <Login />}
			/>
			<Route
				path="/"
				element={
					<PrivateRoute>
						<Kanban />
					</PrivateRoute>
				}
			/>
			<Route path="*" element={<Navigate to="/" replace />} />
		</Routes>
	);
}

export default function App() {
	return (
		<AuthProvider>
			<BrowserRouter>
				<AppRoutes />
			</BrowserRouter>
		</AuthProvider>
	);
}
