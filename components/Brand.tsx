import Link from "next/link";

export function Brand({ href = "/ru" }: { href?: string }) {
  return (
    <Link className="brand" href={href} aria-label="AISOLUTION Blog">
      <span className="brand-mark">
        <img className="brand-logo" src="/brand/site-mark.png" alt="" width={27} height={27} />
      </span>
      <span>
        <strong>AISOLUTION</strong>
        <small>startup verdicts</small>
      </span>
    </Link>
  );
}
