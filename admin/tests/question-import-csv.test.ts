import { describe, expect, test } from "bun:test";
import {
  getQuestionImportCsvRows,
  parseQuestionImportBoolean,
  parseQuestionImportEnum,
  parseQuestionImportJsonArray,
} from "../src/features/questions/utils/question-import-csv";

describe("question import CSV utilities", () => {
  test("keeps commas and escaped quotes inside quoted cells", () => {
    const rows = getQuestionImportCsvRows(
      'questionCode,body,type,gradeCode,subjectCode\nQB-1,"Solve ""x, y""",mcq,G06,MATH',
    );

    expect(rows).toEqual([
      {
        rowNumber: 2,
        row: {
          questionCode: "QB-1",
          body: 'Solve "x, y"',
          type: "mcq",
          gradeCode: "G06",
          subjectCode: "MATH",
        },
      },
    ]);
  });

  test("requires the minimum identifying columns", () => {
    expect(() => getQuestionImportCsvRows("questionCode,body\nQB-1,Question"))
      .toThrow('Missing required column "type".');
  });

  test("parses supported boolean, enum, and JSON array values", () => {
    expect(parseQuestionImportBoolean("yes")).toBe(true);
    expect(parseQuestionImportEnum("MEDIUM", ["easy", "medium", "hard"], "easy", "Difficulty"))
      .toBe("medium");
    expect(parseQuestionImportJsonArray<{ id: number }>("[{\"id\":1}]", "optionsJson"))
      .toEqual([{ id: 1 }]);
  });
});
