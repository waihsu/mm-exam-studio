import { relations, sql } from "drizzle-orm";
import {
  boolean,
  check,
  index,
  integer,
  json,
  pgEnum,
  pgTable,
  primaryKey,
  real,
  text,
  timestamp,
  unique,
} from "drizzle-orm/pg-core";

import { user } from "./auth-schema";

const createId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2);

export const roleEnum = pgEnum("Role", ["user", "admin"]);
export const accountStatusEnum = pgEnum("AccountStatus", [
  "active",
  "suspended",
  "deactivated",
]);
export const questionTypeEnum = pgEnum("QuestionType", [
  "mcq",
  "true_false",
  "short_answer",
  "long_answer",
  "fill_blank",
  "matching",
]);
export const difficultyEnum = pgEnum("Difficulty", ["easy", "medium", "hard"]);
export const questionModeEnum = pgEnum("QuestionMode", ["static", "variable"]);
export const questionReviewStatusEnum = pgEnum("QuestionReviewStatus", [
  "draft",
  "in_review",
  "needs_changes",
  "approved",
]);
export const practiceSessionStatusEnum = pgEnum("PracticeSessionStatus", [
  "active",
  "completed",
]);
export const questionPaperStatusEnum = pgEnum("QuestionPaperStatus", [
  "draft",
  "finalized",
]);
export const planCodeEnum = pgEnum("PlanCode", ["free", "pro", "premium"]);
export const subscriptionStatusEnum = pgEnum("SubscriptionStatus", [
  "active",
  "canceled",
  "past_due",
  "expired",
]);
export const billingCycleEnum = pgEnum("BillingCycle", [
  "monthly",
  "yearly",
  "lifetime",
]);
export const subscriptionRequestStatusEnum = pgEnum(
  "SubscriptionRequestStatus",
  ["pending", "approved", "rejected", "canceled"],
);
export const deviceTypeEnum = pgEnum("DeviceType", [
  "mobile",
  "desktop",
  "unknown",
]);
export const pushProviderEnum = pgEnum("PushProvider", ["expo"]);
export const pushPlatformEnum = pgEnum("PushPlatform", ["android", "ios"]);
export const supportConversationStatusEnum = pgEnum("SupportConversationStatus", [
  "open",
  "closed",
]);
export const supportMessageSenderRoleEnum = pgEnum("SupportMessageSenderRole", [
  "user",
  "admin",
]);

