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
  apiKeyOverride?: string,
): Promise<T> {
  const url = `${getAsaasBaseUrl()}${path}`;
  const res = await fetch(url, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      "access_token": apiKeyOverride ?? getAsaasApiKey(),
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
    .eq("is_subaccount", false)
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
    is_subaccount: false,
  });

  return { asaasCustomerId: created.id };
}

// ============================================================
// SUBCONTA ASAAS (para split de pagamento)
// ------------------------------------------------------------
// Cria ou retorna a subconta Asaas de um proprietário.
// A subconta recebe o split (85% do aluguel) e a partir dela
// fazemos as transferências PIX automáticas para o owner.
// ============================================================
export interface OwnerSubaccountProfile {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  cpf?: string | null;
  phone_number?: string | null;
  birth_date?: string | null;
  // Endereço (vem da tabela addresses)
  address?: string | null;
  addressNumber?: string | null;
  complement?: string | null;
  province?: string | null; // bairro
  postalCode?: string | null;
  city?: string | null;
  state?: string | null;
}

export async function getOrCreateAsaasSubaccount(
  supabaseAdmin: any,
  owner: OwnerSubaccountProfile,
): Promise<{ walletId: string; apiKey: string; subaccountCustomerId: string }> {
  const env = getAsaasEnv();

  // 1) já existe subconta para esse owner?
  const { data: existing } = await supabaseAdmin
    .from("asaas_customers")
    .select("asaas_customer_id, asaas_wallet_id, asaas_subaccount_api_key")
    .eq("user_id", owner.id)
    .eq("environment", env)
    .eq("is_subaccount", true)
    .maybeSingle();

  if (existing?.asaas_wallet_id && existing?.asaas_subaccount_api_key) {
    return {
      walletId: existing.asaas_wallet_id,
      apiKey: existing.asaas_subaccount_api_key,
      subaccountCustomerId: existing.asaas_customer_id,
    };
  }

  if (!owner.cpf) throw new Error("CPF do proprietário é obrigatório para criar subconta Asaas");
  if (!owner.birth_date) throw new Error("Data de nascimento do proprietário é obrigatória para criar subconta Asaas");
  if (!owner.postalCode || !owner.address || !owner.addressNumber) {
    throw new Error("Endereço completo do proprietário é obrigatório para criar subconta Asaas");
  }

  // 2) cria subconta Asaas (endpoint /accounts)
  const payload: Record<string, unknown> = {
    name: `${owner.first_name} ${owner.last_name}`.trim(),
    email: owner.email,
    loginEmail: owner.email,
    cpfCnpj: owner.cpf.replace(/\D/g, ""),
    birthDate: owner.birth_date,
    mobilePhone: owner.phone_number?.replace(/\D/g, ""),
    address: owner.address,
    addressNumber: owner.addressNumber,
    complement: owner.complement ?? undefined,
    province: owner.province ?? undefined,
    postalCode: owner.postalCode.replace(/\D/g, ""),
    incomeValue: 5000, // declaração de renda mínima exigida pelo Asaas
  };

  const account = await asaasFetch<{
    id: string;
    walletId: string;
    apiKey: string;
  }>("/accounts", { method: "POST", body: JSON.stringify(payload) });

  if (!account.walletId || !account.apiKey) {
    throw new Error("Asaas não retornou walletId/apiKey ao criar subconta");
  }

  // 3) salva no banco
  await supabaseAdmin.from("asaas_customers").insert({
    user_id: owner.id,
    asaas_customer_id: account.id,
    asaas_wallet_id: account.walletId,
    asaas_subaccount_api_key: account.apiKey,
    environment: env,
    cpf_cnpj: owner.cpf.replace(/\D/g, ""),
    is_subaccount: true,
  });

  return {
    walletId: account.walletId,
    apiKey: account.apiKey,
    subaccountCustomerId: account.id,
  };
}

// Busca dados completos do owner (perfil + endereço default) para criar subconta.
export async function loadOwnerForSubaccount(
  supabaseAdmin: any,
  ownerId: string,
): Promise<OwnerSubaccountProfile> {
  const { data: profile, error: pErr } = await supabaseAdmin
    .from("profiles")
    .select("id, first_name, last_name, email, cpf, phone_number, birth_date")
    .eq("id", ownerId)
    .single();
  if (pErr || !profile) throw new Error("Perfil do proprietário não encontrado");

  const { data: addr } = await supabaseAdmin
    .from("addresses")
    .select("street, number, complement, neighborhood, city, state, zip_code")
    .eq("user_id", ownerId)
    .order("is_default", { ascending: false })
    .limit(1)
    .maybeSingle();

  return {
    ...profile,
    address: addr?.street ?? null,
    addressNumber: addr?.number ?? null,
    complement: addr?.complement ?? null,
    province: addr?.neighborhood ?? null,
    postalCode: addr?.zip_code ?? null,
    city: addr?.city ?? null,
    state: addr?.state ?? null,
  };
}
