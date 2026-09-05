import { Pencil, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { ChapterRecord } from "../types";

type ChapterRecordsTableProps = {
  chapters: ChapterRecord[];
  onEdit: (chapter: ChapterRecord) => void;
  onDelete: (chapter: ChapterRecord) => void;
};

export function ChapterRecordsTable({
  chapters,
  onEdit,
  onDelete,
}: ChapterRecordsTableProps) {
  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Chapter</TableHead>
            <TableHead>Grade</TableHead>
            <TableHead>Subject</TableHead>
            <TableHead>Stats</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="w-[140px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {chapters.length ? (
            chapters.map((chapter) => (
              <TableRow key={chapter.id}>
                <TableCell className="whitespace-normal">
                  <div className="space-y-1">
                    <p className="font-semibold">
                      {chapter.code ? `${chapter.code} · ` : ""}
                      {chapter.name}
                    </p>
                    {chapter.description ? (
                      <p className="text-xs text-slate-500">{chapter.description}</p>
                    ) : null}
                  </div>
                </TableCell>
                <TableCell>{chapter.grade.name}</TableCell>
                <TableCell>{chapter.subject.name}</TableCell>
                <TableCell className="text-xs text-slate-600">
                  {chapter._count.subChapters} sub chapter(s) • {chapter._count.questions} question(s)
                </TableCell>
                <TableCell>
                  <Badge variant={chapter.isActive ? "default" : "secondary"}>
                    {chapter.isActive ? "Active" : "Inactive"}
                  </Badge>
                </TableCell>
                <TableCell className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    title={`Edit ${chapter.name}`}
                    onClick={() => onEdit(chapter)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    title={`Delete ${chapter.name}`}
                    onClick={() => onDelete(chapter)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={6} className="py-10 text-center text-sm text-slate-500">
                No chapters yet.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
