import Image from "next/image";
import { cn } from "@/lib/utils";

type LogoVariant = "mark" | "wordmark" | "adaptive";

/**
 * Dalil logo.
 *
 * - `mark`       — just the circular icon (square aspect)
 * - `wordmark`   — icon + "Dalil" lockup (wide aspect)
 * - `adaptive`   — mark on narrow screens, wordmark from md and up.
 *
 * `size` is the rendered height in pixels. Width is derived from the
 * natural aspect ratio of each asset; both ship with generous whitespace
 * so we scale inside a clipping container to keep small sizes tight.
 */
export function Logo({
  variant = "adaptive",
  size = 28,
  className,
  priority,
}: {
  variant?: LogoVariant;
  size?: number;
  className?: string;
  priority?: boolean;
}) {
  if (variant === "mark") {
    return <LogoMark size={size} className={className} priority={priority} />;
  }
  if (variant === "wordmark") {
    return (
      <LogoWordmark size={size} className={className} priority={priority} />
    );
  }
  return (
    <>
      <LogoMark
        size={size}
        priority={priority}
        className={cn("md:hidden", className)}
      />
      <LogoWordmark
        size={size}
        priority={priority}
        className={cn("hidden md:inline-flex", className)}
      />
    </>
  );
}

export function LogoMark({
  size = 28,
  className,
  priority,
}: {
  size?: number;
  className?: string;
  priority?: boolean;
}) {
  return (
    <span
      aria-label="Dalil"
      className={cn("inline-flex shrink-0 items-center", className)}
      style={{ height: size, width: size }}
    >
      <span
        className="relative overflow-hidden rounded-full"
        style={{ height: size, width: size }}
      >
        <Image
          src="/dalil-icon.webp"
          alt=""
          width={500}
          height={500}
          priority={priority}
          sizes={`${size}px`}
          className="h-full w-full scale-[1.12] object-cover"
        />
      </span>
    </span>
  );
}

export function LogoWordmark({
  size = 28,
  className,
  priority,
}: {
  size?: number;
  className?: string;
  priority?: boolean;
}) {
  // The wordmark asset is square (1024×1024) but the actual content sits
  // in a roughly 3.4:1 band horizontally. Render a wider visible strip and
  // scale the square image so the wordmark fills it without cropping.
  const visibleAspect = 3.4;
  const width = Math.round(size * visibleAspect);
  return (
    <span
      aria-label="Dalil"
      className={cn("inline-flex shrink-0 items-center", className)}
      style={{ height: size, width }}
    >
      <span
        className="relative overflow-hidden"
        style={{ height: size, width }}
      >
        <Image
          src="/dalil-logo.webp"
          alt="Dalil"
          width={1024}
          height={1024}
          priority={priority}
          sizes={`${width}px`}
          className="absolute left-1/2 top-1/2 h-[260%] w-[260%] -translate-x-1/2 -translate-y-1/2 object-contain"
        />
      </span>
    </span>
  );
}
