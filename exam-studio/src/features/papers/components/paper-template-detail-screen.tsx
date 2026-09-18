import { useRouter, type RelativePathString } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { PageStateCard } from "@/components/ui/state-blocks";
import { AppShell } from "@/features/app-shell/components/app-shell";
import { useTranslation } from "@/i18n";
import { PaperTemplateDetailLoadingState } from "./paper-template-detail-loading-state";
import { PaperTemplateDetailOverview } from "./paper-template-detail-overview";
import { PaperTemplateCreateForm } from "./paper-template-create-form";
import { useMaterializePaperTemplateMutation } from "../hooks/use-materialize-paper-template-mutation";
import { usePaperTemplateDetailQuery } from "../hooks/use-paper-template-detail-query";

type PaperTemplateDetailScreenProps = {
  templateId: string;
};

export const PaperTemplateDetailScreen = ({
  templateId,
}: PaperTemplateDetailScreenProps) => {
  const router = useRouter();
  const { t } = useTranslation(["papers", "common"]);
  const detailQuery = usePaperTemplateDetailQuery(templateId);
  const materializeMutation = useMaterializePaperTemplateMutation();
  const [title, setTitle] = useState("");
  const [actionError, setActionError] = useState<string | null>(null);

  const template = detailQuery.data;
  useEffect(() => {
    if (template && !title.trim()) {
      setTitle(template.title);
    }
  }, [template, title]);

  const scopeSummary = useMemo(() => {
    if (!template) return null;

    const chapterCount = template.presetConfig.chapterIds?.length ?? 0;
    const lessonCount = template.presetConfig.subChapterIds?.length ?? 0;

    if (chapterCount < 1 && lessonCount < 1) {
      return t("papers:templates.fullCurriculum");
    }

    return t("papers:templates.scopeSummary", {
      chapters: chapterCount,
      lessons: lessonCount,
    });
  }, [template, t]);

  const createFromTemplate = async () => {
    if (!template || !title.trim() || materializeMutation.isPending) {
      return;
    }

    setActionError(null);
    try {
      const created = await materializeMutation.mutateAsync({
        templateId: template.id,
        input: { title: title.trim() },
      });
      router.replace(`/papers/${created.id}` as RelativePathString);
    } catch (error) {
      setActionError(
        error instanceof Error ? error.message : t("papers:home.failedCreate")
      );
    }
  };

  return (
    <AppShell>
      <ScrollView
        alwaysBounceVertical
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerBlock}>
          <View style={styles.headerTopRow}>
            <Pressable
              style={({ pressed }) => [
                styles.backButton,
                pressed && styles.buttonPressed,
              ]}
              onPress={() => router.back()}
            >
              <Text style={styles.backButtonLabel}>
                {t("papers:templates.backToCatalog")}
              </Text>
            </Pressable>
          </View>
          <Text style={styles.heading}>
            {t("papers:templates.detailTitle")}
          </Text>
          <Text style={styles.subheading}>
            {t("papers:templates.detailSubtitle")}
          </Text>
        </View>

        {detailQuery.isLoading ? <PaperTemplateDetailLoadingState /> : null}

        {detailQuery.isError ? (
          <PageStateCard
            title={t("papers:templates.failedDetail")}
            hint={
              detailQuery.error instanceof Error
                ? detailQuery.error.message
                : t("papers:templates.failedDetail")
            }
            actionLabel={t("papers:templates.backToCatalog")}
            onAction={() => router.back()}
          />
        ) : null}

        {template ? (
          <>
            <PaperTemplateDetailOverview
              scopeSummary={scopeSummary}
              template={template}
            />

            <PaperTemplateCreateForm
              error={actionError}
              isPending={materializeMutation.isPending}
              title={title}
              onCreate={() => {
                void createFromTemplate();
              }}
              onTitleChange={setTitle}
            />
          </>
        ) : null}
      </ScrollView>
    </AppShell>
  );
};

const styles = StyleSheet.create({
  scrollContent: {
    gap: 16,
    paddingBottom: 20,
  },
  headerBlock: {
    gap: 8,
    marginTop: 8,
  },
  headerTopRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  backButton: {
    alignSelf: "flex-start",
    borderColor: "#CFC9BD",
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  backButtonLabel: {
    color: "#202321",
    fontSize: 13,
    fontWeight: "700",
  },
  heading: {
    color: "#202321",
    fontSize: 24,
    fontWeight: "800",
  },
  subheading: {
    color: "#6E706B",
    fontSize: 14,
    lineHeight: 20,
  },
  card: {
    backgroundColor: "#FFFDF8",
    borderColor: "#D8D4C9",
    borderRadius: 24,
    borderWidth: 1,
    gap: 14,
    padding: 18,
  },
  cardTitle: {
    color: "#202321",
    fontSize: 20,
    fontWeight: "700",
  },
  formGroup: {
    gap: 8,
  },
  label: {
    color: "#202321",
    fontSize: 14,
    fontWeight: "600",
  },
  input: {
    backgroundColor: "#FFFDF8",
    borderColor: "#CFC9BD",
    borderRadius: 16,
    borderWidth: 1,
    color: "#202321",
    fontSize: 16,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  primaryButton: {
    alignItems: "center",
    backgroundColor: "#D76F55",
    borderRadius: 16,
    justifyContent: "center",
    minHeight: 48,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  primaryButtonLabel: {
    color: "#FFFDF8",
    fontSize: 15,
    fontWeight: "700",
  },
  buttonPressed: {
    opacity: 0.85,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
});
