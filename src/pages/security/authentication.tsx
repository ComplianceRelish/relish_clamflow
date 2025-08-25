// src/pages/security/authentication.tsx
import ClamFlowSecure from '@/components/integrations/ClamFlowSecure';

export default function SecurityPage() {
  const handleAuthSuccess = (userId: string, method: string) => {
    console.log(`User ${userId} authenticated via ${method}`);
    // Redirect to dashboard or update auth state
  };

  const handleAuthFailure = (reason: string) => {
    console.log(`Authentication failed: ${reason}`);
    // Handle failed authentication
  };

  return (
    <div className="container mx-auto p-6">
      <ClamFlowSecure
        mode="authentication"
        onAuthSuccess={handleAuthSuccess}
        onAuthFailure={handleAuthFailure}
      />
    </div>
  );
}