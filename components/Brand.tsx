import Link from "next/link";

export function Brand({ href = "/ru" }: { href?: string }) {
  return (
    <Link className="brand" href={href} aria-label="AISOLUTION Blog">
      <span className="brand-mark">
        <img className="brand-logo brand-logo-light" src="/brand/logo-light-transparent.png" alt="" />
        <img className="brand-logo brand-logo-dark" src="/brand/logo-dark-transparent.png" alt="" />
      </span>
      <span>
        <strong>AISOLUTION</strong>
        <small>sharp AI brief</small>
      </span>
    </Link>
  );
}
