import type { QuestionInput } from "../schema/question.schema";
import type {
  QuestionType,
  QuestionVariableDefinition,
} from "../types/question.type";

export const typeLabels: Record<QuestionType, string> = {
  mcq: "MCQ",
  true_false: "True / False",
  short_answer: "Short Answer",
  long_answer: "Long Answer",
  fill_blank: "Fill in the Blank",
  matching: "Matching",
};

export const QUESTION_MARK_OPTIONS: Record<QuestionType, readonly number[]> = {
  mcq: [1],
  true_false: [1],
  fill_blank: [1],
  short_answer: [2, 3],
  matching: [5],
  long_answer: [10],
};

export const getDefaultMarksForType = (type: QuestionType) =>
  QUESTION_MARK_OPTIONS[type][0] ?? 1;

export const isAllowedMarksForType = (type: QuestionType, marks: number) =>
  QUESTION_MARK_OPTIONS[type].includes(marks);

export const getQuestionTypeLabel = (type: QuestionType) => typeLabels[type];

export type VariablePreset = {
  id: string;
  category: string;
  label: string;
  description: string;
  type: QuestionType;
  body: string;
  explanation?: string;
  answerText?: string;
  answerFormula?: string;
  variablesSchema: QuestionVariableDefinition[];
  options?: QuestionInput["options"];
};

