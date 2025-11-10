"use client";

import { useEffect, useState } from "react";
import { Navigate } from "react-router";
import useAuth from "@/utils/useAuth";

export default function LogoutPage() {
  const { signOut } = useAuth();
  const [redirect, setRedirect] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      try {
        const result = await signOut({ redirect: false, callbackUrl: "/account/signin" });
        if (cancelled) return;

        if (result?.url) {
          window.location.href = result.url;
        } else {
          setRedirect(true);
        }
      } catch (signOutError) {
        if (cancelled) return;
        const message = signOutError?.message ?? "Unable to sign out. Please try again.";
        setError(message);
      }
    };

    run();

    return () => {
      cancelled = true;
    };
  }, [signOut]);

  if (redirect) {
    return <Navigate to="/account/signin" replace />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-[#121212] px-4">
      <div className="w-full max-w-md space-y-4 text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-[#18B84E] dark:bg-[#16A249] text-white font-semibold text-lg">
          PM
        </div>
        <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Signing you out</h1>
        {error ? (
          <>
            <p className="text-sm text-red-600 dark:text-red-300">{error}</p>
            <button
              type="button"
              onClick={() => window.location.replace("/")}
              className="inline-flex justify-center items-center rounded-md bg-[#18B84E] hover:bg-[#16A249] text-white font-medium px-4 py-2 text-sm transition-colors duration-150"
            >
              Return to dashboard
            </button>
          </>
        ) : (
          <p className="text-sm text-gray-600 dark:text-gray-400">This will only take a moment...</p>
        )}
      </div>
    </div>
  );
}
