"use client";

import { GoogleLogin } from "@react-oauth/google";
import { useRouter } from "next/navigation";

export default function GoogleSignIn() {
  const router = useRouter();

  const handleSuccess = async (credentialResponse: any) => {
    try {
      // Send the token to the backend
      const res = await fetch("/api/auth/google", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token: credentialResponse.credential }),
      });

      if (res.ok) {
        // Redirect to dashboard on success
        router.push("/dashboard");
      } else {
        console.error("Authentication failed");
      }
    } catch (error) {
      console.error("Error during authentication:", error);
    }
  };

  return (
    <div className="google-auth-wrapper">
      <GoogleLogin
        onSuccess={handleSuccess}
        onError={() => {
          console.error("Login Failed");
        }}
        theme="filled_black"
        shape="pill"
        size="large"
      />
    </div>
  );
}
