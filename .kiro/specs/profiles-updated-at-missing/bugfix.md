# Bugfix Requirements Document

## Introduction

When an authenticated user opens the Preferences panel on the account page and changes a setting (e.g. preferred currency), the UI displays the error:

> "Could not find the 'updated_at' column of 'profiles' in the schema cache."

The error is thrown by PostgREST because `src/lib/actions/settings.ts` explicitly writes `updated_at: new Date().toISOString()` in both `upsert` calls, but the `profiles` table does not have an `updated_at` column (or the column exists but is absent from the PostgREST schema cache). The save operation fails entirely, leaving the user's settings unchanged despite the optimistic UI update.

## Bug Analysis

### Current Behavior (Defect)

1.1 WHEN an authenticated user saves any preference change (currency, marketing emails, order updates) THEN the system fails with "Could not find the 'updated_at' column of 'profiles' in the schema cache" and the settings are not persisted.

1.2 WHEN the primary upsert by `user_id` fails due to the missing `updated_at` column THEN the system attempts a fallback upsert by `email` which also includes `updated_at` and fails with the same error.

1.3 WHEN the upsert error is returned THEN the system surfaces the raw PostgREST error message to the user in the Preferences panel UI.

### Expected Behavior (Correct)

2.1 WHEN an authenticated user saves any preference change THEN the system SHALL persist the updated settings to the `profiles` table without referencing the `updated_at` column in the upsert payload.

2.2 WHEN the primary upsert by `user_id` is attempted THEN the system SHALL omit `updated_at` from the upsert payload so that PostgREST does not reject the operation.

2.3 WHEN the fallback upsert by `email` is attempted THEN the system SHALL also omit `updated_at` from the upsert payload so that the fallback path does not reproduce the same error.

### Unchanged Behavior (Regression Prevention)

3.1 WHEN an authenticated user saves a preference change THEN the system SHALL CONTINUE TO merge the new settings with the existing profile settings rather than overwriting unrelated fields.

3.2 WHEN the primary upsert by `user_id` succeeds THEN the system SHALL CONTINUE TO revalidate the Next.js layout cache so that server-rendered components reflect the updated settings.

3.3 WHEN the user is not authenticated THEN the system SHALL CONTINUE TO return an `Unauthorized` error without attempting any database write.

3.4 WHEN a preference key is not in the allowed list (`marketing_emails`, `order_updates`, `preferred_currency`) THEN the system SHALL CONTINUE TO filter it out before writing to the database.

3.5 WHEN the `profiles` row does not yet exist for the authenticated user THEN the system SHALL CONTINUE TO create it via upsert with the correct `user_id` and `email` values.
