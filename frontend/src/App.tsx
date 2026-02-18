import { Routes, Route, Navigate, Link } from "react-router-dom";
import { auth } from "./api/client";
import { AuthProvider, useAuth } from "./context/AuthContext";
import CreateAccount from "./pages/CreateAccount";
import Login from "./pages/Login";
import OnboardingStep1 from "./pages/OnboardingStep1";
import OnboardingStep2 from "./pages/OnboardingStep2";
import Dashboard from "./pages/Dashboard";
import StrategyLibrary from "./pages/StrategyLibrary";
import Analytics from "./pages/Analytics";
import Settings from "./pages/Settings";
import ResetPassword from "./pages/ResetPassword";
import AppLayout from "./components/AppLayout";

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { token, loading } = useAuth();
  if (loading) return <div style={{ padding: 40, textAlign: "center" }}>Loading...</div>;
  if (!token) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<LandingOrApp />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<CreateAccount />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route
        path="/onboarding/1"
        element={
          <RequireAuth>
            <OnboardingStep1 />
          </RequireAuth>
        }
      />
      <Route
        path="/onboarding/2"
        element={
          <RequireAuth>
            <OnboardingStep2 />
          </RequireAuth>
        }
      />
      <Route
        path="/app"
        element={
          <RequireAuth>
            <AppLayout>
              <Dashboard />
            </AppLayout>
          </RequireAuth>
        }
      />
      <Route
        path="/app/strategy-library"
        element={
          <RequireAuth>
            <AppLayout>
              <StrategyLibrary />
            </AppLayout>
          </RequireAuth>
        }
      />
      <Route
        path="/app/analytics"
        element={
          <RequireAuth>
            <AppLayout>
              <Analytics />
            </AppLayout>
          </RequireAuth>
        }
      />
      <Route
        path="/app/settings"
        element={
          <RequireAuth>
            <AppLayout>
              <Settings />
            </AppLayout>
          </RequireAuth>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function ForgotPassword() {
  return (
    <div style={{ maxWidth: 400, margin: "60px auto", padding: 24 }}>
      <h1 style={{ fontSize: 24, marginBottom: 16 }}>Reset password</h1>
      <p style={{ color: "#666", marginBottom: 24 }}>
        Enter your email and we&apos;ll send you a link to reset your password.
      </p>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          const form = e.target as HTMLFormElement;
          const email = (form.elements.namedItem("email") as HTMLInputElement)?.value;
          if (email) {
            auth.requestPasswordReset({ email }).then(() => alert("Check your email for the reset link.")).catch(() => alert("Failed. Try again."));
          }
        }}
      >
        <input
          name="email"
          type="email"
          placeholder="Email"
          required
          style={{ width: "100%", padding: 12, marginBottom: 16, border: "1px solid #ddd", borderRadius: 8 }}
        />
        <button type="submit" style={{ padding: "12px 24px", background: "#111", color: "#fff", border: "none", borderRadius: 8, fontWeight: 600 }}>
          Send reset link
        </button>
      </form>
        <p style={{ marginTop: 16, fontSize: 14 }}>
        <Link to="/login">Back to login</Link>
      </p>
    </div>
  );
}

function LandingOrApp() {
  const { token, loading } = useAuth();
  if (loading) return <div style={{ padding: 40, textAlign: "center" }}>Loading...</div>;
  if (token) return <Navigate to="/app" replace />;
  return <Navigate to="/register" replace />;
}

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}
