"use client";

import { ExternalLink, FileText, Pencil, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { deleteCertificate, getDownloadUrl } from "@/app/(app)/certificados/actions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export type CertificateCardData = {
  id: string;
  title: string;
  institution: string | null;
  issued_on: string | null;
  expires_on: string | null;
  workload_hours: number | null;
  file_path: string | null;
};

export function CertificateCard({ certificate: c }: { certificate: CertificateCardData }) {
  const t = useTranslations("certificates");
  const router = useRouter();
  const [opening, setOpening] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function open() {
    if (opening) return;
    setOpening(true);
    setError(null);
    const result = await getDownloadUrl(c.id);
    setOpening(false);
    if ("url" in result) {
      window.open(result.url, "_blank", "noopener,noreferrer");
    } else {
      setError(t(`errors.${result.error}`));
    }
  }

  async function confirmDelete() {
    if (deleting) return;
    setDeleting(true);
    setError(null);
    const result = await deleteCertificate(c.id);
    if ("error" in result) {
      setDeleting(false);
      setError(t(`errors.${result.error}`));
      return;
    }
    setConfirmOpen(false);
    setDeleting(false);
    router.refresh();
  }

  return (
    <li className="flex flex-col gap-3 rounded-lg border border-border bg-surface p-4">
      <div className="flex flex-col gap-1">
        <h2 className="display text-base leading-tight font-semibold text-balance">
          {c.title}
        </h2>
        {c.institution ? (
          <p className="text-sm text-muted-foreground">{c.institution}</p>
        ) : null}
      </div>

      <dl className="flex flex-wrap gap-x-5 gap-y-1 text-sm">
        {c.issued_on ? (
          <div className="flex gap-1.5">
            <dt className="text-muted-foreground">{t("row.issued")}</dt>
            <dd className="tabular">{c.issued_on}</dd>
          </div>
        ) : null}
        {c.expires_on ? (
          <div className="flex gap-1.5">
            <dt className="text-muted-foreground">{t("row.expires")}</dt>
            <dd className="tabular">{c.expires_on}</dd>
          </div>
        ) : null}
        {c.workload_hours !== null ? (
          <div className="flex gap-1.5">
            <dt className="sr-only">{t("row.workload", { hours: c.workload_hours })}</dt>
            <dd className="tabular">{t("row.workload", { hours: c.workload_hours })}</dd>
          </div>
        ) : null}
      </dl>

      <div className="flex flex-wrap items-center gap-2">
        {c.file_path ? (
          <Button variant="outline" size="sm" onClick={open} disabled={opening}>
            <ExternalLink /> {opening ? t("row.opening") : t("row.open")}
          </Button>
        ) : (
          <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
            <FileText className="size-3.5" /> {t("row.noFile")}
          </span>
        )}
        <Button variant="ghost" size="sm" render={<Link href={`/certificados/${c.id}/editar`} />}>
          <Pencil /> {t("row.edit")}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="text-danger hover:text-danger"
          onClick={() => setConfirmOpen(true)}
        >
          <Trash2 /> {t("row.delete")}
        </Button>
      </div>

      {error ? (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      ) : null}

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("delete.title")}</DialogTitle>
            <DialogDescription>{t("delete.description")}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose render={<Button variant="outline" />}>
              {t("delete.cancel")}
            </DialogClose>
            <Button variant="destructive" onClick={confirmDelete} disabled={deleting}>
              {deleting ? t("delete.deleting") : t("delete.confirm")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </li>
  );
}
