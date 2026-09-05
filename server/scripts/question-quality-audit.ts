import { and, eq } from "drizzle-orm";
import { closeAuthDb, db, question } from "@/db";
import { getQuestionPublishReadinessIssues } from "@/modules/questions/utils/question-publish-readiness";

const main = async () => {
  const rows = await db.query.question.findMany({
    where: and(eq(question.isPublished, true), eq(question.isActive, true)),
    with: {
      options: {
        columns: {
          label: true,
          text: true,
          isCorrect: true,
        },
      },
    },
  });

  const failures = rows.flatMap((item) => {
    const issues = getQuestionPublishReadinessIssues({
      body: item.body,
      type: item.type,
      mode: item.mode,
      answerText: item.answerText,
      answerFormula: item.answerFormula,
      options: item.options,
      variablesSchema: Array.isArray(item.variablesSchema)
        ? (item.variablesSchema as Array<{
            key: string;
            label?: string;
            type: "number" | "text";
            min?: number;
            max?: number;
            step?: number;
            choices?: string[];
          }>)
        : undefined,
      parametricValueSets: Array.isArray(item.parametricValueSets)
        ? (item.parametricValueSets as Array<Record<string, string | number>>)
        : undefined,
      variantContents: Array.isArray(item.variantContents)
        ? item.variantContents
        : undefined,
    });

    return issues.map((issue) => ({ questionCode: item.questionCode, issue }));
  });

  console.log(`Audited ${rows.length} active published questions.`);
  if (failures.length === 0) {
    console.log("Question quality audit passed.");
    return;
  }

  console.error(`Found ${failures.length} publish-readiness issue(s):`);
  for (const failure of failures) {
    console.error(`- ${failure.questionCode}: ${failure.issue}`);
  }
  process.exitCode = 1;
};

try {
  await main();
} finally {
  await closeAuthDb();
}
