import { StyleSheet } from "react-native";

export const authUiStyles = StyleSheet.create({
  sectionKicker: {
    color: "#48766B",
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  sectionTitle: {
    color: "#202321",
    fontSize: 26,
    fontWeight: "800",
    letterSpacing: -0.5,
    lineHeight: 31,
  },
  sectionDescription: {
    color: "#4F514B",
    fontSize: 14,
    lineHeight: 21,
  },
  sectionHeader: { gap: 6 },
  actionStack: { gap: 12 },
  splitRow: { flexDirection: "row", gap: 10 },
  splitColumn: { flex: 1 },
  caption: {
    color: "#6E706B",
    fontSize: 13,
    lineHeight: 19,
    textAlign: "center",
  },
  textLink: { alignSelf: "center" },
  textLinkLabel: {
    color: "#48766B",
    fontSize: 14,
    fontWeight: "700",
  },
});
