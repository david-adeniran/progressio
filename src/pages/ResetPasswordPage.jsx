import { useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "../lib/firebase";
import styles from "./ResetPasswordPage.module.css";

const STEPS = [
  { n: "01", label: "Enter the email on your account" },
  { n: "02", label: "We send a secure reset link" },
  { n: "03", label: "Set a new password and sign back in" },
];

function friendlyError(code) {
  const map = {
    "auth/invalid-email": "Enter a valid email address.",
    "auth/user-not-found": "No account found with that email.",
  };
  return map[code] || "Something went wrong. Try again.";
}

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState(location.state?.email || "");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    if (!email.trim()) return;
    setError("");
    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, email.trim());
      setSent(true);
    } catch (err) {
      setError(friendlyError(err.code));
    }
    setLoading(false);
  }

  return (
    <div className={styles.page}>
      {/* Left — brand */}
      <div className={styles.brand}>
        <div className={styles.brandAccentLine} />
        <div className={styles.brandTop}>
          <div className={styles.brandMarkRow}>
            <img
              src="https://res.cloudinary.com/f3z9dqhr/image/upload/f_auto/q_auto/Gemini_Generated_Image_s9gwums9gwums9gw-removebg-preview_cfktxv.png"
              alt="Progressio"
              className={styles.brandLogo}
            />
            <span className={styles.brandMark}>Progressio</span>
          </div>
          <h1 className={styles.brandHeadline}>
            Let's get you<br />
            back on <em>track</em>.
          </h1>
          <p className={styles.brandTagline}>
            Losing access to your account shouldn't cost you your progress.
            Here's how recovery works.
          </p>
        </div>

        <div className={styles.brandBottom}>
          <div className={styles.steps}>
            {STEPS.map((s) => (
              <div className={styles.step} key={s.n}>
                <span className={styles.stepNum}>{s.n}</span>
                <span className={styles.stepLabel}>{s.label}</span>
              </div>
            ))}
          </div>
          <p className={styles.brandNote}>
            Reset links expire shortly after they're sent, and only work for
            the account they were requested for.
          </p>
        </div>
      </div>

      {/* Right — form */}
      <div className={styles.formPanel}>
        <Link to="/" className={styles.backLink}>← Back to sign in</Link>

        {!sent ? (
          <>
            <div className={styles.formHeader}>
              <h2 className={styles.formTitle}>Reset your password</h2>
              <p className={styles.formSub}>
                Enter the email on your account and we'll send you a link to
                set a new password.
              </p>
            </div>

            <form onSubmit={handleSubmit} className={styles.form}>
              <div className={styles.field}>
                <label className={styles.label}>Email</label>
                <input
                  className={styles.input}
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  autoFocus
                  required
                />
              </div>

              {error && <p className={styles.error}>{error}</p>}

              <button type="submit" className={styles.submitBtn} disabled={loading}>
                {loading ? "Sending…" : "Send reset link"}
              </button>
            </form>
          </>
        ) : (
          <div className={styles.sentState}>
            <div className={styles.sentAccent} />
            <div className={styles.formHeader}>
              <h2 className={styles.formTitle}>Check your email</h2>
              <p className={styles.formSub}>
                We've sent a reset link to <strong>{email}</strong>. Open it
                to set a new password.
              </p>
            </div>

            <p className={styles.sentHint}>
              Nothing in your inbox after a few minutes? Check spam, confirm
              the address is right, or send it again.
            </p>

            <div className={styles.sentActions}>
              <button
                type="button"
                className={styles.resendBtn}
                onClick={() => setSent(false)}
              >
                Try a different email
              </button>
              <button
                type="button"
                className={styles.submitBtn}
                onClick={() => navigate("/")}
              >
                Back to sign in
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
