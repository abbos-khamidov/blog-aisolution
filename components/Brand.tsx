import Image from "next/image";
import Link from "next/link";

export function Brand({ href = "/ru" }: { href?: string }) {
  return (
    <Link className="brand" href={href} aria-label="AISOLUTION Blog">
      <span className="brand-mark">
        <Image className="brand-logo brand-logo-light" src="/brand/logo-light-transparent.png" alt="" width={27} height={27} />
        <Image className="brand-logo brand-logo-dark" src="/brand/logo-dark-transparent.png" alt="" width={27} height={27} />
      </span>
      <span>
        <strong>AISOLUTION</strong>
        <small>startup verdicts</small>
      </span>
    </Link>
  );
}
