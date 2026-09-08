/**
 * SAML identity-provider administration.
 *
 * Registering a SAML IdP is a service-role operation against Supabase's Admin
 * SSO API, so it cannot happen in the browser. This function is the guarded
 * seam: an authenticated platform admin can add, list, update, and remove IdPs
 * without anyone handing out the service-role key.
 *
 *   POST /functions/v1/sso-admin  {"action":"list"}
 *   POST /functions/v1/sso-admin  {"action":"create","domains":["usc.edu"],
 *                                  "metadataUrl":"https://shibboleth.usc.edu/idp/shibboleth"}
 *
 * See docs/auth-sso.md for the end-to-end setup, including what USC's IdP
 * administrators need from us.
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

/**
 * Confirms the caller is a signed-in admin.
 *
 * The JWT is verified through Supabase Auth rather than decoded here, and the
 * admin role is read from `user_roles` — a claim inside a token the client
 * supplies is not evidence of anything.
 */
async function requireAdmin(request: Request): Promise<
  { ok: true; userId: string } | { ok: false; response: Response }
> {
  const authorization = request.headers.get("Authorization") ?? "";
  const token = authorization.match(/^Bearer\s+(.+)$/i)?.[1];

  if (!token) {
    return { ok: false, response: json({ error: "Not authenticated" }, 401) };
  }

  const anonClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: userData, error: userError } = await anonClient.auth.getUser(
    token,
  );
  if (userError || !userData.user) {
    return { ok: false, response: json({ error: "Invalid token" }, 401) };
  }

  const adminClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: roles, error: rolesError } = await adminClient
    .from("user_roles")
    .select("role")
    .eq("user_id", userData.user.id)
    .eq("role", "admin")
    .maybeSingle();

  if (rolesError) {
    console.error("sso-admin: role lookup failed", rolesError.message);
    return {
      ok: false,
      response: json({ error: "Could not verify permissions" }, 500),
    };
  }

  if (!roles) {
    console.warn(`sso-admin: denied non-admin ${userData.user.id}`);
    return { ok: false, response: json({ error: "Admin role required" }, 403) };
  }

  return { ok: true, userId: userData.user.id };
}

/** Calls the Admin SSO API, which supabase-js does not wrap. */
async function adminSsoRequest(
  path: string,
  init: RequestInit = {},
): Promise<Response> {
  return await fetch(`${SUPABASE_URL}/auth/v1/admin/sso/providers${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
      apikey: SERVICE_ROLE_KEY,
      "Content-Type": "application/json",
      ...init.headers,
    },
  });
}

interface CreateProviderBody {
  action: "create";
  /** Email domains this IdP authenticates, e.g. ["usc.edu"]. */
  domains: string[];
  /** IdP metadata URL. Preferred: Supabase re-reads it when certificates roll. */
  metadataUrl?: string;
  /** Inline IdP metadata XML, for an IdP with no public metadata endpoint. */
  metadataXml?: string;
  /**
   * Maps SAML assertion attributes onto user metadata. USC's Shibboleth emits
   * the standard eduPerson set; see docs/auth-sso.md.
   */
  attributeMapping?: Record<string, unknown>;
}

serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (request.method !== "POST") {
    return json({ error: "POST only" }, 405);
  }

  if (!SUPABASE_URL || !SERVICE_ROLE_KEY || !SUPABASE_ANON_KEY) {
    console.error("sso-admin: missing environment configuration");
    return json({ error: "Function is misconfigured" }, 500);
  }

  const auth = await requireAdmin(request);
  if (!auth.ok) return auth.response;

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return json({ error: "Body must be JSON" }, 400);
  }

  const action = body.action;

  try {
    switch (action) {
      case "list": {
        const response = await adminSsoRequest("");
        const data = await response.json();
        return json(data, response.status);
      }

      case "get": {
        const id = String(body.providerId ?? "");
        if (!id) return json({ error: "providerId is required" }, 400);
        const response = await adminSsoRequest(`/${encodeURIComponent(id)}`);
        return json(await response.json(), response.status);
      }

      case "create": {
        const input = body as unknown as CreateProviderBody;

        if (!Array.isArray(input.domains) || input.domains.length === 0) {
          return json({ error: "At least one domain is required" }, 400);
        }
        if (!input.metadataUrl && !input.metadataXml) {
          return json(
            { error: "Provide metadataUrl or metadataXml" },
            400,
          );
        }

        const response = await adminSsoRequest("", {
          method: "POST",
          body: JSON.stringify({
            type: "saml",
            domains: input.domains,
            ...(input.metadataUrl
              ? { metadata_url: input.metadataUrl }
              : { metadata_xml: input.metadataXml }),
            attribute_mapping: input.attributeMapping ?? DEFAULT_ATTRIBUTE_MAPPING,
          }),
        });

        const data = await response.json();
        console.log(
          `sso-admin: ${auth.userId} created provider for ${input.domains.join(", ")} (${response.status})`,
        );
        return json(data, response.status);
      }

      case "update": {
        const id = String(body.providerId ?? "");
        if (!id) return json({ error: "providerId is required" }, 400);

        const payload: Record<string, unknown> = {};
        if (body.domains) payload.domains = body.domains;
        if (body.metadataUrl) payload.metadata_url = body.metadataUrl;
        if (body.metadataXml) payload.metadata_xml = body.metadataXml;
        if (body.attributeMapping) {
          payload.attribute_mapping = body.attributeMapping;
        }

        const response = await adminSsoRequest(`/${encodeURIComponent(id)}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        });
        console.log(`sso-admin: ${auth.userId} updated provider ${id}`);
        return json(await response.json(), response.status);
      }

      case "delete": {
        const id = String(body.providerId ?? "");
        if (!id) return json({ error: "providerId is required" }, 400);
        const response = await adminSsoRequest(`/${encodeURIComponent(id)}`, {
          method: "DELETE",
        });
        console.warn(`sso-admin: ${auth.userId} deleted provider ${id}`);
        return json(await response.json(), response.status);
      }

      default:
        return json(
          { error: `Unknown action: ${String(action)}` },
          400,
        );
    }
  } catch (error) {
    console.error("sso-admin: unhandled error", error);
    return json({ error: "Internal server error" }, 500);
  }
});

/**
 * Default mapping from SAML assertion attributes to Supabase user metadata.
 *
 * Keys are OIDs because Shibboleth deployments commonly release attributes by
 * OID rather than friendly name; both spellings are listed so the mapping works
 * either way.
 */
const DEFAULT_ATTRIBUTE_MAPPING = {
  keys: {
    email: {
      names: [
        "urn:oid:0.9.2342.19200300.100.1.3", // mail
        "mail",
        "email",
        "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress",
      ],
    },
    first_name: {
      names: [
        "urn:oid:2.5.4.42", // givenName
        "givenName",
        "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/givenname",
      ],
    },
    last_name: {
      names: [
        "urn:oid:2.5.4.4", // sn
        "sn",
        "surname",
        "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/surname",
      ],
    },
    // eduPersonPrincipalName — stable across name changes, unlike mail.
    eppn: {
      names: ["urn:oid:1.3.6.1.4.1.5923.1.1.1.6", "eduPersonPrincipalName"],
    },
    affiliation: {
      names: ["urn:oid:1.3.6.1.4.1.5923.1.1.1.1", "eduPersonAffiliation"],
    },
  },
};
