"use client";

import Image from "next/image";
import { useState } from "react";

import { Icon } from "@/components/ui/Icon";
import { cn } from "@/lib/utils";

interface VideoEmbedProps {
  videoId: string;
  title: string;
  caption?: string;
  className?: string;
}

export function VideoEmbed({ videoId, title, caption, className }: VideoEmbedProps) {
  const [playing, setPlaying] = useState(false);

  return (
    <figure
      className={cn(
        "group relative overflow-hidden border border-white/12 bg-navy-900",
        className,
      )}
    >
      <div className="relative aspect-video">
        {playing ? (
          <iframe
            className="absolute inset-0 h-full w-full"
            src={`https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1&playsinline=1`}
            title={title}
            loading="lazy"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            referrerPolicy="strict-origin-when-cross-origin"
            allowFullScreen
          />
        ) : (
          <button
            type="button"
            onClick={() => setPlaying(true)}
            className="absolute inset-0 cursor-pointer"
            aria-label={`Play video: ${title}`}
          >
            <Image
              src={`https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`}
              alt=""
              fill
              sizes="(max-width: 1024px) 100vw, 566px"
              className="object-cover opacity-70 transition duration-500 group-hover:scale-[1.03] group-hover:opacity-90 motion-reduce:transition-none"
            />
            <span className="absolute inset-0 bg-gradient-to-t from-navy-950/90 via-navy-950/25 to-navy-950/45" />
            <span className="absolute inset-0 grid place-items-center">
              <span className="flex h-14 w-14 items-center justify-center rounded-[2px] border border-gold-400/60 bg-navy-950/55 text-gold-400 backdrop-blur-sm transition duration-300 group-hover:scale-110 group-hover:border-gold-400 group-hover:bg-navy-950/75 motion-reduce:transition-none">
                <Icon name="play" size={22} className="translate-x-0.5 fill-current" />
              </span>
            </span>
            {caption ? (
              <span className="absolute inset-x-0 bottom-0 p-5 text-left">
                <span className="block text-sm font-semibold uppercase tracking-[0.12em] text-white sm:text-base">
                  {caption}
                </span>
              </span>
            ) : null}
          </button>
        )}
      </div>
    </figure>
  );
}
