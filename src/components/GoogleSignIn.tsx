"use client";

import { GoogleLogin } from "@react-oauth/google";

export default function GoogleSignIn() {
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
        // 💡 Hard Redirect එකක් දෙනවා, එතකොට අලුත් Cookie එකත් එක්කම ලස්සනට ලෝඩ් වෙනවා!
        window.location.href = "/dashboard";
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