export const grade = pgTable("grade", {
  id: text("id").primaryKey().$defaultFn(createId),
  code: text("code").notNull().unique(),
  name: text("name").notNull(),
  sortOrder: integer("sortOrder").default(0).notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt")
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

export const subject = pgTable("subject", {
  id: text("id").primaryKey().$defaultFn(createId),
  code: text("code").notNull().unique(),
  name: text("name").notNull(),
  description: text("description"),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt")
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

export const gradeSubject = pgTable(
  "grade_subject",
  {
    gradeId: text("gradeId")
      .notNull()
      .references(() => grade.id, { onDelete: "cascade" }),
    subjectId: text("subjectId")
      .notNull()
      .references(() => subject.id, { onDelete: "cascade" }),
    sortOrder: integer("sortOrder").default(0).notNull(),
    isActive: boolean("isActive").default(true).notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.gradeId, table.subjectId] }),
    index("grade_subject_subjectId_idx").on(table.subjectId),
  ],
);

export const chapter = pgTable(
  "chapter",
  {
    id: text("id").primaryKey().$defaultFn(createId),
    gradeId: text("gradeId")
      .notNull()
      .references(() => grade.id, { onDelete: "cascade" }),
    subjectId: text("subjectId")
      .notNull()
      .references(() => subject.id, { onDelete: "cascade" }),
    code: text("code"),
    name: text("name").notNull(),
    description: text("description"),
    sortOrder: integer("sortOrder").default(0).notNull(),
    isActive: boolean("isActive").default(true).notNull(),
    isFreePreview: boolean("isFreePreview").default(false).notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    unique().on(table.gradeId, table.subjectId, table.name),
    index("chapter_grade_subject_idx").on(table.gradeId, table.subjectId),
  ],
);

export const subChapter = pgTable(
  "sub_chapter",
  {
    id: text("id").primaryKey().$defaultFn(createId),
    chapterId: text("chapterId")
      .notNull()
      .references(() => chapter.id, { onDelete: "cascade" }),
    code: text("code"),
    name: text("name").notNull(),
    description: text("description"),
    sortOrder: integer("sortOrder").default(0).notNull(),
    isActive: boolean("isActive").default(true).notNull(),
    isFreePreview: boolean("isFreePreview").default(false).notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    unique().on(table.chapterId, table.name),
    index("sub_chapter_chapter_idx").on(table.chapterId),
  ],
);

export const question = pgTable(
  "question",
  {
    id: text("id").primaryKey().$defaultFn(createId),
    questionCode: text("questionCode").notNull().unique(),
    gradeId: text("gradeId")
      .notNull()
      .references(() => grade.id),
    subjectId: text("subjectId")
      .notNull()
      .references(() => subject.id),
    chapterId: text("chapterId").references(() => chapter.id),
    subChapterId: text("subChapterId").references(() => subChapter.id),
    type: questionTypeEnum("type").default("mcq").notNull(),
    difficulty: difficultyEnum("difficulty").default("medium").notNull(),
    mode: questionModeEnum("mode").default("static").notNull(),
    title: text("title"),
    body: text("body").notNull(),
    explanation: text("explanation"),
    answerText: text("answerText"),
    answerFormula: text("answerFormula"),
    variablesSchema: json("variablesSchema"),
    reviewStatus: questionReviewStatusEnum("reviewStatus")
      .default("draft")
      .notNull(),
    reviewNotes: text("reviewNotes"),
    marks: integer("marks").default(1).notNull(),
    estimatedTimeSec: integer("estimatedTimeSec"),
    isPublished: boolean("isPublished").default(false).notNull(),
    isActive: boolean("isActive").default(true).notNull(),
    createdBy: text("createdBy").references(() => user.id),
    reviewedBy: text("reviewedBy").references(() => user.id),
    reviewedAt: timestamp("reviewedAt"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("question_taxonomy_idx").on(
      table.gradeId,
      table.subjectId,
      table.chapterId,
      table.subChapterId,
    ),
    check("question_marks_allowed_ck", sql`${table.marks} in (1, 2, 3, 5, 10)`),
  ],
);

export const questionOption = pgTable(
  "question_option",
  {
    id: text("id").primaryKey().$defaultFn(createId),
    questionId: text("questionId")
      .notNull()
      .references(() => question.id, { onDelete: "cascade" }),
    label: text("label"),
    text: text("text").notNull(),
    isCorrect: boolean("isCorrect").default(false).notNull(),
    sortOrder: integer("sortOrder").default(0).notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => [
    unique().on(table.questionId, table.label),
    unique().on(table.questionId, table.sortOrder),
    index("question_option_question_idx").on(table.questionId),
  ],
);

export const practiceSession = pgTable(
  "practice_session",
  {
    id: text("id").primaryKey().$defaultFn(createId),
    userId: text("userId")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    title: text("title"),
    status: practiceSessionStatusEnum("status").default("active").notNull(),
    gradeId: text("gradeId").references(() => grade.id),
    subjectId: text("subjectId").references(() => subject.id),
    chapterId: text("chapterId").references(() => chapter.id),
    subChapterId: text("subChapterId").references(() => subChapter.id),
    totalQuestions: integer("totalQuestions").default(0).notNull(),
    correctAnswers: integer("correctAnswers").default(0).notNull(),
    scorePercent: real("scorePercent"),
    startedAt: timestamp("startedAt").defaultNow().notNull(),
    completedAt: timestamp("completedAt"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("practice_session_user_created_idx").on(table.userId, table.createdAt),
    index("practice_session_status_idx").on(table.status),
  ],
);

export const practiceSessionItem = pgTable(
  "practice_session_item",
  {
    id: text("id").primaryKey().$defaultFn(createId),
    sessionId: text("sessionId")
      .notNull()
      .references(() => practiceSession.id, { onDelete: "cascade" }),
    questionId: text("questionId")
      .notNull()
      .references(() => question.id),
    position: integer("position").notNull(),
    questionCode: text("questionCode").notNull(),
    questionType: questionTypeEnum("questionType").notNull(),
    marks: integer("marks").default(1).notNull(),
    renderedBody: text("renderedBody").notNull(),
    renderedExplanation: text("renderedExplanation"),
    renderedAnswerText: text("renderedAnswerText"),
    renderedOptions: json("renderedOptions"),
    variableContext: json("variableContext"),
    submittedAnswer: text("submittedAnswer"),
    isCorrect: boolean("isCorrect"),
    answeredAt: timestamp("answeredAt"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => [
    unique().on(table.sessionId, table.position),
    index("practice_session_item_session_idx").on(table.sessionId),
    index("practice_session_item_question_idx").on(table.questionId),
    check(
      "practice_session_item_marks_allowed_ck",
      sql`${table.marks} in (1, 2, 3, 5, 10)`,
    ),
  ],
);

export const brandAsset = pgTable(
  "brand_asset",
  {
    id: text("id").primaryKey().$defaultFn(createId),
    userId: text("userId")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    label: text("label").notNull(),
    imageDataUrl: text("imageDataUrl").notNull(),
    isPrimary: boolean("isPrimary").default(false).notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [index("brand_asset_user_created_idx").on(table.userId, table.createdAt)],
);

export const questionPaper = pgTable(
  "question_paper",
  {
    id: text("id").primaryKey().$defaultFn(createId),
    userId: text("userId")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    brandAssetId: text("brandAssetId").references(() => brandAsset.id),
    title: text("title").notNull(),
    instructions: text("instructions"),
    schoolName: text("schoolName"),
    academicYear: text("academicYear"),
    status: questionPaperStatusEnum("status").default("draft").notNull(),
    includeAnswerKey: boolean("includeAnswerKey").default(false).notNull(),
    gradeId: text("gradeId").references(() => grade.id),
    subjectId: text("subjectId").references(() => subject.id),
    chapterId: text("chapterId").references(() => chapter.id),
    subChapterId: text("subChapterId").references(() => subChapter.id),
    totalQuestions: integer("totalQuestions").default(0).notNull(),
    totalMarks: integer("totalMarks").default(0).notNull(),
    exportedAt: timestamp("exportedAt"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("question_paper_user_created_idx").on(table.userId, table.createdAt),
    index("question_paper_brand_idx").on(table.brandAssetId),
    index("question_paper_status_idx").on(table.status),
    index("question_paper_exported_idx").on(table.exportedAt),
  ],
);

export const questionPaperItem = pgTable(
  "question_paper_item",
  {
    id: text("id").primaryKey().$defaultFn(createId),
    paperId: text("paperId")
      .notNull()
      .references(() => questionPaper.id, { onDelete: "cascade" }),
    questionId: text("questionId")
      .notNull()
      .references(() => question.id),
    position: integer("position").notNull(),
    questionCode: text("questionCode").notNull(),
    questionType: questionTypeEnum("questionType").notNull(),
    marks: integer("marks").default(1).notNull(),
    renderedBody: text("renderedBody").notNull(),
    renderedAnswerText: text("renderedAnswerText"),
    renderedOptions: json("renderedOptions"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => [
    unique().on(table.paperId, table.position),
    index("question_paper_item_paper_idx").on(table.paperId),
    index("question_paper_item_question_idx").on(table.questionId),
    check(
      "question_paper_item_marks_allowed_ck",
      sql`${table.marks} in (1, 2, 3, 5, 10)`,
    ),
  ],
);

export const plan = pgTable("plan", {
  id: text("id").primaryKey().$defaultFn(createId),
  code: planCodeEnum("code").notNull().unique(),
  name: text("name").notNull(),
  description: text("description"),
  deviceLimit: integer("deviceLimit").default(1).notNull(),
  maxQuestionsPerPractice: integer("maxQuestionsPerPractice"),
  maxQuestionsPerPaper: integer("maxQuestionsPerPaper"),
  monthlyPdfExportLimit: integer("monthlyPdfExportLimit"),
  monthlyPaperGenerationLimit: integer("monthlyPaperGenerationLimit"),
  monthlyPaperSwapLimit: integer("monthlyPaperSwapLimit"),
  chatEnabled: boolean("chatEnabled").default(false).notNull(),
  generatorEnabled: boolean("generatorEnabled").default(true).notNull(),
  brandingLogoLimit: integer("brandingLogoLimit").default(0).notNull(),
  offlineDrmEnabled: boolean("offlineDrmEnabled").default(false).notNull(),
  screenshotBlockEnabled: boolean("screenshotBlockEnabled")
    .default(false)
    .notNull(),
  printAllowed: boolean("printAllowed").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt")
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

export const subscription = pgTable(
  "subscription",
  {
    id: text("id").primaryKey().$defaultFn(createId),
    userId: text("userId")
      .notNull()
      .unique()
      .references(() => user.id, { onDelete: "cascade" }),
    planId: text("planId")
      .notNull()
      .references(() => plan.id),
    status: subscriptionStatusEnum("status").default("active").notNull(),
    billingCycle: billingCycleEnum("billingCycle").default("monthly").notNull(),
    startsAt: timestamp("startsAt").defaultNow().notNull(),
    endsAt: timestamp("endsAt"),
    currentPeriodStart: timestamp("currentPeriodStart").defaultNow().notNull(),
    currentPeriodEnd: timestamp("currentPeriodEnd"),
    deviceLimitOverride: integer("deviceLimitOverride"),
    maxQuestionsPerPracticeOverride: integer("maxQuestionsPerPracticeOverride"),
    maxQuestionsPerPaperOverride: integer("maxQuestionsPerPaperOverride"),
    monthlyPdfExportLimitOverride: integer("monthlyPdfExportLimitOverride"),
    monthlyPaperGenerationLimitOverride: integer(
      "monthlyPaperGenerationLimitOverride",
    ),
    monthlyPaperSwapLimitOverride: integer("monthlyPaperSwapLimitOverride"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("subscription_plan_idx").on(table.planId),
    index("subscription_status_idx").on(table.status),
  ],
);

export const subscriptionRequest = pgTable(
  "subscription_request",
  {
    id: text("id").primaryKey().$defaultFn(createId),
    userId: text("userId")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    requestedPlanCode: planCodeEnum("requestedPlanCode").notNull(),
    status: subscriptionRequestStatusEnum("status").default("pending").notNull(),
    transactionId: text("transactionId"),
    paymentProofImageDataUrl: text("paymentProofImageDataUrl"),
    note: text("note"),
    adminNote: text("adminNote"),
    reviewedBy: text("reviewedBy").references(() => user.id),
    reviewedAt: timestamp("reviewedAt"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("subscription_request_user_status_created_idx").on(
      table.userId,
      table.status,
      table.createdAt,
    ),
    index("subscription_request_status_created_idx").on(
      table.status,
      table.createdAt,
    ),
    index("subscription_request_reviewedBy_idx").on(table.reviewedBy),
  ],
);

export const usageCounter = pgTable(
  "usage_counter",
  {
    id: text("id").primaryKey().$defaultFn(createId),
    subscriptionId: text("subscriptionId")
      .notNull()
      .references(() => subscription.id, { onDelete: "cascade" }),
    userId: text("userId")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    periodKey: text("periodKey").notNull(),
    pdfExportsUsed: integer("pdfExportsUsed").default(0).notNull(),
    paperGenerationsUsed: integer("paperGenerationsUsed").default(0).notNull(),
    paperSwapsUsed: integer("paperSwapsUsed").default(0).notNull(),
    chatMessagesUsed: integer("chatMessagesUsed").default(0).notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    unique().on(table.userId, table.periodKey),
    index("usage_counter_subscription_idx").on(table.subscriptionId),
  ],
);

export const deviceRegistration = pgTable(
  "device_registration",
  {
    id: text("id").primaryKey().$defaultFn(createId),
    subscriptionId: text("subscriptionId")
      .notNull()
      .references(() => subscription.id, { onDelete: "cascade" }),
    userId: text("userId")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    deviceKey: text("deviceKey").notNull(),
    deviceType: deviceTypeEnum("deviceType").default("unknown").notNull(),
    deviceLabel: text("deviceLabel"),
    userAgent: text("userAgent"),
    firstSeenAt: timestamp("firstSeenAt").defaultNow().notNull(),
    lastSeenAt: timestamp("lastSeenAt").defaultNow().notNull(),
    revokedAt: timestamp("revokedAt"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    unique().on(table.userId, table.deviceKey),
    index("device_registration_subscription_revoked_idx").on(
      table.subscriptionId,
      table.revokedAt,
    ),
  ],
);

export const pushRegistration = pgTable(
  "push_registration",
  {
    id: text("id").primaryKey().$defaultFn(createId),
    userId: text("userId")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    installationId: text("installationId").notNull(),
    provider: pushProviderEnum("provider").default("expo").notNull(),
    platform: pushPlatformEnum("platform").notNull(),
    pushToken: text("pushToken").notNull(),
    deviceLabel: text("deviceLabel"),
    lastSeenAt: timestamp("lastSeenAt").defaultNow().notNull(),
    revokedAt: timestamp("revokedAt"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    unique().on(table.installationId),
    index("push_registration_user_revoked_idx").on(table.userId, table.revokedAt),
    index("push_registration_token_idx").on(table.pushToken),
  ],
);

export const supportConversation = pgTable(
  "support_conversation",
  {
    id: text("id").primaryKey().$defaultFn(createId),
    userId: text("userId")
      .notNull()
      .unique()
      .references(() => user.id, { onDelete: "cascade" }),
    subject: text("subject"),
    status: supportConversationStatusEnum("status").default("open").notNull(),
    allowUserReplies: boolean("allowUserReplies").default(true).notNull(),
    lastMessagePreview: text("lastMessagePreview"),
    lastMessageAt: timestamp("lastMessageAt"),
    unreadForAdminCount: integer("unreadForAdminCount").default(0).notNull(),
    unreadForUserCount: integer("unreadForUserCount").default(0).notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("support_conversation_status_last_message_idx").on(
      table.status,
      table.lastMessageAt,
    ),
    index("support_conversation_user_idx").on(table.userId),
  ],
);

export const supportMessage = pgTable(
  "support_message",
  {
    id: text("id").primaryKey().$defaultFn(createId),
    conversationId: text("conversationId")
      .notNull()
      .references(() => supportConversation.id, { onDelete: "cascade" }),
    senderRole: supportMessageSenderRoleEnum("senderRole").notNull(),
    senderUserId: text("senderUserId").references(() => user.id, {
      onDelete: "set null",
    }),
    body: text("body").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => [
    index("support_message_conversation_created_idx").on(
      table.conversationId,
      table.createdAt,
    ),
    index("support_message_sender_idx").on(table.senderUserId),
  ],
);

export const auditLog = pgTable(
  "audit_log",
  {
    id: text("id").primaryKey().$defaultFn(createId),
    action: text("action").notNull(),
    entityType: text("entityType"),
    entityId: text("entityId"),
    actorUserId: text("actorUserId"),
    ipAddress: text("ipAddress"),
    userAgent: text("userAgent"),
    metadata: json("metadata"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => [
    index("audit_log_actor_idx").on(table.actorUserId),
    index("audit_log_action_idx").on(table.action),
  ],
);

export const gradeRelations = relations(grade, ({ many }) => ({
  gradeSubjects: many(gradeSubject),
  chapters: many(chapter),
  questions: many(question),
}));

export const subjectRelations = relations(subject, ({ many }) => ({
  gradeSubjects: many(gradeSubject),
  chapters: many(chapter),
  questions: many(question),
}));

export const gradeSubjectRelations = relations(gradeSubject, ({ one }) => ({
  grade: one(grade, {
    fields: [gradeSubject.gradeId],
    references: [grade.id],
  }),
  subject: one(subject, {
    fields: [gradeSubject.subjectId],
    references: [subject.id],
  }),
}));

export const chapterRelations = relations(chapter, ({ one, many }) => ({
  grade: one(grade, {
    fields: [chapter.gradeId],
    references: [grade.id],
  }),
  subject: one(subject, {
    fields: [chapter.subjectId],
    references: [subject.id],
  }),
  subChapters: many(subChapter),
  questions: many(question),
}));

export const subChapterRelations = relations(subChapter, ({ one, many }) => ({
  chapter: one(chapter, {
    fields: [subChapter.chapterId],
    references: [chapter.id],
  }),
  questions: many(question),
}));

export const questionRelations = relations(question, ({ one, many }) => ({
  grade: one(grade, { fields: [question.gradeId], references: [grade.id] }),
  subject: one(subject, {
    fields: [question.subjectId],
    references: [subject.id],
  }),
  chapter: one(chapter, {
    fields: [question.chapterId],
    references: [chapter.id],
  }),
  subChapter: one(subChapter, {
    fields: [question.subChapterId],
    references: [subChapter.id],
  }),
  creator: one(user, {
    fields: [question.createdBy],
    references: [user.id],
    relationName: "QuestionCreator",
  }),
  reviewer: one(user, {
    fields: [question.reviewedBy],
    references: [user.id],
    relationName: "QuestionReviewer",
  }),
  options: many(questionOption),
}));

export const questionOptionRelations = relations(questionOption, ({ one }) => ({
  question: one(question, {
    fields: [questionOption.questionId],
    references: [question.id],
  }),
}));

export const practiceSessionRelations = relations(practiceSession, ({ one, many }) => ({
  user: one(user, { fields: [practiceSession.userId], references: [user.id] }),
  grade: one(grade, { fields: [practiceSession.gradeId], references: [grade.id] }),
  subject: one(subject, {
    fields: [practiceSession.subjectId],
    references: [subject.id],
  }),
  chapter: one(chapter, {
    fields: [practiceSession.chapterId],
    references: [chapter.id],
  }),
  subChapter: one(subChapter, {
    fields: [practiceSession.subChapterId],
    references: [subChapter.id],
  }),
  items: many(practiceSessionItem),
}));

export const practiceSessionItemRelations = relations(
  practiceSessionItem,
  ({ one }) => ({
    session: one(practiceSession, {
      fields: [practiceSessionItem.sessionId],
      references: [practiceSession.id],
    }),
    question: one(question, {
      fields: [practiceSessionItem.questionId],
      references: [question.id],
    }),
  }),
);

export const brandAssetRelations = relations(brandAsset, ({ one, many }) => ({
  user: one(user, { fields: [brandAsset.userId], references: [user.id] }),
  questionPapers: many(questionPaper),
}));

export const questionPaperRelations = relations(questionPaper, ({ one, many }) => ({
  user: one(user, { fields: [questionPaper.userId], references: [user.id] }),
  brandAsset: one(brandAsset, {
    fields: [questionPaper.brandAssetId],
    references: [brandAsset.id],
  }),
  grade: one(grade, { fields: [questionPaper.gradeId], references: [grade.id] }),
  subject: one(subject, {
    fields: [questionPaper.subjectId],
    references: [subject.id],
  }),
  chapter: one(chapter, {
    fields: [questionPaper.chapterId],
    references: [chapter.id],
  }),
  subChapter: one(subChapter, {
    fields: [questionPaper.subChapterId],
    references: [subChapter.id],
  }),
  items: many(questionPaperItem),
}));

export const questionPaperItemRelations = relations(questionPaperItem, ({ one }) => ({
  paper: one(questionPaper, {
    fields: [questionPaperItem.paperId],
    references: [questionPaper.id],
  }),
  question: one(question, {
    fields: [questionPaperItem.questionId],
    references: [question.id],
  }),
}));

export const planRelations = relations(plan, ({ many }) => ({
  subscriptions: many(subscription),
}));

export const subscriptionRelations = relations(subscription, ({ one, many }) => ({
  user: one(user, { fields: [subscription.userId], references: [user.id] }),
  plan: one(plan, { fields: [subscription.planId], references: [plan.id] }),
  usageCounters: many(usageCounter),
  deviceRegistrations: many(deviceRegistration),
}));

export const subscriptionRequestRelations = relations(
  subscriptionRequest,
  ({ one }) => ({
    user: one(user, {
      fields: [subscriptionRequest.userId],
      references: [user.id],
      relationName: "SubscriptionRequestUser",
    }),
    reviewer: one(user, {
      fields: [subscriptionRequest.reviewedBy],
      references: [user.id],
      relationName: "SubscriptionRequestReviewer",
    }),
  }),
);

export const usageCounterRelations = relations(usageCounter, ({ one }) => ({
  subscription: one(subscription, {
    fields: [usageCounter.subscriptionId],
    references: [subscription.id],
  }),
  user: one(user, { fields: [usageCounter.userId], references: [user.id] }),
}));

export const deviceRegistrationRelations = relations(
  deviceRegistration,
  ({ one }) => ({
    subscription: one(subscription, {
      fields: [deviceRegistration.subscriptionId],
      references: [subscription.id],
    }),
    user: one(user, {
      fields: [deviceRegistration.userId],
      references: [user.id],
    }),
  }),
);

export const pushRegistrationRelations = relations(pushRegistration, ({ one }) => ({
  user: one(user, {
    fields: [pushRegistration.userId],
    references: [user.id],
  }),
}));

export const supportConversationRelations = relations(
  supportConversation,
  ({ one, many }) => ({
    user: one(user, {
      fields: [supportConversation.userId],
      references: [user.id],
    }),
    messages: many(supportMessage),
  }),
);

export const supportMessageRelations = relations(supportMessage, ({ one }) => ({
  conversation: one(supportConversation, {
    fields: [supportMessage.conversationId],
    references: [supportConversation.id],
  }),
  senderUser: one(user, {
    fields: [supportMessage.senderUserId],
    references: [user.id],
  }),
}));
