# Bugfix Requirements Document

## Introduction

Users who request a password reset receive an email with a link to `/account/update-password`. Clicking that link returns a 404 "Page Not Found" error because the route was never implemented — the folder `src/app/account/update-password/` exists but contains no `page.tsx`. This blocks users from completing the password reset flow entirely.

## Bug Analysis

### Current Behavior (Defect)

1.1 WHEN a user clicks the "Reset My Password" link in the password reset email THEN the system returns a 404 "Page Not Found" error

1.2 WHEN a user navigates directly to `/account/update-password` THEN the system returns a 404 "Page Not Found" error instead of rendering a password update form

1.3 WHEN the Supabase password reset token is present in the URL (via the auth callback redirect) THEN the system fails to present a form for the user to enter a new password

### Expected Behavior (Correct)

2.1 WHEN a user clicks the "Reset My Password" link in the password reset email THEN the system SHALL render a password update form at `/account/update-password`

2.2 WHEN a user navigates to `/account/update-password` with a valid Supabase recovery session THEN the system SHALL display a form allowing the user to enter and confirm a new password

2.3 WHEN a user submits a valid new password via the update-password form THEN the system SHALL update the password via Supabase Auth and redirect the user to `/account`

2.4 WHEN a user submits a new password that does not meet validation requirements (e.g. too short, confirmation mismatch) THEN the system SHALL display an inline validation error without submitting

2.5 WHEN a user navigates to `/account/update-password` without a valid recovery session THEN the system SHALL redirect the user to `/login` with an appropriate error message

### Unchanged Behavior (Regression Prevention)

3.1 WHEN a user logs in normally (not via password reset) THEN the system SHALL CONTINUE TO authenticate and redirect to `/account` as before

3.2 WHEN a user visits `/account` while authenticated THEN the system SHALL CONTINUE TO display the account overview page without disruption

3.3 WHEN the auth callback route at `/auth/callback` processes a code THEN the system SHALL CONTINUE TO exchange the code for a session and redirect to the `next` parameter as before

3.4 WHEN a user completes MFA verification at `/auth/mfa` THEN the system SHALL CONTINUE TO redirect to `/account` as before

3.5 WHEN a user requests a password reset email THEN the system SHALL CONTINUE TO receive the email with the reset link pointing to `/account/update-password`
