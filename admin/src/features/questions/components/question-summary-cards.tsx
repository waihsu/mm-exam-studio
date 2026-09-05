import { Boxes, FileStack, FlaskConical, Send } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

type QuestionSummaryCardsProps = {
  total: number;
  published: number;
  draft: number;
  variable: number;
};

export function QuestionSummaryCards({
  total,
  published,
  draft,
  variable,
}: QuestionSummaryCardsProps) {
  const cards = [
    { key: "total", label: "Total questions", value: total, icon: Boxes },
    { key: "published", label: "Published", value: published, icon: Send },
    { key: "draft", label: "Draft", value: draft, icon: FileStack },
    { key: "variable", label: "Variable", value: variable, icon: FlaskConical },
  ];

  return (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <Card key={card.key} className="border-slate-200 bg-white text-slate-900">
            <CardContent className="flex items-start justify-between p-4">
              <div className="space-y-1">
                <p className="admin-kicker opacity-65">{card.label}</p>
                <p className="text-2xl font-bold tracking-tight">{card.value}</p>
              </div>
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-2.5 text-slate-500">
                <Icon className="h-4 w-4" />
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
