/**
 * Tradsy logo: four-pointed star with concave curved sides (solid black).
 * Use className="tradsy-logo-prism" for the rotating variant in the sidebar.
 */
type Props = {
  className?: string;
  size?: number;
  style?: React.CSSProperties;
  ariaHidden?: boolean;
};

export default function TradsyLogo({ className, size = 24, style, ariaHidden = true }: Props) {
  return (
    <span
      className={className}
      style={{ display: "inline-flex", width: size, height: size, flexShrink: 0, ...style }}
      aria-hidden={ariaHidden}
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ display: "block" }}
      >
        {/* Four-pointed star: sharp points at T/R/B/L, concave curved sides bowing inward */}
        <path
          d="M12 1.5 Q 14 8 22.5 12 Q 14 16 12 22.5 Q 10 16 1.5 12 Q 10 8 12 1.5 Z"
          fill="currentColor"
        />
      </svg>
    </span>
  );
}
