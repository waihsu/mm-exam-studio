import { Pencil, Tag, Trash2 } from "lucide-react";
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
import type { SubChapterRecord } from "../types";

type SubChapterRecordsTableProps = {
  subChapters: SubChapterRecord[];
  onEdit: (subChapter: SubChapterRecord) => void;
  onDelete: (subChapter: SubChapterRecord) => void;
};

export function SubChapterRecordsTable({
  subChapters,
  onEdit,
  onDelete,
}: SubChapterRecordsTableProps) {
  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Chapter</TableHead>
            <TableHead>Taxonomy</TableHead>
            <TableHead>Questions</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="w-[140px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {subChapters.length ? (
            subChapters.map((subChapter) => (
              <TableRow key={subChapter.id}>
                <TableCell className="whitespace-normal">
                  <div className="space-y-1">
                    <p className="font-semibold">
                      {subChapter.code ? `${subChapter.code} · ` : ""}
                      {subChapter.name}
                    </p>
                    {subChapter.description ? (
                      <p className="text-xs text-slate-500">{subChapter.description}</p>
                    ) : null}
                  </div>
                </TableCell>
                <TableCell>{subChapter.chapter.name}</TableCell>
                <TableCell className="text-xs text-slate-600">
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-2 py-1">
                    <Tag className="h-3 w-3" />
                    {subChapter.chapter.grade.code} · {subChapter.chapter.subject.code}
                  </span>
                </TableCell>
                <TableCell>{subChapter._count.questions}</TableCell>
                <TableCell>
                  <Badge variant={subChapter.isActive ? "default" : "secondary"}>
                    {subChapter.isActive ? "Active" : "Inactive"}
                  </Badge>
                </TableCell>
                <TableCell className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    title={`Edit ${subChapter.name}`}
                    onClick={() => onEdit(subChapter)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    title={`Delete ${subChapter.name}`}
                    onClick={() => onDelete(subChapter)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={6} className="py-10 text-center text-sm text-slate-500">
                No sub chapters yet.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
