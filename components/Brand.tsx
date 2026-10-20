import Link from "next/link";

export function Brand({ href = "/ru" }: { href?: string }) {
  return (
    <Link className="brand" href={href} aria-label="AISOLUTION Blog">
      <img className="brand-logo brand-logo-dark" src="/brand/mark-on-dark.png" alt="" width={32} height={32} />
      <img className="brand-logo brand-logo-light" src="/brand/mark-on-light.png" alt="" width={32} height={32} />
      <span>
        aisolution <em>blog</em>
      </span>
    </Link>
  );
}
