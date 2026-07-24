import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { createClient } from "@/lib/supabase/server";

import { InviteForm } from "./invite-form";

/**
 * Resgate do convite. Só faz sentido para quem já autenticou e ainda não tem
 * perfil — as duas outras situações são desviadas antes de renderizar.
 */
export default async function AcceptInvitePage() {
  const t = await getTranslations("invite");
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", user.id)
    .maybeSingle();

  if (profile) redirect("/dashboard");

  return (
    <>
      <div className="flex flex-col gap-2">
        <h1 className="display text-2xl font-semibold">{t("title")}</h1>
        <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
      </div>
      <InviteForm />
    </>
  );
}
