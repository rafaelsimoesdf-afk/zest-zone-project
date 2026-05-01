// Helper compartilhado para chamadas à API do Asaas.
// Toggle sandbox/produção via env ASAAS_ENVIRONMENT (default: sandbox).

export type AsaasEnv = "sandbox" | "production";

export function getAsaasEnv(): AsaasEnv {
  const env = (Deno.env.get("ASAAS_ENVIRONMENT") ?? "sandbox").toLowerCase();
  return env === "production" ? "production" : "sandbox";
}

export function getAsaasBaseUrl(): string {
  return getAsaasEnv() === "production"
    ? "https://api.asaas.com/v3"
    : "https://sandbox.asaas.com/api/v3";
}

export function getAsaasApiKey(): string {
  const env = getAsaasEnv();
  const key = env === "production"
    ? Deno.env.get("ASAAS_API_KEY_PRODUCTION")
    : Deno.env.get("ASAAS_API_KEY_SANDBOX");
  if (!key) {
    throw new Error(`ASAAS_API_KEY_${env.toUpperCase()} não configurada`);
  }
  return key;
}

export async function asaasFetch<T = any>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const url = `${getAsaasBaseUrl()}${path}`;
  const res = await fetch(url, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      "access_token": getAsaasApiKey(),
      "User-Agent": "InfiniteDrive/1.0",
      ...(init.headers ?? {}),
    },
  });

  const text = await res.text();
  let data: any = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = { raw: text };
  }

  if (!res.ok) {
    const msg = data?.errors?.[0]?.description ?? data?.message ?? `Asaas error ${res.status}`;
    throw new Error(`[Asaas ${res.status}] ${msg}`);
  }

  return data as T;
}

// Cria ou retorna customer Asaas para um perfil.
export async function getOrCreateAsaasCustomer(
  supabaseAdmin: any,
  profile: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    cpf?: string | null;
    phone_number?: string | null;
  },
): Promise<{ asaasCustomerId: string }> {
  const env = getAsaasEnv();

  const { data: existing } = await supabaseAdmin
    .from("asaas_customers")
    .select("asaas_customer_id")
    .eq("user_id", profile.id)
    .eq("environment", env)
    .maybeSingle();

  if (existing?.asaas_customer_id) {
    return { asaasCustomerId: existing.asaas_customer_id };
  }

  if (!profile.cpf) {
    throw new Error("CPF não cadastrado no perfil — necessário para criar cliente Asaas");
  }

  const created = await asaasFetch<{ id: string }>("/customers", {
    method: "POST",
    body: JSON.stringify({
      name: `${profile.first_name} ${profile.last_name}`.trim(),
      email: profile.email,
      cpfCnpj: profile.cpf.replace(/\D/g, ""),
      mobilePhone: profile.phone_number?.replace(/\D/g, ""),
      notificationDisabled: false,
    }),
  });

  await supabaseAdmin.from("asaas_customers").insert({
    user_id: profile.id,
    asaas_customer_id: created.id,
    environment: env,
    cpf_cnpj: profile.cpf.replace(/\D/g, ""),
  });

  return { asaasCustomerId: created.id };
}
