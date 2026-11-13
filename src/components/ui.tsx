"use client";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
export function Notice({
  children,
  error = false,
}: {
  children: React.ReactNode;
  error?: boolean;
}) {
  return (
    <div
      className={`notice ${error ? "error" : ""}`}
      role={error ? "alert" : "status"}
    >
      {children}
    </div>
  );
}
export function Empty({
  title,
  children,
  href,
  label,
}: {
  title: string;
  children: React.ReactNode;
  href?: string;
  label?: string;
}) {
  return (
    <div className="empty">
      <span className="empty-icon">↗</span>
      <h2>{title}</h2>
      <p>{children}</p>
      {href && (
        <Link className="button" href={href}>
          {label}
        </Link>
      )}
    </div>
  );
}
export function Private({
  children,
  admin = false,
}: {
  children: React.ReactNode;
  admin?: boolean;
}) {
  const q = useQuery({
    queryKey: ["me"],
    queryFn: () => api<{ id: string; name: string; role: string }>("me"),
    retry: false,
  });
  if (q.isPending) return <Notice>Opening your workspace…</Notice>;
  if (q.error)
    return (
      <Empty title="Your workspace is waiting" href="/login" label="Sign in">
        {q.error.message}
      </Empty>
    );
  if (admin && q.data.role !== "admin")
    return <Notice error>Administrator access is required.</Notice>;
  return children;
}
export function QueryError({
  error,
  retry,
}: {
  error: Error;
  retry: () => unknown;
}) {
  return (
    <Notice error>
      {error.message}{" "}
      <button className="text-button" onClick={() => retry()}>
        Try again
      </button>
    </Notice>
  );
}
export function PageHeading({
  eyebrow,
  title,
  children,
  action,
}: {
  eyebrow: string;
  title: string;
  children?: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div className="page-heading">
      <div>
        <div className="eyebrow">{eyebrow}</div>
        <h1>{title}</h1>
        {children && <p>{children}</p>}
      </div>
      {action}
    </div>
  );
}
export function Pagination({
  page,
  onChange,
  hasNext,
}: {
  page: number;
  onChange: (page: number) => void;
  hasNext: boolean;
}) {
  return (
    <div className="actions results" aria-label="Pagination">
      <button
        className="button secondary"
        disabled={page === 1}
        onClick={() => onChange(page - 1)}
      >
        Previous
      </button>
      <span className="subtle">Page {page}</span>
      <button
        className="button secondary"
        disabled={!hasNext}
        onClick={() => onChange(page + 1)}
      >
        Next
      </button>
    </div>
  );
}