export const VARIABLE_PRESETS: VariablePreset[] = [
  {
    id: "addition",
    category: "Arithmetic",
    label: "Addition",
    description: "Simple numeric template for quick arithmetic practice.",
    type: "short_answer",
    body: "What is {{a}} + {{b}}?",
    explanation: "Add the first number to the second number.",
    answerText: "{{a}} + {{b}}",
    answerFormula: "a + b",
    variablesSchema: [
      {
        key: "a",
        label: "First number",
        type: "number",
        min: 1,
        max: 20,
        step: 1,
        choices: [],
      },
      {
        key: "b",
        label: "Second number",
        type: "number",
        min: 1,
        max: 20,
        step: 1,
        choices: [],
      },
    ],
  },
  {
    id: "subtraction",
    category: "Arithmetic",
    label: "Subtraction",
    description: "A ready-made difference template with safe number ranges.",
    type: "short_answer",
    body: "What is {{a}} - {{b}}?",
    explanation: "Subtract the second number from the first number.",
    answerText: "{{a}} - {{b}}",
    answerFormula: "a - b",
    variablesSchema: [
      {
        key: "a",
        label: "Minuend",
        type: "number",
        min: 10,
        max: 50,
        step: 1,
        choices: [],
      },
      {
        key: "b",
        label: "Subtrahend",
        type: "number",
        min: 1,
        max: 10,
        step: 1,
        choices: [],
      },
    ],
  },
  {
    id: "word-problem",
    category: "Word Problem",
    label: "Word Problem",
    description: "Sentence-based prompt using both text and number variables.",
    type: "short_answer",
    body:
      "{{name}} has {{a}} apples and buys {{b}} more apples. How many apples does {{name}} have now?",
    explanation: "Combine the starting amount with the added amount.",
    answerText: "{{a}} + {{b}}",
    answerFormula: "a + b",
    variablesSchema: [
      {
        key: "name",
        label: "Student name",
        type: "text",
        choices: ["Aye Aye", "Moe Moe", "Su Su"],
      },
      {
        key: "a",
        label: "Starting apples",
        type: "number",
        min: 1,
        max: 12,
        step: 1,
        choices: [],
      },
      {
        key: "b",
        label: "Extra apples",
        type: "number",
        min: 1,
        max: 9,
        step: 1,
        choices: [],
      },
    ],
  },
  {
    id: "pythagorean",
    category: "Geometry",
    label: "Pythagorean",
    description: "Hypotenuse template using square roots and powers.",
    type: "short_answer",
    body:
      "A right triangle has legs ${{a}}$ cm and ${{b}}$ cm. Find the hypotenuse.",
    explanation: "Use the Pythagorean theorem $c = \\sqrt{a^2 + b^2}$.",
    answerText: "$\\sqrt{{{a}}^2 + {{{b}}^2}$",
    answerFormula: "sqrt(a ^ 2 + b ^ 2)",
    variablesSchema: [
      {
        key: "a",
        label: "First leg",
        type: "number",
        min: 3,
        max: 12,
        step: 1,
        choices: [],
      },
      {
        key: "b",
        label: "Second leg",
        type: "number",
        min: 4,
        max: 15,
        step: 1,
        choices: [],
      },
    ],
  },
  {
    id: "quadratic-root",
    category: "Algebra",
    label: "Quadratic Root",
    description: "Positive-root formula with a guaranteed real discriminant range.",
    type: "short_answer",
    body:
      "Find the positive root of ${{a}}x^2 + {{b}}x + {{c}} = 0$ using the quadratic formula.",
    explanation:
      "Use $x = \\frac{-b + \\sqrt{b^2 - 4ac}}{2a}$ and take the positive branch.",
    answerText: "$\\frac{-{{b}} + \\sqrt{{{{b}}^2 - 4({{a}})({{c}})}}{2({{a}})}$",
    answerFormula: "(-b + sqrt(b ^ 2 - 4 * a * c)) / (2 * a)",
    variablesSchema: [
      {
        key: "a",
        label: "Quadratic coefficient",
        type: "number",
        min: 1,
        max: 2,
        step: 1,
        choices: [],
      },
      {
        key: "b",
        label: "Linear coefficient",
        type: "number",
        min: 10,
        max: 16,
        step: 1,
        choices: [],
      },
      {
        key: "c",
        label: "Constant term",
        type: "number",
        min: 1,
        max: 9,
        step: 1,
        choices: [],
      },
    ],
  },
  {
    id: "compound-interest",
    category: "Finance",
    label: "Compound Growth",
    description: "Interest-growth template using exponents and percentages.",
    type: "short_answer",
    body:
      "An investment of {{principal}} kyats grows at {{rate}}% per year for {{years}} years. What is the final amount?",
    explanation: "Apply $A = P(1 + r/100)^t$.",
    answerText: "{{principal}} * (1 + {{rate}} / 100)^{{years}}",
    answerFormula: "principal * ((1 + rate / 100) ^ years)",
    variablesSchema: [
      {
        key: "principal",
        label: "Principal",
        type: "number",
        min: 100000,
        max: 500000,
        step: 50000,
        choices: [],
      },
      {
        key: "rate",
        label: "Rate percent",
        type: "number",
        min: 2,
        max: 12,
        step: 1,
        choices: [],
      },
      {
        key: "years",
        label: "Years",
        type: "number",
        min: 2,
        max: 6,
        step: 1,
        choices: [],
      },
    ],
  },
  {
    id: "trig-degree",
    category: "Trigonometry",
    label: "Trig Degree",
    description: "Angle-based trig template using degree helpers like sind/cosd.",
    type: "short_answer",
    body:
      "Evaluate $\\sin({{theta}}^\\circ)$ and multiply the result by {{scale}}.",
    explanation: "Use the degree helper because the angle is expressed in degrees.",
    answerText: "{{scale}} \\sin({{theta}}^\\circ)",
    answerFormula: "scale * sind(theta)",
    variablesSchema: [
      {
        key: "theta",
        label: "Angle",
        type: "number",
        min: 15,
        max: 75,
        step: 15,
        choices: [],
      },
      {
        key: "scale",
        label: "Multiplier",
        type: "number",
        min: 2,
        max: 10,
        step: 1,
        choices: [],
      },
    ],
  },
  {
    id: "piecewise-max",
    category: "Piecewise",
    label: "Max Selector",
    description: "Piecewise template using if(...) and comparison operators.",
    type: "short_answer",
    body:
      "Choose the larger value between {{a}} and {{b}} using a piecewise rule.",
    explanation: "Use $if(a > b, a, b)$ to return the greater value.",
    answerText: "max({{a}}, {{b}})",
    answerFormula: "if(a > b, a, b)",
    variablesSchema: [
      {
        key: "a",
        label: "First value",
        type: "number",
        min: -20,
        max: 20,
        step: 1,
        choices: [],
      },
      {
        key: "b",
        label: "Second value",
        type: "number",
        min: -20,
        max: 20,
        step: 1,
        choices: [],
      },
    ],
  },
  {
    id: "combination-count",
    category: "Combinatorics",
    label: "Combination Count",
    description: "Committee-count template using nCr.",
    type: "short_answer",
    body:
      "How many ways can {{r}} students be chosen from a group of {{n}} students?",
    explanation: "Use the combination formula $\\binom{n}{r}$.",
    answerText: "$\\binom{{{n}}}{{{r}}}$",
    answerFormula: "ncr(n, r)",
    variablesSchema: [
      {
        key: "n",
        label: "Group size",
        type: "number",
        min: 5,
        max: 12,
        step: 1,
        choices: [],
      },
      {
        key: "r",
        label: "Selection size",
        type: "number",
        min: 2,
        max: 4,
        step: 1,
        choices: [],
      },
    ],
  },
  {
    id: "distance-between-points",
    category: "Coordinate Geometry",
    label: "Distance Formula",
    description: "Coordinate-plane template with four variables and radicals.",
    type: "short_answer",
    body:
      "Find the distance between the points $({{x1}}, {{y1}})$ and $({{x2}}, {{y2}})$.",
    explanation: "Use $d = \\sqrt{(x_2 - x_1)^2 + (y_2 - y_1)^2}$.",
    answerText: "$\\sqrt{({{x2}} - {{x1}})^2 + ({{y2}} - {{y1}})^2}$",
    answerFormula: "sqrt((x2 - x1) ^ 2 + (y2 - y1) ^ 2)",
    variablesSchema: [
      {
        key: "x1",
        label: "x1",
        type: "number",
        min: -6,
        max: 6,
        step: 1,
        choices: [],
      },
      {
        key: "y1",
        label: "y1",
        type: "number",
        min: -6,
        max: 6,
        step: 1,
        choices: [],
      },
      {
        key: "x2",
        label: "x2",
        type: "number",
        min: -6,
        max: 6,
        step: 1,
        choices: [],
      },
      {
        key: "y2",
        label: "y2",
        type: "number",
        min: -6,
        max: 6,
        step: 1,
        choices: [],
      },
    ],
  },
  {
    id: "midpoint-formula",
    category: "Coordinate Geometry",
    label: "Midpoint",
    description: "Coordinate midpoint template using averages on both axes.",
    type: "short_answer",
    body:
      "Find the midpoint of the line segment joining $({{x1}}, {{y1}})$ and $({{x2}}, {{y2}})$.",
    explanation: "Use $M = ((x_1 + x_2)/2, (y_1 + y_2)/2)$.",
    answerText:
      "$\\left(\\frac{{{{x1}} + {{x2}}}}{2}, \\frac{{{{y1}} + {{y2}}}}{2}\\right)$",
    variablesSchema: [
      {
        key: "x1",
        label: "x1",
        type: "number",
        min: -8,
        max: 8,
        step: 2,
        choices: [],
      },
      {
        key: "y1",
        label: "y1",
        type: "number",
        min: -8,
        max: 8,
        step: 2,
        choices: [],
      },
      {
        key: "x2",
        label: "x2",
        type: "number",
        min: -8,
        max: 8,
        step: 2,
        choices: [],
      },
      {
        key: "y2",
        label: "y2",
        type: "number",
        min: -8,
        max: 8,
        step: 2,
        choices: [],
      },
    ],
  },
  {
    id: "circle-area",
    category: "Geometry",
    label: "Circle Area",
    description: "Circle-area template using $\\pi r^2$.",
    type: "short_answer",
    body: "Find the area of a circle with radius ${{r}}$ cm.",
    explanation: "Use $A = \\pi r^2$.",
    answerText: "$\\pi({{r}})^2$",
    answerFormula: "pi * r ^ 2",
    variablesSchema: [
      {
        key: "r",
        label: "Radius",
        type: "number",
        min: 2,
        max: 15,
        step: 1,
        choices: [],
      },
    ],
  },
  {
    id: "arithmetic-sequence",
    category: "Sequences",
    label: "Arithmetic Sequence",
    description: "Find an nth term from the first term and common difference.",
    type: "short_answer",
    body:
      "The first term of an arithmetic sequence is {{a1}} and the common difference is {{d}}. Find the {{n}}th term.",
    explanation: "Use $a_n = a_1 + (n - 1)d$.",
    answerText: "{{a1}} + ({{n}} - 1)({{d}})",
    answerFormula: "a1 + (n - 1) * d",
    variablesSchema: [
      {
        key: "a1",
        label: "First term",
        type: "number",
        min: 1,
        max: 20,
        step: 1,
        choices: [],
      },
      {
        key: "d",
        label: "Common difference",
        type: "number",
        min: 1,
        max: 8,
        step: 1,
        choices: [],
      },
      {
        key: "n",
        label: "Term number",
        type: "number",
        min: 4,
        max: 15,
        step: 1,
        choices: [],
      },
    ],
  },
  {
    id: "geometric-sequence",
    category: "Sequences",
    label: "Geometric Sequence",
    description: "Nth-term template using exponents for geometric growth.",
    type: "short_answer",
    body:
      "The first term of a geometric sequence is {{a1}} and the common ratio is {{r}}. Find the {{n}}th term.",
    explanation: "Use $a_n = a_1 r^{n-1}$.",
    answerText: "{{a1}}({{r}})^({{n}} - 1)",
    answerFormula: "a1 * (r ^ (n - 1))",
    variablesSchema: [
      {
        key: "a1",
        label: "First term",
        type: "number",
        min: 1,
        max: 6,
        step: 1,
        choices: [],
      },
      {
        key: "r",
        label: "Common ratio",
        type: "number",
        min: 2,
        max: 4,
        step: 1,
        choices: [],
      },
      {
        key: "n",
        label: "Term number",
        type: "number",
        min: 3,
        max: 7,
        step: 1,
        choices: [],
      },
    ],
  },
  {
    id: "triangle-area-sine",
    category: "Trigonometry",
    label: "Area With Included Angle",
    description: "Triangle-area template using $\\frac{1}{2}ab\\sin C$.",
    type: "short_answer",
    body:
      "Two sides of a triangle are {{a}} cm and {{b}} cm with included angle ${{theta}}^\\circ$. Find the area.",
    explanation: "Use $A = \\frac{1}{2}ab\\sin C$ with degree-based trig.",
    answerText: "$\\frac{1}{2}({{a}})({{b}})\\sin({{theta}}^\\circ)$",
    answerFormula: "0.5 * a * b * sind(theta)",
    variablesSchema: [
      {
        key: "a",
        label: "First side",
        type: "number",
        min: 4,
        max: 15,
        step: 1,
        choices: [],
      },
      {
        key: "b",
        label: "Second side",
        type: "number",
        min: 4,
        max: 15,
        step: 1,
        choices: [],
      },
      {
        key: "theta",
        label: "Included angle",
        type: "number",
        min: 30,
        max: 120,
        step: 15,
        choices: [],
      },
    ],
  },
  {
    id: "piecewise-fare",
    category: "Piecewise",
    label: "Taxi Fare",
    description: "Real-world piecewise template using base and extra rates.",
    type: "short_answer",
    body:
      "A taxi charges {{base}} kyats for the first {{included}} km and {{extra}} kyats for each additional km. Find the fare for {{distance}} km.",
    explanation:
      "If the trip stays inside the included distance, the fare is just the base charge. Otherwise add the extra distance cost.",
    answerText:
      "if {{distance}} <= {{included}}, fare is {{base}}; otherwise {{base}} + ({{distance}} - {{included}}) * {{extra}}",
    answerFormula:
      "if(distance <= included, base, base + (distance - included) * extra)",
    variablesSchema: [
      {
        key: "base",
        label: "Base fare",
        type: "number",
        min: 1500,
        max: 2500,
        step: 250,
        choices: [],
      },
      {
        key: "included",
        label: "Included kilometers",
        type: "number",
        min: 2,
        max: 4,
        step: 1,
        choices: [],
      },
      {
        key: "extra",
        label: "Extra cost per km",
        type: "number",
        min: 300,
        max: 700,
        step: 50,
        choices: [],
      },
      {
        key: "distance",
        label: "Trip distance",
        type: "number",
        min: 1,
        max: 12,
        step: 1,
        choices: [],
      },
    ],
  },
];

