import { User } from "@supabase/supabase-js";

type ConfirmableUser = User & {
  confirmed_at?: string | null;
};

export const isEmailConfirmed = (user: User) => {
  const provider = user.app_metadata?.provider;
  const providers = Array.isArray(user.app_metadata?.providers) ? user.app_metadata.providers : [];
  const confirmableUser = user as ConfirmableUser;

  return Boolean(
    user.email_confirmed_at ||
      confirmableUser.confirmed_at ||
      provider === "google" ||
      providers.includes("google"),
  );
};
