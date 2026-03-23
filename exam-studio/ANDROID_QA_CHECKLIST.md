# Android QA Checklist

Use this checklist before cutting a release build.

## Environment

- Confirm `.env` uses the correct LAN or production API URL.
- Start backend API and verify the Android device can reach it.
- Run:
  ```bash
  npm run check
  npm run lint
  ```

## Auth

- Sign in with a normal email/password account.
- Sign in with an MFA-enabled account and complete TOTP or backup code flow.
- Confirm app reopens into an authenticated state after restart.
- Sign out and confirm protected routes redirect back to `sign-in`.

## Practice

- Open `Practice` tab and confirm catalog loads.
- Use quick type chips and advanced filters.
- Remove active filters directly from the summary bar.
- Start `Quick Practice`.
- Start a session using selected questions.
- Leave a session open long enough to trigger a reminder notification.
- Submit a completed session and confirm draft cleanup + result state.
- Open `Session History` and resume an existing session.

## Papers

- Create a draft paper from the `Papers` tab.
- Edit title, instructions, school, year, and answer-key setting.
- Reorder questions.
- Replace a question with a compatible candidate.
- Remove a question.
- Finalize the paper.
- Generate PDF export.
- Open the generated PDF.
- Share the generated PDF to another app.
- Regenerate export after metadata/content changes.
- Delete a draft paper.

## Settings

- Change locale, timezone, date format, and 24-hour clock.
- Toggle auto-save drafts.
- Toggle submit confirmation.
- Enable reminder notifications and change interval.
- Disable reminder notifications and confirm scheduled reminders are cleared.
- Change password with:
  - wrong current password
  - mismatched confirmation
  - valid new password
- Confirm changing password signs out other devices.
- Revoke a single device session.
- Revoke all other sessions.
- Clear local drafts.

## Release Confidence

- Reopen the app after a full device restart.
- Verify no red screen, no infinite loading state, and no broken tab navigation.
- Confirm exported PDF still opens after app restart.
- Capture screenshots of sign-in, practice, papers, settings, and exported PDF flow.
