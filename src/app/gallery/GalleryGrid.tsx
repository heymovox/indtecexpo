import Image from "next/image";
import { floorPhotos } from "@/data/floorPhotos";

export function GalleryGrid() {
  return (
    <>
      <p className="mb-6 text-sm text-steel-500" role="status">
        Showing all {floorPhotos.length} photographs from previous editions.
      </p>

      <div className="columns-2 gap-3 sm:gap-4 lg:columns-3">
        {floorPhotos.map((photo) => (
          <figure
            key={photo.id}
            className="group relative mb-3 block break-inside-avoid overflow-hidden border border-steel-200 bg-navy-900 sm:mb-4"
          >
            <Image
              src={photo.src}
              alt={photo.alt}
              width={photo.width}
              height={photo.height}
              className="h-auto w-full transition-transform duration-500 group-hover:scale-105 motion-reduce:transition-none"
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 33vw"
              loading="lazy"
            />
            <figcaption className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-navy-950 via-navy-950/70 to-transparent px-3.5 pb-3 pt-10 text-[11px] font-semibold uppercase leading-snug tracking-[0.1em] text-white">
              {photo.caption}
            </figcaption>
          </figure>
        ))}
      </div>
    </>
  );
}
