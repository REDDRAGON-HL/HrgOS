import { lazy, Suspense, useState } from "react";
import { LoginScreen } from "./components/LoginScreen";
import { WaitingScreen } from "./components/WaitingScreen";
import { resolveLoginSession } from "./domain/loginAccess";
import type { LoginSession } from "./domain/loginAccess";

const DemoApp = lazy(() => import("./DemoApp"));
const TestLab = lazy(() => import("./testing/TestLab"));
const AbilityApp = lazy(() => import("./ability/AbilityApp"));

export default function App() {
  const [access, setAccess] = useState<LoginSession | "waiting" | null>(null);

  if ((import.meta.env.DEV || import.meta.env.VITE_ENABLE_TEST_LAB === 'true') && typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('test') === 'rules') {
    return <Suspense fallback={<WaitingScreen />}><TestLab /></Suspense>;
  }

  if (typeof window !== 'undefined' && (import.meta.env.VITE_ENABLE_LIVE_GAME === 'true' || new URLSearchParams(window.location.search).get('live') === 'cards')) {
    return <Suspense fallback={<WaitingScreen />}><AbilityApp /></Suspense>;
  }

  if (access === "waiting") {
    return <WaitingScreen />;
  }

  if (access === null) {
    return (
      <LoginScreen onLogin={(mode, username, password) => {
        setAccess(resolveLoginSession(mode, username, password) ?? "waiting");
      }} />
    );
  }

  return (
    <Suspense fallback={<WaitingScreen />}>
      <DemoApp mode={access.role} account={access} onLogout={() => setAccess(null)} />
    </Suspense>
  );
}
