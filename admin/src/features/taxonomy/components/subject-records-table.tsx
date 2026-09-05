import { Pencil, Tags, Trash2 } from "lucide-react";
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
import type { SubjectRecord } from "../types";

type SubjectRecordsTableProps = {
  subjects: SubjectRecord[];
  onEdit: (subject: SubjectRecord) => void;
  onDelete: (subject: SubjectRecord) => void;
};

export function SubjectRecordsTable({ subjects, onEdit, onDelete }: SubjectRecordsTableProps) {
  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Code</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Grades</TableHead>
            <TableHead>Stats</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="w-[140px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {subjects.length ? (
            subjects.map((subject) => (
              <TableRow key={subject.id}>
                <TableCell className="font-semibold">{subject.code}</TableCell>
                <TableCell className="whitespace-normal">
                  <div className="space-y-1">
                    <p>{subject.name}</p>
                    {subject.description ? (
                      <p className="text-xs text-slate-500">{subject.description}</p>
                    ) : null}
                  </div>
                </TableCell>
                <TableCell className="whitespace-normal">
                  <div className="flex flex-wrap gap-1.5">
                    {subject.grades.map((grade) => (
                      <Badge
                        key={`${subject.id}-${grade.id}`}
                        variant="outline"
                        className="border-sky-200 bg-sky-50 text-sky-700"
                      >
                        <Tags className="mr-1 h-3 w-3" />
                        {grade.code}
                      </Badge>
                    ))}
                  </div>
                </TableCell>
                <TableCell className="text-xs text-slate-600">
                  {subject._count.chapters} chapter(s) • {subject._count.questions} question(s)
                </TableCell>
                <TableCell>
                  <Badge variant={subject.isActive ? "default" : "secondary"}>
                    {subject.isActive ? "Active" : "Inactive"}
                  </Badge>
                </TableCell>
                <TableCell className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    title={`Edit ${subject.name}`}
                    onClick={() => onEdit(subject)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    title={`Delete ${subject.name}`}
                    onClick={() => onDelete(subject)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={6} className="py-10 text-center text-sm text-slate-500">
                No subjects yet.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
