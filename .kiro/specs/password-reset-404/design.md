# Design Document: Password Reset 404 Fix

## Overview

The password reset flow is broken because `src/app/account/update-password/` exists as an empty directory with no `page.tsx`. When a user clicks the reset link in their email, Supabase's auth callback exchanges the code for a session and redirects to `/account/update-password` — which returns a 404. The fix is to create that missing page as a Client Component.

No new dependencies are required. The page uses the existing `createClient()` browser client from `@/lib/supabase` and `next/navigation`.

---

## Bug Condition

**isBugCondition(request):**

```
request.path === "/account/update-password"
```

Any request to `/account/update-password` triggers the bug — the Next.js App Router finds no `page.tsx` in that directory and falls through to the global `not-found.tsx`, returning a 404.

This is a deterministic, structural bug (missing file), not a logic or data bug. The condition is fully reproducible with a single concrete case: navigate to `/account/update-password`.

**Counterexample:** `GET /account/update-password` → HTTP 404 (should render a password update form)

---

## Expected Behavior

**expectedBehavior(result) for requests with a valid recovery session:**

```
result.status === 200
AND result.body contains a password update form
AND form submission calls supabase.auth.updateUser({ password })
AND on success, router.push("/account")
```

**expectedBehavior(result) for requests without a valid session:**

```
result.redirectsTo === "/login?error=Invalid_Token"
```

### Detailed Page Behavior

1. **Session guard (on mount):** Call `supabase.auth.getSession()`. If no session exists, call `router.replace('/login?error=Invalid_Token')` and return early.
2. **Form fields:** "New Password" and "Confirm Password" inputs (both `type="password"`, `minLength={8}`).
3. **Inline validation (before submit):**
   - Passwords shorter than 8 characters → show error, do not submit.
   - Passwords that do not match → show error, do not submit.
4. **Submission:** Call `supabase.auth.updateUser({ password: newPassword })`.
5. **On success:** `router.push('/account')` — no success message needed.
6. **On API error:** Display the error message from Supabase inline.
7. **Loading state:** Disable the submit button and show a `Loader2` spinner while the request is in flight.

---

## Preservation Requirements

These behaviors exist today and must not regress after the fix is applied.

**¬isBugCondition(request) — non-buggy paths that must be preserved:**

| Requirement | Condition                       | Expected Preserved Behavior                                                  |
| ----------- | ------------------------------- | ---------------------------------------------------------------------------- |
| 3.1         | Normal login flow               | `supabase.auth.signInWithPassword` authenticates and redirects to `/account` |
| 3.2         | Authenticated `/account` visit  | Account overview page renders without disruption                             |
| 3.3         | `/auth/callback` code exchange  | `exchangeCodeForSession(code)` succeeds and redirects to `next` param        |
| 3.4         | MFA verification at `/auth/mfa` | Successful TOTP verify redirects to `/account`                               |
| 3.5         | Password reset email dispatch   | `resetPasswordForEmail` sends email with link to `/account/update-password`  |

The fix is purely additive (creating a new file). It does not touch any existing route, component, or utility. Preservation risk is minimal.

---

## Implementation Design

### File to Create

**`src/app/account/update-password/page.tsx`**

### Component Structure

```tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import { KeyRound, Loader2, ShieldAlert } from 'lucide-react';

export default function UpdatePasswordPage() {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [error, setError] = useState('');
  const router = useRouter();
  const supabase = createClient();

  // Session guard
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        router.replace('/login?error=Invalid_Token');
      } else {
        setChecking(false);
      }
    });
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    // Inline validation
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (updateError) {
      setError(updateError.message);
    } else {
      router.push('/account');
    }
  }

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-[80vh] bg-white flex items-center justify-center px-4 py-16">
      <div className="max-w-md w-full bg-slate-50 p-10 rounded-3xl shadow-sm text-center border border-slate-100">
        {/* Header */}
        <div className="flex flex-col items-center mb-8">
          <div className="p-4 bg-primary/10 text-primary rounded-2xl mb-4">
            <KeyRound size={32} />
          </div>
          <h1 className="text-3xl font-black text-secondary uppercase tracking-tight mb-2">
            New Password
          </h1>
          <div className="h-1.5 w-16 bg-primary" />
        </div>

        <p className="text-slate-600 mb-10 font-medium leading-relaxed">
          Choose a strong new password for your account.
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="text-left">
            <label className="block text-[10px] font-black text-secondary uppercase tracking-widest mb-2 ml-1">
              New Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              placeholder="Min. 8 characters"
              className="w-full px-5 py-4 bg-white border border-slate-200 rounded-2xl focus:ring-2 focus:ring-primary outline-none font-bold text-secondary"
            />
          </div>

          <div className="text-left">
            <label className="block text-[10px] font-black text-secondary uppercase tracking-widest mb-2 ml-1">
              Confirm Password
            </label>
            <input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
              minLength={8}
              placeholder="Repeat your password"
              className="w-full px-5 py-4 bg-white border border-slate-200 rounded-2xl focus:ring-2 focus:ring-primary outline-none font-bold text-secondary"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-secondary text-white font-black rounded-full py-5 hover:bg-primary transition-all uppercase tracking-[0.2em] text-sm shadow-xl shadow-secondary/10 disabled:opacity-50 flex items-center justify-center gap-3"
          >
            {loading ? <Loader2 className="animate-spin" size={20} /> : 'Update Password'}
          </button>
        </form>

        {error && (
          <div className="mt-8 p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-center gap-3 text-rose-600 text-left">
            <ShieldAlert size={18} className="shrink-0" />
            <p className="text-xs font-black uppercase tracking-widest">{error}</p>
          </div>
        )}
      </div>
    </div>
  );
}
```

### Design Token Alignment

Mirrors `src/app/auth/mfa/page.tsx` exactly:

| Element        | Class                                                                                        |
| -------------- | -------------------------------------------------------------------------------------------- |
| Page wrapper   | `min-h-[80vh] bg-white flex items-center justify-center px-4 py-16`                          |
| Card           | `max-w-md w-full bg-slate-50 p-10 rounded-3xl shadow-sm text-center border border-slate-100` |
| Icon container | `p-4 bg-primary/10 text-primary rounded-2xl mb-4`                                            |
| Heading        | `text-3xl font-black text-secondary uppercase tracking-tight`                                |
| Accent bar     | `h-1.5 w-16 bg-primary`                                                                      |
| Labels         | `text-[10px] font-black text-secondary uppercase tracking-widest`                            |
| Inputs         | `bg-white border border-slate-200 rounded-2xl focus:ring-2 focus:ring-primary`               |
| Submit button  | `bg-secondary text-white font-black rounded-full`                                            |
| Error block    | `bg-rose-50 border border-rose-100 rounded-2xl` with `ShieldAlert` icon                      |

---

## Test Strategy

This is a structural bug (missing file), not a logic bug. Property-based testing is not applicable. A focused integration smoke test is sufficient:

1. **Render test** — The page renders without crashing when a mock session is present.
2. **Validation test** — Submitting mismatched or too-short passwords shows the correct inline error and does not call `supabase.auth.updateUser`.
3. **No-session redirect test** — When `getSession()` returns null, the component calls `router.replace('/login?error=Invalid_Token')`.
4. **Success test** — When `updateUser` resolves without error, `router.push('/account')` is called.

Test file location: `src/lib/__tests__/update-password.test.tsx` (alongside the existing `sanitize.test.ts`).
