import { SymbolView } from "expo-symbols";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

type MiniHelpHintProps = {
  title?: string;
  hint: string;
  icon?: React.ComponentProps<typeof SymbolView>["name"];
};

export const MiniHelpHint = ({
  title = "Tip",
  hint,
  icon = { ios: "lightbulb.fill", android: "lightbulb", web: "lightbulb" },
}: MiniHelpHintProps) => (
  <View style={styles.card}>
    <View style={styles.iconWrap}>
      <SymbolView name={icon} size={14} tintColor="#B45309" />
    </View>
    <View style={styles.textWrap}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.hint}>{hint}</Text>
    </View>
  </View>
);

const styles = StyleSheet.create({
  card: {
    alignItems: "flex-start",
    backgroundColor: "#FFF7ED",
    borderColor: "#FED7AA",
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: "row",
    gap: 10,
    padding: 12,
  },
  iconWrap: {
    alignItems: "center",
    backgroundColor: "#FFEDD5",
    borderRadius: 999,
    height: 28,
    justifyContent: "center",
    width: 28,
  },
  textWrap: {
    flex: 1,
    gap: 2,
  },
  title: {
    color: "#9A3412",
    fontSize: 12,
    fontWeight: "800",
    textTransform: "uppercase",
  },
  hint: {
    color: "#9A3412",
    fontSize: 13,
    lineHeight: 18,
  },
});
