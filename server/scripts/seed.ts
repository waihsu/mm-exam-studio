import { and, eq, inArray } from "drizzle-orm";
import {
  account as accountTable,
  chapter as chapterTable,
  db,
  grade as gradeTable,
  gradeSubject as gradeSubjectTable,
  paperBlueprint as paperBlueprintTable,
  paperBlueprintSection as paperBlueprintSectionTable,
  paperBlueprintSlot as paperBlueprintSlotTable,
  plan as planTable,
  question as questionTable,
  questionOption as questionOptionTable,
  subscription as subscriptionTable,
  subChapter as subChapterTable,
  subject as subjectTable,
  user as userTable,
} from "../src/db";
import { auth } from "../src/lib/auth";
import { hashAuthPassword } from "../src/lib/auth-password";

const Difficulty = {
  easy: "easy",
  medium: "medium",
  hard: "hard",
} as const;

const QuestionMode = {
  static: "static",
  variable: "variable",
} as const;

const QuestionReviewStatus = {
  draft: "draft",
  in_review: "in_review",
  needs_changes: "needs_changes",
  approved: "approved",
} as const;

const QuestionType = {
  mcq: "mcq",
  true_false: "true_false",
  short_answer: "short_answer",
  long_answer: "long_answer",
  fill_blank: "fill_blank",
  matching: "matching",
} as const;

const seededAdminName = (
  process.env.SEED_SUPERADMIN_NAME ??
  process.env.SEED_ADMIN_NAME ??
  "MM Exam Studio Admin"
).trim();
const seededAdminEmail = (
  process.env.SEED_SUPERADMIN_EMAIL ??
  process.env.SEED_ADMIN_EMAIL ??
  "admin@hsuwai.space"
)
  .trim()
  .toLowerCase();
const seededAdminPassword = (
  process.env.SEED_SUPERADMIN_PASSWORD ??
  process.env.SEED_ADMIN_PASSWORD ??
  "Admin@123456"
).trim();
const ownerDeviceLimitOverride = 20;
const ownerOverrideEmails = Array.from(
  new Set(
    [
      process.env.SUPERADMIN_EMAIL,
      process.env.SUPERADMIN_EMAILS,
      process.env.ADMIN_EMAIL,
      process.env.ADMIN_EMAILS,
      seededAdminEmail,
    ]
      .flatMap((value) => String(value ?? "").split(","))
      .map((value) => value.trim().toLowerCase())
      .filter(Boolean),
  ),
);

const authBaseUrl = (process.env.BETTER_AUTH_URL ?? "http://localhost:3000")
  .trim()
  .replace(/\/+$/, "");

const parseBooleanEnv = (value: string | undefined, fallback: boolean) => {
  if (typeof value !== "string") {
    return fallback;
  }

  const normalized = value.trim().toLowerCase();
  if (["1", "true", "yes", "on"].includes(normalized)) {
    return true;
  }
  if (["0", "false", "no", "off"].includes(normalized)) {
    return false;
  }
  return fallback;
};

const seedProfile = (process.env.SEED_PROFILE ?? "production").trim().toLowerCase();
const includeGeneratedQuestions = parseBooleanEnv(
  process.env.SEED_INCLUDE_GENERATED_QUESTIONS,
  seedProfile !== "production",
);
const defaultGeneratedQuestionsPerGradeSubject = seedProfile === "production" ? 0 : 180;

const generatedQuestionsPerGradeSubject = Math.max(
  0,
  includeGeneratedQuestions
    ? (Number.parseInt(
        process.env.SEED_QUESTIONS_PER_GRADE_SUBJECT ?? String(defaultGeneratedQuestionsPerGradeSubject),
        10,
      ) || defaultGeneratedQuestionsPerGradeSubject)
    : 0,
);

type OptionSeed = {
  label: string;
  text: string;
  isCorrect: boolean;
  sortOrder: number;
};

type VariableSeed = {
  key: string;
  label: string;
  type: "number" | "text";
  min?: number;
  max?: number;
  step?: number;
  choices?: string[];
};

type SubChapterSeed = {
  code: string;
  name: string;
  description?: string;
  sortOrder: number;
  isFreePreview: boolean;
};

type ChapterSeed = {
  gradeCode: string;
  subjectCode: string;
  code: string;
  name: string;
  description?: string;
  sortOrder: number;
  isFreePreview: boolean;
  subChapters: readonly SubChapterSeed[];
};

type QuestionSeed = {
  questionCode: string;
  title?: string;
  gradeCode: string;
  subjectCode: string;
  chapterCode?: string;
  subChapterCode?: string;
  mode: (typeof QuestionMode)[keyof typeof QuestionMode];
  type: (typeof QuestionType)[keyof typeof QuestionType];
  difficulty: (typeof Difficulty)[keyof typeof Difficulty];
  body: string;
  questionImageUrls?: readonly string[];
  answerText?: string | null;
  explanation?: string | null;
  solutionImageUrls?: readonly string[];
  answerFormula?: string | null;
  variablesSchema?: readonly VariableSeed[] | null;
  marks: number;
  estimatedTimeSec?: number | null;
  isPublished: boolean;
  reviewStatus?: (typeof QuestionReviewStatus)[keyof typeof QuestionReviewStatus];
  options: readonly OptionSeed[];
};

type BlueprintDifficultySeed = "easy" | "normal" | "hard" | "advance";
type BlueprintPlanCodeSeed = "free" | "pro" | "premium";
type BlueprintSectionSeed = {
  code: string;
  title?: string;
  questionType?: (typeof QuestionType)[keyof typeof QuestionType];
  marksPerQuestion?: 1 | 2 | 3 | 5 | 10;
  questionCount: number;
  totalMarks: number;
  sortOrder: number;
};

type BlueprintSlotSeed = {
  sectionCode?: string;
  slotNumber: number;
  questionType: (typeof QuestionType)[keyof typeof QuestionType];
  marks: 1 | 2 | 3 | 5 | 10;
  difficultyTarget?: BlueprintDifficultySeed;
  chapterCode?: string;
  subChapterCode?: string;
  swapLimit?: number;
  slotConfig?: Record<string, unknown>;
};

type BlueprintSeed = {
  title: string;
  mode: "mcq_only" | "all_type" | "custom";
  status: "draft" | "ready" | "archived";
  gradeCode: string;
  subjectCode: string;
  totalMarks: number;
  pdfTemplateKey?: "default" | "myanmar_matric";
  examYearLabel?: string;
  timeAllowedLabel?: string;
  departmentLine?: string;
  answerInstructionLine?: string;
  includeAnswerPaper: boolean;
  difficultyDistribution: {
    easy: number;
    normal: number;
    hard: number;
    advance: number;
  };
  presetChapterCodes?: readonly string[];
  presetSubChapterCodes?: readonly string[];
  templateConfig?: {
    isPublished: boolean;
    availablePlanCodes: readonly BlueprintPlanCodeSeed[];
  };
  sections: readonly BlueprintSectionSeed[];
  slots: readonly BlueprintSlotSeed[];
};

const gradeSeeds = [
  { code: "G06", name: "Grade 6", sortOrder: 6 },
  { code: "G07", name: "Grade 7", sortOrder: 7 },
  { code: "G08", name: "Grade 8", sortOrder: 8 },
  { code: "G12", name: "Grade 12", sortOrder: 12 },
] as const;

const subjectSeeds = [
  {
    code: "MATH",
    name: "Mathematics",
    description: "Arithmetic, algebra, geometry, and problem-solving practice.",
  },
  {
    code: "ENG",
    name: "English",
    description: "Reading, grammar, and writing skills for classroom practice.",
  },
  {
    code: "SCI",
    name: "Science",
    description: "Concept-based science questions across middle-school topics.",
  },
] as const;

const subjectGradeMap = {
  MATH: ["G06", "G07", "G08", "G12"],
  ENG: ["G06", "G07", "G08", "G12"],
  SCI: ["G06", "G07", "G08", "G12"],
} as const;

const chapterSeeds: readonly ChapterSeed[] = [
  {
    gradeCode: "G06",
    subjectCode: "MATH",
    code: "G06-MATH-01",
    name: "Numbers and Operations",
    description: "Core number sense, factors, and fraction fluency.",
    sortOrder: 1,
    isFreePreview: true,
    subChapters: [
      {
        code: "G06-MATH-01-A",
        name: "Whole Numbers",
        description: "Place value and multi-step addition or subtraction.",
        sortOrder: 1,
        isFreePreview: true,
      },
      {
        code: "G06-MATH-01-B",
        name: "Factors and Multiples",
        description: "Identify factors, multiples, and common factors.",
        sortOrder: 2,
        isFreePreview: true,
      },
      {
        code: "G06-MATH-01-C",
        name: "Fractions",
        description: "Equivalent fractions and fraction comparisons.",
        sortOrder: 3,
        isFreePreview: true,
      },
    ],
  },
  {
    gradeCode: "G06",
    subjectCode: "MATH",
    code: "G06-MATH-02",
    name: "Geometry Basics",
    description: "Angles, shapes, and introductory measurement.",
    sortOrder: 2,
    isFreePreview: true,
    subChapters: [
      {
        code: "G06-MATH-02-A",
        name: "Shapes and Angles",
        description: "Classify angles and reason about common shapes.",
        sortOrder: 1,
        isFreePreview: true,
      },
      {
        code: "G06-MATH-02-B",
        name: "Perimeter and Area",
        description: "Compute perimeter and area for rectangles and squares.",
        sortOrder: 2,
        isFreePreview: false,
      },
    ],
  },
  {
    gradeCode: "G07",
    subjectCode: "MATH",
    code: "G07-MATH-01",
    name: "Expressions and Equations",
    description: "Evaluate expressions and solve one-step equations.",
    sortOrder: 1,
    isFreePreview: true,
    subChapters: [
      {
        code: "G07-MATH-01-A",
        name: "Algebraic Expressions",
        description: "Simplify and evaluate expressions with variables.",
        sortOrder: 1,
        isFreePreview: true,
      },
      {
        code: "G07-MATH-01-B",
        name: "One-Step Equations",
        description: "Solve equations with addition and subtraction.",
        sortOrder: 2,
        isFreePreview: true,
      },
    ],
  },
  {
    gradeCode: "G07",
    subjectCode: "MATH",
    code: "G07-MATH-02",
    name: "Ratios and Percentages",
    description: "Work with ratio tables and real-world percentage problems.",
    sortOrder: 2,
    isFreePreview: true,
    subChapters: [
      {
        code: "G07-MATH-02-A",
        name: "Ratios",
        description: "Compare quantities and complete ratio tables.",
        sortOrder: 1,
        isFreePreview: true,
      },
      {
        code: "G07-MATH-02-B",
        name: "Percent Problems",
        description: "Find percentages of quantities and reason about increase.",
        sortOrder: 2,
        isFreePreview: false,
      },
    ],
  },
  {
    gradeCode: "G08",
    subjectCode: "MATH",
    code: "G08-MATH-01",
    name: "Linear Relationships",
    description: "Patterns, slope, and graphs of linear rules.",
    sortOrder: 1,
    isFreePreview: false,
    subChapters: [
      {
        code: "G08-MATH-01-A",
        name: "Tables and Graphs",
        description: "Read values from linear tables and graphs.",
        sortOrder: 1,
        isFreePreview: false,
      },
      {
        code: "G08-MATH-01-B",
        name: "Slope and Patterns",
        description: "Interpret rate of change in familiar situations.",
        sortOrder: 2,
        isFreePreview: false,
      },
    ],
  },
  {
    gradeCode: "G06",
    subjectCode: "ENG",
    code: "G06-ENG-01",
    name: "Reading Skills",
    description: "Main idea, supporting details, and context clues.",
    sortOrder: 1,
    isFreePreview: true,
    subChapters: [
      {
        code: "G06-ENG-01-A",
        name: "Main Idea",
        description: "Find the central message in short texts.",
        sortOrder: 1,
        isFreePreview: true,
      },
      {
        code: "G06-ENG-01-B",
        name: "Context Clues",
        description: "Use surrounding words to infer meanings.",
        sortOrder: 2,
        isFreePreview: true,
      },
    ],
  },
  {
    gradeCode: "G07",
    subjectCode: "ENG",
    code: "G07-ENG-01",
    name: "Grammar and Writing",
    description: "Sentence structure and tense accuracy for classroom writing.",
    sortOrder: 1,
    isFreePreview: true,
    subChapters: [
      {
        code: "G07-ENG-01-A",
        name: "Sentence Structure",
        description: "Recognize complete and incomplete sentences.",
        sortOrder: 1,
        isFreePreview: true,
      },
      {
        code: "G07-ENG-01-B",
        name: "Verb Tense",
        description: "Use past, present, and future tense correctly.",
        sortOrder: 2,
        isFreePreview: false,
      },
    ],
  },
  {
    gradeCode: "G08",
    subjectCode: "ENG",
    code: "G08-ENG-01",
    name: "Argument Writing",
    description: "Claims, evidence, and logical organization.",
    sortOrder: 1,
    isFreePreview: false,
    subChapters: [
      {
        code: "G08-ENG-01-A",
        name: "Claims and Reasons",
        description: "Develop strong claims with supporting reasons.",
        sortOrder: 1,
        isFreePreview: false,
      },
      {
        code: "G08-ENG-01-B",
        name: "Supporting Evidence",
        description: "Use evidence to support written arguments.",
        sortOrder: 2,
        isFreePreview: false,
      },
    ],
  },
  {
    gradeCode: "G06",
    subjectCode: "SCI",
    code: "G06-SCI-01",
    name: "Living Things",
    description: "Organisms, habitats, and food relationships.",
    sortOrder: 1,
    isFreePreview: true,
    subChapters: [
      {
        code: "G06-SCI-01-A",
        name: "Classification",
        description: "Sort living things by features and groups.",
        sortOrder: 1,
        isFreePreview: true,
      },
      {
        code: "G06-SCI-01-B",
        name: "Food Chains",
        description: "Understand producers, consumers, and energy flow.",
        sortOrder: 2,
        isFreePreview: true,
      },
    ],
  },
  {
    gradeCode: "G07",
    subjectCode: "SCI",
    code: "G07-SCI-01",
    name: "Matter and Materials",
    description: "States of matter and changes in materials.",
    sortOrder: 1,
    isFreePreview: true,
    subChapters: [
      {
        code: "G07-SCI-01-A",
        name: "States of Matter",
        description: "Identify properties of solids, liquids, and gases.",
        sortOrder: 1,
        isFreePreview: true,
      },
      {
        code: "G07-SCI-01-B",
        name: "Physical Changes",
        description: "Recognize reversible changes in matter.",
        sortOrder: 2,
        isFreePreview: false,
      },
    ],
  },
  {
    gradeCode: "G08",
    subjectCode: "SCI",
    code: "G08-SCI-01",
    name: "Force and Motion",
    description: "Motion, balanced forces, and speed.",
    sortOrder: 1,
    isFreePreview: false,
    subChapters: [
      {
        code: "G08-SCI-01-A",
        name: "Balanced Forces",
        description: "Describe forces acting on stationary objects.",
        sortOrder: 1,
        isFreePreview: false,
      },
      {
        code: "G08-SCI-01-B",
        name: "Speed and Distance",
        description: "Interpret motion and average speed in simple contexts.",
        sortOrder: 2,
        isFreePreview: false,
      },
    ],
  },
  {
    gradeCode: "G12",
    subjectCode: "MATH",
    code: "G12-MATH-01",
    name: "Algebra and Functions",
    description: "Algebraic manipulation and core function reasoning.",
    sortOrder: 1,
    isFreePreview: true,
    subChapters: [
      {
        code: "G12-MATH-01-A",
        name: "Linear and Quadratic",
        description: "Solve and interpret linear and quadratic expressions.",
        sortOrder: 1,
        isFreePreview: true,
      },
      {
        code: "G12-MATH-01-B",
        name: "Exponents and Logarithms",
        description: "Manipulate powers, roots, and logarithmic forms.",
        sortOrder: 2,
        isFreePreview: false,
      },
    ],
  },
  {
    gradeCode: "G12",
    subjectCode: "MATH",
    code: "G12-MATH-02",
    name: "Calculus Basics",
    description: "Limits, rates of change, and introductory integration.",
    sortOrder: 2,
    isFreePreview: false,
    subChapters: [
      {
        code: "G12-MATH-02-A",
        name: "Limits",
        description: "Evaluate limits from expressions and graphs.",
        sortOrder: 1,
        isFreePreview: false,
      },
      {
        code: "G12-MATH-02-B",
        name: "Differentiation",
        description: "Differentiate polynomial and simple composite functions.",
        sortOrder: 2,
        isFreePreview: false,
      },
    ],
  },
  {
    gradeCode: "G12",
    subjectCode: "MATH",
    code: "G12-MATH-03",
    name: "Complex Numbers",
    description: "Imaginary unit, arithmetic with complex numbers, and modulus.",
    sortOrder: 3,
    isFreePreview: false,
    subChapters: [
      {
        code: "G12-MATH-03-A",
        name: "Complex Arithmetic",
        description: "Add, subtract, and multiply complex numbers.",
        sortOrder: 1,
        isFreePreview: false,
      },
      {
        code: "G12-MATH-03-B",
        name: "Modulus and Argand Diagram",
        description: "Find modulus and interpret complex numbers on the plane.",
        sortOrder: 2,
        isFreePreview: false,
      },
    ],
  },
  {
    gradeCode: "G12",
    subjectCode: "MATH",
    code: "G12-MATH-04",
    name: "Transformation of Trigonometric Functions",
    description: "Amplitude, period, phase shift, and vertical translation of trig graphs.",
    sortOrder: 4,
    isFreePreview: false,
    subChapters: [
      {
        code: "G12-MATH-04-A",
        name: "Amplitude and Period",
        description: "Read stretch and period changes from trig equations.",
        sortOrder: 1,
        isFreePreview: false,
      },
      {
        code: "G12-MATH-04-B",
        name: "Phase Shift and Translation",
        description: "Interpret horizontal and vertical shifts in trig graphs.",
        sortOrder: 2,
        isFreePreview: false,
      },
    ],
  },
  {
    gradeCode: "G12",
    subjectCode: "MATH",
    code: "G12-MATH-05",
    name: "Conic Sections",
    description: "Recognize and analyze circles, parabolas, ellipses, and hyperbolas.",
    sortOrder: 5,
    isFreePreview: false,
    subChapters: [
      {
        code: "G12-MATH-05-A",
        name: "Parabolas and Circles",
        description: "Work with standard equations of parabolas and circles.",
        sortOrder: 1,
        isFreePreview: false,
      },
      {
        code: "G12-MATH-05-B",
        name: "Ellipses and Hyperbolas",
        description: "Identify major features of ellipses and hyperbolas.",
        sortOrder: 2,
        isFreePreview: false,
      },
    ],
  },
  {
    gradeCode: "G12",
    subjectCode: "ENG",
    code: "G12-ENG-01",
    name: "Reading and Interpretation",
    description: "Read short passages, identify central ideas, and justify interpretations.",
    sortOrder: 6,
    isFreePreview: true,
    subChapters: [
      {
        code: "G12-ENG-01-A",
        name: "Main Idea and Support",
        description: "Identify the main idea and the best supporting detail.",
        sortOrder: 1,
        isFreePreview: true,
      },
      {
        code: "G12-ENG-01-B",
        name: "Inference and Tone",
        description: "Infer meaning and describe tone from short texts.",
        sortOrder: 2,
        isFreePreview: false,
      },
    ],
  },
  {
    gradeCode: "G12",
    subjectCode: "ENG",
    code: "G12-ENG-02",
    name: "Grammar and Writing",
    description: "Strengthen sentence control, grammar accuracy, and short formal writing.",
    sortOrder: 7,
    isFreePreview: false,
    subChapters: [
      {
        code: "G12-ENG-02-A",
        name: "Sentence Revision",
        description: "Correct and improve sentence structure and grammar.",
        sortOrder: 1,
        isFreePreview: false,
      },
      {
        code: "G12-ENG-02-B",
        name: "Directed Writing",
        description: "Respond clearly to short prompts in a formal register.",
        sortOrder: 2,
        isFreePreview: false,
      },
    ],
  },
  {
    gradeCode: "G12",
    subjectCode: "SCI",
    code: "G12-SCI-01",
    name: "Motion and Forces",
    description: "Explain motion, acceleration, and balanced or unbalanced forces.",
    sortOrder: 8,
    isFreePreview: true,
    subChapters: [
      {
        code: "G12-SCI-01-A",
        name: "Velocity and Acceleration",
        description: "Interpret motion quantities from simple situations and calculations.",
        sortOrder: 1,
        isFreePreview: true,
      },
      {
        code: "G12-SCI-01-B",
        name: "Force Diagrams",
        description: "Analyze balanced and unbalanced forces with basic force diagrams.",
        sortOrder: 2,
        isFreePreview: false,
      },
    ],
  },
  {
    gradeCode: "G12",
    subjectCode: "SCI",
    code: "G12-SCI-02",
    name: "Energy and Matter",
    description: "Recognize energy transfer and explain density and simple properties of matter.",
    sortOrder: 9,
    isFreePreview: false,
    subChapters: [
      {
        code: "G12-SCI-02-A",
        name: "Energy Transfer",
        description: "Describe how energy changes from one form to another.",
        sortOrder: 1,
        isFreePreview: false,
      },
      {
        code: "G12-SCI-02-B",
        name: "Density and Matter",
        description: "Calculate density and explain physical properties of substances.",
        sortOrder: 2,
        isFreePreview: false,
      },
    ],
  },
];

