type NavLabelProps = {
  parts: [string, string];
  compact: boolean;
};

export default function NavLabel({ parts, compact }: NavLabelProps) {
  if (!compact) {
    return `${parts[0]} ${parts[1]}`;
  }
  return (
    <span className="inline-flex flex-col items-center text-center leading-tight">
      <span>{parts[0]}</span>
      <span>{parts[1]}</span>
    </span>
  );
}
