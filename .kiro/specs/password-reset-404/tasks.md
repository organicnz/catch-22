# Implementation Plan

- [x] 1. Write bug condition smoke test (BEFORE implementing the fix)
  - **Property 1: Bug Condition** - Missing Page Returns 404
  - **CRITICAL**: This test MUST FAIL on unfixed code — failure confirms the bug exists
  - **DO NOT attempt to fix the test or the code when it fails**
  - **NOTE**: This test encodes the expected behavior — it will validate the fix when it passes after implementation
  - **GOAL**: Confirm that `src/app/account/update-password/page.tsx` does not exist and the route is broken
  - **Scoped approach**: This is a deterministic structural bug — scope the test to the single concrete failing case: a GET request to `/account/update-password`
  - Verify that `src/app/account/update-password/page.tsx` does not exist (the bug condition)
  - Write a render test in `src/lib/__tests__/update-password.test.tsx` that imports `UpdatePasswordPage` — this import will fail (module not found) on unfixed code, confirming the bug
  - Run the test on UNFIXED code
  - **EXPECTED OUTCOME**: Test FAILS with "Cannot find module" or similar (this is correct — it proves the bug exists)
  - Document the failure to confirm root cause: missing `page.tsx` in `src/app/account/update-password/`
  - Mark task complete when test is written, run, and failure is documented
  - _Requirements: 1.1, 1.2, 1.3_

- [x] 2. Write preservation smoke tests (BEFORE implementing the fix)
  - **Property 2: Preservation** - Existing Auth Routes Unaffected
  - **IMPORTANT**: Follow observation-first methodology — observe behavior on unfixed code for non-buggy paths
  - Observe: `src/app/auth/callback/route.ts` exists and exports a `GET` handler — confirm it is importable
  - Observe: `src/app/auth/mfa/page.tsx` exists and renders without error
  - Observe: `src/app/login/page.tsx` exists and renders without error
  - Write tests in `src/lib/__tests__/update-password.test.tsx` that assert:
    - The auth callback route module exports a `GET` function (3.3)
    - The MFA page module is importable without error (3.4)
    - The login page module is importable without error (3.1)
  - Run tests on UNFIXED code
  - **EXPECTED OUTCOME**: Tests PASS (confirms baseline behavior to preserve)
  - Mark task complete when tests are written, run, and passing on unfixed code
  - _Requirements: 3.1, 3.3, 3.4, 3.5_

- [x] 3. Fix: create the missing update-password page

  - [x] 3.1 Create `src/app/account/update-password/page.tsx`
    - Create the file as a `'use client'` Next.js page component named `UpdatePasswordPage`
    - Import `useState`, `useEffect` from `react`; `useRouter` from `next/navigation`; `createClient` from `@/lib/supabase`; `KeyRound`, `Loader2`, `ShieldAlert` from `lucide-react`
    - On mount (`useEffect`), call `supabase.auth.getSession()` — if no session, call `router.replace('/login?error=Invalid_Token')` and return; otherwise set `checking` to false
    - Render a loading spinner (`Loader2`) while `checking` is true
    - Render a centered card matching the MFA page aesthetic: `min-h-[80vh] bg-white flex items-center justify-center`, card `bg-slate-50 rounded-3xl`, `KeyRound` icon in `bg-primary/10` container, `font-black uppercase tracking-tight` heading, `h-1.5 w-16 bg-primary` accent bar
    - Render two `type="password"` inputs ("New Password", "Confirm Password") with labels `text-[10px] font-black text-secondary uppercase tracking-widest` and inputs `bg-white border border-slate-200 rounded-2xl focus:ring-2 focus:ring-primary`
    - On submit: validate password length ≥ 8 and passwords match — show inline error via `bg-rose-50 border border-rose-100 rounded-2xl` block with `ShieldAlert` icon if invalid, do not call API
    - On valid submit: set `loading` true, call `supabase.auth.updateUser({ password })`, set `loading` false
    - On success: `router.push('/account')`
    - On API error: display `updateError.message` in the error block
    - Submit button: `bg-secondary text-white font-black rounded-full`, disabled + `Loader2` spinner while loading
    - _Bug_Condition: request.path === "/account/update-password" with no page.tsx present_
    - _Expected_Behavior: page renders form; valid submission calls updateUser and redirects to /account; invalid session redirects to /login?error=Invalid_Token_
    - _Preservation: additive change only — no existing files modified_
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

  - [x] 3.2 Verify bug condition smoke test now passes
    - **Property 1: Expected Behavior** - Missing Page Returns 404
    - **IMPORTANT**: Re-run the SAME test from task 1 — do NOT write a new test
    - The test from task 1 imports `UpdatePasswordPage` — it will now resolve successfully
    - Run the test suite in `src/lib/__tests__/update-password.test.tsx`
    - **EXPECTED OUTCOME**: Test PASSES (confirms the missing page now exists and is importable)
    - _Requirements: 2.1, 2.2_

  - [x] 3.3 Verify preservation tests still pass
    - **Property 2: Preservation** - Existing Auth Routes Unaffected
    - **IMPORTANT**: Re-run the SAME tests from task 2 — do NOT write new tests
    - Run the full test suite in `src/lib/__tests__/update-password.test.tsx`
    - **EXPECTED OUTCOME**: All preservation tests PASS (confirms no regressions — auth callback, MFA page, and login page are unaffected)
    - _Requirements: 3.1, 3.3, 3.4_

- [x] 4. Checkpoint — ensure all tests pass
  - Run `bun test src/lib/__tests__/update-password.test.tsx` and confirm all tests pass
  - Manually verify the page renders correctly by navigating to `/account/update-password` in the browser (with and without an active session)
  - Confirm the full reset flow end-to-end: request reset email → click link → land on form → submit new password → redirect to `/account`
  - Ask the user if any questions arise
