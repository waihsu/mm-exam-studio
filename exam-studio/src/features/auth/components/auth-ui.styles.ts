import { StyleSheet } from "react-native";

export const authUiStyles = StyleSheet.create({
  sectionKicker: {
    color: "#0F172A",
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  sectionTitle: {
    color: "#0F172A",
    fontSize: 26,
    fontWeight: "800",
    letterSpacing: -0.5,
    lineHeight: 31,
  },
  sectionDescription: {
    color: "#475569",
    fontSize: 14,
    lineHeight: 21,
  },
  sectionHeader: { gap: 6 },
  actionStack: { gap: 12 },
  splitRow: { flexDirection: "row", gap: 10 },
  splitColumn: { flex: 1 },
  caption: {
    color: "#64748B",
    fontSize: 13,
    lineHeight: 19,
    textAlign: "center",
  },
  textLink: { alignSelf: "center" },
  textLinkLabel: {
    color: "#0F172A",
    fontSize: 14,
    fontWeight: "700",
  },
});
