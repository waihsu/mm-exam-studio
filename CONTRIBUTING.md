# Contributing to MM Exam Studio

Thanks for improving the project. Please keep changes focused, accessible, and safe for learners.

## Before opening a pull request

1. Create a focused branch from the current default branch.
2. Do not commit `.env` files, production data, credentials, or learner information.
3. Add or update tests when a behavior changes.
4. Run the checks relevant to your change. For web/API work, run `bun run verify:release`; for mobile work, run `npm run check` and `npm run lint` inside `exam-studio`.
5. Describe the learner/admin impact, verification performed, and any migration or configuration requirement.

## Content contributions

Question content must be accurate, traceable, and permitted for reuse. Use sources you are allowed to publish, include enough context for reviewers, and do not upload copyrighted exam material without permission. See [Content policy](docs/CONTENT_POLICY.md).

## Pull request expectations

- Keep the pull request narrow and easy to review.
- Preserve Burmese and English copy quality when editing user-facing screens.
- Do not weaken answer validation, auth, authorization, or audit checks to make a flow pass.
- Include screenshots for visible UI changes and a short test plan for workflow changes.

For security vulnerabilities, do not create a public issue; follow [SECURITY.md](SECURITY.md).
