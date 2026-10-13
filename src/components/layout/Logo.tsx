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
        src={light ? "/images/brand/indtec-expo-2026-white.png" : "/images/brand/indtec-expo-2026-colored.png"}
        alt="INDTEC EXPO"
        width={985}
        height={432}
        priority={priority}
        className="h-[44px] w-auto sm:h-[52px]"
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
        src="/images/brand/indtec-expo-2026-white.png"
        alt="INDTEC EXPO 2026–2027"
        width={985}
        height={432}
        className="h-[68px] w-auto sm:h-[80px]"
        sizes="(max-width: 640px) 155px, 182px"
      />
    </Link>
  );
}
