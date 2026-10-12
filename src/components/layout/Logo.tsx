import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

export function Logo({
  light = false,
  className,
  priority = true,
}: {
  light?: boolean;
  className?: string;
  priority?: boolean;
}) {
  return (
    <Link
      href="/"
      aria-label="INDTEC EXPO — home"
      className={cn("relative block shrink-0", className)}
    >
      <Image
        src={light ? "/images/brand/logo-indtec-compact-white.png" : "/images/brand/logo-indtec-compact-dark.png"}
        alt="INDTEC EXPO"
        width={539}
        height={240}
        priority={priority}
        className="h-[48px] w-auto sm:h-[56px]"
        sizes="(max-width: 640px) 108px, 126px"
      />
    </Link>
  );
}

export function FooterLogo({ className }: { className?: string }) {
  return (
    <Link
      href="/"
      aria-label="INDTEC EXPO — home"
      className={cn("block w-fit shrink-0", className)}
    >
      <Image
        src="/images/brand/logo-footer-white.png"
        alt="INDTEC EXPO 2026–2027"
        width={600}
        height={406}
        className="h-[96px] w-auto sm:h-[110px]"
        sizes="(max-width: 640px) 142px, 163px"
      />
    </Link>
  );
}
