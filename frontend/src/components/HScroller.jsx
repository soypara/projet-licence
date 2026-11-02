"use client";

import { useCallback, useEffect, useRef, useState } from "react";

// Bande horizontale défilable :
// - téléphone : on glisse au doigt ;
// - PC : flèches gauche/droite, ou on attrape la bande à la souris.
// Les enfants doivent avoir une largeur fixe et la classe "flex-none".
export default function HScroller({ children, className = "" }) {
  const ref = useRef(null);
  const drag = useRef({ active: false, startX: 0, startLeft: 0, moved: false });

  const [edges, setEdges] = useState({ start: true, end: true });
  const [dragging, setDragging] = useState(false);

  const update = useCallback(() => {
    const el = ref.current;
    if (!el) return;

    setEdges({
      start: el.scrollLeft <= 4,
      end: el.scrollLeft + el.clientWidth >= el.scrollWidth - 4,
    });
  }, []);

  useEffect(() => {
    update();

    const el = ref.current;
    if (!el) return;

    const observer = new ResizeObserver(update);
    observer.observe(el);
    Array.from(el.children).forEach((child) => observer.observe(child));

    return () => observer.disconnect();
  }, [update, children]);

  function page(direction) {
    const el = ref.current;
    if (!el) return;

    el.scrollBy({ left: direction * el.clientWidth * 0.8, behavior: "smooth" });
  }

  function onPointerDown(e) {
    if (e.pointerType !== "mouse" || e.button !== 0) return;

    drag.current = {
      active: true,
      startX: e.clientX,
      startLeft: ref.current.scrollLeft,
      moved: false,
    };
  }

  function onPointerMove(e) {
    const d = drag.current;
    if (!d.active) return;

    const delta = e.clientX - d.startX;

    if (!d.moved && Math.abs(delta) > 6) {
      d.moved = true;
      setDragging(true);
    }

    if (d.moved) ref.current.scrollLeft = d.startLeft - delta;
  }

  function endDrag() {
    if (!drag.current.active) return;

    drag.current.active = false;
    setDragging(false);
  }

  // Après un glissé à la souris, on évite d'ouvrir le lien survolé
  function onClickCapture(e) {
    if (drag.current.moved) {
      e.preventDefault();
      e.stopPropagation();
      drag.current.moved = false;
    }
  }

  const arrow =
    "absolute top-1/2 z-10 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/25 bg-emeraude-950/80 text-lg text-white backdrop-blur transition hover:bg-emeraude-900 sm:flex";

  return (
    <div className="relative">
      {!edges.start && (
        <button
          type="button"
          aria-label="←"
          onClick={() => page(-1)}
          className={`${arrow} -left-3`}
        >
          ←
        </button>
      )}

      <div
        ref={ref}
        onScroll={update}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerLeave={endDrag}
        onPointerCancel={endDrag}
        onClickCapture={onClickCapture}
        onDragStart={(e) => e.preventDefault()}
        className={`scrollbar-hide flex gap-4 overflow-x-auto overscroll-x-contain pb-2 ${
          dragging ? "cursor-grabbing select-none" : "snap-x snap-proximity sm:cursor-grab"
        } ${className}`}
      >
        {children}
      </div>

      {!edges.end && (
        <button
          type="button"
          aria-label="→"
          onClick={() => page(1)}
          className={`${arrow} -right-3`}
        >
          →
        </button>
      )}
    </div>
  );
}
