const env = {
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
  supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY ?? "",
  rootDomain: process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? "ekatalox.com",
  marketingDomain:
    process.env.NEXT_PUBLIC_MARKETING_DOMAIN ?? "ekatalox.com",
  adminDomain: process.env.NEXT_PUBLIC_ADMIN_DOMAIN ?? "admin.ekatalox.com",
  appDomain: process.env.NEXT_PUBLIC_APP_DOMAIN ?? "app.ekatalox.com",
};

export const appEnv = env;

export function isProductionEnvironment() {
  return process.env.VERCEL_ENV === "production";
}

export function isPreviewEnvironment() {
  return process.env.VERCEL_ENV === "preview";
}

export function shouldAllowDemoFallback() {
  return !isProductionEnvironment();
}

export function hasSupabaseEnv() {
  return Boolean(env.supabaseUrl && env.supabaseAnonKey);
}

export function hasServiceRoleEnv() {
  return hasSupabaseEnv() && Boolean(env.supabaseServiceRoleKey);
}

export function requireSupabaseEnv() {
  if (!hasSupabaseEnv()) {
    throw new Error("Supabase environment variables are missing.");
  }

  return {
    url: env.supabaseUrl,
    anonKey: env.supabaseAnonKey,
  };
}

export function requireServiceRoleEnv() {
  if (!hasServiceRoleEnv()) {
    throw new Error("Supabase service role environment variable is missing.");
  }

  return {
    url: env.supabaseUrl,
    serviceRoleKey: env.supabaseServiceRoleKey,
  };
}