const planSeeds = [
  {
    code: "free",
    name: "Free",
    description:
      "Access published questions in free-preview chapters only, with modest practice, paper, and export limits.",
    deviceLimit: 2,
    maxQuestionsPerPractice: 12,
    maxQuestionsPerPaper: 12,
    monthlyPdfExportLimit: 5,
    monthlyPaperGenerationLimit: 10,
    monthlyPaperSwapLimit: 10,
    chatEnabled: false,
    generatorEnabled: true,
    brandingLogoLimit: 0,
    offlineDrmEnabled: false,
    screenshotBlockEnabled: false,
    printAllowed: true,
  },
  {
    code: "pro",
    name: "Pro",
    description:
      "Teacher workflow with larger limits and full published static question access.",
    deviceLimit: 3,
    maxQuestionsPerPractice: 40,
    maxQuestionsPerPaper: 40,
    monthlyPdfExportLimit: 60,
    monthlyPaperGenerationLimit: 120,
    monthlyPaperSwapLimit: 120,
    chatEnabled: true,
    generatorEnabled: true,
    brandingLogoLimit: 2,
    offlineDrmEnabled: false,
    screenshotBlockEnabled: false,
    printAllowed: true,
  },
  {
    code: "premium",
    name: "Premium",
    description:
      "High-volume teacher workflow with broader access, stronger protection, and generous monthly limits.",
    deviceLimit: 5,
    maxQuestionsPerPractice: 120,
    maxQuestionsPerPaper: 120,
    monthlyPdfExportLimit: 240,
    monthlyPaperGenerationLimit: 400,
    monthlyPaperSwapLimit: 400,
    chatEnabled: true,
    generatorEnabled: true,
    brandingLogoLimit: 2,
    offlineDrmEnabled: true,
    screenshotBlockEnabled: true,
    printAllowed: true,
  },
] as const;

const starterBlueprintSeeds: readonly BlueprintSeed[] = [
  {
    title: "Starter Template · G12 Math Free Preview",
    mode: "all_type",
    status: "ready",
    gradeCode: "G12",
    subjectCode: "MATH",
    totalMarks: 2,
    pdfTemplateKey: "default",
    includeAnswerPaper: true,
    difficultyDistribution: {
      easy: 50,
      normal: 30,
      hard: 20,
      advance: 0,
    },
    presetChapterCodes: ["G12-MATH-01"],
    templateConfig: {
      isPublished: true,
      availablePlanCodes: ["free", "pro", "premium"],
    },
    sections: [
      {
        code: "A",
        title: "MCQ",
        questionType: QuestionType.mcq,
        marksPerQuestion: 1,
        questionCount: 1,
        totalMarks: 1,
        sortOrder: 0,
      },
      {
        code: "B",
        title: "Fill in the Blank",
        questionType: QuestionType.fill_blank,
        marksPerQuestion: 1,
        questionCount: 1,
        totalMarks: 1,
        sortOrder: 1,
      },
    ],
    slots: [],
  },
  {
    title: "Starter Template · G12 Math Mixed Revision",
    mode: "all_type",
    status: "ready",
    gradeCode: "G12",
    subjectCode: "MATH",
    totalMarks: 8,
    pdfTemplateKey: "default",
    includeAnswerPaper: true,
    difficultyDistribution: {
      easy: 20,
      normal: 50,
      hard: 20,
      advance: 10,
    },
    presetChapterCodes: ["G12-MATH-03", "G12-MATH-04", "G12-MATH-05"],
    templateConfig: {
      isPublished: true,
      availablePlanCodes: ["pro", "premium"],
    },
    sections: [
      {
        code: "A",
        title: "MCQ Review",
        questionType: QuestionType.mcq,
        marksPerQuestion: 1,
        questionCount: 2,
        totalMarks: 2,
        sortOrder: 0,
      },
      {
        code: "B",
        title: "Fill Blank",
        questionType: QuestionType.fill_blank,
        marksPerQuestion: 1,
        questionCount: 1,
        totalMarks: 1,
        sortOrder: 1,
      },
      {
        code: "C",
        title: "Short Answer (2 marks)",
        questionType: QuestionType.short_answer,
        marksPerQuestion: 2,
        questionCount: 1,
        totalMarks: 2,
        sortOrder: 2,
      },
      {
        code: "D",
        title: "Short Answer (3 marks)",
        questionType: QuestionType.short_answer,
        marksPerQuestion: 3,
        questionCount: 1,
        totalMarks: 3,
        sortOrder: 3,
      },
    ],
    slots: [],
  },
  {
    title: "Starter Template · G12 Math Final Prep Custom",
    mode: "custom",
    status: "ready",
    gradeCode: "G12",
    subjectCode: "MATH",
    totalMarks: 15,
    pdfTemplateKey: "myanmar_matric",
    examYearLabel: "2020",
    timeAllowedLabel: "(3) Hours",
    departmentLine: "DEPARTMENT OF MYANMAR EXAMINATION",
    answerInstructionLine: "WRITE YOUR ANSWERS IN THE ANSWER BOOKLET.",
    includeAnswerPaper: true,
    difficultyDistribution: {
      easy: 20,
      normal: 40,
      hard: 20,
      advance: 20,
    },
    presetChapterCodes: ["G12-MATH-01", "G12-MATH-02", "G12-MATH-03", "G12-MATH-04", "G12-MATH-05"],
    templateConfig: {
      isPublished: true,
      availablePlanCodes: ["premium"],
    },
    sections: [
      {
        code: "A",
        title: "Answer ALL questions",
        questionType: QuestionType.mcq,
        marksPerQuestion: 1,
        questionCount: 2,
        totalMarks: 2,
        sortOrder: 0,
      },
      {
        code: "B",
        title: "Answer the short-answer question",
        questionType: QuestionType.short_answer,
        marksPerQuestion: 3,
        questionCount: 1,
        totalMarks: 3,
        sortOrder: 1,
      },
      {
        code: "C",
        title: "Answer the long-answer question",
        questionType: QuestionType.long_answer,
        marksPerQuestion: 10,
        questionCount: 1,
        totalMarks: 10,
        sortOrder: 2,
      },
    ],
    slots: [
      {
        sectionCode: "A",
        slotNumber: 1,
        questionType: QuestionType.mcq,
        marks: 1,
        difficultyTarget: "normal",
        chapterCode: "G12-MATH-01",
        subChapterCode: "G12-MATH-01-A",
        swapLimit: 3,
      },
      {
        sectionCode: "A",
        slotNumber: 2,
        questionType: QuestionType.mcq,
        marks: 1,
        difficultyTarget: "easy",
        chapterCode: "G12-MATH-03",
        subChapterCode: "G12-MATH-03-A",
        swapLimit: 3,
      },
      {
        sectionCode: "B",
        slotNumber: 3,
        questionType: QuestionType.short_answer,
        marks: 3,
        difficultyTarget: "hard",
        chapterCode: "G12-MATH-04",
        subChapterCode: "G12-MATH-04-B",
        swapLimit: 2,
      },
      {
        sectionCode: "C",
        slotNumber: 4,
        questionType: QuestionType.long_answer,
        marks: 10,
        difficultyTarget: "hard",
        chapterCode: "G12-MATH-02",
        subChapterCode: "G12-MATH-02-A",
        swapLimit: 1,
      },
    ],
  },
  {
    title: "Starter Template · G12 English Reading Drill",
    mode: "all_type",
    status: "ready",
    gradeCode: "G12",
    subjectCode: "ENG",
    totalMarks: 6,
    pdfTemplateKey: "default",
    includeAnswerPaper: true,
    difficultyDistribution: {
      easy: 30,
      normal: 50,
      hard: 20,
      advance: 0,
    },
    presetChapterCodes: ["G12-ENG-01", "G12-ENG-02"],
    templateConfig: {
      isPublished: true,
      availablePlanCodes: ["pro", "premium"],
    },
    sections: [
      {
        code: "A",
        title: "Reading MCQ",
        questionType: QuestionType.mcq,
        marksPerQuestion: 1,
        questionCount: 2,
        totalMarks: 2,
        sortOrder: 0,
      },
      {
        code: "B",
        title: "Grammar Short Response",
        questionType: QuestionType.short_answer,
        marksPerQuestion: 2,
        questionCount: 2,
        totalMarks: 4,
        sortOrder: 1,
      },
    ],
    slots: [],
  },
  {
    title: "Starter Template · G12 Science Concepts Check",
    mode: "all_type",
    status: "ready",
    gradeCode: "G12",
    subjectCode: "SCI",
    totalMarks: 7,
    pdfTemplateKey: "default",
    includeAnswerPaper: true,
    difficultyDistribution: {
      easy: 30,
      normal: 40,
      hard: 20,
      advance: 10,
    },
    presetChapterCodes: ["G12-SCI-01", "G12-SCI-02"],
    templateConfig: {
      isPublished: true,
      availablePlanCodes: ["pro", "premium"],
    },
    sections: [
      {
        code: "A",
        title: "Concept MCQ",
        questionType: QuestionType.mcq,
        marksPerQuestion: 1,
        questionCount: 2,
        totalMarks: 2,
        sortOrder: 0,
      },
      {
        code: "B",
        title: "Short Explanation",
        questionType: QuestionType.short_answer,
        marksPerQuestion: 2,
        questionCount: 1,
        totalMarks: 2,
        sortOrder: 1,
      },
      {
        code: "C",
        title: "Matching",
        questionType: QuestionType.matching,
        marksPerQuestion: 3,
        questionCount: 1,
        totalMarks: 3,
        sortOrder: 2,
      },
    ],
    slots: [],
  },
] as const;

const reviewStatusFor = (isPublished: boolean) =>
  isPublished ? QuestionReviewStatus.approved : QuestionReviewStatus.draft;

const toSvgDataUrl = (svg: string) =>
  `data:image/svg+xml;base64,${Buffer.from(svg.trim()).toString("base64")}`;

const buildMathSvgCard = (params: {
  title: string;
  subtitle?: string;
  body: string;
}) =>
  toSvgDataUrl(`
    <svg xmlns="http://www.w3.org/2000/svg" width="900" height="480" viewBox="0 0 900 480">
      <rect width="900" height="480" rx="28" fill="#f8fafc" />
      <rect x="20" y="20" width="860" height="440" rx="22" fill="#ffffff" stroke="#cbd5e1" stroke-width="3" />
      <text x="60" y="100" font-family="Arial, Helvetica, sans-serif" font-size="34" font-weight="700" fill="#0f172a">${params.title}</text>
      ${
        params.subtitle
          ? `<text x="60" y="146" font-family="Arial, Helvetica, sans-serif" font-size="20" fill="#475569">${params.subtitle}</text>`
          : ""
      }
      <foreignObject x="56" y="180" width="788" height="220">
        <div xmlns="http://www.w3.org/1999/xhtml" style="font-family: Arial, Helvetica, sans-serif; color: #1e293b; font-size: 28px; line-height: 1.45;">
          ${params.body}
        </div>
      </foreignObject>
    </svg>
  `);

const MATH_SVG_ASSETS = {
  parabolaFocus: buildMathSvgCard({
    title: "Parabola Diagram",
    subtitle: "Standard form: y² = 8x",
    body:
      "<div>Vertex: (0, 0)<br/>Focus: (2, 0)<br/>Directrix: x = -2</div>",
  }),
  hyperbolaStandard: buildMathSvgCard({
    title: "Hyperbola Reference",
    subtitle: "x²/9 − y²/16 = 1",
    body:
      "<div>Center: (0, 0)<br/>a = 3, b = 4<br/>Opens left and right</div>",
  }),
  trigShift: buildMathSvgCard({
    title: "Trig Transformation",
    subtitle: "y = sin(x + 45°)",
    body:
      "<div>Amplitude: 1<br/>Period: 360°<br/>Phase shift: 45° left</div>",
  }),
  complexPlane: buildMathSvgCard({
    title: "Argand Diagram",
    subtitle: "Point P(-2, 3)",
    body:
      "<div>Real axis = x-axis<br/>Imaginary axis = y-axis<br/>Point P corresponds to -2 + 3i</div>",
  }),
  ellipseMajorAxis: buildMathSvgCard({
    title: "Ellipse Reference",
    subtitle: "x²/16 + y²/9 = 1",
    body:
      "<div>Center: (0, 0)<br/>Major axis along x-axis<br/>Vertices: (±4, 0)</div>",
  }),
  limitApproach: buildMathSvgCard({
    title: "Limit from a Graph",
    subtitle: "As x approaches 2",
    body:
      "<div>Left-hand and right-hand values both approach 5<br/>Open circle at (2, 5)</div>",
  }),
  shiftedParabola: buildMathSvgCard({
    title: "Shifted Parabola",
    subtitle: "y = (x - 2)² - 1",
    body:
      "<div>Vertex: (2, -1)<br/>Axis of symmetry: x = 2<br/>Opens upward</div>",
  }),
  trigComparison: buildMathSvgCard({
    title: "Trig Comparison",
    subtitle: "Compare sin x and 2sin x",
    body:
      "<div>Both have the same period<br/>2sin x has larger amplitude</div>",
  }),
  quadraticGraph: buildMathSvgCard({
    title: "Quadratic Function",
    subtitle: "y = (x - 1)(x - 5)",
    body:
      "<div>x-intercepts: 1 and 5<br/>Axis of symmetry: x = 3<br/>Vertex lies below the x-axis</div>",
  }),
  derivativeSlope: buildMathSvgCard({
    title: "Derivative Snapshot",
    subtitle: "y = x² at x = 2",
    body:
      "<div>Tangent slope = 4<br/>Gradient increases as x increases<br/>Use f'(x) = 2x</div>",
  }),
  logarithmSteps: buildMathSvgCard({
    title: "Logarithm Rule",
    subtitle: "logₐ(MN) = logₐ M + logₐ N",
    body:
      "<div>Useful for simplifying products<br/>Also recall logₐ(Mⁿ) = n logₐ M</div>",
  }),
  forceDiagram: buildMathSvgCard({
    title: "Force Diagram",
    subtitle: "Balanced forces on a box",
    body:
      "<div>10 N left and 10 N right<br/>Net force = 0 N<br/>The object stays in equilibrium</div>",
  }),
  energyTransfer: buildMathSvgCard({
    title: "Energy Transfer",
    subtitle: "Battery to lamp",
    body:
      "<div>Chemical energy → electrical energy → light and heat energy</div>",
  }),
} as const;

const withCommonFields = <T extends Omit<QuestionSeed, "mode" | "type" | "reviewStatus" | "options">>(
  config: T,
  overrides: Pick<QuestionSeed, "mode" | "type" | "options">,
): QuestionSeed => ({
  ...config,
  ...overrides,
  reviewStatus: reviewStatusFor(config.isPublished),
});

const mcq = (
  config: Omit<QuestionSeed, "mode" | "type" | "reviewStatus"> & {
    options: readonly OptionSeed[];
  },
): QuestionSeed =>
  withCommonFields(config, {
    mode: QuestionMode.static,
    type: QuestionType.mcq,
    options: config.options,
  });

const shortAnswer = (
  config: Omit<QuestionSeed, "mode" | "type" | "options" | "reviewStatus">,
): QuestionSeed =>
  withCommonFields(config, {
    mode: QuestionMode.static,
    type: QuestionType.short_answer,
    options: [],
  });

const longAnswer = (
  config: Omit<QuestionSeed, "mode" | "type" | "options" | "reviewStatus">,
): QuestionSeed =>
  withCommonFields(config, {
    mode: QuestionMode.static,
    type: QuestionType.long_answer,
    options: [],
  });

const trueFalse = (
  config: Omit<QuestionSeed, "mode" | "type" | "options" | "reviewStatus">,
): QuestionSeed =>
  withCommonFields(config, {
    mode: QuestionMode.static,
    type: QuestionType.true_false,
    options: [],
  });

const fillBlank = (
  config: Omit<QuestionSeed, "mode" | "type" | "options" | "reviewStatus">,
): QuestionSeed =>
  withCommonFields(config, {
    mode: QuestionMode.static,
    type: QuestionType.fill_blank,
    options: [],
  });

const matching = (
  config: Omit<QuestionSeed, "mode" | "type" | "reviewStatus"> & {
    options: readonly OptionSeed[];
  },
): QuestionSeed =>
  withCommonFields(config, {
    mode: QuestionMode.static,
    type: QuestionType.matching,
    options: config.options,
  });

const variableShortAnswer = (
  config: Omit<QuestionSeed, "type" | "options" | "reviewStatus">,
): QuestionSeed => ({
  ...config,
  type: QuestionType.short_answer,
  options: [],
  reviewStatus: reviewStatusFor(config.isPublished),
});

