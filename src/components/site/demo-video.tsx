/**
 * Klip fitur produk yang autoplay/muted/loop, dengan poster statis sebagai
 * fallback saat pengguna mengaktifkan prefers-reduced-motion.
 */
export function DemoVideo({
  src,
  poster,
  alt,
  className,
  eager = false,
}: {
  src: string;
  poster: string;
  alt: string;
  className?: string;
  eager?: boolean;
}) {
  return (
    <>
      <video
        autoPlay
        muted
        loop
        playsInline
        preload={eager ? "auto" : "none"}
        poster={poster}
        aria-label={alt}
        className={`motion-reduce:hidden ${className ?? ""}`}
      >
        <source src={src} type="video/mp4" />
      </video>
      <img
        src={poster}
        alt={alt}
        className={`hidden motion-reduce:block ${className ?? ""}`}
      />
    </>
  );
}
