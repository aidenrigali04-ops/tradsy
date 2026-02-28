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
        {/* Four-pointed star with concave curved sides, solid black */}
        <path
          d="M12 3 Q 16 7 21 12 Q 16 17 12 21 Q 8 17 3 12 Q 8 7 12 3 Z"
          fill="currentColor"
        />
      </svg>
    </span>
  );
}
