import { Pressable, StyleSheet, Text, View } from "react-native";
import { useTranslation } from "@/i18n";

type PaperDetailDangerZoneProps = {
  disabled: boolean;
  onDelete: () => void;
};

export const PaperDetailDangerZone = ({
  disabled,
  onDelete,
}: PaperDetailDangerZoneProps) => {
  const { t } = useTranslation("papers");

  return (
    <View style={styles.card}>
      <Text style={styles.title}>{t("detail.dangerZoneTitle")}</Text>
      <Text style={styles.hint}>{t("detail.deletePaperHint")}</Text>
      <Pressable
        disabled={disabled}
        style={({ pressed }) => [
          styles.deleteButton,
          disabled && styles.disabled,
          pressed && !disabled && styles.pressed,
        ]}
        onPress={onDelete}
      >
        <Text style={styles.deleteButtonLabel}>{t("detail.deletePaper")}</Text>
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#FFF7F7",
    borderColor: "#FECACA",
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
    padding: 14,
  },
  title: { color: "#991B1B", fontSize: 14, fontWeight: "800" },
  hint: { color: "#7F1D1D", fontSize: 12, lineHeight: 18 },
  deleteButton: {
    alignItems: "center",
    borderColor: "#FCA5A5",
    borderRadius: 10,
    borderWidth: 1,
    justifyContent: "center",
    minHeight: 42,
    paddingHorizontal: 14,
  },
  deleteButtonLabel: { color: "#B91C1C", fontSize: 13, fontWeight: "700" },
  disabled: { opacity: 0.5 },
  pressed: { opacity: 0.78 },
});
