import type { Dispatch, ReactNode, SetStateAction } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { useTranslation } from "@/i18n";
import type { QuestionPaperDetail } from "../types/papers.types";

type PaperDetailMetadataFormProps = {
  academicYear: string;
  hasActionPending: boolean;
  includeAnswerKey: boolean;
  instructions: string;
  isDraft: boolean;
  paper: QuestionPaperDetail;
  schoolName: string;
  title: string;
  setAcademicYear: (value: string) => void;
  setIncludeAnswerKey: Dispatch<SetStateAction<boolean>>;
  setInstructions: (value: string) => void;
  setSchoolName: (value: string) => void;
  setTitle: (value: string) => void;
};

export const PaperDetailMetadataForm = ({
  academicYear,
  hasActionPending,
  includeAnswerKey,
  instructions,
  isDraft,
  paper,
  schoolName,
  title,
  setAcademicYear,
  setIncludeAnswerKey,
  setInstructions,
  setSchoolName,
  setTitle,
}: PaperDetailMetadataFormProps) => {
  const { t } = useTranslation(["papers", "common"]);
  const editable = isDraft && !hasActionPending;

  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>{t("papers:detail.paperDetails")}</Text>
      <Text style={styles.hint}>
        {isDraft
          ? t("papers:detail.draftEditable")
          : t("papers:detail.finalizedReadonly")}
      </Text>

      <Field label={t("papers:detail.title")}>
        <TextInput
          editable={editable}
          placeholder={t("papers:detail.titlePlaceholder")}
          placeholderTextColor="#96938A"
          style={[styles.input, !isDraft && styles.inputDisabled]}
          value={title}
          onChangeText={setTitle}
        />
      </Field>

      <Field label={t("papers:detail.instructions")}>
        <TextInput
          editable={editable}
          multiline
          numberOfLines={4}
          placeholder={t("papers:detail.instructionsPlaceholder")}
          placeholderTextColor="#96938A"
          style={[
            styles.input,
            styles.multilineInput,
            !isDraft && styles.inputDisabled,
          ]}
          textAlignVertical="top"
          value={instructions}
          onChangeText={setInstructions}
        />
      </Field>

      <View style={styles.formRow}>
        <View style={styles.formHalf}>
          <Field label={t("papers:detail.schoolName")}>
            <TextInput
              editable={editable}
              placeholder={t("papers:detail.optional")}
              placeholderTextColor="#96938A"
              style={[styles.input, !isDraft && styles.inputDisabled]}
              value={schoolName}
              onChangeText={setSchoolName}
            />
          </Field>
        </View>
        <View style={styles.formHalf}>
          <Field label={t("papers:detail.academicYear")}>
            <TextInput
              editable={editable}
              placeholder="2025-2026"
              placeholderTextColor="#96938A"
              style={[styles.input, !isDraft && styles.inputDisabled]}
              value={academicYear}
              onChangeText={setAcademicYear}
            />
          </Field>
        </View>
      </View>

      <Pressable
        disabled={!isDraft || hasActionPending}
        style={({ pressed }) => [
          styles.checkboxRow,
          includeAnswerKey && styles.checkboxRowActive,
          (!isDraft || hasActionPending) && styles.buttonDisabled,
          pressed && isDraft && styles.buttonPressed,
        ]}
        onPress={() => setIncludeAnswerKey(value => !value)}
      >
        <Text style={styles.checkboxLabel}>
          {includeAnswerKey ? "✓ " : ""}
          {t("papers:home.includeAnswerKey")}
        </Text>
      </Pressable>

      <View style={styles.metaGrid}>
        <Text style={styles.metaText}>
          {t("papers:detail.grade", {
            value: paper.grade
              ? `${paper.grade.name} (${paper.grade.code})`
              : t("papers:detail.notSet"),
          })}
        </Text>
        <Text style={styles.metaText}>
          {t("papers:detail.subject", {
            value: paper.subject
              ? `${paper.subject.name} (${paper.subject.code})`
              : t("papers:detail.notSet"),
          })}
        </Text>
        <Text style={styles.metaText}>
          {t("papers:detail.chapter", {
            value: paper.chapter?.name ?? t("papers:detail.notSet"),
          })}
        </Text>
        <Text style={styles.metaText}>
          {t("papers:detail.subchapter", {
            value: paper.subChapter?.name ?? t("papers:detail.notSet"),
          })}
        </Text>
      </View>
    </View>
  );
};

const Field = ({ children, label }: { children: ReactNode; label: string }) => (
  <View style={styles.formGroup}>
    <Text style={styles.label}>{label}</Text>
    {children}
  </View>
);

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#FFFDF8",
    borderColor: "#D8D4C9",
    borderRadius: 12,
    borderWidth: 1,
    gap: 10,
    padding: 14,
  },
  cardTitle: { color: "#202321", fontSize: 16, fontWeight: "700" },
  hint: { color: "#6E706B", fontSize: 12 },
  formRow: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  formGroup: { gap: 6 },
  formHalf: { flex: 1, minWidth: 140 },
  label: { color: "#4F514B", fontSize: 13, fontWeight: "600" },
  input: {
    backgroundColor: "#F8F5EE",
    borderColor: "#CFC9BD",
    borderRadius: 10,
    borderWidth: 1,
    color: "#202321",
    fontSize: 14,
    minHeight: 44,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  multilineInput: { minHeight: 100 },
  inputDisabled: { color: "#6E706B" },
  checkboxRow: {
    alignItems: "center",
    borderColor: "#CFC9BD",
    borderRadius: 10,
    borderWidth: 1,
    minHeight: 42,
    paddingHorizontal: 12,
  },
  checkboxRowActive: { backgroundColor: "#E7EFE9", borderColor: "#A8C9BD" },
  checkboxLabel: { color: "#202321", fontSize: 13, fontWeight: "600" },
  metaGrid: { gap: 4 },
  metaText: { color: "#6E706B", fontSize: 12 },
  buttonDisabled: { opacity: 0.6 },
  buttonPressed: { opacity: 0.85 },
});
