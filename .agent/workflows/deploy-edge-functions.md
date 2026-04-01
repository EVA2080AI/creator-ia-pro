---
description: How to deploy Supabase Edge Functions for Creator IA Pro
---

# Deploy Edge Functions — Creator IA Pro

## ⚠️ CRITICAL RULES

### 1. `verify_jwt` Configuration

**NEVER deploy `ai-proxy` with `verify_jwt: true`.**

The `VITE_SUPABASE_PUBLISHABLE_KEY` used in production is a custom key that does NOT pass Supabase's built-in JWT verification layer. When `verify_jwt: true`, Supabase rejects the request with **401** before the function code even executes.

| Function | `verify_jwt` | Reason |
|---|---|---|
| `ai-proxy` | **`false`** | Called from frontend with custom API key; rate-limiting is done inside the function via `extractUserIdFromJwt()` |
| `stripe-webhook` | **`false`** | Called by Stripe servers (no Supabase JWT); verified via `stripe-signature` header |
| `bold-webhook` | **`false`** | Called by Bold servers; verified via webhook signature |
| `bold-checkout` | `true` | Called from authenticated frontend |
| `media-proxy` | `true` | Called from authenticated frontend |
| `create-checkout` | `true` | Called from authenticated frontend |
| `customer-portal` | `true` | Called from authenticated frontend |
| `admin-save-settings` | `true` | Called from authenticated admin frontend |
| `studio-generate` | `true` | Called from authenticated frontend |
| `buy-credits` | `true` | Called from authenticated frontend |
| `check-subscription` | `true` | Called from authenticated frontend |

### 2. Supabase Project ID

```
Project: creator-ia-pro
ID: zfzkohjdwggctogehlkw
Region: us-east-1
```

### 3. Deploy Steps

// turbo-all

1. Read the function file:
```bash
cat supabase/functions/<function-name>/index.ts
```

2. Deploy using Supabase MCP tool `deploy_edge_function` with:
   - `project_id`: `zfzkohjdwggctogehlkw`
   - `name`: the function slug (e.g., `ai-proxy`)
   - `verify_jwt`: Check the table above — **default to `false` for ai-proxy and webhooks**
   - `files`: array with `{ name: "index.ts", content: "<file contents>" }`

3. Verify deployment succeeded by checking the returned `version` and `status: "ACTIVE"`

4. Check logs with `get_logs` (service: `edge-function`) to confirm requests return 200

### 4. Common Pitfalls

- **DO NOT** change `verify_jwt` from `false` to `true` on `ai-proxy` — it will break ALL AI features immediately
- **DO NOT** deploy with special unicode characters in string literals — use ASCII-safe alternatives
- **ALWAYS** test after deploy by checking the edge-function logs for 200 status codes
- The `ai-proxy` handles its own auth via JWT extraction from headers — it doesn't need Supabase's built-in verification

### 5. Tier & Credit Constants (v3 — April 2026)

When modifying `stripe-webhook`, keep these values in sync:

```
Starter:  500 credits/month
Creator:  1,200 credits/month  
Pymes:    4,000 credits/month
Free:     5 credits/month (set in frontend only)

Credit Packs:
  Pack 1: 200 credits
  Pack 2: 1,000 credits
  Pack 3: 2,000 credits
```

### 6. SQL Admin Functions

All admin SQL functions (`admin_list_users`, `admin_add_credits`, etc.) must call:
```sql
has_role(auth.uid(), 'admin')
```
**NEVER** use the shorthand `has_role('admin')` — it causes `function has_role(unknown) does not exist`.
