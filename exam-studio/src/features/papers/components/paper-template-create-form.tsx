import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { InlineErrorState } from "@/components/ui/state-blocks";
import { useTranslation } from "@/i18n";

type PaperTemplateCreateFormProps = {
  error: string | null;
  isPending: boolean;
  title: string;
  onCreate: () => void;
  onTitleChange: (value: string) => void;
};

export const PaperTemplateCreateForm = ({
  error,
  isPending,
  title,
  onCreate,
  onTitleChange,
}: PaperTemplateCreateFormProps) => {
  const { t } = useTranslation(["papers", "common"]);
  const disabled = isPending || !title.trim();

  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>{t("papers:templates.useTitle")}</Text>
      <View style={styles.formGroup}>
        <Text style={styles.label}>{t("papers:home.paperTitle")}</Text>
        <TextInput
          placeholder={t("papers:home.paperTitlePlaceholder")}
          placeholderTextColor="#94A3B8"
          style={styles.input}
          value={title}
          onChangeText={onTitleChange}
        />
      </View>
      {error ? <InlineErrorState message={error} /> : null}
      <Pressable
        disabled={disabled}
        style={({ pressed }) => [
          styles.primaryButton,
          disabled && styles.buttonDisabled,
          pressed && !disabled && styles.buttonPressed,
        ]}
        onPress={onCreate}
      >
        <Text style={styles.primaryButtonLabel}>
          {isPending
            ? t("papers:templates.creating")
            : t("papers:home.useTemplate")}
        </Text>
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#FFFFFF",
    borderColor: "#E2E8F0",
    borderRadius: 24,
    borderWidth: 1,
    gap: 14,
    padding: 18,
  },
  cardTitle: { color: "#111827", fontSize: 20, fontWeight: "700" },
  formGroup: { gap: 8 },
  label: { color: "#0F172A", fontSize: 14, fontWeight: "600" },
  input: {
    backgroundColor: "#FFFFFF",
    borderColor: "#CBD5E1",
    borderRadius: 16,
    borderWidth: 1,
    color: "#111827",
    fontSize: 16,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  primaryButton: {
    alignItems: "center",
    backgroundColor: "#2563EB",
    borderRadius: 16,
    justifyContent: "center",
    minHeight: 48,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  primaryButtonLabel: { color: "#FFFFFF", fontSize: 15, fontWeight: "700" },
  buttonPressed: { opacity: 0.85 },
  buttonDisabled: { opacity: 0.5 },
});
