"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { checkSession, getUsername, updatePasswordAfterReset, signOut, getSession } from "@/app/lib/supabase"
import { validatePassword } from "@/app/components/validatePassword"

export default function ResetPasswordPage() {
  const router = useRouter()

  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [loading, setLoading] = useState(true)
  const [username, setUsername] = useState<string | null>(null)
  const [resetSuccess, setResetSuccess] = useState(false)
  const [hasError, setHasError] = useState(false)
  const [isDarkMode, setIsDarkMode] = useState(false)

  useEffect(() => {
    const match = window.matchMedia("(prefers-color-scheme: dark)")
    setIsDarkMode(match.matches)

    const handleChange = (e: MediaQueryListEvent) => setIsDarkMode(e.matches)
    match.addEventListener("change", handleChange)

    return () => match.removeEventListener("change", handleChange)
  }, [])

  useEffect(() => {
    const trySetSessionFromHash = async () => {
      try {
        const currentSession = await checkSession()
        const currentAccessToken = currentSession.session?.access_token

        if (currentAccessToken) {
          console.log("Found existing session, signing out before continuing.")
          await signOut()
        }

        const hash = window.location.hash.substring(1)
        const params = new URLSearchParams(hash)

        const access_token = params.get("access_token")
        const refresh_token = params.get("refresh_token")
        const type = params.get("type")

        if (!access_token || !refresh_token || type !== "recovery") {
          throw new Error("Invalid or missing recovery token in URL.")
        }

        await getSession(access_token, refresh_token)

        // Remove access token from URL to prevent reuse before reset process is complete
        window.history.replaceState({}, document.title, window.location.pathname)

        // Get username or email
        const data = await getUsername(access_token, refresh_token)
        setUsername(data?.user?.user_metadata?.username ?? data?.user?.email ?? null)
      } catch (err: any) {
        setHasError(true)
        await signOut()
      } finally {
        setLoading(false)
      }
    }
    trySetSessionFromHash()
  }, [])

  const handleReset = async () => {
    if (password.length < 1) {
      alert("Password cannot be empty.")
      return
    }

    if (password !== confirmPassword) {
      alert("Passwords do not match. Please re-enter your passwords.")
      return
    }

    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      alert("Password must be at least 8 characters, contains 1 uppercase, 1 lowercase, 1 number, and 1 special character")
    }

    setLoading(true)

    try {
      await updatePasswordAfterReset(password)
      setResetSuccess(true)
      await signOut()

    } catch (err: any) {
      alert("Password reset failed: " + err.message)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <main style={getStyles(isDarkMode).container}>
        <p style={{ textAlign: "center", marginTop: 48 }}>Verifying reset link...</p>
      </main>
    )
  }

  if (hasError) {
    return (
      <main style={getStyles(isDarkMode).container}>
        <h2 style={getStyles(isDarkMode).heading}>Please try sending another password reset request.</h2>
      </main>
    )
  }

  if (resetSuccess) {
    return (
      <main style={getStyles(isDarkMode).container}>
        <h2 style={getStyles(isDarkMode).heading}>Password updated successfully.</h2>
        <p style={getStyles(isDarkMode).paragraph}>
          You can now login with your new password in the SafeQR application.
        </p>
      </main>
    )
  }

  return (
    <main style={getStyles(isDarkMode).container}>
      <h2 style={getStyles(isDarkMode).heading}>
        Reset Password {username ? `for ${username}` : ""}
      </h2>

      <input
        type="password"
        placeholder="New password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        autoComplete="new-password"
        style={getStyles(isDarkMode).input}
      />

      <input
        type="password"
        placeholder="Confirm password"
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
        autoComplete="new-password"
        style={getStyles(isDarkMode).input}
      />

      {password.length > 0 && (
        <div style={{ marginBottom: 16, fontSize: 14, textAlign: "left" }}>
          {[
            { label: "At least 8 characters", valid: password.length >= 8 },
            { label: "At least one uppercase letter", valid: /[A-Z]/.test(password) },
            { label: "At least one lowercase letter", valid: /[a-z]/.test(password) },
            { label: "At least one number", valid: /[0-9]/.test(password) },
            { label: "At least one special character", valid: /[^A-Za-z0-9]/.test(password) },
          ].map((rule, idx) => (
            <p key={idx} style={{ color: rule.valid ? "green" : "red", margin: "4px 0", fontSize: 14 }}>
              • {rule.label}
            </p>
          ))}
        </div>
      )}

      <button
        onClick={handleReset}
        disabled={loading}
        style={{
          ...getStyles(isDarkMode).button,
          opacity: loading ? 0.6 : 1,
          cursor: loading ? "not-allowed" : "pointer",
        }}
      >
        {loading ? "Resetting..." : "Reset Password"}
      </button>
    </main>
  )
}

const getStyles = (dark: boolean): { [key: string]: React.CSSProperties } => ({
  container: {
    maxWidth: 400,
    width: "90vw",
    margin: "auto",
    padding: 24,
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, "Open Sans", "Helvetica Neue", sans-serif',
    color: dark ? "#fff" : "#000",
    backgroundColor: dark ? "#121212" : "#fff",
    textAlign: "center",
    minHeight: "100vh",
  },
  heading: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 24,
  },
  paragraph: {
    fontSize: 16,
    marginTop: 16,
  },
  input: {
    width: "100%",
    padding: 12,
    marginBottom: 16,
    borderRadius: 8,
    border: dark ? "1px solid #444" : "1px solid #ccc",
    fontSize: 16,
    backgroundColor: dark ? "#1e1e1e" : "#fff",
    color: dark ? "#fff" : "#000",
    boxSizing: "border-box",
  },
  button: {
    width: "100%",
    padding: 12,
    fontSize: 16,
    fontWeight: 600,
    border: "none",
    borderRadius: 8,
    backgroundColor: dark ? "#fff" : "#000",
    color: dark ? "#000" : "#fff",
  },
})