const curatedMathQuestionSeeds: readonly QuestionSeed[] = [
  mcq({
    questionCode: "QB-G06-MATH-LTX-0001",
    title: "Fraction addition with LaTeX",
    gradeCode: "G06",
    subjectCode: "MATH",
    chapterCode: "G06-MATH-01",
    subChapterCode: "G06-MATH-01-C",
    difficulty: Difficulty.medium,
    body: "Find $\\frac{1}{4} + \\frac{1}{2}$.",
    explanation:
      "Use a common denominator: $\\frac{1}{2} = \\frac{2}{4}$, so $\\frac{1}{4} + \\frac{2}{4} = \\frac{3}{4}$.",
    marks: 1,
    estimatedTimeSec: 50,
    isPublished: true,
    options: [
      { label: "A", text: "$\\frac{1}{2}$", isCorrect: false, sortOrder: 0 },
      { label: "B", text: "$\\frac{2}{3}$", isCorrect: false, sortOrder: 1 },
      { label: "C", text: "$\\frac{3}{4}$", isCorrect: true, sortOrder: 2 },
      { label: "D", text: "$1$", isCorrect: false, sortOrder: 3 },
    ],
  }),
  fillBlank({
    questionCode: "QB-G06-MATH-LTX-0002",
    title: "Square root fill blank",
    gradeCode: "G06",
    subjectCode: "MATH",
    chapterCode: "G06-MATH-02",
    subChapterCode: "G06-MATH-02-B",
    difficulty: Difficulty.easy,
    body: "Fill in the blank: $\\sqrt{81} =$ ____.",
    answerText: "9",
    explanation: "$9 \\times 9 = 81$, so $\\sqrt{81} = 9$.",
    marks: 1,
    estimatedTimeSec: 40,
    isPublished: true,
  }),
  shortAnswer({
    questionCode: "QB-G07-MATH-LTX-0003",
    title: "Solve one-step equation",
    gradeCode: "G07",
    subjectCode: "MATH",
    chapterCode: "G07-MATH-01",
    subChapterCode: "G07-MATH-01-B",
    difficulty: Difficulty.medium,
    body: "Solve for $x$: $x + 7 = 19$.",
    answerText: "$x = 12$",
    explanation: "Subtract 7 from both sides: $x = 19 - 7 = 12$.",
    marks: 2,
    estimatedTimeSec: 55,
    isPublished: true,
  }),
  trueFalse({
    questionCode: "QB-G07-MATH-LTX-0004",
    title: "Percentage equivalence",
    gradeCode: "G07",
    subjectCode: "MATH",
    chapterCode: "G07-MATH-02",
    subChapterCode: "G07-MATH-02-B",
    difficulty: Difficulty.easy,
    body: "True or False: $25\\% = \\frac{1}{4}$.",
    answerText: "True",
    explanation: "$25\\% = \\frac{25}{100} = \\frac{1}{4}$.",
    marks: 1,
    estimatedTimeSec: 35,
    isPublished: true,
  }),
  matching({
    questionCode: "QB-G08-MATH-LTX-0005",
    title: "Match algebraic expressions",
    gradeCode: "G08",
    subjectCode: "MATH",
    chapterCode: "G08-MATH-01",
    subChapterCode: "G08-MATH-01-A",
    difficulty: Difficulty.medium,
    body: "Match each algebraic expression with its simplified value when $x = 2$.",
    explanation: "Substitute $x = 2$ into each expression first, then simplify.",
    marks: 5,
    estimatedTimeSec: 90,
    isPublished: true,
    options: [
      { label: "$x + 5$", text: "$7$", isCorrect: true, sortOrder: 0 },
      { label: "$3x$", text: "$6$", isCorrect: true, sortOrder: 1 },
      { label: "$x^2 + 1$", text: "$5$", isCorrect: true, sortOrder: 2 },
    ],
  }),
  shortAnswer({
    questionCode: "QB-G08-MATH-LTX-0006",
    title: "Slope from two points",
    gradeCode: "G08",
    subjectCode: "MATH",
    chapterCode: "G08-MATH-01",
    subChapterCode: "G08-MATH-01-B",
    difficulty: Difficulty.hard,
    body: "Find the slope of the line through $(2, 5)$ and $(6, 13)$.",
    answerText: "$2$",
    explanation:
      "Use $m = \\frac{y_2 - y_1}{x_2 - x_1} = \\frac{13 - 5}{6 - 2} = \\frac{8}{4} = 2$.",
    marks: 3,
    estimatedTimeSec: 85,
    isPublished: true,
  }),
  mcq({
    questionCode: "QB-G12-MATH-LTX-0007",
    title: "Quadratic factorization",
    gradeCode: "G12",
    subjectCode: "MATH",
    chapterCode: "G12-MATH-01",
    subChapterCode: "G12-MATH-01-A",
    difficulty: Difficulty.medium,
    body: "Which expression is equivalent to $x^2 - 5x + 6$?",
    explanation: "Look for two numbers whose product is 6 and sum is -5: -2 and -3.",
    marks: 1,
    estimatedTimeSec: 55,
    isPublished: true,
    options: [
      { label: "A", text: "$(x-1)(x-6)$", isCorrect: false, sortOrder: 0 },
      { label: "B", text: "$(x-2)(x-3)$", isCorrect: true, sortOrder: 1 },
      { label: "C", text: "$(x+2)(x+3)$", isCorrect: false, sortOrder: 2 },
      { label: "D", text: "$(x+1)(x+6)$", isCorrect: false, sortOrder: 3 },
    ],
  }),
  fillBlank({
    questionCode: "QB-G12-MATH-LTX-0008",
    title: "Logarithm value",
    gradeCode: "G12",
    subjectCode: "MATH",
    chapterCode: "G12-MATH-01",
    subChapterCode: "G12-MATH-01-B",
    difficulty: Difficulty.hard,
    body: "Fill in the blank: If $2^5 = 32$, then $\\log_2 32 =$ ____.",
    answerText: "5",
    explanation: "A logarithm asks for the power, so $\\log_2 32 = 5$.",
    marks: 1,
    estimatedTimeSec: 50,
    isPublished: true,
  }),
  shortAnswer({
    questionCode: "QB-G12-MATH-LTX-0009",
    title: "Differentiate polynomial",
    gradeCode: "G12",
    subjectCode: "MATH",
    chapterCode: "G12-MATH-02",
    subChapterCode: "G12-MATH-02-B",
    difficulty: Difficulty.hard,
    body: "Differentiate $f(x) = 4x^3 - 3x^2 + 2x - 7$.",
    answerText: "$f'(x) = 12x^2 - 6x + 2$",
    explanation:
      "Apply the power rule term by term: $\\frac{d}{dx}(4x^3)=12x^2$, $\\frac{d}{dx}(-3x^2)=-6x$, $\\frac{d}{dx}(2x)=2$.",
    marks: 3,
    estimatedTimeSec: 100,
    isPublished: true,
  }),
  longAnswer({
    questionCode: "QB-G12-MATH-LTX-0010",
    title: "Limit explanation",
    gradeCode: "G12",
    subjectCode: "MATH",
    chapterCode: "G12-MATH-02",
    subChapterCode: "G12-MATH-02-A",
    difficulty: Difficulty.hard,
    body:
      "Evaluate and explain: $$\\lim_{x \\to 3} (2x^2 - x + 4).$$ Show the substitution step clearly.",
    explanation:
      "A full-mark answer states that direct substitution works for polynomials and computes $2(3)^2 - 3 + 4 = 19$.",
    marks: 10,
    estimatedTimeSec: 220,
    isPublished: true,
  }),
  mcq({
    questionCode: "QB-G12-MATH-LTX-0011",
    title: "Imaginary unit square",
    gradeCode: "G12",
    subjectCode: "MATH",
    chapterCode: "G12-MATH-03",
    subChapterCode: "G12-MATH-03-A",
    difficulty: Difficulty.easy,
    body: "What is the value of $i^2$?",
    explanation: "By definition of the imaginary unit, $i^2 = -1$.",
    marks: 1,
    estimatedTimeSec: 35,
    isPublished: true,
    options: [
      { label: "A", text: "$1$", isCorrect: false, sortOrder: 0 },
      { label: "B", text: "$-1$", isCorrect: true, sortOrder: 1 },
      { label: "C", text: "$i$", isCorrect: false, sortOrder: 2 },
      { label: "D", text: "$-i$", isCorrect: false, sortOrder: 3 },
    ],
  }),
  shortAnswer({
    questionCode: "QB-G12-MATH-LTX-0012",
    title: "Add complex numbers",
    gradeCode: "G12",
    subjectCode: "MATH",
    chapterCode: "G12-MATH-03",
    subChapterCode: "G12-MATH-03-A",
    difficulty: Difficulty.medium,
    body: "Simplify $(3 + 2i) + (5 - 7i)$.",
    answerText: "$8 - 5i$",
    explanation: "Add real parts and imaginary parts separately: $(3+5) + (2i-7i) = 8 - 5i$.",
    marks: 2,
    estimatedTimeSec: 60,
    isPublished: true,
  }),
  fillBlank({
    questionCode: "QB-G12-MATH-LTX-0013",
    title: "Modulus of a complex number",
    gradeCode: "G12",
    subjectCode: "MATH",
    chapterCode: "G12-MATH-03",
    subChapterCode: "G12-MATH-03-B",
    difficulty: Difficulty.medium,
    body: "Fill in the blank: The modulus of $3 + 4i$ is ____.",
    answerText: "5",
    explanation: "$|3 + 4i| = \\sqrt{3^2 + 4^2} = \\sqrt{25} = 5$.",
    marks: 1,
    estimatedTimeSec: 55,
    isPublished: true,
  }),
  mcq({
    questionCode: "QB-G12-MATH-LTX-0014",
    title: "Amplitude of a trig function",
    gradeCode: "G12",
    subjectCode: "MATH",
    chapterCode: "G12-MATH-04",
    subChapterCode: "G12-MATH-04-A",
    difficulty: Difficulty.medium,
    body: "What is the amplitude of $y = 3\\sin x - 2$?",
    explanation: "For $y = a\\sin x + k$, the amplitude is $|a|$, so the amplitude is $3$.",
    marks: 1,
    estimatedTimeSec: 45,
    isPublished: true,
    options: [
      { label: "A", text: "$1$", isCorrect: false, sortOrder: 0 },
      { label: "B", text: "$2$", isCorrect: false, sortOrder: 1 },
      { label: "C", text: "$3$", isCorrect: true, sortOrder: 2 },
      { label: "D", text: "$5$", isCorrect: false, sortOrder: 3 },
    ],
  }),
  fillBlank({
    questionCode: "QB-G12-MATH-LTX-0015",
    title: "Period of a transformed sine graph",
    gradeCode: "G12",
    subjectCode: "MATH",
    chapterCode: "G12-MATH-04",
    subChapterCode: "G12-MATH-04-A",
    difficulty: Difficulty.medium,
    body: "Fill in the blank: The period of $y = \\sin(2x)$ is ____.",
    answerText: "$\\pi$",
    explanation: "For $y = \\sin(bx)$, period $= \\frac{2\\pi}{b} = \\frac{2\\pi}{2} = \\pi$.",
    marks: 1,
    estimatedTimeSec: 60,
    isPublished: true,
  }),
  shortAnswer({
    questionCode: "QB-G12-MATH-LTX-0016",
    title: "Describe a trig translation",
    gradeCode: "G12",
    subjectCode: "MATH",
    chapterCode: "G12-MATH-04",
    subChapterCode: "G12-MATH-04-B",
    difficulty: Difficulty.hard,
    body: "Describe the transformations from $y = \\sin x$ to $y = \\sin(x - 30^\\circ) + 2$.",
    answerText: "Shift 30 degrees to the right and 2 units up",
    explanation:
      "$x - 30^\\circ$ gives a horizontal shift to the right by $30^\\circ$, and $+2$ shifts the graph upward by 2 units.",
    marks: 3,
    estimatedTimeSec: 95,
    isPublished: true,
  }),
  mcq({
    questionCode: "QB-G12-MATH-LTX-0017",
    title: "Identify a conic",
    gradeCode: "G12",
    subjectCode: "MATH",
    chapterCode: "G12-MATH-05",
    subChapterCode: "G12-MATH-05-A",
    difficulty: Difficulty.easy,
    body: "The graph of $y = x^2$ is which conic section?",
    explanation: "$y = x^2$ is the standard form of a parabola opening upward.",
    marks: 1,
    estimatedTimeSec: 35,
    isPublished: true,
    options: [
      { label: "A", text: "Circle", isCorrect: false, sortOrder: 0 },
      { label: "B", text: "Parabola", isCorrect: true, sortOrder: 1 },
      { label: "C", text: "Ellipse", isCorrect: false, sortOrder: 2 },
      { label: "D", text: "Hyperbola", isCorrect: false, sortOrder: 3 },
    ],
  }),
  shortAnswer({
    questionCode: "QB-G12-MATH-LTX-0018",
    title: "Circle center and radius",
    gradeCode: "G12",
    subjectCode: "MATH",
    chapterCode: "G12-MATH-05",
    subChapterCode: "G12-MATH-05-A",
    difficulty: Difficulty.medium,
    body: "Find the center and radius of $x^2 + y^2 = 25$.",
    answerText: "Center (0,0), radius 5",
    explanation: "Compare with $(x-h)^2 + (y-k)^2 = r^2$. Here $h=0$, $k=0$, and $r=5$.",
    marks: 2,
    estimatedTimeSec: 70,
    isPublished: true,
  }),
  fillBlank({
    questionCode: "QB-G12-MATH-LTX-0019",
    title: "Focus of a parabola",
    gradeCode: "G12",
    subjectCode: "MATH",
    chapterCode: "G12-MATH-05",
    subChapterCode: "G12-MATH-05-A",
    difficulty: Difficulty.hard,
    body: "Fill in the blank: For the parabola $y^2 = 8x$, the focus is ____.",
    answerText: "$(2,0)$",
    explanation: "Compare with $y^2 = 4ax$. Then $4a = 8$, so $a=2$ and the focus is $(2,0)$.",
    questionImageUrls: [MATH_SVG_ASSETS.parabolaFocus],
    solutionImageUrls: [MATH_SVG_ASSETS.parabolaFocus],
    marks: 1,
    estimatedTimeSec: 75,
    isPublished: true,
  }),
  mcq({
    questionCode: "QB-G12-MATH-LTX-0020",
    title: "Modulus of a complex number in surd form",
    gradeCode: "G12",
    subjectCode: "MATH",
    chapterCode: "G12-MATH-03",
    subChapterCode: "G12-MATH-03-B",
    difficulty: Difficulty.hard,
    body: "If $z = -1 + \\sqrt{3}i$, what is $|z|$?",
    explanation:
      "Use $|a+bi| = \\sqrt{a^2 + b^2} = \\sqrt{(-1)^2 + (\\sqrt{3})^2} = \\sqrt{4} = 2$.",
    marks: 1,
    estimatedTimeSec: 70,
    isPublished: true,
    options: [
      { label: "A", text: "$1$", isCorrect: false, sortOrder: 0 },
      { label: "B", text: "$2$", isCorrect: true, sortOrder: 1 },
      { label: "C", text: "$\\sqrt{3}$", isCorrect: false, sortOrder: 2 },
      { label: "D", text: "$4$", isCorrect: false, sortOrder: 3 },
    ],
  }),
  mcq({
    questionCode: "QB-G12-MATH-LTX-0021",
    title: "Phase shift of a sine graph",
    gradeCode: "G12",
    subjectCode: "MATH",
    chapterCode: "G12-MATH-04",
    subChapterCode: "G12-MATH-04-B",
    difficulty: Difficulty.hard,
    body: "Which phase shift describes $y = \\sin(x + 45^\\circ)$?",
    explanation:
      "Replacing $x$ with $x + 45^\\circ$ shifts the graph $45^\\circ$ to the left.",
    questionImageUrls: [MATH_SVG_ASSETS.trigShift],
    solutionImageUrls: [MATH_SVG_ASSETS.trigShift],
    marks: 1,
    estimatedTimeSec: 65,
    isPublished: true,
    options: [
      { label: "A", text: "Shift $45^\\circ$ right", isCorrect: false, sortOrder: 0 },
      { label: "B", text: "Shift $45^\\circ$ left", isCorrect: true, sortOrder: 1 },
      { label: "C", text: "Shift 2 units up", isCorrect: false, sortOrder: 2 },
      { label: "D", text: "No phase shift", isCorrect: false, sortOrder: 3 },
    ],
  }),
  mcq({
    questionCode: "QB-G12-MATH-LTX-0022",
    title: "Identify a hyperbola from standard form",
    gradeCode: "G12",
    subjectCode: "MATH",
    chapterCode: "G12-MATH-05",
    subChapterCode: "G12-MATH-05-B",
    difficulty: Difficulty.hard,
    body: "The equation $\\frac{x^2}{9} - \\frac{y^2}{16} = 1$ represents which conic?",
    explanation:
      "A difference of squared terms equal to 1 is the standard form of a hyperbola.",
    questionImageUrls: [MATH_SVG_ASSETS.hyperbolaStandard],
    solutionImageUrls: [MATH_SVG_ASSETS.hyperbolaStandard],
    marks: 1,
    estimatedTimeSec: 60,
    isPublished: true,
    options: [
      { label: "A", text: "Circle", isCorrect: false, sortOrder: 0 },
      { label: "B", text: "Ellipse", isCorrect: false, sortOrder: 1 },
      { label: "C", text: "Parabola", isCorrect: false, sortOrder: 2 },
      { label: "D", text: "Hyperbola", isCorrect: true, sortOrder: 3 },
    ],
  }),
  mcq({
    questionCode: "QB-G12-MATH-LTX-0028",
    title: "Read a complex number from the Argand diagram",
    gradeCode: "G12",
    subjectCode: "MATH",
    chapterCode: "G12-MATH-03",
    subChapterCode: "G12-MATH-03-A",
    difficulty: Difficulty.medium,
    body: "In the Argand diagram, point $P(-2,3)$ represents which complex number?",
    explanation:
      "A point $(a,b)$ on the Argand plane represents the complex number $a + bi$, so the point is $-2 + 3i$.",
    questionImageUrls: [MATH_SVG_ASSETS.complexPlane],
    solutionImageUrls: [MATH_SVG_ASSETS.complexPlane],
    marks: 1,
    estimatedTimeSec: 55,
    isPublished: true,
    options: [
      { label: "A", text: "$-2 + 3i$", isCorrect: true, sortOrder: 0 },
      { label: "B", text: "$2 - 3i$", isCorrect: false, sortOrder: 1 },
      { label: "C", text: "$3 - 2i$", isCorrect: false, sortOrder: 2 },
      { label: "D", text: "$-3 + 2i$", isCorrect: false, sortOrder: 3 },
    ],
  }),
  fillBlank({
    questionCode: "QB-G12-MATH-LTX-0029",
    title: "Maximum value of a transformed cosine graph",
    gradeCode: "G12",
    subjectCode: "MATH",
    chapterCode: "G12-MATH-04",
    subChapterCode: "G12-MATH-04-A",
    difficulty: Difficulty.medium,
    body: "Fill in the blank: The maximum value of $y = 2\\cos x + 1$ is ____.",
    answerText: "3",
    explanation: "The cosine value ranges from $-1$ to $1$. Multiplying by 2 gives $-2$ to $2$, then adding 1 gives $-1$ to $3$.",
    marks: 1,
    estimatedTimeSec: 55,
    isPublished: true,
  }),
  shortAnswer({
    questionCode: "QB-G12-MATH-LTX-0030",
    title: "Read the vertices of an ellipse",
    gradeCode: "G12",
    subjectCode: "MATH",
    chapterCode: "G12-MATH-05",
    subChapterCode: "G12-MATH-05-A",
    difficulty: Difficulty.medium,
    body: "For the ellipse $\\frac{x^2}{16} + \\frac{y^2}{9} = 1$, state the vertices on the major axis.",
    answerText: "$(\\pm 4, 0)$",
    explanation: "Since $a^2 = 16$, we have $a = 4$. The major axis lies on the x-axis, so the vertices are $(4,0)$ and $(-4,0)$.",
    questionImageUrls: [MATH_SVG_ASSETS.ellipseMajorAxis],
    solutionImageUrls: [MATH_SVG_ASSETS.ellipseMajorAxis],
    marks: 2,
    estimatedTimeSec: 75,
    isPublished: true,
  }),
  mcq({
    questionCode: "QB-G12-MATH-LTX-0031",
    title: "Limit read from a graph",
    gradeCode: "G12",
    subjectCode: "MATH",
    chapterCode: "G12-MATH-02",
    subChapterCode: "G12-MATH-02-A",
    difficulty: Difficulty.medium,
    body: "From the graph, what is $\\lim_{x \\to 2} f(x)$?",
    explanation:
      "Both sides of the graph approach the same y-value, 5, as $x$ approaches 2. So the limit is 5.",
    questionImageUrls: [MATH_SVG_ASSETS.limitApproach],
    solutionImageUrls: [MATH_SVG_ASSETS.limitApproach],
    marks: 1,
    estimatedTimeSec: 60,
    isPublished: true,
    options: [
      { label: "A", text: "$2$", isCorrect: false, sortOrder: 0 },
      { label: "B", text: "$4$", isCorrect: false, sortOrder: 1 },
      { label: "C", text: "$5$", isCorrect: true, sortOrder: 2 },
      { label: "D", text: "Does not exist", isCorrect: false, sortOrder: 3 },
    ],
  }),
  trueFalse({
    questionCode: "QB-G12-MATH-LTX-0032",
    title: "Asymptotes of a hyperbola",
    gradeCode: "G12",
    subjectCode: "MATH",
    chapterCode: "G12-MATH-05",
    subChapterCode: "G12-MATH-05-B",
    difficulty: Difficulty.hard,
    body: "True or False: The asymptotes of $\\frac{x^2}{9} - \\frac{y^2}{16} = 1$ are $y = \\pm \\frac{4}{3}x$.",
    answerText: "True",
    explanation:
      "For $\\frac{x^2}{a^2} - \\frac{y^2}{b^2} = 1$, the asymptotes are $y = \\pm \\frac{b}{a}x$. Here $a=3$ and $b=4$.",
    questionImageUrls: [MATH_SVG_ASSETS.hyperbolaStandard],
    solutionImageUrls: [MATH_SVG_ASSETS.hyperbolaStandard],
    marks: 1,
    estimatedTimeSec: 55,
    isPublished: true,
  }),
  matching({
    questionCode: "QB-G12-MATH-LTX-0033",
    title: "Match trig equations with their key features",
    gradeCode: "G12",
    subjectCode: "MATH",
    chapterCode: "G12-MATH-04",
    subChapterCode: "G12-MATH-04-B",
    difficulty: Difficulty.medium,
    body: "Match each trigonometric equation with the correct graph feature.",
    explanation:
      "Compare the coefficient in front of the trig function for amplitude and the number multiplying x for period changes.",
    questionImageUrls: [MATH_SVG_ASSETS.trigComparison],
    solutionImageUrls: [MATH_SVG_ASSETS.trigComparison],
    marks: 5,
    estimatedTimeSec: 100,
    isPublished: true,
    options: [
      { label: "$y = 2\\sin x$", text: "Amplitude 2", isCorrect: true, sortOrder: 0 },
      { label: "$y = \\sin(2x)$", text: "Period $\\pi$", isCorrect: true, sortOrder: 1 },
      { label: "$y = \\cos x + 3$", text: "Shifted 3 units up", isCorrect: true, sortOrder: 2 },
    ],
  }),
  longAnswer({
    questionCode: "QB-G12-MATH-LTX-0034",
    title: "Describe a shifted parabola",
    gradeCode: "G12",
    subjectCode: "MATH",
    chapterCode: "G12-MATH-05",
    subChapterCode: "G12-MATH-05-A",
    difficulty: Difficulty.hard,
    body:
      "Using the graph of $y = (x - 2)^2 - 1$, describe the vertex, the axis of symmetry, and the direction in which the parabola opens.",
    answerText: "Vertex (2,-1), axis of symmetry x = 2, opens upward",
    explanation:
      "The equation is in the form $y = (x-h)^2 + k$. Hence the vertex is $(h,k)=(2,-1)$, the axis is $x=2$, and the positive coefficient means the parabola opens upward.",
    questionImageUrls: [MATH_SVG_ASSETS.shiftedParabola],
    solutionImageUrls: [MATH_SVG_ASSETS.shiftedParabola],
    marks: 10,
    estimatedTimeSec: 220,
    isPublished: true,
  }),
  fillBlank({
    questionCode: "QB-G12-MATH-LTX-0023",
    title: "Value of a quadratic at a point",
    gradeCode: "G12",
    subjectCode: "MATH",
    chapterCode: "G12-MATH-01",
    subChapterCode: "G12-MATH-01-A",
    difficulty: Difficulty.medium,
    body: "Fill in the blank: If $f(x) = x^2 - 4x + 4$, then $f(2) =$ ____.",
    answerText: "0",
    explanation: "Substitute $x = 2$: $2^2 - 4(2) + 4 = 4 - 8 + 4 = 0$.",
    marks: 1,
    estimatedTimeSec: 50,
    isPublished: true,
  }),
  shortAnswer({
    questionCode: "QB-G12-MATH-LTX-0024",
    title: "Evaluate a factorized limit",
    gradeCode: "G12",
    subjectCode: "MATH",
    chapterCode: "G12-MATH-02",
    subChapterCode: "G12-MATH-02-A",
    difficulty: Difficulty.hard,
    body: "Evaluate $\\lim_{x \\to 3} \\frac{x^2 - 9}{x - 3}$.",
    answerText: "$6$",
    explanation:
      "Factor the numerator: $x^2 - 9 = (x-3)(x+3)$. Cancel $(x-3)$, then substitute $x=3$ to get $6$.",
    marks: 3,
    estimatedTimeSec: 95,
    isPublished: true,
  }),
  trueFalse({
    questionCode: "QB-G12-MATH-LTX-0025",
    title: "Modulus statement check",
    gradeCode: "G12",
    subjectCode: "MATH",
    chapterCode: "G12-MATH-03",
    subChapterCode: "G12-MATH-03-B",
    difficulty: Difficulty.medium,
    body: "True or False: $|1 - i| = 2$.",
    answerText: "False",
    explanation:
      "$|1 - i| = \\sqrt{1^2 + (-1)^2} = \\sqrt{2}$, not $2$.",
    marks: 1,
    estimatedTimeSec: 45,
    isPublished: true,
  }),
  matching({
    questionCode: "QB-G12-MATH-LTX-0026",
    title: "Match conic equations with conic names",
    gradeCode: "G12",
    subjectCode: "MATH",
    chapterCode: "G12-MATH-05",
    subChapterCode: "G12-MATH-05-B",
    difficulty: Difficulty.medium,
    body: "Match each standard equation with the correct conic section.",
    explanation:
      "Check whether the equation has one squared variable, both added squared variables, or a difference of squared variables.",
    marks: 5,
    estimatedTimeSec: 95,
    isPublished: true,
    options: [
      { label: "$y^2 = 8x$", text: "Parabola", isCorrect: true, sortOrder: 0 },
      { label: "$x^2 + y^2 = 16$", text: "Circle", isCorrect: true, sortOrder: 1 },
      { label: "$\\frac{x^2}{9} - \\frac{y^2}{4} = 1$", text: "Hyperbola", isCorrect: true, sortOrder: 2 },
    ],
  }),
  longAnswer({
    questionCode: "QB-G12-MATH-LTX-0027",
    title: "Compare ellipse and hyperbola features",
    gradeCode: "G12",
    subjectCode: "MATH",
    chapterCode: "G12-MATH-05",
    subChapterCode: "G12-MATH-05-B",
    difficulty: Difficulty.hard,
    body:
      "Explain two differences between an ellipse and a hyperbola, and give one example equation for each.",
    explanation:
      "A strong answer compares the overall graph shape and the standard-form sign pattern, then gives one correct example for each conic.",
    marks: 10,
    estimatedTimeSec: 240,
    isPublished: true,
  }),
  mcq({
    questionCode: "QB-G12-MATH-LTX-0035",
    title: "Roots of a quadratic expression",
    gradeCode: "G12",
    subjectCode: "MATH",
    chapterCode: "G12-MATH-01",
    subChapterCode: "G12-MATH-01-A",
    difficulty: Difficulty.medium,
    body: "The roots of $x^2 - 6x + 5 = 0$ are:",
    explanation: "Factorize: $x^2 - 6x + 5 = (x-1)(x-5)$, so the roots are 1 and 5.",
    questionImageUrls: [MATH_SVG_ASSETS.quadraticGraph],
    solutionImageUrls: [MATH_SVG_ASSETS.quadraticGraph],
    marks: 1,
    estimatedTimeSec: 55,
    isPublished: true,
    options: [
      { label: "A", text: "$1$ and $5$", isCorrect: true, sortOrder: 0 },
      { label: "B", text: "$-1$ and $-5$", isCorrect: false, sortOrder: 1 },
      { label: "C", text: "$2$ and $4$", isCorrect: false, sortOrder: 2 },
      { label: "D", text: "$-2$ and $-4$", isCorrect: false, sortOrder: 3 },
    ],
  }),
  shortAnswer({
    questionCode: "QB-G12-MATH-LTX-0036",
    title: "Use logarithm laws to simplify",
    gradeCode: "G12",
    subjectCode: "MATH",
    chapterCode: "G12-MATH-01",
    subChapterCode: "G12-MATH-01-B",
    difficulty: Difficulty.medium,
    body: "Simplify $\\log_a 8 + \\log_a 4$ into a single logarithm.",
    answerText: "$\\log_a 32$",
    explanation:
      "Use the product rule: $\\log_a 8 + \\log_a 4 = \\log_a (8 \\times 4) = \\log_a 32$.",
    questionImageUrls: [MATH_SVG_ASSETS.logarithmSteps],
    solutionImageUrls: [MATH_SVG_ASSETS.logarithmSteps],
    marks: 3,
    estimatedTimeSec: 85,
    isPublished: true,
  }),
  fillBlank({
    questionCode: "QB-G12-MATH-LTX-0037",
    title: "Derivative at a point",
    gradeCode: "G12",
    subjectCode: "MATH",
    chapterCode: "G12-MATH-02",
    subChapterCode: "G12-MATH-02-B",
    difficulty: Difficulty.medium,
    body: "Fill in the blank: If $f(x) = x^2$, then $f'(2) =$ ____.",
    answerText: "4",
    explanation: "Differentiate first: $f'(x) = 2x$. Then substitute $x = 2$ to get $4$.",
    questionImageUrls: [MATH_SVG_ASSETS.derivativeSlope],
    solutionImageUrls: [MATH_SVG_ASSETS.derivativeSlope],
    marks: 1,
    estimatedTimeSec: 50,
    isPublished: true,
  }),
  shortAnswer({
    questionCode: "QB-G12-MATH-LTX-0038",
    title: "Gradient of a tangent",
    gradeCode: "G12",
    subjectCode: "MATH",
    chapterCode: "G12-MATH-02",
    subChapterCode: "G12-MATH-02-B",
    difficulty: Difficulty.hard,
    body: "Find the gradient of the tangent to $y = x^2$ at the point where $x = 2$.",
    answerText: "4",
    explanation:
      "The derivative of $y = x^2$ is $\\frac{dy}{dx} = 2x$. At $x = 2$, the gradient is $2(2) = 4$.",
    questionImageUrls: [MATH_SVG_ASSETS.derivativeSlope],
    solutionImageUrls: [MATH_SVG_ASSETS.derivativeSlope],
    marks: 3,
    estimatedTimeSec: 95,
    isPublished: true,
  }),
  trueFalse({
    questionCode: "QB-G12-MATH-LTX-0039",
    title: "Continuity of a polynomial",
    gradeCode: "G12",
    subjectCode: "MATH",
    chapterCode: "G12-MATH-02",
    subChapterCode: "G12-MATH-02-A",
    difficulty: Difficulty.easy,
    body: "True or False: Every polynomial function is continuous for all real values of $x$.",
    answerText: "True",
    explanation:
      "Polynomial functions do not have breaks, holes, or vertical asymptotes, so they are continuous for all real numbers.",
    marks: 1,
    estimatedTimeSec: 45,
    isPublished: true,
  }),
  mcq({
    questionCode: "QB-G12-MATH-LTX-0040",
    title: "Identify the point on the Argand plane",
    gradeCode: "G12",
    subjectCode: "MATH",
    chapterCode: "G12-MATH-03",
    subChapterCode: "G12-MATH-03-A",
    difficulty: Difficulty.medium,
    body: "From the Argand diagram, which complex number is represented by the point $P$?",
    explanation:
      "The point has real part $-2$ and imaginary part $3$, so it represents $-2 + 3i$.",
    questionImageUrls: [MATH_SVG_ASSETS.complexPlane],
    solutionImageUrls: [MATH_SVG_ASSETS.complexPlane],
    marks: 1,
    estimatedTimeSec: 60,
    isPublished: true,
    options: [
      { label: "A", text: "$2 + 3i$", isCorrect: false, sortOrder: 0 },
      { label: "B", text: "$-2 + 3i$", isCorrect: true, sortOrder: 1 },
      { label: "C", text: "$-3 + 2i$", isCorrect: false, sortOrder: 2 },
      { label: "D", text: "$2 - 3i$", isCorrect: false, sortOrder: 3 },
    ],
  }),
  shortAnswer({
    questionCode: "QB-G12-MATH-LTX-0041",
    title: "Describe a trigonometric phase shift",
    gradeCode: "G12",
    subjectCode: "MATH",
    chapterCode: "G12-MATH-04",
    subChapterCode: "G12-MATH-04-B",
    difficulty: Difficulty.medium,
    body: "Using the diagram, describe the transformation from $y = \\sin x$ to $y = \\sin(x + 45^\\circ)$.",
    answerText: "A phase shift of 45 degrees to the left",
    explanation:
      "Adding $45^\\circ$ inside the bracket shifts the graph horizontally 45 degrees to the left.",
    questionImageUrls: [MATH_SVG_ASSETS.trigShift],
    solutionImageUrls: [MATH_SVG_ASSETS.trigShift],
    marks: 2,
    estimatedTimeSec: 80,
    isPublished: true,
  }),
  fillBlank({
    questionCode: "QB-G12-MATH-LTX-0042",
    title: "Center of a hyperbola",
    gradeCode: "G12",
    subjectCode: "MATH",
    chapterCode: "G12-MATH-05",
    subChapterCode: "G12-MATH-05-B",
    difficulty: Difficulty.medium,
    body: "Fill in the blank: The center of the hyperbola $\\frac{x^2}{9} - \\frac{y^2}{16} = 1$ is ____.",
    answerText: "$(0,0)$",
    explanation:
      "In the standard form shown, both squared terms are centered at the origin, so the center is $(0,0)$.",
    questionImageUrls: [MATH_SVG_ASSETS.hyperbolaStandard],
    solutionImageUrls: [MATH_SVG_ASSETS.hyperbolaStandard],
    marks: 1,
    estimatedTimeSec: 50,
    isPublished: true,
  }),
  trueFalse({
    questionCode: "QB-G12-MATH-LTX-0043",
    title: "Major axis of an ellipse",
    gradeCode: "G12",
    subjectCode: "MATH",
    chapterCode: "G12-MATH-05",
    subChapterCode: "G12-MATH-05-A",
    difficulty: Difficulty.easy,
    body: "True or False: For the ellipse $\\frac{x^2}{16} + \\frac{y^2}{9} = 1$, the major axis lies on the x-axis.",
    answerText: "True",
    explanation:
      "Since $16 > 9$, the larger denominator is under $x^2$, so the major axis is horizontal.",
    questionImageUrls: [MATH_SVG_ASSETS.ellipseMajorAxis],
    solutionImageUrls: [MATH_SVG_ASSETS.ellipseMajorAxis],
    marks: 1,
    estimatedTimeSec: 45,
    isPublished: true,
  }),
  matching({
    questionCode: "QB-G12-MATH-LTX-0044",
    title: "Match complex numbers with their descriptions",
    gradeCode: "G12",
    subjectCode: "MATH",
    chapterCode: "G12-MATH-03",
    subChapterCode: "G12-MATH-03-B",
    difficulty: Difficulty.medium,
    body: "Match each complex-number expression with the correct description.",
    explanation:
      "Read each complex number in terms of its real part, imaginary part, or modulus.",
    questionImageUrls: [MATH_SVG_ASSETS.complexPlane],
    solutionImageUrls: [MATH_SVG_ASSETS.complexPlane],
    marks: 5,
    estimatedTimeSec: 95,
    isPublished: true,
    options: [
      { label: "$3 + 0i$", text: "Purely real number", isCorrect: true, sortOrder: 0 },
      { label: "$0 + 4i$", text: "Purely imaginary number", isCorrect: true, sortOrder: 1 },
      { label: "$3 + 4i$", text: "Has modulus 5", isCorrect: true, sortOrder: 2 },
    ],
  }),
  longAnswer({
    questionCode: "QB-G12-MATH-LTX-0045",
    title: "Explain a translated sine graph",
    gradeCode: "G12",
    subjectCode: "MATH",
    chapterCode: "G12-MATH-04",
    subChapterCode: "G12-MATH-04-B",
    difficulty: Difficulty.hard,
    body:
      "Using the reference graph, explain how the function $y = \\sin(x + 45^\\circ)$ differs from $y = \\sin x$. State the phase shift, and comment on the amplitude and period.",
    answerText:
      "Shifted 45 degrees left; amplitude 1; period 360 degrees",
    explanation:
      "The graph keeps the same amplitude and period as $y = \\sin x$, but the positive angle inside the bracket moves the graph 45 degrees to the left.",
    questionImageUrls: [MATH_SVG_ASSETS.trigShift],
    solutionImageUrls: [MATH_SVG_ASSETS.trigShift],
    marks: 10,
    estimatedTimeSec: 210,
    isPublished: true,
  }),
  mcq({
    questionCode: "QB-G12-MATH-LTX-0046",
    title: "Read the focus from a parabola reference",
    gradeCode: "G12",
    subjectCode: "MATH",
    chapterCode: "G12-MATH-05",
    subChapterCode: "G12-MATH-05-A",
    difficulty: Difficulty.medium,
    body: "According to the reference diagram for $y^2 = 8x$, what is the focus of the parabola?",
    explanation: "For $y^2 = 8x$, we have $4a = 8$, so $a = 2$ and the focus is $(2,0)$.",
    questionImageUrls: [MATH_SVG_ASSETS.parabolaFocus],
    solutionImageUrls: [MATH_SVG_ASSETS.parabolaFocus],
    marks: 1,
    estimatedTimeSec: 55,
    isPublished: true,
    options: [
      { label: "A", text: "$(0,2)$", isCorrect: false, sortOrder: 0 },
      { label: "B", text: "$(2,0)$", isCorrect: true, sortOrder: 1 },
      { label: "C", text: "$(-2,0)$", isCorrect: false, sortOrder: 2 },
      { label: "D", text: "$(4,0)$", isCorrect: false, sortOrder: 3 },
    ],
  }),
  shortAnswer({
    questionCode: "QB-G12-MATH-LTX-0047",
    title: "State the modulus from an Argand diagram",
    gradeCode: "G12",
    subjectCode: "MATH",
    chapterCode: "G12-MATH-03",
    subChapterCode: "G12-MATH-03-B",
    difficulty: Difficulty.hard,
    body: "Using the Argand diagram for the point $P(-2,3)$, find $|z|$.",
    answerText: "$\\sqrt{13}$",
    explanation: "Use the modulus formula: $|z| = \\sqrt{(-2)^2 + 3^2} = \\sqrt{4 + 9} = \\sqrt{13}$.",
    questionImageUrls: [MATH_SVG_ASSETS.complexPlane],
    solutionImageUrls: [MATH_SVG_ASSETS.complexPlane],
    marks: 3,
    estimatedTimeSec: 90,
    isPublished: true,
  }),
  fillBlank({
    questionCode: "QB-G12-MATH-LTX-0048",
    title: "Complete the period of a shifted trig graph",
    gradeCode: "G12",
    subjectCode: "MATH",
    chapterCode: "G12-MATH-04",
    subChapterCode: "G12-MATH-04-A",
    difficulty: Difficulty.easy,
    body: "Fill in the blank: The period of $y = \\sin(x + 45^\\circ)$ is ____.",
    answerText: "$360^\\circ$",
    explanation: "A phase shift changes position only. The sine graph keeps its original period of $360^\\circ$.",
    questionImageUrls: [MATH_SVG_ASSETS.trigShift],
    solutionImageUrls: [MATH_SVG_ASSETS.trigShift],
    marks: 1,
    estimatedTimeSec: 45,
    isPublished: true,
  }),
  trueFalse({
    questionCode: "QB-G12-MATH-LTX-0049",
    title: "Check a logarithm identity",
    gradeCode: "G12",
    subjectCode: "MATH",
    chapterCode: "G12-MATH-01",
    subChapterCode: "G12-MATH-01-B",
    difficulty: Difficulty.medium,
    body: "True or False: $\\log_a(MN) = \\log_a M + \\log_a N$.",
    answerText: "True",
    explanation: "This is the standard logarithm product rule.",
    questionImageUrls: [MATH_SVG_ASSETS.logarithmSteps],
    solutionImageUrls: [MATH_SVG_ASSETS.logarithmSteps],
    marks: 1,
    estimatedTimeSec: 40,
    isPublished: true,
  }),
  matching({
    questionCode: "QB-G12-MATH-LTX-0050",
    title: "Match conic references with features",
    gradeCode: "G12",
    subjectCode: "MATH",
    chapterCode: "G12-MATH-05",
    subChapterCode: "G12-MATH-05-B",
    difficulty: Difficulty.medium,
    body: "Match each conic reference with the correct feature.",
    explanation: "Use the standard form and the reference card to identify the key feature of each conic.",
    marks: 5,
    estimatedTimeSec: 90,
    isPublished: true,
    options: [
      { label: "$y^2 = 8x$", text: "Focus at $(2,0)$", isCorrect: true, sortOrder: 0 },
      { label: "$x^2/16 + y^2/9 = 1$", text: "Vertices at $(\\pm 4,0)$", isCorrect: true, sortOrder: 1 },
      { label: "$x^2/9 - y^2/16 = 1$", text: "Asymptotes $y = \\pm \\frac{4}{3}x$", isCorrect: true, sortOrder: 2 },
    ],
  }),
  longAnswer({
    questionCode: "QB-G12-MATH-LTX-0051",
    title: "Compare three graph families",
    gradeCode: "G12",
    subjectCode: "MATH",
    chapterCode: "G12-MATH-05",
    subChapterCode: "G12-MATH-05-B",
    difficulty: Difficulty.hard,
    body:
      "Using the reference diagrams, compare a parabola, an ellipse, and a hyperbola. State one defining feature for each and give one example equation.",
    answerText:
      "Parabola: one focus, e.g. $y^2 = 8x$; ellipse: closed curve, e.g. $x^2/16 + y^2/9 = 1$; hyperbola: two separate branches, e.g. $x^2/9 - y^2/16 = 1$",
    explanation:
      "A strong answer identifies one reliable graphical feature and one correct standard-form example for each conic.",
    questionImageUrls: [MATH_SVG_ASSETS.parabolaFocus, MATH_SVG_ASSETS.ellipseMajorAxis, MATH_SVG_ASSETS.hyperbolaStandard],
    solutionImageUrls: [MATH_SVG_ASSETS.parabolaFocus, MATH_SVG_ASSETS.ellipseMajorAxis, MATH_SVG_ASSETS.hyperbolaStandard],
    marks: 10,
    estimatedTimeSec: 230,
    isPublished: true,
  }),
];

