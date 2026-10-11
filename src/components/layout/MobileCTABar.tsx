"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { primaryCta, secondaryCta } from "@/config/navigation";

const visitorWa = `https://wa.me/917406213220?text=${encodeURIComponent(
  "Hello INDTEC EXPO, I would like to register as a visitor.",
)}`;

export function MobileCTABar() {
  const pathname = usePathname();
  const hidden =
    pathname.startsWith("/admin") ||
    pathname.includes("thank-you") ||
    pathname === "/privacy-policy" ||
    pathname === "/terms" ||
    // On the registration forms this bar sat on top of the page's own submit
    // button, and its "Book Stall" / "Register" links only duplicated the form
    // the visitor is already completing.
    pathname === "/exhibitors/book-your-stall" ||
    pathname === "/visitors/register";

  if (hidden) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-navy-700 bg-navy-950/95 backdrop-blur lg:hidden">
      <div className="grid grid-cols-4 pb-[env(safe-area-inset-bottom)]">
        <Link
          href={primaryCta.href}
          className="flex flex-col items-center gap-1 bg-signal-500 py-2.5 text-white active:bg-signal-600"
        >
          <Image
            src="/images/icons/book-stall.png"
            alt=""
            width={19}
            height={19}
            className="h-[19px] w-[19px] object-contain [filter:brightness(0)_invert(1)]"
          />
          <span className="text-[10px] font-bold uppercase tracking-[0.1em]">
            Book Stall
          </span>
        </Link>
        <Link
          href={secondaryCta.href}
          className="flex flex-col items-center gap-1 border-x border-white/10 py-2.5 text-white active:bg-white/10"
        >
          <Image
            src="/images/icons/register.png"
            alt=""
            width={19}
            height={19}
            className="h-[19px] w-[19px] object-contain [filter:brightness(0)_invert(1)]"
          />
          <span className="text-[10px] font-bold uppercase tracking-[0.1em]">
            Register
          </span>
        </Link>
        <Link
          href="tel:+917406213220"
          className="flex flex-col items-center gap-1 border-r border-white/10 py-2.5 text-white active:bg-white/10"
        >
          <Image
            src="/images/icons/call.png"
            alt=""
            width={19}
            height={19}
            className="h-[19px] w-[19px] object-contain [filter:brightness(0)_invert(1)]"
          />
          <span className="text-[10px] font-bold uppercase tracking-[0.1em]">
            Call
          </span>
        </Link>
        <a
          href={visitorWa}
          target="_blank"
          rel="noopener noreferrer"
          className="flex flex-col items-center gap-1 py-2.5 text-success-500 active:bg-white/10"
        >
          <Image
            src="/images/icons/whatsapp.png"
            alt=""
            width={19}
            height={19}
            className="h-[19px] w-[19px] object-contain [filter:brightness(0)_invert(48%)_sepia(79%)_saturate(449%)_hue-rotate(86deg)_brightness(91%)_contrast(96%)]"
          />
          <span className="text-[10px] font-bold uppercase tracking-[0.1em]">
            WhatsApp
          </span>
        </a>
      </div>
    </div>
  );
}
