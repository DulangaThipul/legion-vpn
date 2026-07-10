"use client";

import { GoogleLogin } from "@react-oauth/google";
import { useRouter } from "next/navigation";

import { handleGoogleAuth } from "@/lib/authActions"; 

export default function GoogleSignIn() {
  const router = useRouter();

  const handleSuccess = async (credentialResponse: any) => {
    try {
      if (!credentialResponse.credential) {
        console.error("No credential received from Google");
        return;
      }

      // 🛠️ පරණ fetch එක වෙනුවට කෙලින්ම සර්වර් ඇක්ෂන් එක call කරනවා:
      const response = await handleGoogleAuth(credentialResponse.credential);

      if (response.success) {
        // සාර්ථකව ලොග් වුණාට පස්සේ Dashboard එකට redirect කරනවා
        router.push("/dashboard");
      } else {
        console.error("Authentication failed:", response.error);
        alert("Authentication failed! Please try again.");
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
