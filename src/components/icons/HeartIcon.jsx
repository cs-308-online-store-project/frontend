export default function HeartIcon({ active = false, size = 26 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      className={`heart-icon ${active ? "active" : ""}`}
    >
      <path d="M12 21s-7.5-5.2-10-10c-2.5-4.8 0-9 5-9 3 0 5 2.5 5 2.5S14 2 17 2c5 0 7.5 4.2 5 9-2.5 4.8-10 10-10 10z" />
    </svg>
  );
}
