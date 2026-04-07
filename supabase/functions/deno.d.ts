// Ambient type declarations for Deno globals used in Supabase Edge Functions.
// The VS Code TypeScript server uses this to suppress "Cannot find name 'Deno'" errors.
// At runtime, these are provided by the actual Deno runtime in Supabase's edge infrastructure.

declare const Deno: {
  env: {
    get(key: string): string | undefined;
  };
  serve(handler: (req: Request) => Response | Promise<Response>): void;
};
