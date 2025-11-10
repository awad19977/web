"use client";

import { useState } from "react";
import { Navigate } from "react-router";
import useAuth from "@/utils/useAuth";
import useUser from "@/utils/useUser";

const initialFormState = {
  email: "",
  password: "",
};

export default function SignInPage() {
  const [mode, setMode] = useState("signin");
  const [formState, setFormState] = useState(initialFormState);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const { user, loading } = useUser();
  const { signInWithCredentials, signUpWithCredentials } = useAuth();

  if (!loading && user) {
    return <Navigate to="/" replace />;
  }

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormState((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (submitting) return;
    setSubmitting(true);
    setError(null);

    const authFn = mode === "signin" ? signInWithCredentials : signUpWithCredentials;

    try {
      const result = await authFn({
        email: formState.email,
        password: formState.password,
        redirect: false,
        callbackUrl: "/",
      });

      if (result?.error) {
        setError(result.error);
        setSubmitting(false);
        return;
      }

      if (result?.url) {
        window.location.href = result.url;
      } else {
        window.location.href = "/";
      }
    } catch (authError) {
      const message = authError?.message ?? "Something went wrong. Please try again.";
      setError(message);
      setSubmitting(false);
    }
  };

  const isSignIn = mode === "signin";
  const title = isSignIn ? "Sign in" : "Create an account";
  const submitLabel = submitting ? "Please wait..." : isSignIn ? "Sign in" : "Sign up";

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-[#121212] px-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-[#18B84E] dark:bg-[#16A249] text-white font-semibold text-lg">
            PM
          </div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">{title}</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {isSignIn ? "Access your dashboard" : "A password will secure your new workspace"}
          </p>
        </div>

        <div className="bg-white dark:bg-[#1E1E1E] rounded-lg border border-gray-200 dark:border-gray-800 shadow-sm p-6">
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300" htmlFor="email">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                autoComplete="email"
                value={formState.email}
                onChange={handleChange}
                className="block w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#262626] px-3 py-2 text-gray-900 dark:text-white shadow-sm focus:border-[#18B84E] focus:ring-[#18B84E] sm:text-sm"
                placeholder="you@example.com"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300" htmlFor="password">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                autoComplete={isSignIn ? "current-password" : "new-password"}
                value={formState.password}
                onChange={handleChange}
                className="block w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#262626] px-3 py-2 text-gray-900 dark:text-white shadow-sm focus:border-[#18B84E] focus:ring-[#18B84E] sm:text-sm"
                placeholder={isSignIn ? "••••••••" : "At least 8 characters"}
              />
            </div>

            {error && (
              <div className="rounded-md border border-red-200 dark:border-red-900/60 bg-red-50 dark:bg-red-950/30 px-3 py-2 text-sm text-red-700 dark:text-red-200">
                {error}
              </div>
            )}

            <button
              type="submit"
              className="w-full inline-flex justify-center items-center rounded-md bg-[#18B84E] hover:bg-[#16A249] text-white font-medium py-2.5 text-sm transition-colors duration-150 disabled:opacity-70"
              disabled={submitting || !formState.email || !formState.password}
            >
              {submitLabel}
            </button>
          </form>
        </div>

        <div className="text-center text-sm text-gray-600 dark:text-gray-400">
          {isSignIn ? "Don't have an account?" : "Already registered?"}{" "}
          <button
            type="button"
            onClick={() => {
              setMode(isSignIn ? "signup" : "signin");
              setFormState(initialFormState);
              setError(null);
            }}
            className="font-medium text-[#18B84E] hover:text-[#16A249] dark:text-[#16A249]"
          >
            {isSignIn ? "Create one" : "Sign in"}
          </button>
        </div>
      </div>
    </div>
  );
}