const coreQuestionSeeds: readonly QuestionSeed[] = [
  mcq({
    questionCode: "QB-G06-MATH-0001",
    title: "Equivalent fraction",
    gradeCode: "G06",
    subjectCode: "MATH",
    chapterCode: "G06-MATH-01",
    subChapterCode: "G06-MATH-01-C",
    difficulty: Difficulty.easy,
    body: "Which fraction is equal to one half?",
    explanation: "Two fourths represents the same value as one half.",
    marks: 1,
    estimatedTimeSec: 45,
    isPublished: true,
    options: [
      { label: "A", text: "1/4", isCorrect: false, sortOrder: 0 },
      { label: "B", text: "2/4", isCorrect: true, sortOrder: 1 },
      { label: "C", text: "3/4", isCorrect: false, sortOrder: 2 },
      { label: "D", text: "4/8 and 1/2 are not equal", isCorrect: false, sortOrder: 3 },
    ],
  }),
  shortAnswer({
    questionCode: "QB-G06-MATH-0003",
    title: "Whole number addition",
    gradeCode: "G06",
    subjectCode: "MATH",
    chapterCode: "G06-MATH-01",
    subChapterCode: "G06-MATH-01-A",
    difficulty: Difficulty.easy,
    body: "Find the sum of 328 and 175.",
    answerText: "503",
    explanation: "Add the ones, tens, and hundreds to get 503.",
    marks: 2,
    estimatedTimeSec: 50,
    isPublished: true,
  }),
  variableShortAnswer({
    questionCode: "QB-G06-MATH-VAR-0001",
    title: "Variable addition",
    gradeCode: "G06",
    subjectCode: "MATH",
    chapterCode: "G06-MATH-01",
    subChapterCode: "G06-MATH-01-A",
    mode: QuestionMode.variable,
    difficulty: Difficulty.easy,
    body: "What is {{a}} + {{b}}?",
    answerText: "{{a}} + {{b}}",
    explanation: "Add the first number to the second number.",
    answerFormula: "a + b",
    variablesSchema: [
      { key: "a", label: "First number", type: "number", min: 10, max: 60, step: 1 },
      { key: "b", label: "Second number", type: "number", min: 5, max: 40, step: 1 },
    ],
    marks: 2,
    estimatedTimeSec: 45,
    isPublished: true,
  }),
  ...curatedMathQuestionSeeds,
  trueFalse({
    questionCode: "QB-G06-SCI-0001",
    title: "Photosynthesis",
    gradeCode: "G06",
    subjectCode: "SCI",
    chapterCode: "G06-SCI-01",
    subChapterCode: "G06-SCI-01-A",
    difficulty: Difficulty.easy,
    body: "Plants can make their own food through photosynthesis.",
    answerText: "True",
    explanation: "Photosynthesis helps plants make food using sunlight, water, and carbon dioxide.",
    marks: 1,
    estimatedTimeSec: 35,
    isPublished: true,
  }),
  fillBlank({
    questionCode: "QB-G07-MATH-0004",
    title: "Fill blank percentage",
    gradeCode: "G07",
    subjectCode: "MATH",
    chapterCode: "G07-MATH-02",
    subChapterCode: "G07-MATH-02-B",
    difficulty: Difficulty.medium,
    body: "Fill in the blank: 25% of 80 is ____. ",
    answerText: "20",
    explanation: "25% means one quarter, and one quarter of 80 is 20.",
    marks: 1,
    estimatedTimeSec: 45,
    isPublished: true,
  }),
  matching({
    questionCode: "QB-G08-SCI-0002",
    title: "Match force examples",
    gradeCode: "G08",
    subjectCode: "SCI",
    chapterCode: "G08-SCI-01",
    subChapterCode: "G08-SCI-01-A",
    difficulty: Difficulty.medium,
    body: "Match each force type with a correct example.",
    explanation: "Each pair links a force with a common classroom example.",
    marks: 5,
    estimatedTimeSec: 80,
    isPublished: true,
    options: [
      { label: "Gravity", text: "Apple falling from a tree", isCorrect: true, sortOrder: 0 },
      { label: "Friction", text: "Bike slowing down on rough road", isCorrect: true, sortOrder: 1 },
      { label: "Magnetic force", text: "Magnet attracting paper clips", isCorrect: true, sortOrder: 2 },
    ],
  }),
  longAnswer({
    questionCode: "QB-G08-SCI-0003",
    title: "Explain photosynthesis process",
    gradeCode: "G08",
    subjectCode: "SCI",
    chapterCode: "G08-SCI-01",
    subChapterCode: "G08-SCI-01-A",
    difficulty: Difficulty.medium,
    body:
      "Explain how photosynthesis helps a plant make food. Include the roles of sunlight, water, and carbon dioxide in your answer.",
    explanation:
      "A full-mark answer should mention the process, the three main inputs, and the outputs glucose and oxygen.",
    marks: 10,
    estimatedTimeSec: 240,
    isPublished: true,
  }),
  mcq({
    questionCode: "QB-G06-MATH-0005",
    title: "Common factors",
    gradeCode: "G06",
    subjectCode: "MATH",
    chapterCode: "G06-MATH-01",
    subChapterCode: "G06-MATH-01-B",
    difficulty: Difficulty.medium,
    body: "Which number is a common factor of both 18 and 24?",
    explanation: "6 divides both 18 and 24 exactly, so it is a common factor.",
    marks: 1,
    estimatedTimeSec: 45,
    isPublished: true,
    options: [
      { label: "A", text: "3", isCorrect: false, sortOrder: 0 },
      { label: "B", text: "4", isCorrect: false, sortOrder: 1 },
      { label: "C", text: "6", isCorrect: true, sortOrder: 2 },
      { label: "D", text: "9", isCorrect: false, sortOrder: 3 },
    ],
  }),
  shortAnswer({
    questionCode: "QB-G07-MATH-0006",
    title: "Ratio table reasoning",
    gradeCode: "G07",
    subjectCode: "MATH",
    chapterCode: "G07-MATH-02",
    subChapterCode: "G07-MATH-02-A",
    difficulty: Difficulty.medium,
    body: "A recipe uses 2 cups of rice for 5 people. How many cups of rice are needed for 15 people?",
    answerText: "6",
    explanation: "15 people is 3 times 5 people, so multiply 2 cups by 3 to get 6 cups.",
    marks: 3,
    estimatedTimeSec: 75,
    isPublished: true,
  }),
  longAnswer({
    questionCode: "QB-G12-MATH-0007",
    title: "Differentiate a quadratic expression",
    gradeCode: "G12",
    subjectCode: "MATH",
    chapterCode: "G12-MATH-02",
    subChapterCode: "G12-MATH-02-B",
    difficulty: Difficulty.hard,
    body: "Find the derivative of y = 3x^2 + 4x - 5 and explain each step clearly.",
    explanation:
      "A strong answer differentiates each term correctly and shows why the constant term becomes zero.",
    marks: 10,
    estimatedTimeSec: 240,
    isPublished: true,
  }),
  mcq({
    questionCode: "QB-G12-ENG-0008",
    title: "Identify the main idea",
    gradeCode: "G12",
    subjectCode: "ENG",
    chapterCode: "G12-ENG-01",
    subChapterCode: "G12-ENG-01-A",
    difficulty: Difficulty.easy,
    body:
      "Read the sentence set: 'Many students revise with a timetable. They divide large topics into smaller tasks and review a little every day.' What is the main idea?",
    explanation: "The details all support the idea that students use a timetable to revise effectively.",
    marks: 1,
    estimatedTimeSec: 55,
    isPublished: true,
    options: [
      { label: "A", text: "Students dislike large topics.", isCorrect: false, sortOrder: 0 },
      { label: "B", text: "A timetable helps students revise effectively.", isCorrect: true, sortOrder: 1 },
      { label: "C", text: "Every student studies in the same way.", isCorrect: false, sortOrder: 2 },
      { label: "D", text: "Daily review is unnecessary.", isCorrect: false, sortOrder: 3 },
    ],
  }),
  trueFalse({
    questionCode: "QB-G12-ENG-0009",
    title: "Infer the writer's tone",
    gradeCode: "G12",
    subjectCode: "ENG",
    chapterCode: "G12-ENG-01",
    subChapterCode: "G12-ENG-01-B",
    difficulty: Difficulty.medium,
    body:
      "True or False: In the sentence 'The library finally opened its quiet new reading room, giving students a calm place to work,' the writer's tone is appreciative.",
    answerText: "True",
    explanation: "Words such as 'quiet', 'new', and 'calm place to work' show approval and appreciation.",
    marks: 1,
    estimatedTimeSec: 45,
    isPublished: true,
  }),
  shortAnswer({
    questionCode: "QB-G12-ENG-0010",
    title: "Combine ideas into one sentence",
    gradeCode: "G12",
    subjectCode: "ENG",
    chapterCode: "G12-ENG-02",
    subChapterCode: "G12-ENG-02-A",
    difficulty: Difficulty.medium,
    body:
      "Combine the ideas into one correct sentence: 'The experiment was simple. It was effective.'",
    answerText: "The experiment was simple but effective.",
    explanation: "Use a coordinating conjunction to join the contrasting ideas smoothly.",
    marks: 2,
    estimatedTimeSec: 60,
    isPublished: true,
  }),
  longAnswer({
    questionCode: "QB-G12-ENG-0011",
    title: "Write a formal response",
    gradeCode: "G12",
    subjectCode: "ENG",
    chapterCode: "G12-ENG-02",
    subChapterCode: "G12-ENG-02-B",
    difficulty: Difficulty.hard,
    body:
      "Write a short formal paragraph explaining why regular practice is important when preparing for an examination. Include a clear topic sentence and at least two supporting points.",
    explanation:
      "A strong answer presents a clear topic sentence, explains two relevant supporting points, and keeps a formal tone throughout.",
    marks: 10,
    estimatedTimeSec: 220,
    isPublished: true,
  }),
  mcq({
    questionCode: "QB-G12-SCI-0007",
    title: "Calculate acceleration",
    gradeCode: "G12",
    subjectCode: "SCI",
    chapterCode: "G12-SCI-01",
    subChapterCode: "G12-SCI-01-A",
    difficulty: Difficulty.easy,
    body: "A car increases its velocity from 10 m/s to 18 m/s in 4 s. What is its acceleration?",
    explanation: "Acceleration = change in velocity ÷ time = (18 - 10) ÷ 4 = 2 m/s².",
    marks: 1,
    estimatedTimeSec: 55,
    isPublished: true,
    options: [
      { label: "A", text: "2 m/s²", isCorrect: true, sortOrder: 0 },
      { label: "B", text: "4 m/s²", isCorrect: false, sortOrder: 1 },
      { label: "C", text: "8 m/s²", isCorrect: false, sortOrder: 2 },
      { label: "D", text: "28 m/s²", isCorrect: false, sortOrder: 3 },
    ],
  }),
  trueFalse({
    questionCode: "QB-G12-SCI-0008",
    title: "Balanced forces",
    gradeCode: "G12",
    subjectCode: "SCI",
    chapterCode: "G12-SCI-01",
    subChapterCode: "G12-SCI-01-B",
    difficulty: Difficulty.medium,
    body: "True or False: If two equal forces act in opposite directions on an object, the net force is zero.",
    answerText: "True",
    explanation: "Equal forces in opposite directions cancel each other, so the resultant force is zero.",
    questionImageUrls: [MATH_SVG_ASSETS.forceDiagram],
    solutionImageUrls: [MATH_SVG_ASSETS.forceDiagram],
    marks: 1,
    estimatedTimeSec: 45,
    isPublished: true,
  }),
  shortAnswer({
    questionCode: "QB-G12-SCI-0009",
    title: "Define density",
    gradeCode: "G12",
    subjectCode: "SCI",
    chapterCode: "G12-SCI-02",
    subChapterCode: "G12-SCI-02-B",
    difficulty: Difficulty.medium,
    body: "State the formula for density and define each quantity in the formula.",
    answerText: "Density = mass / volume",
    explanation: "Density is the mass of a substance per unit volume, so density = mass ÷ volume.",
    marks: 2,
    estimatedTimeSec: 65,
    isPublished: true,
  }),
  matching({
    questionCode: "QB-G12-SCI-0010",
    title: "Match energy changes",
    gradeCode: "G12",
    subjectCode: "SCI",
    chapterCode: "G12-SCI-02",
    subChapterCode: "G12-SCI-02-A",
    difficulty: Difficulty.medium,
    body: "Match each device or situation with the main energy conversion.",
    explanation: "Think about the main energy form entering the system and the useful output energy.",
    questionImageUrls: [MATH_SVG_ASSETS.energyTransfer],
    solutionImageUrls: [MATH_SVG_ASSETS.energyTransfer],
    marks: 5,
    estimatedTimeSec: 90,
    isPublished: true,
    options: [
      { label: "Battery lamp", text: "Chemical to light", isCorrect: true, sortOrder: 0 },
      { label: "Electric fan", text: "Electrical to kinetic", isCorrect: true, sortOrder: 1 },
      { label: "Solar panel", text: "Light to electrical", isCorrect: true, sortOrder: 2 },
    ],
  }),
  mcq({
    questionCode: "QB-G12-ENG-0012",
    title: "Choose the best summary statement",
    gradeCode: "G12",
    subjectCode: "ENG",
    chapterCode: "G12-ENG-01",
    subChapterCode: "G12-ENG-01-A",
    difficulty: Difficulty.medium,
    body:
      "Which sentence best summarizes the idea: 'Good readers pause to ask questions, connect ideas, and check whether each paragraph supports the main point.'?",
    explanation:
      "The main point is that strong reading habits include active thinking while reading.",
    marks: 1,
    estimatedTimeSec: 55,
    isPublished: true,
    options: [
      { label: "A", text: "Readers should memorize every paragraph.", isCorrect: false, sortOrder: 0 },
      { label: "B", text: "Active reading helps readers understand a text better.", isCorrect: true, sortOrder: 1 },
      { label: "C", text: "Every paragraph contains the same idea.", isCorrect: false, sortOrder: 2 },
      { label: "D", text: "Questions make reading slower and less useful.", isCorrect: false, sortOrder: 3 },
    ],
  }),
  fillBlank({
    questionCode: "QB-G12-ENG-0013",
    title: "Use a suitable connector",
    gradeCode: "G12",
    subjectCode: "ENG",
    chapterCode: "G12-ENG-02",
    subChapterCode: "G12-ENG-02-A",
    difficulty: Difficulty.easy,
    body:
      "Fill in the blank with the best connector: 'The class was difficult, ____ the students kept working until they understood it.'",
    answerText: "but",
    explanation:
      "The second clause contrasts with the first one, so 'but' is the most suitable connector.",
    marks: 1,
    estimatedTimeSec: 40,
    isPublished: true,
  }),
  shortAnswer({
    questionCode: "QB-G12-ENG-0014",
    title: "Rewrite in a more formal style",
    gradeCode: "G12",
    subjectCode: "ENG",
    chapterCode: "G12-ENG-02",
    subChapterCode: "G12-ENG-02-B",
    difficulty: Difficulty.medium,
    body:
      "Rewrite this sentence in a more formal style: 'A lot of students get nervous before an exam.'",
    answerText: "Many students become nervous before an examination.",
    explanation:
      "A more formal answer replaces casual phrasing such as 'a lot of' with 'many' and may use 'examination' instead of 'exam'.",
    marks: 2,
    estimatedTimeSec: 70,
    isPublished: true,
  }),
  matching({
    questionCode: "QB-G12-ENG-0015",
    title: "Match formal phrases with their purposes",
    gradeCode: "G12",
    subjectCode: "ENG",
    chapterCode: "G12-ENG-02",
    subChapterCode: "G12-ENG-02-B",
    difficulty: Difficulty.medium,
    body: "Match each formal phrase with its most suitable writing purpose.",
    explanation:
      "Think about whether each phrase introduces a reason, an example, or a conclusion.",
    marks: 5,
    estimatedTimeSec: 95,
    isPublished: true,
    options: [
      { label: "Therefore", text: "Shows a conclusion", isCorrect: true, sortOrder: 0 },
      { label: "For example", text: "Introduces an example", isCorrect: true, sortOrder: 1 },
      { label: "Because", text: "Gives a reason", isCorrect: true, sortOrder: 2 },
    ],
  }),
  fillBlank({
    questionCode: "QB-G12-SCI-0011",
    title: "Recall the speed formula",
    gradeCode: "G12",
    subjectCode: "SCI",
    chapterCode: "G12-SCI-01",
    subChapterCode: "G12-SCI-01-A",
    difficulty: Difficulty.easy,
    body: "Fill in the blank: Speed = distance ÷ ____.",
    answerText: "time",
    explanation: "Speed is the distance traveled in one unit of time.",
    questionImageUrls: [MATH_SVG_ASSETS.forceDiagram],
    solutionImageUrls: [MATH_SVG_ASSETS.forceDiagram],
    marks: 1,
    estimatedTimeSec: 35,
    isPublished: true,
  }),
  mcq({
    questionCode: "QB-G12-SCI-0012",
    title: "Choose the correct energy change",
    gradeCode: "G12",
    subjectCode: "SCI",
    chapterCode: "G12-SCI-02",
    subChapterCode: "G12-SCI-02-A",
    difficulty: Difficulty.medium,
    body: "Which energy change is most closely associated with a solar panel?",
    explanation: "A solar panel converts light energy into electrical energy.",
    questionImageUrls: [MATH_SVG_ASSETS.energyTransfer],
    solutionImageUrls: [MATH_SVG_ASSETS.energyTransfer],
    marks: 1,
    estimatedTimeSec: 50,
    isPublished: true,
    options: [
      { label: "A", text: "Electrical to heat", isCorrect: false, sortOrder: 0 },
      { label: "B", text: "Light to electrical", isCorrect: true, sortOrder: 1 },
      { label: "C", text: "Chemical to sound", isCorrect: false, sortOrder: 2 },
      { label: "D", text: "Kinetic to nuclear", isCorrect: false, sortOrder: 3 },
    ],
  }),
  shortAnswer({
    questionCode: "QB-G12-SCI-0013",
    title: "State one effect of an unbalanced force",
    gradeCode: "G12",
    subjectCode: "SCI",
    chapterCode: "G12-SCI-01",
    subChapterCode: "G12-SCI-01-B",
    difficulty: Difficulty.medium,
    body:
      "State one effect of an unbalanced force acting on an object.",
    answerText: "It changes the object's motion.",
    explanation:
      "An unbalanced force can change speed, change direction, or both. All describe a change in motion.",
    questionImageUrls: [MATH_SVG_ASSETS.forceDiagram],
    solutionImageUrls: [MATH_SVG_ASSETS.forceDiagram],
    marks: 2,
    estimatedTimeSec: 60,
    isPublished: true,
  }),
  matching({
    questionCode: "QB-G12-SCI-0014",
    title: "Match quantities with units",
    gradeCode: "G12",
    subjectCode: "SCI",
    chapterCode: "G12-SCI-02",
    subChapterCode: "G12-SCI-02-B",
    difficulty: Difficulty.medium,
    body: "Match each physical quantity with the correct SI unit.",
    explanation: "Recall the standard units used in school science formulas.",
    marks: 5,
    estimatedTimeSec: 85,
    isPublished: true,
    options: [
      { label: "Force", text: "newton (N)", isCorrect: true, sortOrder: 0 },
      { label: "Mass", text: "kilogram (kg)", isCorrect: true, sortOrder: 1 },
      { label: "Density", text: "kg/m³", isCorrect: true, sortOrder: 2 },
    ],
  }),
  mcq({
    questionCode: "QB-G06-ENG-0003",
    title: "Main idea of a short text",
    gradeCode: "G06",
    subjectCode: "ENG",
    chapterCode: "G06-ENG-01",
    subChapterCode: "G06-ENG-01-A",
    difficulty: Difficulty.easy,
    body:
      "Read the sentence set: 'Mya waters her plants every morning. She also removes dry leaves and keeps the pots near sunlight.' What is the main idea?",
    explanation: "All the details show that Mya takes care of her plants.",
    marks: 1,
    estimatedTimeSec: 50,
    isPublished: true,
    options: [
      { label: "A", text: "Mya likes to wake up early.", isCorrect: false, sortOrder: 0 },
      { label: "B", text: "Mya takes care of her plants.", isCorrect: true, sortOrder: 1 },
      { label: "C", text: "Sunlight is too strong for plants.", isCorrect: false, sortOrder: 2 },
      { label: "D", text: "Dry leaves should be ignored.", isCorrect: false, sortOrder: 3 },
    ],
  }),
  shortAnswer({
    questionCode: "QB-G07-ENG-0004",
    title: "Past tense correction",
    gradeCode: "G07",
    subjectCode: "ENG",
    chapterCode: "G07-ENG-01",
    subChapterCode: "G07-ENG-01-B",
    difficulty: Difficulty.medium,
    body: "Rewrite the verb in correct past tense: 'Yesterday, she ____ (write) a letter.'",
    answerText: "wrote",
    explanation: "The past tense of 'write' is 'wrote'.",
    marks: 2,
    estimatedTimeSec: 50,
    isPublished: true,
  }),
  longAnswer({
    questionCode: "QB-G08-ENG-0005",
    title: "Support a claim with reasons",
    gradeCode: "G08",
    subjectCode: "ENG",
    chapterCode: "G08-ENG-01",
    subChapterCode: "G08-ENG-01-A",
    difficulty: Difficulty.medium,
    body: "Write a short paragraph explaining why regular reading is important for students. Include a clear claim and at least two supporting reasons.",
    explanation:
      "A strong response states a claim, gives relevant reasons, and keeps the paragraph logically organized.",
    marks: 10,
    estimatedTimeSec: 240,
    isPublished: true,
  }),
  matching({
    questionCode: "QB-G06-SCI-0004",
    title: "Match animals to groups",
    gradeCode: "G06",
    subjectCode: "SCI",
    chapterCode: "G06-SCI-01",
    subChapterCode: "G06-SCI-01-A",
    difficulty: Difficulty.easy,
    body: "Match each animal with the correct group.",
    explanation: "Each animal belongs to one classification group.",
    marks: 5,
    estimatedTimeSec: 80,
    isPublished: true,
    options: [
      { label: "Frog", text: "Amphibian", isCorrect: true, sortOrder: 0 },
      { label: "Eagle", text: "Bird", isCorrect: true, sortOrder: 1 },
      { label: "Shark", text: "Fish", isCorrect: true, sortOrder: 2 },
    ],
  }),
  fillBlank({
    questionCode: "QB-G07-SCI-0005",
    title: "State of matter",
    gradeCode: "G07",
    subjectCode: "SCI",
    chapterCode: "G07-SCI-01",
    subChapterCode: "G07-SCI-01-A",
    difficulty: Difficulty.easy,
    body: "Fill in the blank: A substance that keeps its own shape and volume is a ____.",
    answerText: "solid",
    explanation: "A solid has a definite shape and definite volume.",
    marks: 1,
    estimatedTimeSec: 40,
    isPublished: true,
  }),
  shortAnswer({
    questionCode: "QB-G08-SCI-0006",
    title: "Speed formula",
    gradeCode: "G08",
    subjectCode: "SCI",
    chapterCode: "G08-SCI-01",
    subChapterCode: "G08-SCI-01-B",
    difficulty: Difficulty.medium,
    body: "A car travels 120 km in 2 hours. What is its average speed?",
    answerText: "60 km/h",
    explanation: "Average speed = distance ÷ time = 120 ÷ 2 = 60 km/h.",
    marks: 3,
    estimatedTimeSec: 70,
    isPublished: true,
  }),
];

