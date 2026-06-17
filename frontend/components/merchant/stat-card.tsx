import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, TrendingDown } from "lucide-react";

interface StatCardProps {
  label: string;
  value: string | number;
  icon: React.ElementType;
  iconClassName?: string;
  description?: string;
  trend?: {
    value: string;
    direction: "up" | "down" | "neutral";
  };
  className?: string;
}

export function StatCard({
  label,
  value,
  icon: Icon,
  iconClassName,
  description,
  trend,
  className,
}: StatCardProps) {
  return (
    <Card className={cn("gap-4 py-5", className)}>
      <CardContent className="px-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold mb-2">
              {label}
            </p>
            <p className="text-3xl font-black tabular-nums text-foreground leading-none">
              {value}
            </p>
            {description && (
              <p className="text-xs text-muted-foreground mt-1.5">{description}</p>
            )}
            {trend && (
              <div
                className={cn(
                  "inline-flex items-center gap-1 mt-2 text-xs font-semibold",
                  trend.direction === "up" && "text-green-600 dark:text-green-400",
                  trend.direction === "down" && "text-destructive",
                  trend.direction === "neutral" && "text-muted-foreground"
                )}
              >
                {trend.direction === "up" && <TrendingUp className="w-3 h-3" />}
                {trend.direction === "down" && <TrendingDown className="w-3 h-3" />}
                <span>{trend.value}</span>
              </div>
            )}
          </div>
          <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center shrink-0", iconClassName ?? "bg-primary/10 text-primary")}>
            <Icon className="w-5 h-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
