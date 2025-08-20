// Supabase clients
export { createClient } from "./supabase/client";
export { createServerClient } from "./supabase/server";

// Hooks
export { useProductAccess, useHasProduct, useHasFeature, useProduct } from "./useProductAccess";
export type { Product, ProductAccess } from "./useProductAccess";

// Types
export type { User } from "@supabase/supabase-js";