const difficultyCycle = [Difficulty.easy, Difficulty.medium, Difficulty.hard] as const;
const generatedTypeCycle = [
  QuestionType.mcq,
  QuestionType.true_false,
  QuestionType.fill_blank,
  QuestionType.short_answer,
  QuestionType.matching,
  QuestionType.long_answer,
] as const;
const optionLabels = ["A", "B", "C", "D"] as const;
const generatedMarksByType = {
  [QuestionType.mcq]: [1],
  [QuestionType.true_false]: [1],
  [QuestionType.fill_blank]: [1],
  [QuestionType.short_answer]: [2, 3],
  [QuestionType.matching]: [5],
  [QuestionType.long_answer]: [10],
} as const satisfies Record<(typeof QuestionType)[keyof typeof QuestionType], readonly number[]>;

type SubjectCode = (typeof subjectSeeds)[number]["code"];
type QuestionTypeValue = (typeof QuestionType)[keyof typeof QuestionType];
type TopicSeed = { chapterCode: string; subChapterCode: string };

const englishSynonymBank = [
  { word: "rapid", correct: "fast", distractors: ["quiet", "slow", "cold"] },
  { word: "ancient", correct: "very old", distractors: ["new", "tiny", "loud"] },
  { word: "brave", correct: "courageous", distractors: ["careless", "sleepy", "boring"] },
  { word: "tiny", correct: "very small", distractors: ["very large", "empty", "heavy"] },
  { word: "silent", correct: "quiet", distractors: ["noisy", "bright", "late"] },
] as const;

