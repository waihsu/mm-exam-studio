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
import type { GradeRecord } from "../types";

type GradeRecordsTableProps = {
  grades: GradeRecord[];
  onEdit: (grade: GradeRecord) => void;
  onDelete: (grade: GradeRecord) => void;
};

export function GradeRecordsTable({ grades, onEdit, onDelete }: GradeRecordsTableProps) {
  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Code</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Order</TableHead>
            <TableHead>Stats</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="w-[140px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {grades.length ? (
            grades.map((grade) => (
              <TableRow key={grade.id}>
                <TableCell className="font-semibold">{grade.code}</TableCell>
                <TableCell>{grade.name}</TableCell>
                <TableCell>{grade.sortOrder}</TableCell>
                <TableCell className="text-xs text-[#6e706b]">
                  {grade._count.gradeSubjects} subject link(s) • {grade._count.chapters} chapter(s) • {grade._count.questions} question(s)
                </TableCell>
                <TableCell>
                  <Badge variant={grade.isActive ? "default" : "secondary"}>
                    {grade.isActive ? "Active" : "Inactive"}
                  </Badge>
                </TableCell>
                <TableCell className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="border-[#d8d4c9] bg-[#fffdf8] hover:border-[#7fa99d] hover:bg-[#f8f5ee]"
                    title={`Edit ${grade.name}`}
                    onClick={() => onEdit(grade)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="border-[#d8d4c9] bg-[#fffdf8] text-[#8f4437] hover:border-[#d76f55] hover:bg-[#f5e4da]"
                    title={`Delete ${grade.name}`}
                    onClick={() => onDelete(grade)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={6} className="py-10 text-center text-sm text-[#6e706b]">
                No grades yet.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
