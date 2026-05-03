/**
 * Bug Condition Exploration Test: profiles `updated_at` column missing from schema cache
 *
 * **Validates: Requirements 1.1, 1.2, 2.1, 2.2, 2.3**
 *
 * Property 1: Bug Condition — Upsert Succeeds Without `updated_at`
 *
 * This test confirms the bug condition: `updateUserSettingsAction` includes
 * `updated_at` in both upsert payloads. The mock rejects any payload that
 * contains `updated_at` with the real PostgREST error. On unfixed code the
 * action returns `{ error: "Could not find the 'updated_at' column..." }`
 * instead of `{ success: true }`.
 *
 * EXPECTED OUTCOME on unfixed code: FAIL (proves the bug exists)
 * EXPECTED OUTCOME after fix: PASS (updated_at absent from payload)
 *
 * Property 2: Preservation — Existing Action Behaviour Is Unchanged
 *
 * **Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5**
 *
 * These tests cover paths where the bug condition does NOT hold (auth guard,
 * key filtering, settings merge, return shape, cache revalidation). The upsert
 * mock is configured to SUCCEED for these tests so the preserved paths can be
 * observed. All preservation tests PASS on unfixed code.
 *
 * EXPECTED OUTCOME on unfixed code: PASS (confirms baseline behaviour to preserve)
 */

import fc from 'fast-check';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// ─── Mocks ────────────────────────────────────────────────────────────────────

// Track the last upsert payload so the mock can inspect it
let capturedUpsertPayload: Record<string, unknown> = {};

// Configurable upsert behaviour — set per-test
// When true: upsert returns { data: null, error: null }
// When false: upsert rejects payloads containing updated_at with PostgREST error
let upsertShouldSucceed = false;

// Configurable non-updated_at error for failure-path tests
let upsertErrorOverride: { message: string } | null = null;

const mockSingle = vi.fn();
const mockEq = vi.fn(() => ({ single: mockSingle }));
const mockSelect = vi.fn(() => ({ eq: mockEq }));

const mockUpsert = vi.fn((payload: Record<string, unknown>) => {
  capturedUpsertPayload = payload;
  // If a specific error override is set, return it regardless
  if (upsertErrorOverride !== null) {
    return Promise.resolve({ data: null, error: upsertErrorOverride });
  }
  // If configured to succeed, return success
  if (upsertShouldSucceed) {
    return Promise.resolve({ data: null, error: null });
  }
  // Default (bug condition mode): reject payloads containing updated_at
  if ('updated_at' in payload) {
    return Promise.resolve({
      data: null,
      error: {
        message:
          "Could not find the 'updated_at' column of 'profiles' in the schema cache.",
      },
    });
  }
  return Promise.resolve({ data: null, error: null });
});

const mockFrom = vi.fn((table: string) => {
  if (table === 'profiles') {
    return { select: mockSelect, upsert: mockUpsert };
  }
  return { select: mockSelect, upsert: mockUpsert };
});

const mockGetUser = vi.fn();

const mockSupabase = {
  auth: { getUser: mockGetUser },
  from: mockFrom,
};

vi.mock('@/lib/supabase-server', () => ({
  createServerClient: vi.fn(() => Promise.resolve(mockSupabase)),
}));

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

// Import AFTER mocks are registered
import { updateUserSettingsAction } from '@/lib/actions/settings';
import { revalidatePath } from 'next/cache';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const POSTGREST_ERROR =
  "Could not find the 'updated_at' column of 'profiles' in the schema cache.";

const EXISTING_PROFILE_SETTINGS = {
  marketing_emails: false,
  order_updates: true,
  preferred_currency: 'NZD',
};

function setupAuthenticatedUser() {
  mockGetUser.mockResolvedValue({
    data: { user: { id: 'user-123', email: 'test@example.com' } },
    error: null,
  });
}

function setupProfileFetch() {
  // select('settings').eq('user_id', ...).single()
  mockSingle.mockResolvedValue({
    data: { settings: EXISTING_PROFILE_SETTINGS },
    error: null,
  });
}

// ─── Property 1: Bug Condition ────────────────────────────────────────────────
// Feature: profiles-updated-at-missing, Property 1: Bug Condition
// Validates: Requirements 1.1, 1.2, 2.1, 2.2, 2.3
describe('Property 1: Bug Condition — upsert payload includes updated_at', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    capturedUpsertPayload = {};
    setupAuthenticatedUser();
    setupProfileFetch();
  });

  it(
    'updateUserSettingsAction returns success for any valid settings input (FAILS on unfixed code)',
    async () => {
      /**
       * On UNFIXED code: the upsert payload always contains `updated_at`, so the
       * mock returns the PostgREST error and the action returns
       * `{ error: "Could not find the 'updated_at' column..." }`.
       * The assertion `result.success === true` therefore FAILS — which is the
       * expected outcome for this exploration test.
       *
       * After the fix: `updated_at` is absent from the payload, the mock returns
       * `{ error: null }`, and the action returns `{ success: true, settings: {...} }`.
       */
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            preferred_currency: fc.constantFrom('NZD', 'AUD', 'USD'),
            marketing_emails: fc.boolean(),
            order_updates: fc.boolean(),
          }),
          async (input) => {
            // Reset mocks for each generated input
            vi.clearAllMocks();
            capturedUpsertPayload = {};
            setupAuthenticatedUser();
            setupProfileFetch();

            const result = await updateUserSettingsAction(input);

            const mergedSettings = {
              ...EXISTING_PROFILE_SETTINGS,
              ...input,
            };

            expect(result).toEqual({ success: true, settings: mergedSettings });
          }
        ),
        { numRuns: 50 }
      );
    }
  );
});

