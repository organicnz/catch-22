# profiles-updated-at-missing Bugfix Design

## Overview

Both upsert calls in `src/lib/actions/settings.ts` include `updated_at: new Date().toISOString()` in their payloads. The `profiles` table does not expose an `updated_at` column in the PostgREST schema cache, so every attempt to save user preferences fails with:

> "Could not find the 'updated_at' column of 'profiles' in the schema cache."

The fix is a two-line deletion: remove `updated_at` from the primary upsert (conflict on `user_id`) and from the fallback upsert (conflict on `email`). No schema changes, no new dependencies, no logic changes — the rest of the function is correct.

---

## Glossary

- **Bug_Condition (C)**: The condition that triggers the bug — an upsert payload that includes the `updated_at` field when writing to the `profiles` table.
- **Property (P)**: The desired outcome — the upsert succeeds and the user's settings are persisted.
- **Preservation**: All existing behaviour in `updateUserSettingsAction` that must remain unchanged: auth guard, key filtering, settings merge, cache revalidation, and the email-fallback path.
- **updateUserSettingsAction**: The server action in `src/lib/actions/settings.ts` that merges and persists user preference changes to the `profiles` table.
- **PostgREST schema cache**: The in-memory column map PostgREST builds from the database schema. Any column referenced in a write payload that is absent from this cache causes an immediate 400 error.

---

## Bug Details

### Bug Condition

The bug manifests whenever `updateUserSettingsAction` is called by an authenticated user. Both upsert paths unconditionally include `updated_at` in the payload object. Because `profiles` has no `updated_at` column in the PostgREST schema cache, PostgREST rejects the write before it reaches the database.

**Formal Specification:**

```
FUNCTION isBugCondition(payload)
  INPUT: payload — the object passed to supabase.from('profiles').upsert(...)
  OUTPUT: boolean

  RETURN 'updated_at' IN keys(payload)
END FUNCTION
```

Both upsert calls satisfy this condition unconditionally, so every invocation of `updateUserSettingsAction` is a buggy input.

### Examples

- **Primary upsert** — `{ user_id, email, settings, updated_at }` with `onConflict: 'user_id'` → PostgREST 400: "Could not find the 'updated_at' column of 'profiles' in the schema cache."
- **Fallback upsert** — `{ email, user_id, settings, updated_at }` with `onConflict: 'email'` → same PostgREST 400 error.
- **Any preference toggle** (marketing emails, order updates, currency) → error surfaced in the Preferences panel UI; optimistic update is reverted by the Zustand store.
- **First-time profile creation** — upsert would create the row, but fails for the same reason before the row is written.

---

## Expected Behavior

### Preservation Requirements

**Unchanged Behaviors:**

- Auth guard: when the user is not authenticated, the action returns `{ error: 'Unauthorized' }` without touching the database.
- Key filtering: only `marketing_emails`, `order_updates`, and `preferred_currency` are written; any other keys in the input are silently dropped.
- Settings merge: the new partial settings are merged with the existing profile settings rather than overwriting unrelated fields.
- Email fallback read: if the `user_id` select returns `PGRST116` (no row), the action retries the select by `email`.
- Cache revalidation: on success, `revalidatePath('/', 'layout')` is called so server-rendered components reflect the updated settings.
- Return shape: success returns `{ success: true, settings: updatedSettings }`; failure returns `{ error: string }`.

**Scope:**

All inputs that do NOT include `updated_at` in the upsert payload are unaffected. The fix touches only the two payload object literals — no surrounding logic changes.

---

## Hypothesized Root Cause

The `updated_at` field was added to the upsert payloads as a convenience timestamp, likely copied from a pattern used elsewhere or written before the `profiles` schema was finalised. The column either was never created in the `profiles` table, or was created and later dropped, and the PostgREST schema cache was never updated to reflect it.

There is no ambiguity about the root cause — the PostgREST error message is deterministic and names the exact field. No other hypothesis is needed.

---

## Correctness Properties

Property 1: Bug Condition — Upsert Succeeds Without `updated_at`

_For any_ invocation of `updateUserSettingsAction` by an authenticated user, the fixed function SHALL omit `updated_at` from both upsert payloads so that PostgREST accepts the write and the user's settings are persisted to the `profiles` table.

**Validates: Requirements 2.1, 2.2, 2.3**

Property 2: Preservation — Existing Action Behaviour Is Unchanged

_For any_ invocation of `updateUserSettingsAction` where the bug condition does NOT hold (i.e. `updated_at` is absent from the payload), the fixed function SHALL produce the same result as the original function, preserving the auth guard, key filtering, settings merge, email fallback, cache revalidation, and return shape.

**Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5**

---

## Fix Implementation

### Changes Required

**File:** `src/lib/actions/settings.ts`

**Function:** `updateUserSettingsAction`

**Specific Changes:**

1. **Primary upsert payload** — Remove the `updated_at: new Date().toISOString()` line from the object passed to the first `.upsert(...)` call (conflict on `user_id`).

2. **Fallback upsert payload** — Remove the `updated_at: new Date().toISOString()` line from the object passed to the second `.upsert(...)` call (conflict on `email`).

No other changes are required. The surrounding logic (auth check, key filter, settings merge, error handling, `revalidatePath`) is correct and must not be modified.

**Before (primary upsert):**

