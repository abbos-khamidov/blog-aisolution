import Link from "next/link";

export function Brand({ href = "/ru" }: { href?: string }) {
  return (
    <Link className="brand" href={href} aria-label="AISOLUTION Blog">
      <span className="brand-mark">AI</span>
      <span>
        <strong>AISOLUTION</strong>
        <small>blog</small>
      </span>
    </Link>
  );
}
