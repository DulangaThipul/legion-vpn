"use client";

import { GoogleOAuthProvider } from "@react-oauth/google";

export default function Providers({ children }: { children: React.ReactNode }) {
  // Fixed the duplicated .apps.googleusercontent.com domain extension
  const clientId = "669397877346-cj371sqgmnl3tb67li85r6oe5vvootbn.apps.googleusercontent.com";

  return (
    <GoogleOAuthProvider clientId={clientId}>
      {children}
    </GoogleOAuthProvider>
  );
}