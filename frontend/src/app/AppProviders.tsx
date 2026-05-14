import { AuthProvider } from "@/contexts/auth/AuthProvider";
import { SystemConfigProvider } from "@/contexts/system-config/SystemConfigProvider";

export default function AppProviders({ children }) {
  return (
    <SystemConfigProvider>
      <AuthProvider>{children}</AuthProvider>
    </SystemConfigProvider>
  );
}
