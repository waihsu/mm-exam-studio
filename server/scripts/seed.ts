import { and, eq } from "drizzle-orm";
import {
  account as accountTable,
  chapter as chapterTable,
  db,
  grade as gradeTable,
  gradeSubject as gradeSubjectTable,
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

const seededAdminName = (process.env.SEED_ADMIN_NAME ?? "MM Exam Studio Admin").trim();
const seededAdminEmail = (process.env.SEED_ADMIN_EMAIL ?? "admin@hsuwai.space")
  .trim()
  .toLowerCase();
const seededAdminPassword = (process.env.SEED_ADMIN_PASSWORD ?? "Admin@123456").trim();

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
const defaultGeneratedQuestionsPerGradeSubject = seedProfile === "production" ? 0 : 60;

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
  answerText?: string | null;
  explanation?: string | null;
  answerFormula?: string | null;
  variablesSchema?: readonly VariableSeed[] | null;
  marks: number;
  estimatedTimeSec?: number | null;
  isPublished: boolean;
  reviewStatus?: (typeof QuestionReviewStatus)[keyof typeof QuestionReviewStatus];
  options: readonly OptionSeed[];
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
  ENG: ["G06", "G07", "G08"],
  SCI: ["G06", "G07", "G08"],
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
];

const planSeeds = [
  {
    code: "free",
    name: "Free",
    description:
      "Access published questions in free-preview chapters only, with modest practice, paper, and export limits.",
    deviceLimit: 1,
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
    deviceLimit: 2,
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
    deviceLimit: 3,
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

const reviewStatusFor = (isPublished: boolean) =>
  isPublished ? QuestionReviewStatus.approved : QuestionReviewStatus.draft;

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
      body: `Choose the correct value of ${a} + ${b}.`,
      explanation: `Add ${a} and ${b} to get ${answer}.`,
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
      body: `True or False: ${number} is an even number.`,
      answerText: statementTrue ? "True" : "False",
      explanation: `${number} is ${number % 2 === 0 ? "even" : "odd"}.`,
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
      body: `Compute ${a} x ${b}.`,
      answerText: String(answer),
      explanation: `Multiply ${a} by ${b} to get ${answer}.`,
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
        `A rectangle has length ${length} cm and width ${width} cm. Explain the formula for area and show how to find the area of the rectangle.`,
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
      body: `Fill in the blank: The square root of ${square} is ____.`,
      answerText: String(root),
      explanation: `${root} x ${root} = ${square}.`,
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
        label: `Expr A (${leftA} + ${leftB})`,
        text: String(leftA + leftB),
        isCorrect: true,
        sortOrder: 0,
      },
      {
        label: `Expr B (${leftA} - ${leftC})`,
        text: String(leftA - leftC),
        isCorrect: true,
        sortOrder: 1,
      },
      {
        label: `Expr C (${leftB} x ${leftC})`,
        text: String(leftB * leftC),
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

const questionTypeSummary = (questions: readonly QuestionSeed[]) => {
  const counts: Record<string, number> = {};
  for (const item of questions) {
    counts[item.type] = (counts[item.type] ?? 0) + 1;
  }
  return counts;
};

export const seed = async () => {
  ensureUniqueQuestionCodes(questionSeeds);

  const gradesByCode = new Map<string, string>();
  const subjectsByCode = new Map<string, string>();
  const chaptersByCode = new Map<string, string>();
  const subChaptersByCode = new Map<string, string>();
  const plansByCode = new Map<string, string>();
  const seededAdmin = await ensureSeededAdminUser();

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

  for (const [subjectCode, gradeCodes] of Object.entries(subjectGradeMap)) {
    const subjectId = subjectsByCode.get(subjectCode);

    if (!subjectId) {
      throw new Error(`Subject ${subjectCode} was not created.`);
    }

    for (const [index, gradeCode] of gradeCodes.entries()) {
      const gradeId = gradesByCode.get(gradeCode);

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

  for (const chapter of chapterSeeds) {
    const gradeId = gradesByCode.get(chapter.gradeCode);
    const subjectId = subjectsByCode.get(chapter.subjectCode);

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

    chaptersByCode.set(chapter.code, chapterRecord.id);

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

      subChaptersByCode.set(subChapter.code, subChapterRecord.id);
    }
  }

  for (const question of questionSeeds) {
    const gradeId = gradesByCode.get(question.gradeCode);
    const subjectId = subjectsByCode.get(question.subjectCode);

    if (!gradeId || !subjectId) {
      throw new Error(`Missing grade/subject relation for question ${question.questionCode}.`);
    }

    const chapterId = question.chapterCode
      ? chaptersByCode.get(question.chapterCode) ?? null
      : null;
    const subChapterId = question.subChapterCode
      ? subChaptersByCode.get(question.subChapterCode) ?? null
      : null;

    if (question.chapterCode && !chapterId) {
      throw new Error(`Missing chapter relation for question ${question.questionCode}.`);
    }

    if (question.subChapterCode && !subChapterId) {
      throw new Error(`Missing sub-chapter relation for question ${question.questionCode}.`);
    }

    const existingQuestion = await db.query.question.findFirst({
      where: eq(questionTable.questionCode, question.questionCode),
      columns: { id: true },
    });

    const payload = {
      gradeId,
      subjectId,
      chapterId,
      subChapterId,
      title: question.title ?? null,
      mode: question.mode,
      type: question.type,
      difficulty: question.difficulty,
      body: question.body,
      explanation: question.explanation ?? null,
      answerText: question.answerText ?? null,
      answerFormula: question.answerFormula ?? null,
      variablesSchema: question.variablesSchema ?? null,
      reviewStatus: question.reviewStatus ?? reviewStatusFor(question.isPublished),
      marks: question.marks,
      estimatedTimeSec: question.estimatedTimeSec ?? null,
      isPublished: question.isPublished,
      isActive: true,
      createdBy: seededAdmin.id,
    } as const;

    const questionId = existingQuestion?.id;

    if (questionId) {
      await db.update(questionTable).set(payload).where(eq(questionTable.id, questionId));
      await db.delete(questionOptionTable).where(eq(questionOptionTable.questionId, questionId));
    } else {
      const createdQuestion = firstOrThrow(
        await db
          .insert(questionTable)
          .values({
            questionCode: question.questionCode,
            ...payload,
          })
          .returning(),
        `Failed to create question ${question.questionCode}.`,
      );

      const newQuestionId = createdQuestion.id;

      if (question.options.length > 0) {
        await db.insert(questionOptionTable).values(
          question.options.map((option) => ({
            questionId: newQuestionId,
            label: option.label,
            text: option.text,
            isCorrect: option.isCorrect,
            sortOrder: option.sortOrder,
          })),
        );
      }

      continue;
    }

    if (question.options.length > 0) {
      await db.insert(questionOptionTable).values(
        question.options.map((option) => ({
          questionId,
          label: option.label,
          text: option.text,
          isCorrect: option.isCorrect,
          sortOrder: option.sortOrder,
        })),
      );
    }
  }

  const freePlanId = plansByCode.get("free");
  if (freePlanId) {
    const users = await db.query.user.findMany({
      columns: { id: true },
    });
    const now = new Date();
    const periodStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
    const periodEnd = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));

    for (const row of users) {
      const existingSubscription = await db.query.subscription.findFirst({
        where: eq(subscriptionTable.userId, row.id),
        columns: { id: true },
      });

      if (existingSubscription) {
        continue;
      }

      await db.insert(subscriptionTable).values({
        userId: row.id,
        planId: freePlanId,
        status: "active",
        billingCycle: "monthly",
        startsAt: now,
        currentPeriodStart: periodStart,
        currentPeriodEnd: periodEnd,
      });
    }
  }

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
