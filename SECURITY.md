# Security Issue: Pseudo-Authentication & Spoofable Identity

**Status:** Open / Unresolved
**Impact:** App-Wide
**Severity:** Medium/High (Spoofable identities allow unauthorized actions)

## Description
Currently, the application relies on pseudo-authentication. User identities (e.g., `userId` or `username`) are stored directly in `localStorage` by the client and passed to the backend either in request bodies or custom headers (like `X-User-Id`). 

Because there is no cryptographic verification of these identities (such as a verified JSON Web Token (JWT) or an HTTP-only secure session cookie), any client can easily spoof another user's identity by modifying their `localStorage` or manually constructing HTTP requests.

## Required Fixes
1. **Authentication Middleware:** Implement robust token-based authentication (e.g., JWT) or session-based authentication on the backend.
2. **Login/Registration Flow:** Ensure the login endpoints return cryptographically signed tokens that the client must provide in the `Authorization: Bearer <token>` header.
3. **Route Protection:** Apply auth verification middleware to all protected API routes. The middleware should decode the token and securely inject the authenticated user's ID into `req.user`.
4. **Remove Client-Supplied IDs:** Refactor all endpoints (including Event, IPO, and Expense tracking) to derive the acting user strictly from the secure `req.user` context, ignoring any `userId` or `uploaderId` passed in the request body.

*Note: This issue was documented during the IPO Funding Tracker feature implementation but represents a broader architectural gap that must be addressed system-wide.*