const englishGrammarStatementBank = [
  {
    body: "The sentence 'She walks to school.' is grammatically correct.",
    answer: "True",
    explanation: "The sentence uses correct subject-verb agreement.",
  },
  {
    body: "The sentence 'They was late.' is grammatically correct.",
    answer: "False",
    explanation: "Plural subject 'They' should use 'were'.",
  },
  {
    body: "The sentence 'I have finished my homework.' is grammatically correct.",
    answer: "True",
    explanation: "This sentence is complete and uses proper tense.",
  },
  {
    body: "The sentence 'He go to market yesterday.' is grammatically correct.",
    answer: "False",
    explanation: "Past tense should be 'went'.",
  },
] as const;

const englishVerbBank = [
  { verb: "go", past: "went" },
  { verb: "write", past: "wrote" },
  { verb: "see", past: "saw" },
  { verb: "eat", past: "ate" },
  { verb: "bring", past: "brought" },
] as const;

const englishFillBlankBank = [
  {
    body: "Fill in the blank: She ____ to school every day.",
    answer: "goes",
    explanation: "Use present simple singular verb form: goes.",
  },
  {
    body: "Fill in the blank: They ____ playing football now.",
    answer: "are",
    explanation: "Present continuous with plural subject uses 'are'.",
  },
  {
    body: "Fill in the blank: I ____ my homework yesterday.",
    answer: "finished",
    explanation: "Yesterday indicates simple past tense.",
  },
  {
    body: "Fill in the blank: The book is ____ the table.",
    answer: "on",
    explanation: "Use the preposition 'on' for surface position.",
  },
] as const;

const englishMatchingPairs = [
  { left: "happy", right: "joyful" },
  { left: "rapid", right: "fast" },
  { left: "ancient", right: "very old" },
  { left: "silent", right: "quiet" },
  { left: "begin", right: "start" },
  { left: "tiny", right: "very small" },
] as const;

const scienceMcqBank = [
  {
    body: "Which gas do plants absorb during photosynthesis?",
    correct: "Carbon dioxide",
    distractors: ["Oxygen", "Nitrogen", "Hydrogen"],
    explanation: "Plants absorb carbon dioxide and release oxygen.",
  },
  {
    body: "Which part of a plant usually absorbs water?",
    correct: "Roots",
    distractors: ["Flowers", "Leaves", "Stem"],
    explanation: "Roots absorb water and minerals from soil.",
  },
  {
    body: "What is the center of an atom called?",
    correct: "Nucleus",
    distractors: ["Electron shell", "Molecule", "Cell wall"],
    explanation: "The nucleus contains protons and neutrons.",
  },
  {
    body: "Which force pulls objects toward Earth?",
    correct: "Gravity",
    distractors: ["Friction", "Magnetism", "Tension"],
    explanation: "Gravity pulls objects toward Earth's center.",
  },
] as const;

const scienceTrueFalseBank = [
  {
    body: "Water boils at a lower temperature on high mountains.",
    answer: "True",
    explanation: "Lower air pressure decreases the boiling point.",
  },
  {
    body: "Sound can travel through a vacuum.",
    answer: "False",
    explanation: "Sound needs a medium such as air, liquid, or solid.",
  },
  {
    body: "Metals are generally good conductors of electricity.",
    answer: "True",
    explanation: "Most metals allow electric current to pass easily.",
  },
  {
    body: "The Moon produces its own light.",
    answer: "False",
    explanation: "The Moon reflects sunlight; it does not produce light.",
  },
] as const;

const scienceShortAnswerBank = [
  {
    body: "Name the process plants use to make food.",
    answer: "Photosynthesis",
    explanation: "Photosynthesis converts light energy into chemical energy.",
  },
  {
    body: "What instrument is used to measure temperature?",
    answer: "Thermometer",
    explanation: "A thermometer measures how hot or cold something is.",
  },
  {
    body: "What is the SI unit of force?",
    answer: "Newton",
    explanation: "Force is measured in newtons (N).",
  },
  {
    body: "Which blood vessel carries blood away from the heart?",
    answer: "Artery",
    explanation: "Arteries carry blood away from the heart.",
  },
] as const;

const scienceFillBlankBank = [
  {
    body: "Fill in the blank: The change from liquid water to gas is called ____.",
    answer: "evaporation",
    explanation: "Evaporation is the liquid-to-gas phase change.",
  },
  {
    body: "Fill in the blank: The nearest star to Earth is the ____.",
    answer: "Sun",
    explanation: "The Sun is Earth's nearest star.",
  },
  {
    body: "Fill in the blank: The basic unit of life is the ____.",
    answer: "cell",
    explanation: "Cells are the fundamental units of living organisms.",
  },
  {
    body: "Fill in the blank: A push or pull is called a ____.",
    answer: "force",
    explanation: "A force is defined as a push or pull.",
  },
] as const;

const scienceMatchingPairs = [
  { left: "Photosynthesis", right: "Process plants use to make food" },
  { left: "Evaporation", right: "Liquid changing to gas" },
  { left: "Condensation", right: "Gas changing to liquid" },
  { left: "Gravity", right: "Force pulling objects toward Earth" },
  { left: "Nucleus", right: "Control center of a cell" },
  { left: "Artery", right: "Carries blood away from the heart" },
] as const;

const padQuestionCode = (index: number) => String(index).padStart(4, "0");

const pick = <T>(items: readonly T[], index: number): T => {
  if (items.length === 0) {
    throw new Error("Cannot pick from an empty list.");
  }
  return items[index % items.length]!;
};

const firstOrThrow = <T>(rows: readonly T[], message: string): T => {
  const first = rows[0];
  if (!first) {
    throw new Error(message);
  }
  return first;
};

const uniqueNumberOptions = (correct: number) => {
  const values = [correct - 2, correct, correct + 2, correct + 4];
  const deduped = Array.from(new Set(values));
  while (deduped.length < 4) {
    deduped.push(correct + deduped.length + 5);
  }
  return deduped.slice(0, 4);
};

const createMcqOptions = (correct: string, distractors: readonly string[], seedIndex: number): OptionSeed[] => {
  const cleanedDistractors = Array.from(
    new Set(distractors.map((item) => item.trim()).filter((item) => item && item !== correct)),
  );
  while (cleanedDistractors.length < 3) {
    cleanedDistractors.push(`${correct} (${cleanedDistractors.length + 1})`);
  }

  const correctSlot = seedIndex % optionLabels.length;
  const texts = cleanedDistractors.slice(0, 3);
  texts.splice(correctSlot, 0, correct);

  return optionLabels.map((label, optionIndex) => ({
    label,
    text: texts[optionIndex] ?? `Option ${optionIndex + 1}`,
    isCorrect: optionIndex === correctSlot,
    sortOrder: optionIndex,
  }));
};

const createMatchingOptions = (
  pairs: readonly { left: string; right: string }[],
  seedIndex: number,
): OptionSeed[] =>
  Array.from({ length: 3 }, (_, offset) => pick(pairs, seedIndex + offset)).map((pair, optionIndex) => ({
    label: pair.left,
    text: pair.right,
    isCorrect: true,
    sortOrder: optionIndex,
  }));

const buildTopicPool = (gradeCode: string, subjectCode: SubjectCode): TopicSeed[] =>
  chapterSeeds
    .filter((chapter) => chapter.gradeCode === gradeCode && chapter.subjectCode === subjectCode)
    .flatMap((chapter) =>
      chapter.subChapters.map((subChapter) => ({
        chapterCode: chapter.code,
        subChapterCode: subChapter.code,
      })),
    );

