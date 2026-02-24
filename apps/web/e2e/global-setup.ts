import { clerkSetup } from '@clerk/testing/playwright';

/**
 * Playwright global setup — runs once before any project.
 * Fetches a Clerk testing token from the backend API.
 * Requires CLERK_SECRET_KEY in environment.
 */
async function globalSetup() {
  await clerkSetup();
}

export default globalSetup;
