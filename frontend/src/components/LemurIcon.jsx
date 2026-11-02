// Maki (lémurien catta) : animal emblématique de Madagascar.
// Mascotte provisoire, en attendant le vrai logo de l'agence.
// Dessin original, sans image externe.
export default function LemurIcon({ size = 64, className = "" }) {
  return (
    <svg
      viewBox="0 0 64 64"
      width={size}
      height={size}
      className={className}
      role="img"
      aria-hidden="true"
    >
      {/* oreilles */}
      <circle cx="13" cy="17" r="8" fill="#8a9097" />
      <circle cx="13" cy="17" r="4.2" fill="#d9a3a0" />
      <circle cx="51" cy="17" r="8" fill="#8a9097" />
      <circle cx="51" cy="17" r="4.2" fill="#d9a3a0" />

      {/* tête grise */}
      <ellipse cx="32" cy="34" rx="23" ry="22" fill="#9ca3aa" />

      {/* visage blanc */}
      <ellipse cx="32" cy="37" rx="16" ry="17" fill="#f7f4ee" />

      {/* masques noirs autour des yeux */}
      <ellipse
        cx="22.5"
        cy="30"
        rx="6.6"
        ry="9"
        transform="rotate(-22 22.5 30)"
        fill="#1d2126"
      />
      <ellipse
        cx="41.5"
        cy="30"
        rx="6.6"
        ry="9"
        transform="rotate(22 41.5 30)"
        fill="#1d2126"
      />

      {/* yeux ambrés */}
      <circle cx="23" cy="31" r="3.2" fill="#f2a93b" />
      <circle cx="41" cy="31" r="3.2" fill="#f2a93b" />
      <circle cx="23" cy="31" r="1.4" fill="#111" />
      <circle cx="41" cy="31" r="1.4" fill="#111" />
      <circle cx="24" cy="30" r="0.7" fill="#fff" />
      <circle cx="42" cy="30" r="0.7" fill="#fff" />

      {/* museau */}
      <ellipse cx="32" cy="45" rx="7.5" ry="6" fill="#fffdf9" />
      <ellipse cx="32" cy="42.6" rx="4.2" ry="3" fill="#1d2126" />
      <path
        d="M32 45.4v2.4M28.6 49c1.2 1.3 2.4 1.8 3.4 1.8s2.2-.5 3.4-1.8"
        fill="none"
        stroke="#1d2126"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
    </svg>
  );
}
