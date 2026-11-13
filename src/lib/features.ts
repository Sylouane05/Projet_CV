// The static Hosting build never exposes controls that need a server.
export const AI_AVAILABLE = process.env.NEXT_PUBLIC_AI_ENABLED !== "false";