const generateMathQuestion = (params: {
  questionCode: string;
  gradeCode: string;
  topic: TopicSeed;
  type: QuestionTypeValue;
  difficulty: (typeof Difficulty)[keyof typeof Difficulty];
  marks: number;
  estimatedTimeSec: number;
  sequence: number;
}) => {
  const { questionCode, gradeCode, topic, type, difficulty, marks, estimatedTimeSec, sequence } = params;
  const index = sequence - 1;

  if (type === QuestionType.mcq) {
    const a = 12 + (index % 80);
    const b = 4 + ((index * 3) % 27);
    const answer = a + b;
    const options = uniqueNumberOptions(answer).map((value, optionIndex) => ({
      label: optionLabels[optionIndex] ?? String.fromCharCode(65 + optionIndex),
      text: String(value),
      isCorrect: value === answer,
      sortOrder: optionIndex,
    }));

    return mcq({
      questionCode,
      title: `${gradeCode} Math MCQ ${sequence}`,
      gradeCode,
      subjectCode: "MATH",
      chapterCode: topic.chapterCode,
      subChapterCode: topic.subChapterCode,
      difficulty,
      body: `Choose the correct value of $${a} + ${b}$.`,
      explanation: `Add the numbers: $${a} + ${b} = ${answer}$.`,
      marks,
      estimatedTimeSec,
      isPublished: false,
      options,
    });
  }

  if (type === QuestionType.true_false) {
    const base = 20 + (index % 90);
    const statementTrue = index % 2 === 0;
    const number = statementTrue ? (base % 2 === 0 ? base : base + 1) : base % 2 === 0 ? base + 1 : base;

    return trueFalse({
      questionCode,
      title: `${gradeCode} Math True/False ${sequence}`,
      gradeCode,
      subjectCode: "MATH",
      chapterCode: topic.chapterCode,
      subChapterCode: topic.subChapterCode,
      difficulty,
      body: `True or False: $${number}$ is an even number.`,
      answerText: statementTrue ? "True" : "False",
      explanation: `$${number}$ is ${number % 2 === 0 ? "even" : "odd"}.`,
      marks,
      estimatedTimeSec,
      isPublished: false,
    });
  }

  if (type === QuestionType.short_answer) {
    const a = 10 + (index % 40);
    const b = 6 + ((index * 5) % 20);
    const answer = a * b;

    return shortAnswer({
      questionCode,
      title: `${gradeCode} Math Short Answer ${sequence}`,
      gradeCode,
      subjectCode: "MATH",
      chapterCode: topic.chapterCode,
      subChapterCode: topic.subChapterCode,
      difficulty,
      body: `Compute $${a} \\times ${b}$.`,
      answerText: String(answer),
      explanation: `$${a} \\times ${b} = ${answer}$.`,
      marks,
      estimatedTimeSec,
      isPublished: false,
    });
  }

  if (type === QuestionType.long_answer) {
    const length = 8 + (index % 12);
    const width = 4 + ((index * 2) % 8);
    const area = length * width;

    return longAnswer({
      questionCode,
      title: `${gradeCode} Math Long Answer ${sequence}`,
      gradeCode,
      subjectCode: "MATH",
      chapterCode: topic.chapterCode,
      subChapterCode: topic.subChapterCode,
      difficulty,
      body:
        `A rectangle has length ${length} cm and width ${width} cm. Use $$A = l \\times w$$ to explain how to find its area.`,
      explanation:
        "A strong answer states the formula, substitutes the given values, and writes the final unit.",
      marks,
      estimatedTimeSec,
      isPublished: false,
    });
  }

  if (type === QuestionType.fill_blank) {
    const roots = [9, 11, 12, 14, 15, 16, 18, 20, 24, 25];
    const root = pick(roots, index);
    const square = root * root;

    return fillBlank({
      questionCode,
      title: `${gradeCode} Math Fill Blank ${sequence}`,
      gradeCode,
      subjectCode: "MATH",
      chapterCode: topic.chapterCode,
      subChapterCode: topic.subChapterCode,
      difficulty,
      body: `Fill in the blank: $\\sqrt{${square}} =$ ____.`,
      answerText: String(root),
      explanation: `$${root} \\times ${root} = ${square}$.`,
      marks,
      estimatedTimeSec,
      isPublished: false,
    });
  }

  const leftA = 14 + (index % 50);
  const leftB = 5 + ((index * 2) % 17);
  const leftC = 3 + ((index * 3) % 14);

  return matching({
    questionCode,
    title: `${gradeCode} Math Matching ${sequence}`,
    gradeCode,
    subjectCode: "MATH",
    chapterCode: topic.chapterCode,
    subChapterCode: topic.subChapterCode,
    difficulty,
    body: "Match each expression with its correct result.",
    explanation: "Each expression on the left maps to one result on the right.",
    marks,
    estimatedTimeSec,
    isPublished: false,
    options: [
      {
        label: `Expr A: $${leftA} + ${leftB}$`,
        text: `$${leftA + leftB}$`,
        isCorrect: true,
        sortOrder: 0,
      },
      {
        label: `Expr B: $${leftA} - ${leftC}$`,
        text: `$${leftA - leftC}$`,
        isCorrect: true,
        sortOrder: 1,
      },
      {
        label: `Expr C: $${leftB} \\times ${leftC}$`,
        text: `$${leftB * leftC}$`,
        isCorrect: true,
        sortOrder: 2,
      },
    ],
  });
};

const generateEnglishQuestion = (params: {
  questionCode: string;
  gradeCode: string;
  topic: TopicSeed;
  type: QuestionTypeValue;
  difficulty: (typeof Difficulty)[keyof typeof Difficulty];
  marks: number;
  estimatedTimeSec: number;
  sequence: number;
}) => {
  const { questionCode, gradeCode, topic, type, difficulty, marks, estimatedTimeSec, sequence } = params;
  const index = sequence - 1;

  if (type === QuestionType.mcq) {
    const item = pick(englishSynonymBank, index);
    return mcq({
      questionCode,
      title: `${gradeCode} English MCQ ${sequence}`,
      gradeCode,
      subjectCode: "ENG",
      chapterCode: topic.chapterCode,
      subChapterCode: topic.subChapterCode,
      difficulty,
      body: `Choose the word closest in meaning to "${item.word}".`,
      explanation: `"${item.word}" is closest in meaning to "${item.correct}".`,
      marks,
      estimatedTimeSec,
      isPublished: false,
      options: createMcqOptions(item.correct, item.distractors, index),
    });
  }

  if (type === QuestionType.true_false) {
    const item = pick(englishGrammarStatementBank, index);
    return trueFalse({
      questionCode,
      title: `${gradeCode} English True/False ${sequence}`,
      gradeCode,
      subjectCode: "ENG",
      chapterCode: topic.chapterCode,
      subChapterCode: topic.subChapterCode,
      difficulty,
      body: item.body,
      answerText: item.answer,
      explanation: item.explanation,
      marks,
      estimatedTimeSec,
      isPublished: false,
    });
  }

  if (type === QuestionType.short_answer) {
    const item = pick(englishVerbBank, index);
    return shortAnswer({
      questionCode,
      title: `${gradeCode} English Short Answer ${sequence}`,
      gradeCode,
      subjectCode: "ENG",
      chapterCode: topic.chapterCode,
      subChapterCode: topic.subChapterCode,
      difficulty,
      body: `Write the past tense of "${item.verb}".`,
      answerText: item.past,
      explanation: `The past tense of "${item.verb}" is "${item.past}".`,
      marks,
      estimatedTimeSec,
      isPublished: false,
    });
  }

  if (type === QuestionType.long_answer) {
    const item = pick(englishSynonymBank, index);
    return longAnswer({
      questionCode,
      title: `${gradeCode} English Long Answer ${sequence}`,
      gradeCode,
      subjectCode: "ENG",
      chapterCode: topic.chapterCode,
      subChapterCode: topic.subChapterCode,
      difficulty,
      body:
        `Explain the meaning of "${item.word}" and use it correctly in one complete sentence.`,
      explanation:
        "A full answer should define the word and use it in a grammatically correct sentence.",
      marks,
      estimatedTimeSec,
      isPublished: false,
    });
  }

  if (type === QuestionType.fill_blank) {
    const item = pick(englishFillBlankBank, index);
    return fillBlank({
      questionCode,
      title: `${gradeCode} English Fill Blank ${sequence}`,
      gradeCode,
      subjectCode: "ENG",
      chapterCode: topic.chapterCode,
      subChapterCode: topic.subChapterCode,
      difficulty,
      body: item.body,
      answerText: item.answer,
      explanation: item.explanation,
      marks,
      estimatedTimeSec,
      isPublished: false,
    });
  }

  return matching({
    questionCode,
    title: `${gradeCode} English Matching ${sequence}`,
    gradeCode,
    subjectCode: "ENG",
    chapterCode: topic.chapterCode,
    subChapterCode: topic.subChapterCode,
    difficulty,
    body: "Match each word with its closest meaning.",
    explanation: "Each vocabulary word matches one synonym.",
    marks,
    estimatedTimeSec,
    isPublished: false,
    options: createMatchingOptions(englishMatchingPairs, index),
  });
};

const generateScienceQuestion = (params: {
  questionCode: string;
  gradeCode: string;
  topic: TopicSeed;
  type: QuestionTypeValue;
  difficulty: (typeof Difficulty)[keyof typeof Difficulty];
  marks: number;
  estimatedTimeSec: number;
  sequence: number;
}) => {
  const { questionCode, gradeCode, topic, type, difficulty, marks, estimatedTimeSec, sequence } = params;
  const index = sequence - 1;

  if (type === QuestionType.mcq) {
    const item = pick(scienceMcqBank, index);
    return mcq({
      questionCode,
      title: `${gradeCode} Science MCQ ${sequence}`,
      gradeCode,
      subjectCode: "SCI",
      chapterCode: topic.chapterCode,
      subChapterCode: topic.subChapterCode,
      difficulty,
      body: item.body,
      explanation: item.explanation,
      marks,
      estimatedTimeSec,
      isPublished: false,
      options: createMcqOptions(item.correct, item.distractors, index),
    });
  }

  if (type === QuestionType.true_false) {
    const item = pick(scienceTrueFalseBank, index);
    return trueFalse({
      questionCode,
      title: `${gradeCode} Science True/False ${sequence}`,
      gradeCode,
      subjectCode: "SCI",
      chapterCode: topic.chapterCode,
      subChapterCode: topic.subChapterCode,
      difficulty,
      body: item.body,
      answerText: item.answer,
      explanation: item.explanation,
      marks,
      estimatedTimeSec,
      isPublished: false,
    });
  }

  if (type === QuestionType.short_answer) {
    const item = pick(scienceShortAnswerBank, index);
    return shortAnswer({
      questionCode,
      title: `${gradeCode} Science Short Answer ${sequence}`,
      gradeCode,
      subjectCode: "SCI",
      chapterCode: topic.chapterCode,
      subChapterCode: topic.subChapterCode,
      difficulty,
      body: item.body,
      answerText: item.answer,
      explanation: item.explanation,
      marks,
      estimatedTimeSec,
      isPublished: false,
    });
  }

  if (type === QuestionType.long_answer) {
    const item = pick(scienceShortAnswerBank, index);
    return longAnswer({
      questionCode,
      title: `${gradeCode} Science Long Answer ${sequence}`,
      gradeCode,
      subjectCode: "SCI",
      chapterCode: topic.chapterCode,
      subChapterCode: topic.subChapterCode,
      difficulty,
      body: `Explain the following science idea in a short paragraph: ${item.body}`,
      explanation:
        "A strong answer should clearly explain the idea, not just repeat a keyword.",
      marks,
      estimatedTimeSec,
      isPublished: false,
    });
  }

  if (type === QuestionType.fill_blank) {
    const item = pick(scienceFillBlankBank, index);
    return fillBlank({
      questionCode,
      title: `${gradeCode} Science Fill Blank ${sequence}`,
      gradeCode,
      subjectCode: "SCI",
      chapterCode: topic.chapterCode,
      subChapterCode: topic.subChapterCode,
      difficulty,
      body: item.body,
      answerText: item.answer,
      explanation: item.explanation,
      marks,
      estimatedTimeSec,
      isPublished: false,
    });
  }

  return matching({
    questionCode,
    title: `${gradeCode} Science Matching ${sequence}`,
    gradeCode,
    subjectCode: "SCI",
    chapterCode: topic.chapterCode,
    subChapterCode: topic.subChapterCode,
    difficulty,
    body: "Match each science term with the correct description.",
    explanation: "Each term has one best matching definition.",
    marks,
    estimatedTimeSec,
    isPublished: false,
    options: createMatchingOptions(scienceMatchingPairs, index),
  });
};

const generateQuestionsForGradeSubject = (
  gradeCode: string,
  subjectCode: SubjectCode,
  count: number,
): QuestionSeed[] => {
  const topics = buildTopicPool(gradeCode, subjectCode);
  if (topics.length === 0 || count <= 0) {
    return [];
  }

  const generated: QuestionSeed[] = [];

  for (let index = 0; index < count; index += 1) {
    const sequence = index + 1;
    const difficulty = pick(difficultyCycle, index);
    const type = pick(generatedTypeCycle, index);
    const marks = pick(generatedMarksByType[type], index);
    const topic = pick(topics, index);
    const questionCode = `QB-${gradeCode}-${subjectCode}-GEN-${padQuestionCode(sequence)}`;
    const estimatedTimeSec =
      type === QuestionType.long_answer
        ? 240
        : type === QuestionType.matching
          ? 120
          : 40 + marks * 25;

    if (subjectCode === "MATH") {
      generated.push(
        generateMathQuestion({
          questionCode,
          gradeCode,
          topic,
          type,
          difficulty,
          marks,
          estimatedTimeSec,
          sequence,
        }),
      );
      continue;
    }

    if (subjectCode === "ENG") {
      generated.push(
        generateEnglishQuestion({
          questionCode,
          gradeCode,
          topic,
          type,
          difficulty,
          marks,
          estimatedTimeSec,
          sequence,
        }),
      );
      continue;
    }

    generated.push(
      generateScienceQuestion({
        questionCode,
        gradeCode,
        topic,
        type,
        difficulty,
        marks,
        estimatedTimeSec,
        sequence,
      }),
    );
  }

  return generated;
};

const generatedQuestionSeeds = (
  Object.entries(subjectGradeMap) as Array<[SubjectCode, readonly string[]]>
).flatMap(([subjectCode, gradeCodes]) =>
  gradeCodes.flatMap((gradeCode) =>
    generateQuestionsForGradeSubject(
      gradeCode,
      subjectCode,
      generatedQuestionsPerGradeSubject,
    ),
  ),
);

const publishAllSeedQuestions = (
  process.env.SEED_PUBLISH_ALL_QUESTIONS ?? "true"
)
  .trim()
  .toLowerCase() !== "false";

const questionSeeds: readonly QuestionSeed[] = [...coreQuestionSeeds, ...generatedQuestionSeeds].map(
  (question) => {
    const shouldPublish = publishAllSeedQuestions ? true : question.isPublished;
    return {
      ...question,
      isPublished: shouldPublish,
      reviewStatus: reviewStatusFor(shouldPublish),
    };
  },
);

const freePreviewChapterCodes: Set<string> = new Set(
  chapterSeeds
    .filter((chapter) => chapter.isFreePreview)
    .map((chapter) => chapter.code),
);

const freePreviewSubChapterCodes: Set<string> = new Set(
  chapterSeeds.flatMap((chapter) =>
    chapter.subChapters
      .filter((subChapter) => subChapter.isFreePreview)
      .map((subChapter) => subChapter.code),
  ),
);

const isQuestionFreePreview = (question: Pick<QuestionSeed, "chapterCode" | "subChapterCode">) =>
  (question.chapterCode ? freePreviewChapterCodes.has(question.chapterCode) : false) ||
  (question.subChapterCode ? freePreviewSubChapterCodes.has(question.subChapterCode) : false);

const ensureSeededAdminUser = async () => {
  let adminUserRecord = await db.query.user.findFirst({
    where: eq(userTable.email, seededAdminEmail),
    columns: {
      id: true,
      email: true,
      name: true,
      role: true,
      emailVerified: true,
    },
  });

  if (!adminUserRecord) {
    const response = await auth.handler(
      new Request(`${authBaseUrl}/api/auth/sign-up/email`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          origin: authBaseUrl,
        },
        body: JSON.stringify({
          name: seededAdminName,
          email: seededAdminEmail,
          password: seededAdminPassword,
        }),
      }),
    );

    if (!response.ok) {
      const body = await response.text().catch(() => "");
      throw new Error(
        `Failed to create seeded admin user (${response.status} ${response.statusText}) ${body}`.trim(),
      );
    }

    adminUserRecord = await db.query.user.findFirst({
      where: eq(userTable.email, seededAdminEmail),
      columns: {
        id: true,
        email: true,
        name: true,
        role: true,
        emailVerified: true,
      },
    });
  }

  if (!adminUserRecord) {
    throw new Error("Seeded admin user could not be loaded after sign-up.");
  }

  const credentialAccount = await db.query.account.findFirst({
    where: and(eq(accountTable.userId, adminUserRecord.id), eq(accountTable.providerId, "credential")),
    columns: {
      id: true,
      password: true,
    },
  });

  const hashedPassword = await hashAuthPassword(seededAdminPassword);
  const now = new Date();

  if (!credentialAccount) {
    await db.insert(accountTable).values({
      id: crypto.randomUUID(),
      accountId: adminUserRecord.id,
      providerId: "credential",
      userId: adminUserRecord.id,
      password: hashedPassword,
      createdAt: now,
      updatedAt: now,
    });
  } else {
    await db
      .update(accountTable)
      .set({
        password: hashedPassword,
        updatedAt: now,
      })
      .where(eq(accountTable.id, credentialAccount.id));
  }

  await db
    .update(userTable)
    .set({
      name: seededAdminName,
      role: "admin",
      emailVerified: true,
    })
    .where(eq(userTable.id, adminUserRecord.id));

  return {
    id: adminUserRecord.id,
    email: seededAdminEmail,
    password: seededAdminPassword,
  };
};

const ensureUniqueQuestionCodes = (questions: readonly QuestionSeed[]) => {
  const seen = new Set<string>();
  for (const question of questions) {
    if (seen.has(question.questionCode)) {
      throw new Error(`Duplicate questionCode found in seed data: ${question.questionCode}`);
    }
    seen.add(question.questionCode);
  }
};

const isAllowedSeedMarksForType = (
  type: QuestionTypeValue,
  marks: number,
) => (generatedMarksByType[type] as readonly number[]).includes(marks);

const assertQuestionMarksByType = (questions: readonly QuestionSeed[]) => {
  for (const question of questions) {
    const allowedMarks = generatedMarksByType[question.type];
    if (!isAllowedSeedMarksForType(question.type, question.marks)) {
      throw new Error(
        `Invalid marks (${question.marks}) for ${question.type} in ${question.questionCode}. Allowed: ${allowedMarks.join(", ")}.`,
      );
    }
  }
};

const questionTypeSummary = (questions: readonly QuestionSeed[]) => {
  const counts: Record<string, number> = {};
  for (const item of questions) {
    counts[item.type] = (counts[item.type] ?? 0) + 1;
  }
  return counts;
};

const createSeedMaps = () => ({
  gradesByCode: new Map<string, string>(),
  subjectsByCode: new Map<string, string>(),
  chaptersByCode: new Map<string, string>(),
  subChaptersByCode: new Map<string, string>(),
  plansByCode: new Map<string, string>(),
});

const upsertPlans = async (plansByCode: Map<string, string>) => {
  for (const plan of planSeeds) {
    const record = firstOrThrow(
      await db
        .insert(planTable)
        .values(plan)
        .onConflictDoUpdate({
          target: planTable.code,
          set: {
            name: plan.name,
            description: plan.description,
            deviceLimit: plan.deviceLimit,
            maxQuestionsPerPractice: plan.maxQuestionsPerPractice,
            maxQuestionsPerPaper: plan.maxQuestionsPerPaper,
            monthlyPdfExportLimit: plan.monthlyPdfExportLimit,
            monthlyPaperGenerationLimit: plan.monthlyPaperGenerationLimit,
            monthlyPaperSwapLimit: plan.monthlyPaperSwapLimit,
            chatEnabled: plan.chatEnabled,
            generatorEnabled: plan.generatorEnabled,
            brandingLogoLimit: plan.brandingLogoLimit,
            offlineDrmEnabled: plan.offlineDrmEnabled,
            screenshotBlockEnabled: plan.screenshotBlockEnabled,
            printAllowed: plan.printAllowed,
          },
        })
        .returning(),
      `Failed to upsert plan ${plan.code}.`,
    );

    plansByCode.set(record.code, record.id);
  }
};

