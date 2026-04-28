import { AlertTriangle } from "lucide-react";
import type { ReactNode } from "react";

export default function ErrorState({
  title = "We could not refresh your financial data.",
  description = "Try again in a moment. Your workspace and saved records are safe.",
  action,
}: {
  title?: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="vf-card rounded-[28px] px-6 py-12 text-center">
      <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--danger-soft)] text-[var(--danger)]">
        <AlertTriangle className="h-6 w-6" aria-hidden="true" />
      </div>
      <h3 className="text-2xl font-semibold tracking-normal text-[var(--text-primary)]">{title}</h3>
      <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-[var(--text-secondary)]">{description}</p>
      {action ? <div className="mt-6 flex justify-center">{action}</div> : null}
    </div>
  );
}