```typescript
.upsert({
  user_id: user.id,
  email: user.email,
  settings: updatedSettings,
  updated_at: new Date().toISOString()   // ← remove this line
}, { onConflict: 'user_id' })
```

**After (primary upsert):**

```typescript
.upsert({
  user_id: user.id,
  email: user.email,
  settings: updatedSettings
}, { onConflict: 'user_id' })
```

**Before (fallback upsert):**

```typescript
.upsert({
  email: user.email,
  user_id: user.id,
  settings: updatedSettings,
  updated_at: new Date().toISOString()   // ← remove this line
}, { onConflict: 'email' })
```

**After (fallback upsert):**

```typescript
.upsert({
  email: user.email,
  user_id: user.id,
  settings: updatedSettings
}, { onConflict: 'email' })
```

---

## Testing Strategy

### Validation Approach

The testing strategy follows a two-phase approach: first, surface counterexamples that demonstrate the bug on unfixed code, then verify the fix works correctly and preserves existing behaviour.

### Exploratory Bug Condition Checking

**Goal:** Surface counterexamples that demonstrate the bug BEFORE implementing the fix. Confirm the root cause (the `updated_at` field in the payload).

**Test Plan:** Mock the Supabase client so that `.upsert()` rejects with the PostgREST error when `updated_at` is present in the payload. Run these tests against the UNFIXED code to observe failures.

**Test Cases:**

1. **Primary upsert includes `updated_at`** — Call `updateUserSettingsAction({ preferred_currency: 'AUD' })` with a mocked Supabase that rejects payloads containing `updated_at`. Assert the action returns `{ error: "Could not find the 'updated_at' column..." }`. (Will fail on unfixed code — the error is returned rather than `{ success: true }`.)
2. **Fallback upsert includes `updated_at`** — Arrange the mock so the primary upsert fails with a non-conflict error to force the fallback path, then assert the fallback payload also contains `updated_at` and is rejected. (Will fail on unfixed code.)
3. **Any setting change triggers the error** — Repeat for `marketing_emails` and `order_updates` toggles to confirm the bug is not input-specific.

**Expected Counterexamples:**

- `updateUserSettingsAction` returns `{ error: "Could not find the 'updated_at' column of 'profiles' in the schema cache." }` for every valid settings change.
- Root cause confirmed: the payload object literal contains `updated_at`.

### Fix Checking

**Goal:** Verify that for all inputs where the bug condition holds, the fixed function produces the expected behaviour.

**Pseudocode:**

```
FOR ALL payload WHERE isBugCondition(payload) DO
  result := updateUserSettingsAction_fixed(input)
  ASSERT 'updated_at' NOT IN keys(capturedUpsertPayload)
  ASSERT result.success === true
  ASSERT result.settings contains the updated values
END FOR
```

### Preservation Checking

**Goal:** Verify that for all inputs where the bug condition does NOT hold, the fixed function produces the same result as the original function.

**Pseudocode:**

```
FOR ALL input WHERE NOT isBugCondition(upsertPayload) DO
  ASSERT updateUserSettingsAction_original(input) = updateUserSettingsAction_fixed(input)
END FOR
```

**Testing Approach:** Property-based testing is recommended for preservation checking because:

- It generates many combinations of partial settings objects automatically.
- It catches edge cases (empty objects, unknown keys, all-false booleans) that manual tests might miss.
- It provides strong guarantees that the auth guard, key filter, merge, and return shape are unchanged across the full input domain.

**Test Plan:** Observe the correct behaviour of each preserved path on unfixed code (they all work today except the upsert itself), then write tests that assert the same behaviour holds after the fix.

**Test Cases:**

1. **Auth guard preservation** — Call the action with no authenticated user; assert `{ error: 'Unauthorized' }` is returned and no upsert is attempted.
2. **Key filtering preservation** — Pass a payload containing an unknown key (e.g. `{ admin: true, preferred_currency: 'USD' }`); assert `admin` is not present in the upsert payload.
3. **Settings merge preservation** — Arrange an existing profile with `{ marketing_emails: true, order_updates: true, preferred_currency: 'NZD' }`; update only `preferred_currency: 'AUD'`; assert the upsert payload's `settings` field contains all three keys with the correct merged values.
4. **Cache revalidation preservation** — Assert `revalidatePath('/', 'layout')` is called on success.
5. **Return shape preservation** — Assert success returns `{ success: true, settings: { ... } }` and failure returns `{ error: string }`.

### Unit Tests

- Test that the primary upsert payload does not contain `updated_at` after the fix.
- Test that the fallback upsert payload does not contain `updated_at` after the fix.
- Test the auth guard (unauthenticated user returns `Unauthorized`).
- Test key filtering (unknown keys are stripped before the upsert).
- Test settings merge (partial update preserves unmodified fields).

### Property-Based Tests

- Generate random `Partial<UserSettings>` objects and verify the upsert payload never contains `updated_at`.
- Generate random existing profile settings and random partial updates; verify the merged `settings` field always contains the correct union of values.
- Generate random inputs including unknown keys; verify the filtered payload only ever contains the three allowed keys.

### Integration Tests

- Full round-trip: authenticated user toggles `marketing_emails`; assert the `profiles` row is updated in the database and the action returns `{ success: true }`.
- Fallback path: arrange a profile with no `user_id` match; assert the email-fallback upsert succeeds without `updated_at`.
- Verify the Preferences panel UI no longer shows the PostgREST error after the fix is applied.
