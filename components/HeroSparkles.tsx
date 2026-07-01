// Faint gold "dust" motes drifting up across the hero — pure decoration.
// Fixed particle list (no randomness) so server and client markup match, so
// this needs no client hooks. Reduced-motion users have the whole layer hidden
// via the `.hero-sparkles` rule in the globals reduced-motion guard.
const PARTICLES = [
  { left: 6, bottom: 8, size: 3, delay: 0.0, dur: 7.0, max: 0.55 },
  { left: 14, bottom: 22, size: 2, delay: 1.6, dur: 6.2, max: 0.45 },
  { left: 23, bottom: 4, size: 4, delay: 0.8, dur: 8.2, max: 0.6 },
  { left: 31, bottom: 30, size: 2, delay: 2.4, dur: 6.8, max: 0.4 },
  { left: 39, bottom: 12, size: 3, delay: 0.4, dur: 7.6, max: 0.55 },
  { left: 47, bottom: 26, size: 2, delay: 3.0, dur: 6.4, max: 0.4 },
  { left: 55, bottom: 6, size: 4, delay: 1.2, dur: 8.6, max: 0.6 },
  { left: 63, bottom: 20, size: 2, delay: 2.0, dur: 6.6, max: 0.45 },
  { left: 71, bottom: 34, size: 3, delay: 0.6, dur: 7.4, max: 0.5 },
  { left: 79, bottom: 10, size: 2, delay: 2.8, dur: 6.0, max: 0.4 },
  { left: 86, bottom: 24, size: 4, delay: 1.0, dur: 8.0, max: 0.6 },
  { left: 93, bottom: 16, size: 3, delay: 3.4, dur: 7.2, max: 0.5 },
];

export function HeroSparkles() {
  return (
    <div
      className="hero-sparkles pointer-events-none absolute inset-0 z-[6] overflow-hidden"
      aria-hidden="true"
    >
      {PARTICLES.map((p, i) => (
        <span
          key={i}
          style={
            {
              position: "absolute",
              left: `${p.left}%`,
              bottom: `${p.bottom}%`,
              width: p.size,
              height: p.size,
              borderRadius: "9999px",
              background:
                "radial-gradient(circle, #E8D5B0 0%, #C9A96E 55%, transparent 100%)",
              boxShadow: "0 0 6px rgba(201, 169, 110, 0.7)",
              animation: `sparkleDrift ${p.dur}s ease-in-out ${p.delay}s infinite`,
              "--spark-max": String(p.max),
            } as React.CSSProperties
          }
        />
      ))}
    </div>
  );
}
