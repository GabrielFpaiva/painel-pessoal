"use client";

import { useTranslations } from "next-intl";
import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { redeemInvite, type RedeemState } from "./actions";

/** Erros que pertencem ao campo de username; o resto é erro do formulário. */
const USERNAME_ERRORS = new Set([
  "username_required",
  "username_too_short",
  "username_too_long",
  "username_invalid_chars",
  "username_taken",
]);

export function InviteForm() {
  const t = useTranslations("invite");
  const [state, formAction, pending] = useActionState<RedeemState, FormData>(
    redeemInvite,
    null,
  );

  const error = state?.error ?? null;
  const usernameError = error && USERNAME_ERRORS.has(error) ? error : null;
  const formError = error && !usernameError ? error : null;

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <Label htmlFor="code">{t("codeLabel")}</Label>
        <Input
          id="code"
          name="code"
          required
          autoComplete="off"
          spellCheck={false}
          className="tabular h-11"
          placeholder="a1b2c3d4e5f6"
          aria-invalid={formError === "code_not_found" ? true : undefined}
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="username">{t("usernameLabel")}</Label>
        <Input
          id="username"
          name="username"
          required
          autoComplete="off"
          spellCheck={false}
          className="h-11"
          placeholder="gabriel"
          aria-invalid={usernameError ? true : undefined}
          aria-describedby={usernameError ? "username-error" : "username-hint"}
        />
        {usernameError ? (
          <p id="username-error" role="alert" className="text-sm text-danger">
            {t(`errors.${usernameError}`)}
          </p>
        ) : (
          <p id="username-hint" className="text-sm text-muted-foreground">
            {t("usernameHint")}
          </p>
        )}
      </div>

      <Button type="submit" size="lg" className="h-11 w-full" disabled={pending}>
        {pending ? t("submitting") : t("submit")}
      </Button>

      {formError ? (
        <p role="alert" className="text-sm text-danger">
          {t(`errors.${formError}`)}
        </p>
      ) : null}
    </form>
  );
}
