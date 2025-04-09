// Re-export from all API layers with clear naming

// Shared types and constants
export * from "./shared";

// Client-side API (for use in Client Components)
import * as clientApi from "./client";
export { clientApi };

// Server-side API (for use in Server Components and Actions)
import * as serverApi from "./server";
export { serverApi };
 