// ─── Property 2: Preservation ─────────────────────────────────────────────────
// Feature: profiles-updated-at-missing, Property 2: Preservation
// Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5
describe('Property 2: Preservation — existing action behaviour is unchanged', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    capturedUpsertPayload = {};
    upsertShouldSucceed = true;
    upsertErrorOverride = null;
    setupAuthenticatedUser();
    setupProfileFetch();
  });

  // ── a) Auth guard ────────────────────────────────────────────────────────────
  it('returns { error: "Unauthorized" } and never calls upsert when user is not authenticated', async () => {
    // Override: unauthenticated user
    mockGetUser.mockResolvedValue({
      data: { user: null },
      error: null,
    });

    const result = await updateUserSettingsAction({ preferred_currency: 'AUD' });

    expect(result).toEqual({ error: 'Unauthorized' });
    expect(mockUpsert).not.toHaveBeenCalled();
  });

  // ── b) Key filtering (PBT) ───────────────────────────────────────────────────
  it(
    'never includes unknown keys in the upsert settings payload (PBT)',
    async () => {
      /**
       * **Validates: Requirements 3.4**
       *
       * Generates inputs that include an extra `unknownKey` field alongside
       * valid settings keys. Asserts the captured upsert payload's `settings`
       * field never contains `unknownKey`.
       */
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            preferred_currency: fc.constantFrom('NZD', 'AUD', 'USD'),
            marketing_emails: fc.boolean(),
            order_updates: fc.boolean(),
            unknownKey: fc.string(),
          }),
          async (input) => {
            vi.clearAllMocks();
            capturedUpsertPayload = {};
            upsertShouldSucceed = true;
            upsertErrorOverride = null;
            setupAuthenticatedUser();
            setupProfileFetch();

            // Pass the full input (including unknownKey) to the action
            await updateUserSettingsAction(
              input as Parameters<typeof updateUserSettingsAction>[0]
            );

            // The settings written to the DB must not contain unknownKey
            const writtenSettings = capturedUpsertPayload.settings as Record<string, unknown>;
            expect(writtenSettings).not.toHaveProperty('unknownKey');
          }
        ),
        { numRuns: 50 }
      );
    }
  );

  // ── c) Settings merge (PBT) ──────────────────────────────────────────────────
  it(
    'merges partial updates with existing profile settings (PBT)',
    async () => {
      /**
       * **Validates: Requirements 3.1**
       *
       * Generates arbitrary existing profile settings and arbitrary partial
       * updates. Asserts the upsert payload's `settings` field contains the
       * merged result: existing values preserved, updated value overwritten.
       */
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            marketing_emails: fc.boolean(),
            order_updates: fc.boolean(),
            preferred_currency: fc.constantFrom('NZD', 'AUD', 'USD'),
          }),
          fc.record({
            preferred_currency: fc.constantFrom('NZD', 'AUD', 'USD'),
          }),
          async (existingSettings, partialUpdate) => {
            vi.clearAllMocks();
            capturedUpsertPayload = {};
            upsertShouldSucceed = true;
            upsertErrorOverride = null;
            setupAuthenticatedUser();

            // Override profile fetch to return the generated existing settings
            mockSingle.mockResolvedValue({
              data: { settings: existingSettings },
              error: null,
            });

            await updateUserSettingsAction(partialUpdate);

            const writtenSettings = capturedUpsertPayload.settings as Record<string, unknown>;
            const expectedSettings = { ...existingSettings, ...partialUpdate };

            expect(writtenSettings).toEqual(expectedSettings);
          }
        ),
        { numRuns: 50 }
      );
    }
  );

  // ── d) Cache revalidation ────────────────────────────────────────────────────
  it('calls revalidatePath("/", "layout") exactly once on successful upsert', async () => {
    await updateUserSettingsAction({ preferred_currency: 'AUD' });

    expect(revalidatePath).toHaveBeenCalledTimes(1);
    expect(revalidatePath).toHaveBeenCalledWith('/', 'layout');
  });

  // ── e) Return shape on success ───────────────────────────────────────────────
  it('returns { success: true, settings: mergedSettings } on successful upsert', async () => {
    const result = await updateUserSettingsAction({ preferred_currency: 'AUD' });

    const expectedMergedSettings = {
      ...EXISTING_PROFILE_SETTINGS,
      preferred_currency: 'AUD',
    };

    expect(result).toEqual({ success: true, settings: expectedMergedSettings });
  });

  // ── f) Return shape on failure (non-updated_at error) ────────────────────────
  it('returns { error: string } when upsert fails with a non-updated_at error', async () => {
    upsertErrorOverride = { message: 'Some other DB error' };

    const result = await updateUserSettingsAction({ preferred_currency: 'AUD' });

    expect(result).toEqual({ error: 'Some other DB error' });
  });
});