export type FormulaSnippet = {
  id: string;
  label: string;
  minVariables: number;
  buildFormula: (keys: string[]) => string;
};

export const FORMULA_SNIPPETS: FormulaSnippet[] = [
  {
    id: "average-2",
    label: "Average",
    minVariables: 2,
    buildFormula: ([a, b]) => `(${a} + ${b}) / 2`,
  },
  {
    id: "hypotenuse",
    label: "Hypotenuse",
    minVariables: 2,
    buildFormula: ([a, b]) => `sqrt(${a} ^ 2 + ${b} ^ 2)`,
  },
  {
    id: "max-piecewise",
    label: "Piecewise Max",
    minVariables: 2,
    buildFormula: ([a, b]) => `if(${a} > ${b}, ${a}, ${b})`,
  },
  {
    id: "combination",
    label: "nCr",
    minVariables: 2,
    buildFormula: ([n, r]) => `ncr(${n}, ${r})`,
  },
  {
    id: "permutation",
    label: "nPr",
    minVariables: 2,
    buildFormula: ([n, r]) => `npr(${n}, ${r})`,
  },
  {
    id: "square",
    label: "Square",
    minVariables: 1,
    buildFormula: ([x]) => `${x} ^ 2`,
  },
  {
    id: "sqrt",
    label: "sqrt",
    minVariables: 1,
    buildFormula: ([x]) => `sqrt(${x})`,
  },
  {
    id: "abs",
    label: "abs",
    minVariables: 1,
    buildFormula: ([x]) => `abs(${x})`,
  },
  {
    id: "sin-degree",
    label: "sin°",
    minVariables: 1,
    buildFormula: ([theta]) => `sind(${theta})`,
  },
  {
    id: "log10",
    label: "log10",
    minVariables: 1,
    buildFormula: ([x]) => `log(${x}, 10)`,
  },
  {
    id: "quadratic-root",
    label: "Quadratic Root",
    minVariables: 3,
    buildFormula: ([a, b, c]) =>
      `(-${b} + sqrt(${b} ^ 2 - 4 * ${a} * ${c})) / (2 * ${a})`,
  },
  {
    id: "quadratic-root-negative",
    label: "Quadratic -Root",
    minVariables: 3,
    buildFormula: ([a, b, c]) =>
      `(-${b} - sqrt(${b} ^ 2 - 4 * ${a} * ${c})) / (2 * ${a})`,
  },
  {
    id: "compound-growth",
    label: "Compound Growth",
    minVariables: 3,
    buildFormula: ([principal, rate, years]) =>
      `${principal} * ((1 + ${rate} / 100) ^ ${years})`,
  },
  {
    id: "circle-area",
    label: "Circle Area",
    minVariables: 1,
    buildFormula: ([r]) => `pi * ${r} ^ 2`,
  },
  {
    id: "circumference",
    label: "Circumference",
    minVariables: 1,
    buildFormula: ([r]) => `2 * pi * ${r}`,
  },
  {
    id: "arithmetic-term",
    label: "Arithmetic nth",
    minVariables: 3,
    buildFormula: ([a1, d, n]) => `${a1} + (${n} - 1) * ${d}`,
  },
  {
    id: "geometric-term",
    label: "Geometric nth",
    minVariables: 3,
    buildFormula: ([a1, r, n]) => `${a1} * (${r} ^ (${n} - 1))`,
  },
  {
    id: "triangle-area-sine",
    label: "Triangle Area",
    minVariables: 3,
    buildFormula: ([a, b, theta]) => `0.5 * ${a} * ${b} * sind(${theta})`,
  },
  {
    id: "distance-2d",
    label: "Distance 2D",
    minVariables: 4,
    buildFormula: ([x1, y1, x2, y2]) =>
      `sqrt((${x2} - ${x1}) ^ 2 + (${y2} - ${y1}) ^ 2)`,
  },
  {
    id: "midpoint-x",
    label: "Midpoint x",
    minVariables: 2,
    buildFormula: ([x1, x2]) => `(${x1} + ${x2}) / 2`,
  },
  {
    id: "piecewise-fare",
    label: "Piecewise Fare",
    minVariables: 4,
    buildFormula: ([base, included, extra, distance]) =>
      `if(${distance} <= ${included}, ${base}, ${base} + (${distance} - ${included}) * ${extra})`,
  },
];

export const PRESET_CATEGORY_ALL = "All";
