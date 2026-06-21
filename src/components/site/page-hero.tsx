export function PageHero({
  eyebrow,
  title,
  subtitle,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
}) {
  return (
    <section className="border-b border-line bg-sand/40">
      <div className="mx-auto max-w-3xl px-5 py-16 text-center md:py-20">
        {eyebrow && (
          <span className="font-mono text-xs uppercase tracking-widest text-teal-700">
            {eyebrow}
          </span>
        )}
        <h1 className="mt-3 font-display text-4xl font-medium leading-tight text-ink md:text-5xl">
          {title}
        </h1>
        {subtitle && <p className="mt-4 text-lg text-muted">{subtitle}</p>}
      </div>
    </section>
  );
}
