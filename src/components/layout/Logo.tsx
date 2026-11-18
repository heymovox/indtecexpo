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
        src="/images/brand/indtec-logo-2027.png"
        alt="INDTEC EXPO"
        width={978}
        height={452}
        priority={priority}
        className={cn(
          "h-[44px] w-auto sm:h-[52px]",
          light && "[filter:brightness(0)_invert(1)]",
        )}
        sizes="(max-width: 640px) 100px, 119px"
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
        src="/images/brand/indtec-logo-2027.png"
        alt="INDTEC EXPO"
        width={978}
        height={452}
        className="h-[68px] w-auto [filter:brightness(0)_invert(1)] sm:h-[80px]"
        sizes="(max-width: 640px) 155px, 182px"
      />
    </Link>
  );
}
