# Implementation Plan

- [x] 1. Write bug condition exploration test
  - **Property 1: Bug Condition** - `updated_at` in upsert payload causes PostgREST 400
  - **CRITICAL**: This test MUST FAIL on unfixed code — failure confirms the bug exists
  - **DO NOT attempt to fix the test or the code when it fails**
  - **NOTE**: This test encodes the expected behavior — it will validate the fix when it passes after implementation
  - **GOAL**: Surface counterexamples that demonstrate the bug exists
  - **Scoped PBT Approach**: Scope the property to the concrete failing case — any call to `updateUserSettingsAction` with a mocked Supabase client that rejects payloads containing `updated_at`
  - Create `src/lib/__tests__/settings-action.test.ts`
  - Mock `@/lib/supabase-server` so `createServerClient` returns a fake Supabase client
  - Mock `next/cache` so `revalidatePath` is a no-op spy
  - Mock `supabase.auth.getUser()` to return a valid authenticated user `{ id: 'user-123', email: 'test@example.com' }`
  - Mock `supabase.from('profiles').select(...).eq(...).single()` to return an existing profile with `settings: { marketing_emails: false, order_updates: true, preferred_currency: 'NZD' }`
  - Mock `supabase.from('profiles').upsert(...)` to inspect the captured payload and return `{ error: { message: "Could not find the 'updated_at' column of 'profiles' in the schema cache." } }` when `'updated_at' in payload` is true
  - Use `fc.record({ preferred_currency: fc.constantFrom('NZD', 'AUD', 'USD'), marketing_emails: fc.boolean(), order_updates: fc.boolean() })` to generate arbitrary valid settings inputs
  - For each generated input, call `updateUserSettingsAction(input)` and assert the result equals `{ error: "Could not find the 'updated_at' column of 'profiles' in the schema cache." }`
  - Run test on UNFIXED code
  - **EXPECTED OUTCOME**: Test FAILS (this is correct — it proves the bug exists, because the unfixed code includes `updated_at` in the payload and the mock returns the PostgREST error)
  - Document counterexamples found (e.g., `updateUserSettingsAction({ preferred_currency: 'AUD' })` returns the PostgREST error instead of `{ success: true }`)
  - Mark task complete when test is written, run, and failure is documented
  - _Requirements: 1.1, 1.2, 2.1, 2.2, 2.3_

- [x] 2. Write preservation property tests (BEFORE implementing fix)
  - **Property 2: Preservation** - Existing action behaviour is unchanged for non-buggy paths
  - **IMPORTANT**: Follow observation-first methodology — observe each preserved behaviour on unfixed code before writing assertions
  - **Scoped approach**: These tests cover paths where the bug condition does NOT hold (auth guard, key filtering, settings merge, return shape, cache revalidation) — all of these work correctly on unfixed code today
  - Add preservation tests to `src/lib/__tests__/settings-action.test.ts`
  - Use the same mock setup as task 1, but configure the upsert mock to succeed (return `{ error: null }`) so the preserved paths can be observed
  - **Observe and assert the following behaviours:**
    - **Auth guard**: Call `updateUserSettingsAction({ preferred_currency: 'AUD' })` with `getUser()` returning `{ user: null, error: null }`; assert result is `{ error: 'Unauthorized' }` and upsert is never called
    - **Key filtering**: Use `fc.record({ ...validKeys, unknownKey: fc.string() })` to generate inputs with extra keys; assert the captured upsert payload's `settings` field never contains keys outside `['marketing_emails', 'order_updates', 'preferred_currency']`
    - **Settings merge**: Use `fc.record({ marketing_emails: fc.boolean(), order_updates: fc.boolean(), preferred_currency: fc.constantFrom('NZD', 'AUD', 'USD') })` for existing profile settings and `fc.record({ preferred_currency: fc.constantFrom('NZD', 'AUD', 'USD') })` for partial updates; assert the upsert payload's `settings` field contains the merged result (existing values preserved, updated value overwritten)
    - **Cache revalidation**: Assert `revalidatePath('/', 'layout')` is called exactly once on a successful upsert
    - **Return shape on success**: Assert result is `{ success: true, settings: { ...mergedSettings } }`
    - **Return shape on failure**: Configure upsert mock to return a non-`updated_at` error; assert result is `{ error: string }`
  - Run tests on UNFIXED code
  - **EXPECTED OUTCOME**: All preservation tests PASS (this confirms baseline behaviour to preserve)
  - Mark task complete when tests are written, run, and passing on unfixed code
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

- [x] 3. Fix: remove `updated_at` from both upsert payloads in `updateUserSettingsAction`

  - [x] 3.1 Implement the fix
    - Open `src/lib/actions/settings.ts`
    - In the primary upsert (conflict on `user_id`), remove the line `updated_at: new Date().toISOString()` from the payload object
    - In the fallback upsert (conflict on `email`), remove the line `updated_at: new Date().toISOString()` from the payload object
    - No other changes — the auth guard, key filter, settings merge, email fallback, error handling, and `revalidatePath` call must not be modified
    - _Bug_Condition: `isBugCondition(payload)` where `'updated_at' in payload` is true — both upsert payloads satisfy this unconditionally on unfixed code_
    - _Expected_Behavior: after fix, `'updated_at' NOT IN keys(capturedUpsertPayload)` and `result.success === true` for any valid authenticated call_
    - _Preservation: auth guard, key filtering, settings merge, email fallback, cache revalidation, and return shape are all unchanged_
    - _Requirements: 2.1, 2.2, 2.3, 3.1, 3.2, 3.3, 3.4, 3.5_

  - [x] 3.2 Verify bug condition exploration test now passes
    - **Property 1: Expected Behavior** - Upsert succeeds without `updated_at`
    - **IMPORTANT**: Re-run the SAME test from task 1 — do NOT write a new test
    - The test from task 1 encodes the expected behavior: the mock no longer receives `updated_at` in the payload, so it returns `{ error: null }` instead of the PostgREST error, and the action returns `{ success: true }`
    - Run `bun test src/lib/__tests__/settings-action.test.ts`
    - **EXPECTED OUTCOME**: Test PASSES (confirms bug is fixed — `updated_at` is absent from both upsert payloads)
    - _Requirements: 2.1, 2.2, 2.3_

  - [x] 3.3 Verify preservation tests still pass
    - **Property 2: Preservation** - Existing action behaviour is unchanged
    - **IMPORTANT**: Re-run the SAME tests from task 2 — do NOT write new tests
    - Run the full test file: `bun test src/lib/__tests__/settings-action.test.ts`
    - Confirm all tests still pass after fix

- [x] 4. Checkpoint — Ensure all tests pass
  - Run the full test suite: `bun test`
  - Confirm `settings-action.test.ts` passes completely (both Property 1 and Property 2 suites)
  - Confirm no other test files have regressed
  - Ensure all tests pass; ask the user if questions arise
