"use client";

import { useTranslations } from "next-intl";
import { useActionState, useEffect } from "react";

import { GithubMark } from "@/components/icons/github-mark";
import { Button } from "@/components/ui/button";

import { signInWithGitHub, type LoginState } from "./actions";

export function LoginForm({ proxima }: { proxima: string }) {
  const t = useTranslations("auth");
  const [state, formAction, pending] = useActionState<LoginState, FormData>(
    signInWithGitHub,
    null,
  );

  const url = state && "url" in state ? state.url : null;

  // Sair para o GitHub é navegação de documento, não do router: o destino é
  // outro domínio e a volta acontece pelo callback.
  useEffect(() => {
    if (url) window.location.assign(url);
  }, [url]);

  const failed = state !== null && "error" in state;

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <input type="hidden" name="proxima" value={proxima} />
      <Button
        type="submit"
        size="lg"
        className="h-11 w-full"
        disabled={pending || url !== null}
      >
        <GithubMark className="size-4" />
        {pending || url ? t("signingIn") : t("signIn")}
      </Button>
      {failed ? (
        <p role="alert" className="text-sm text-danger">
          {t("errors.oauth_failed")}
        </p>
      ) : null}
    </form>
  );
}