const upsertGrades = async (gradesByCode: Map<string, string>) => {
  for (const grade of gradeSeeds) {
    const record = firstOrThrow(
      await db
        .insert(gradeTable)
        .values({
          code: grade.code,
          name: grade.name,
          sortOrder: grade.sortOrder,
          isActive: true,
        })
        .onConflictDoUpdate({
          target: gradeTable.code,
          set: {
            name: grade.name,
            sortOrder: grade.sortOrder,
            isActive: true,
          },
        })
        .returning(),
      `Failed to upsert grade ${grade.code}.`,
    );

    gradesByCode.set(record.code, record.id);
  }
};

const upsertSubjects = async (subjectsByCode: Map<string, string>) => {
  for (const subject of subjectSeeds) {
    const record = firstOrThrow(
      await db
        .insert(subjectTable)
        .values({
          code: subject.code,
          name: subject.name,
          description: subject.description,
          isActive: true,
        })
        .onConflictDoUpdate({
          target: subjectTable.code,
          set: {
            name: subject.name,
            description: subject.description,
            isActive: true,
          },
        })
        .returning(),
      `Failed to upsert subject ${subject.code}.`,
    );

    subjectsByCode.set(record.code, record.id);
  }
};

const upsertGradeSubjectLinks = async (params: {
  gradesByCode: Map<string, string>;
  subjectsByCode: Map<string, string>;
}) => {
  for (const [subjectCode, gradeCodes] of Object.entries(subjectGradeMap)) {
    const subjectId = params.subjectsByCode.get(subjectCode);
    if (!subjectId) {
      throw new Error(`Subject ${subjectCode} was not created.`);
    }

    for (const [index, gradeCode] of gradeCodes.entries()) {
      const gradeId = params.gradesByCode.get(gradeCode);
      if (!gradeId) {
        throw new Error(`Grade ${gradeCode} was not created.`);
      }

      await db
        .insert(gradeSubjectTable)
        .values({
          gradeId,
          subjectId,
          isActive: true,
          sortOrder: index,
        })
        .onConflictDoUpdate({
          target: [gradeSubjectTable.gradeId, gradeSubjectTable.subjectId],
          set: {
            isActive: true,
            sortOrder: index,
          },
        });
    }
  }
};

const upsertChaptersAndSubChapters = async (params: {
  gradesByCode: Map<string, string>;
  subjectsByCode: Map<string, string>;
  chaptersByCode: Map<string, string>;
  subChaptersByCode: Map<string, string>;
}) => {
  for (const chapter of chapterSeeds) {
    const gradeId = params.gradesByCode.get(chapter.gradeCode);
    const subjectId = params.subjectsByCode.get(chapter.subjectCode);
    if (!gradeId || !subjectId) {
      throw new Error(`Missing relation for chapter ${chapter.code}.`);
    }

    const chapterRecord = firstOrThrow(
      await db
        .insert(chapterTable)
        .values({
          gradeId,
          subjectId,
          code: chapter.code,
          name: chapter.name,
          description: chapter.description ?? null,
          sortOrder: chapter.sortOrder,
          isActive: true,
          isFreePreview: chapter.isFreePreview,
        })
        .onConflictDoUpdate({
          target: [chapterTable.gradeId, chapterTable.subjectId, chapterTable.name],
          set: {
            code: chapter.code,
            description: chapter.description ?? null,
            sortOrder: chapter.sortOrder,
            isActive: true,
            isFreePreview: chapter.isFreePreview,
          },
        })
        .returning(),
      `Failed to upsert chapter ${chapter.code}.`,
    );

    params.chaptersByCode.set(chapter.code, chapterRecord.id);

    for (const subChapter of chapter.subChapters) {
      const subChapterRecord = firstOrThrow(
        await db
          .insert(subChapterTable)
          .values({
            chapterId: chapterRecord.id,
            code: subChapter.code,
            name: subChapter.name,
            description: subChapter.description ?? null,
            sortOrder: subChapter.sortOrder,
            isActive: true,
            isFreePreview: subChapter.isFreePreview,
          })
          .onConflictDoUpdate({
            target: [subChapterTable.chapterId, subChapterTable.name],
            set: {
              code: subChapter.code,
              description: subChapter.description ?? null,
              sortOrder: subChapter.sortOrder,
              isActive: true,
              isFreePreview: subChapter.isFreePreview,
            },
          })
          .returning(),
        `Failed to upsert sub-chapter ${subChapter.code}.`,
      );

      params.subChaptersByCode.set(subChapter.code, subChapterRecord.id);
    }
  }
};

const toQuestionPayload = (params: {
  question: QuestionSeed;
  gradeId: string;
  subjectId: string;
  chapterId: string | null;
  subChapterId: string | null;
  seededAdminId: string;
}) => ({
  gradeId: params.gradeId,
  subjectId: params.subjectId,
  chapterId: params.chapterId,
  subChapterId: params.subChapterId,
  title: params.question.title ?? null,
  mode: params.question.mode,
  type: params.question.type,
  difficulty: params.question.difficulty,
  body: params.question.body,
  questionImageUrls: params.question.questionImageUrls ?? null,
  explanation: params.question.explanation ?? null,
  solutionImageUrls: params.question.solutionImageUrls ?? null,
  answerText: params.question.answerText ?? null,
  answerFormula: params.question.answerFormula ?? null,
  variablesSchema: params.question.variablesSchema ?? null,
  reviewStatus: params.question.reviewStatus ?? reviewStatusFor(params.question.isPublished),
  marks: params.question.marks,
  estimatedTimeSec: params.question.estimatedTimeSec ?? null,
  isPublished: params.question.isPublished,
  isActive: true,
  createdBy: params.seededAdminId,
});

const replaceQuestionOptions = async (
  questionId: string,
  options: readonly OptionSeed[],
) => {
  await db.delete(questionOptionTable).where(eq(questionOptionTable.questionId, questionId));

  if (!options.length) {
    return;
  }

  await db.insert(questionOptionTable).values(
    options.map((option) => ({
      questionId,
      label: option.label,
      text: option.text,
      isCorrect: option.isCorrect,
      sortOrder: option.sortOrder,
    })),
  );
};

const upsertQuestions = async (params: {
  gradesByCode: Map<string, string>;
  subjectsByCode: Map<string, string>;
  chaptersByCode: Map<string, string>;
  subChaptersByCode: Map<string, string>;
  seededAdminId: string;
}) => {
  for (const question of questionSeeds) {
    const gradeId = params.gradesByCode.get(question.gradeCode);
    const subjectId = params.subjectsByCode.get(question.subjectCode);
    if (!gradeId || !subjectId) {
      throw new Error(`Missing grade/subject relation for question ${question.questionCode}.`);
    }

    const chapterId = question.chapterCode
      ? params.chaptersByCode.get(question.chapterCode) ?? null
      : null;
    const subChapterId = question.subChapterCode
      ? params.subChaptersByCode.get(question.subChapterCode) ?? null
      : null;

    if (question.chapterCode && !chapterId) {
      throw new Error(`Missing chapter relation for question ${question.questionCode}.`);
    }

    if (question.subChapterCode && !subChapterId) {
      throw new Error(`Missing sub-chapter relation for question ${question.questionCode}.`);
    }

    const payload = toQuestionPayload({
      question,
      gradeId,
      subjectId,
      chapterId,
      subChapterId,
      seededAdminId: params.seededAdminId,
    });

    const upserted = firstOrThrow(
      await db
        .insert(questionTable)
        .values({
          questionCode: question.questionCode,
          ...payload,
        })
        .onConflictDoUpdate({
          target: questionTable.questionCode,
          set: payload,
        })
        .returning(),
      `Failed to upsert question ${question.questionCode}.`,
    );

    await replaceQuestionOptions(upserted.id, question.options);
  }
};

const upsertStarterBlueprints = async (params: {
  gradesByCode: Map<string, string>;
  subjectsByCode: Map<string, string>;
  chaptersByCode: Map<string, string>;
  subChaptersByCode: Map<string, string>;
  seededAdminId: string;
}) => {
  for (const blueprint of starterBlueprintSeeds) {
    const gradeId = params.gradesByCode.get(blueprint.gradeCode);
    const subjectId = params.subjectsByCode.get(blueprint.subjectCode);
    if (!gradeId || !subjectId) {
      throw new Error(`Missing grade/subject relation for starter blueprint "${blueprint.title}".`);
    }

    const chapterIds = (blueprint.presetChapterCodes ?? []).map((code) => {
      const id = params.chaptersByCode.get(code);
      if (!id) {
        throw new Error(`Missing chapter relation for starter blueprint "${blueprint.title}" (${code}).`);
      }
      return id;
    });

    const subChapterIds = (blueprint.presetSubChapterCodes ?? []).map((code) => {
      const id = params.subChaptersByCode.get(code);
      if (!id) {
        throw new Error(
          `Missing sub-chapter relation for starter blueprint "${blueprint.title}" (${code}).`,
        );
      }
      return id;
    });

    const existing = await db.query.paperBlueprint.findFirst({
      where: and(
        eq(paperBlueprintTable.userId, params.seededAdminId),
        eq(paperBlueprintTable.title, blueprint.title),
      ),
      columns: { id: true },
    });

    const payload = {
      userId: params.seededAdminId,
      title: blueprint.title,
      mode: blueprint.mode,
      status: blueprint.status,
      gradeId,
      subjectId,
      totalMarks: blueprint.totalMarks,
      pdfTemplateKey: blueprint.pdfTemplateKey ?? "default",
      examYearLabel: blueprint.examYearLabel ?? null,
      timeAllowedLabel: blueprint.timeAllowedLabel ?? null,
      departmentLine: blueprint.departmentLine ?? null,
      answerInstructionLine: blueprint.answerInstructionLine ?? null,
      includeAnswerPaper: blueprint.includeAnswerPaper,
      difficultyDistribution: blueprint.difficultyDistribution,
      presetConfig: {
        chapterIds,
        subChapterIds,
      },
      templateConfig: blueprint.templateConfig ?? null,
    };

    let blueprintId = existing?.id;
    if (!blueprintId) {
      const inserted = firstOrThrow(
        await db.insert(paperBlueprintTable).values(payload).returning(),
        `Failed to insert starter blueprint "${blueprint.title}".`,
      );
      blueprintId = inserted.id;
    } else {
      await db.update(paperBlueprintTable).set(payload).where(eq(paperBlueprintTable.id, blueprintId));
    }

    await db.delete(paperBlueprintSlotTable).where(eq(paperBlueprintSlotTable.blueprintId, blueprintId));
    await db
      .delete(paperBlueprintSectionTable)
      .where(eq(paperBlueprintSectionTable.blueprintId, blueprintId));

    const sectionIdByCode = new Map<string, string>();
    if (blueprint.sections.length > 0) {
      const insertedSections = await db
        .insert(paperBlueprintSectionTable)
        .values(
          blueprint.sections.map((section) => ({
            blueprintId,
            code: section.code,
            title: section.title ?? null,
            questionType: section.questionType ?? null,
            marksPerQuestion: section.marksPerQuestion ?? null,
            questionCount: section.questionCount,
            totalMarks: section.totalMarks,
            sortOrder: section.sortOrder,
          })),
        )
        .returning();

      for (const section of insertedSections) {
        sectionIdByCode.set(section.code, section.id);
      }
    }

    if (blueprint.slots.length > 0) {
      await db.insert(paperBlueprintSlotTable).values(
        blueprint.slots.map((slot) => {
          const chapterId = slot.chapterCode ? params.chaptersByCode.get(slot.chapterCode) ?? null : null;
          const subChapterId = slot.subChapterCode
            ? params.subChaptersByCode.get(slot.subChapterCode) ?? null
            : null;

          if (slot.chapterCode && !chapterId) {
            throw new Error(`Missing chapter relation for slot ${slot.slotNumber} in "${blueprint.title}".`);
          }
          if (slot.subChapterCode && !subChapterId) {
            throw new Error(
              `Missing sub-chapter relation for slot ${slot.slotNumber} in "${blueprint.title}".`,
            );
          }

          const sectionId = slot.sectionCode ? sectionIdByCode.get(slot.sectionCode) ?? null : null;
          if (slot.sectionCode && !sectionId) {
            throw new Error(
              `Missing section relation for slot ${slot.slotNumber} in starter blueprint "${blueprint.title}".`,
            );
          }

          return {
            blueprintId,
            sectionId,
            slotNumber: slot.slotNumber,
            questionType: slot.questionType,
            marks: slot.marks,
            difficultyTarget: slot.difficultyTarget ?? null,
            chapterId,
            subChapterId,
            lockedQuestionId: null,
            generatedQuestionId: null,
            swapLimit: slot.swapLimit ?? 3,
            slotConfig: slot.slotConfig ?? null,
          };
        }),
      );
    }
  }
};

const ensureFreePlanSubscriptions = async (freePlanId: string | undefined) => {
  if (!freePlanId) {
    return;
  }

  const users = await db.query.user.findMany({
    columns: { id: true },
  });

  const existingSubscriptions = await db.query.subscription.findMany({
    columns: { userId: true },
  });
  const existingUserIds = new Set(existingSubscriptions.map((row) => row.userId));
  const missingUserIds = users
    .map((row) => row.id)
    .filter((userId) => !existingUserIds.has(userId));

  if (!missingUserIds.length) {
    return;
  }

  const now = new Date();
  const periodStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const periodEnd = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));

  await db
    .insert(subscriptionTable)
    .values(
      missingUserIds.map((userId) => ({
        userId,
        planId: freePlanId,
        status: "active" as const,
        billingCycle: "monthly" as const,
        startsAt: now,
        currentPeriodStart: periodStart,
        currentPeriodEnd: periodEnd,
      })),
    )
    .onConflictDoNothing({
      target: subscriptionTable.userId,
    });
};

const ensureOwnerDeviceLimitOverrides = async () => {
  if (!ownerOverrideEmails.length) {
    return;
  }

  const owners = await db.query.user.findMany({
    columns: { id: true, email: true },
  });

  const ownerUserIds = owners
    .filter((row) => ownerOverrideEmails.includes(String(row.email ?? "").trim().toLowerCase()))
    .map((row) => row.id);

  if (!ownerUserIds.length) {
    return;
  }

  await db
    .update(subscriptionTable)
    .set({
      deviceLimitOverride: ownerDeviceLimitOverride,
      updatedAt: new Date(),
    })
    .where(inArray(subscriptionTable.userId, ownerUserIds));
};

export const seed = async () => {
  ensureUniqueQuestionCodes(questionSeeds);
  assertQuestionMarksByType(questionSeeds);

  const maps = createSeedMaps();
  const seededAdmin = await ensureSeededAdminUser();

  await upsertPlans(maps.plansByCode);
  await upsertGrades(maps.gradesByCode);
  await upsertSubjects(maps.subjectsByCode);
  await upsertGradeSubjectLinks({
    gradesByCode: maps.gradesByCode,
    subjectsByCode: maps.subjectsByCode,
  });
  await upsertChaptersAndSubChapters({
    gradesByCode: maps.gradesByCode,
    subjectsByCode: maps.subjectsByCode,
    chaptersByCode: maps.chaptersByCode,
    subChaptersByCode: maps.subChaptersByCode,
  });
  await upsertQuestions({
    gradesByCode: maps.gradesByCode,
    subjectsByCode: maps.subjectsByCode,
    chaptersByCode: maps.chaptersByCode,
    subChaptersByCode: maps.subChaptersByCode,
    seededAdminId: seededAdmin.id,
  });
  await upsertStarterBlueprints({
    gradesByCode: maps.gradesByCode,
    subjectsByCode: maps.subjectsByCode,
    chaptersByCode: maps.chaptersByCode,
    subChaptersByCode: maps.subChaptersByCode,
    seededAdminId: seededAdmin.id,
  });
  await ensureFreePlanSubscriptions(maps.plansByCode.get("free"));
  await ensureOwnerDeviceLimitOverrides();

  const generatedQuestions = questionSeeds.filter((item) => item.questionCode.includes("-GEN-")).length;
  const generatedGradeSubjectPairs = Object.values(subjectGradeMap).reduce(
    (count, gradeCodes) => count + gradeCodes.length,
    0,
  );

  return {
    seedProfile,
    includeGeneratedQuestions,
    seededAdmin,
    plans: planSeeds.length,
    grades: gradeSeeds.length,
    subjects: subjectSeeds.length,
    chapters: chapterSeeds.length,
    subChapters: chapterSeeds.reduce((count, chapter) => count + chapter.subChapters.length, 0),
    questions: questionSeeds.length,
    generatedQuestionsPerGradeSubject,
    generatedGradeSubjectPairs,
    generatedQuestions,
    starterBlueprints: starterBlueprintSeeds.length,
    questionTypes: questionTypeSummary(questionSeeds),
    publishedQuestions: questionSeeds.filter((question) => question.isPublished).length,
    freePreviewChapters: chapterSeeds.filter((chapter) => chapter.isFreePreview).length,
    freePreviewSubChapters: chapterSeeds.flatMap((chapter) => chapter.subChapters).filter(
      (subChapter) => subChapter.isFreePreview,
    ).length,
    freePreviewQuestions: questionSeeds.filter((question) => isQuestionFreePreview(question)).length,
  };
};

const toSeedFailureMessage = (error: unknown) => {
  const collectMessages = (value: unknown, bucket: string[]) => {
    if (!value || typeof value !== "object") {
      return;
    }

    const candidate = value as {
      message?: unknown;
      cause?: unknown;
      code?: unknown;
    };

    if (typeof candidate.message === "string" && candidate.message.trim().length > 0) {
      bucket.push(candidate.message.trim());
    }
    if (typeof candidate.code === "string" && candidate.code.trim().length > 0) {
      bucket.push(candidate.code.trim());
    }
    if (candidate.cause) {
      collectMessages(candidate.cause, bucket);
    }
  };

  const collected: string[] = [];
  collectMessages(error, collected);
  const message = collected.join(" | ") || String(error ?? "Unknown seed error");

  if (/ECONNREFUSED|connect ECONNREFUSED|Connection refused/i.test(message)) {
    return [
      "Database connection was refused.",
      "Make sure PostgreSQL is running and DATABASE_URL points to the correct database.",
      "If schema changed recently, run `bunx drizzle-kit push --config drizzle.config.ts` before seeding.",
    ].join(" ");
  }

  if (
    /does not exist|relation .* does not exist|column .* does not exist|enum .* does not exist/i.test(
      message,
    )
  ) {
    return [
      "Database schema is not up to date for the current seed.",
      "Run `bunx drizzle-kit push --config drizzle.config.ts` (existing DB) or `bunx drizzle-kit migrate --config drizzle.config.ts` (fresh DB) first, then rerun seed.",
    ].join(" ");
  }

  return message;
};

if (import.meta.main) {
  console.log(
    [
      `Seed profile: ${seedProfile}`,
      includeGeneratedQuestions
        ? `Generated questions enabled (${generatedQuestionsPerGradeSubject} per grade-subject)`
        : "Generated questions disabled; using curated core question bank only",
    ].join(" | "),
  );
  seed()
    .then((result) => {
      console.log("Seed completed:", result);
    })
    .catch((error) => {
      console.error("Seed failed:", toSeedFailureMessage(error));
      if (error instanceof Error && error.message.trim().length > 0) {
        console.error(error);
      }
      process.exitCode = 1;
    });
}
