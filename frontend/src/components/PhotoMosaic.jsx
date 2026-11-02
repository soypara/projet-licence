"use client";

import { useEffect, useMemo, useState } from "react";

// Fond : colonnes de photos de tailles variées qui défilent lentement,
// en sens opposés. Sans photo, des tuiles vertes prennent la place.
const HEIGHTS = ["h-40", "h-56", "h-32", "h-48", "h-64", "h-36"];
const COLUMNS = 5;

function buildColumns(photos) {
  const columns = Array.from({ length: COLUMNS }, () => []);
  const pool = photos.length > 0 ? photos : [null];

  // Chaque colonne reçoit au moins 6 tuiles
  for (let c = 0; c < COLUMNS; c++) {
    for (let i = 0; i < 6; i++) {
      const photo = pool[(c + i * COLUMNS) % pool.length];
      columns[c].push({
        key: `${c}-${i}`,
        src: photo,
        height: HEIGHTS[(c * 2 + i) % HEIGHTS.length],
      });
    }
  }

  return columns;
}

function Column({ tiles, direction, duration, className = "" }) {
  const half = (suffix) => (
    <div className="flex flex-col gap-3 pb-3" key={suffix}>
      {tiles.map((tile) => (
        <div
          key={`${suffix}-${tile.key}`}
          className={`${tile.height} w-full flex-none overflow-hidden rounded-2xl bg-emeraude-800/60`}
        >
          {tile.src && (
            <img
              src={tile.src}
              alt=""
              loading="lazy"
              decoding="async"
              className="h-full w-full object-cover"
            />
          )}
        </div>
      ))}
    </div>
  );

  return (
    <div className={`overflow-hidden ${className}`}>
      <div
        className={direction === "up" ? "mosaic-up" : "mosaic-down"}
        style={{ animationDuration: `${duration}s` }}
      >
        {half("a")}
        {half("b")}
      </div>
    </div>
  );
}

const MAX_BLUR = 10; // flou maximal (px) une fois l'accueil quitte

// 0 = tout en haut de l'accueil (fond net), 1 = on est dans les autres sections
function useScrollProgress() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let frame = 0;

    const compute = () => {
      frame = 0;
      const hero = document.getElementById("top");
      if (!hero) return setProgress(1);
      // Le flou commence quand on quitte le haut de l'accueil
      // et est complet quand l'accueil a presque disparu.
      const span = Math.max(hero.offsetHeight * 0.7, 1);
      const value = Math.min(Math.max(window.scrollY / span, 0), 1);
      setProgress((old) => (Math.abs(old - value) < 0.01 ? old : value));
    };

    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(compute);
    };

    compute();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  return progress;
}

export default function PhotoMosaic({ photos = [] }) {
  const columns = useMemo(() => buildColumns(photos), [photos]);
  const progress = useScrollProgress();

  return (
    <div
      aria-hidden="true"
      className="bg-jungle-fallback fixed inset-0 -z-10 overflow-hidden"
    >
      <div
        className="absolute inset-x-0 -top-4 grid h-[calc(100%+2rem)] grid-cols-3 gap-3 px-3 md:grid-cols-5"
        style={{
          filter: progress > 0 ? `blur(${(progress * MAX_BLUR).toFixed(1)}px)` : "none",
          transform: `scale(${(1 + progress * 0.06).toFixed(3)})`,
        }}
      >
        {columns.map((tiles, index) => (
          <Column
            key={index}
            tiles={tiles}
            direction={index % 2 === 0 ? "up" : "down"}
            duration={70 + index * 12}
            className={index >= 3 ? "hidden md:block" : ""}
          />
        ))}
      </div>

      {/* Accueil : photos nettes, juste un leger assombrissement pour le texte.
          Plus on descend, plus le voile sombre apparait (en plus du flou). */}
      <div className="absolute inset-0 bg-black/20" />
      <div
        className="absolute inset-0 bg-emeraude-950/65"
        style={{ opacity: progress }}
      />
      <div className="bg-veil absolute inset-0" style={{ opacity: progress }} />
    </div>
  );
}
