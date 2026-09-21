---
name: NUTTY authentication boundary
description: Authentication and authorization decision for the NUTTY web and API layers.
---

Use Clerk for browser authentication and session persistence. API routes that expose or mutate personal context must require the authenticated Clerk user; browser requests should rely on same-origin Clerk cookies rather than manually attaching bearer tokens.

**Why:** Clerk is the configured account system, and the product requires secure account, session, logout, verification, and recovery flows.

**How to apply:** Keep auth wiring centralized in the web provider and server middleware. Do not reintroduce local password storage, fake profile fallbacks, or unauthenticated personal endpoints.