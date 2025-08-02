"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/utils/supabase/client"
import { getUsername, updatePasswordAfterReset, signOut, getSession } from "@/app/lib/supabase"
import { sign } from "crypto"

export default function ResetPasswordPage() {
  const router = useRouter()

  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [loading, setLoading] = useState(true)
  const [username, setUsername] = useState<string | null>(null)
  const [resetSuccess, setResetSuccess] = useState(false)
  const [hasError, setHasError] = useState(false)

  useEffect(() => {
    const trySetSessionFromHash = async () => {
      try {
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
    if (password.length < 6) {
      alert("Password too short. Minimum 6 characters required.")
      return
    }

    if (password !== confirmPassword) {
      alert("Passwords do not match. Please re-enter your passwords.")
      return
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

  if (loading) return <p style={{ textAlign: "center", marginTop: 48 }}>Verifying reset link...</p>

  if (hasError)
    return (
      <main style={{ padding: 24, textAlign: "center" }}>
        <h2>
          Please try sending another password reset request.
        </h2>
      </main>
    )

  if (resetSuccess) {
    return (
      <main
        style={{
          maxWidth: 400,
          margin: "auto",
          padding: 32,
          fontFamily:
            '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, "Open Sans", "Helvetica Neue", sans-serif',
          color: "#000",
          textAlign: "center",
        }}
      >
        <h2 style={{ fontSize: 24, fontWeight: "700", marginBottom: 24 }}>
          Password updated successfully.
        </h2>
        <p>You can now login with your new password in the SafeQR application.</p>
      </main>
    )
  }

  return (
    <main
      style={{
        maxWidth: 400,
        margin: "auto",
        padding: 32,
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, "Open Sans", "Helvetica Neue", sans-serif',
        color: "#000",
      }}
    >
      <h2 style={{ fontSize: 24, fontWeight: "700", marginBottom: 24 }}>
        Reset Password {username ? `for ${username}` : ""}
      </h2>

      <input
        type="password"
        placeholder="New password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        autoComplete="new-password"
        style={{
          width: "100%",
          padding: 12,
          marginBottom: 16,
          borderRadius: 8,
          border: "1px solid #ccc",
          fontSize: 16,
          boxSizing: "border-box",
        }}
      />

      <input
        type="password"
        placeholder="Confirm password"
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
        autoComplete="new-password"
        style={{
          width: "100%",
          padding: 12,
          marginBottom: 24,
          borderRadius: 8,
          border: "1px solid #ccc",
          fontSize: 16,
          boxSizing: "border-box",
        }}
      />

      <button
        onClick={handleReset}
        disabled={loading}
        style={{
          width: "100%",
          padding: 12,
          fontSize: 16,
          fontWeight: 600,
          border: "none",
          borderRadius: 8,
          backgroundColor: "#000",
          color: "#fff",
          cursor: loading ? "not-allowed" : "pointer",
          opacity: loading ? 0.6 : 1,
        }}
      >
        {loading ? "Resetting..." : "Reset Password"}
      </button>
    </main>
  )
}