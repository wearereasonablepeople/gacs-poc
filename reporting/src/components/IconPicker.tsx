import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { icons, type LucideIcon } from "lucide-react";
import { useMemo, useState } from "react";

/**
 * Converts PascalCase icon names from lucide to kebab-case for storage.
 * e.g. "MonitorCog" → "monitor-cog", "BarChart3" → "bar-chart-3"
 */
function toKebab(name: string): string {
  return name
    .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
    .replace(/([A-Z])([A-Z][a-z])/g, "$1-$2")
    .toLowerCase();
}

const ALL_ICONS: [string, LucideIcon][] = Object.entries(icons).map(
  ([pascal, component]) => [toKebab(pascal), component as LucideIcon],
);

const KEBAB_TO_COMPONENT = new Map<string, LucideIcon>(ALL_ICONS);

interface IconPickerProps {
  value: string | null | undefined;
  onChange: (icon: string | null) => void;
}

export function IconPicker({ value, onChange }: IconPickerProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const SelectedIcon = value ? KEBAB_TO_COMPONENT.get(value) ?? null : null;

  const filtered = useMemo(() => {
    if (!search) return ALL_ICONS;
    const q = search.toLowerCase();
    return ALL_ICONS.filter(([kebab]) => kebab.includes(q));
  }, [search]);

  return (
    <Popover
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (!o) setSearch("");
      }}
    >
      <PopoverTrigger asChild>
        <Button variant="outline" className="w-full justify-start gap-2">
          {SelectedIcon ? (
            <>
              <SelectedIcon className="h-4 w-4" />
              <span className="text-sm truncate">
                {value?.replace(/-/g, " ")}
              </span>
            </>
          ) : (
            <span className="text-sm text-muted-foreground">
              Select icon...
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-2" align="start">
        <Input
          placeholder="Search icons..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="mb-2 h-8 text-sm"
          autoFocus
        />

        {value && (
          <Button
            variant="ghost"
            size="sm"
            className="w-full text-xs text-muted-foreground mb-1"
            onClick={() => {
              onChange(null);
              setOpen(false);
            }}
          >
            Clear icon
          </Button>
        )}

        <ScrollArea className="h-60">
          <div className="grid grid-cols-6 gap-1">
            {filtered.map(([kebab, Icon]) => (
              <Button
                key={kebab}
                variant={value === kebab ? "default" : "ghost"}
                size="icon"
                className="h-8 w-8"
                onClick={() => {
                  onChange(kebab);
                  setOpen(false);
                  setSearch("");
                }}
                title={kebab}
              >
                <Icon className="h-4 w-4" />
              </Button>
            ))}
            {filtered.length === 0 && (
              <p className="col-span-6 py-4 text-center text-xs text-muted-foreground">
                No icons match "{search}"
              </p>
            )}
          </div>
        </ScrollArea>

        <p className="text-[10px] text-muted-foreground text-center mt-1">
          {filtered.length} icon{filtered.length !== 1 ? "s" : ""}
        </p>
      </PopoverContent>
    </Popover>
  );
}

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
