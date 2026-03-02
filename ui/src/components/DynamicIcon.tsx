import { icons, type LucideIcon } from "lucide-react";

function toKebab(name: string): string {
  return name
    .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
    .replace(/([A-Z])([A-Z][a-z])/g, "$1-$2")
    .toLowerCase();
}

const KEBAB_TO_COMPONENT = new Map<string, LucideIcon>(
  Object.entries(icons).map(([pascal, component]) => [
    toKebab(pascal),
    component as LucideIcon,
  ]),
);

export function DynamicIcon({
  name,
  className,
}: {
  name: string | null | undefined;
  className?: string;
}) {
  if (!name) return null;
  const Icon = KEBAB_TO_COMPONENT.get(name);
  if (!Icon) return null;
  return <Icon className={className} />;
}
