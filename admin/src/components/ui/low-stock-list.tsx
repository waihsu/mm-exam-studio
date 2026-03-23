import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface Item {
  id: number;
  name: string;
  quantity: number;
}

export function LowStockList({ items }: { items: Item[] }) {
  return (
    <Card>
      <CardHeader className="font-semibold">
        Low Stock Alerts
      </CardHeader>
      <CardContent className="space-y-3">
        {items.length === 0 && (
          <p className="text-sm text-muted-foreground">
            All stocks are healthy ✅
          </p>
        )}

        {items.map((item) => (
          <div
            key={item.id}
            className="flex items-center justify-between"
          >
            <span className="text-sm">{item.name}</span>
            <Badge variant="destructive">
              {item.quantity} left
            </Badge>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
