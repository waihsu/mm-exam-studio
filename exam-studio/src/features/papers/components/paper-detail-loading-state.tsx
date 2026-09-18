import React, { useEffect } from "react";
import {
  Animated,
  Easing,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

type PaperDetailLoadingStateProps = {
  title: string;
};

const SkeletonBlock = ({
  animatedValue,
  style,
}: {
  animatedValue: Animated.Value;
  style?: object;
}) => (
  <Animated.View
    style={[styles.skeletonBlock, style, { opacity: animatedValue }]}
  />
);

export const PaperDetailLoadingState = ({
  title,
}: PaperDetailLoadingStateProps) => {
  const pulse = React.useRef(new Animated.Value(0.42)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          duration: 900,
          easing: Easing.inOut(Easing.ease),
          toValue: 1,
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          duration: 900,
          easing: Easing.inOut(Easing.ease),
          toValue: 0.42,
          useNativeDriver: true,
        }),
      ])
    );

    loop.start();
    return () => loop.stop();
  }, [pulse]);

  return (
    <ScrollView
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.heroCard}>
        <View style={styles.heroTopRow}>
          <SkeletonBlock animatedValue={pulse} style={styles.backPill} />
          <SkeletonBlock animatedValue={pulse} style={styles.statusPill} />
        </View>
        <Text style={styles.heroLabel}>{title}</Text>
        <View style={styles.heroCopy}>
          <SkeletonBlock animatedValue={pulse} style={styles.lineStrong} />
          <SkeletonBlock animatedValue={pulse} style={styles.lineMedium} />
        </View>
        <View style={styles.metricsRow}>
          <MetricSkeleton animatedValue={pulse} />
          <MetricSkeleton animatedValue={pulse} />
          <MetricSkeleton animatedValue={pulse} wide />
        </View>
      </View>

      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <SkeletonBlock animatedValue={pulse} style={styles.sectionTitle} />
          <SkeletonBlock animatedValue={pulse} style={styles.tinyPill} />
        </View>
        <SkeletonBlock animatedValue={pulse} style={styles.lineStrong} />
        <View style={styles.buttonRow}>
          <SkeletonBlock animatedValue={pulse} style={styles.primaryButton} />
          <SkeletonBlock animatedValue={pulse} style={styles.secondaryButton} />
        </View>
      </View>

      <View style={styles.card}>
        <SkeletonBlock animatedValue={pulse} style={styles.sectionTitle} />
        <View style={styles.formGrid}>
          <FormFieldSkeleton animatedValue={pulse} />
          <FormFieldSkeleton animatedValue={pulse} />
        </View>
        <View style={styles.formField}>
          <SkeletonBlock animatedValue={pulse} style={styles.inputLabelWide} />
          <SkeletonBlock animatedValue={pulse} style={styles.textarea} />
        </View>
      </View>

      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <SkeletonBlock animatedValue={pulse} style={styles.sectionTitle} />
          <SkeletonBlock animatedValue={pulse} style={styles.tinyPillWide} />
        </View>
        {[0, 1, 2].map(itemIndex => (
          <View
            key={`loading-question-${itemIndex}`}
            style={styles.questionCard}
          >
            <View style={styles.questionHeader}>
              <SkeletonBlock
                animatedValue={pulse}
                style={styles.questionTitle}
              />
              <SkeletonBlock
                animatedValue={pulse}
                style={styles.questionChip}
              />
            </View>
            <SkeletonBlock animatedValue={pulse} style={styles.lineStrong} />
            <SkeletonBlock animatedValue={pulse} style={styles.lineWide} />
            <View style={styles.buttonRow}>
              <SkeletonBlock animatedValue={pulse} style={styles.actionChip} />
              <SkeletonBlock animatedValue={pulse} style={styles.actionChip} />
              <SkeletonBlock animatedValue={pulse} style={styles.actionChip} />
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );
};

const MetricSkeleton = ({
  animatedValue,
  wide = false,
}: {
  animatedValue: Animated.Value;
  wide?: boolean;
}) => (
  <View style={wide ? styles.metricCardWide : styles.metricCard}>
    <SkeletonBlock
      animatedValue={animatedValue}
      style={wide ? styles.metricLabelWide : styles.metricLabel}
    />
    <SkeletonBlock
      animatedValue={animatedValue}
      style={wide ? styles.metricValueWide : styles.metricValue}
    />
  </View>
);

const FormFieldSkeleton = ({
  animatedValue,
}: {
  animatedValue: Animated.Value;
}) => (
  <View style={styles.formField}>
    <SkeletonBlock animatedValue={animatedValue} style={styles.inputLabel} />
    <SkeletonBlock animatedValue={animatedValue} style={styles.input} />
  </View>
);

const styles = StyleSheet.create({
  scrollContent: { gap: 12, paddingBottom: 20 },
  heroCard: {
    backgroundColor: "#FFFDF8",
    borderColor: "#D8D4C9",
    borderRadius: 18,
    borderWidth: 1,
    gap: 14,
    overflow: "hidden",
    padding: 16,
  },
  heroTopRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  heroLabel: { color: "#48766B", fontSize: 13, fontWeight: "800" },
  heroCopy: { gap: 10 },
  skeletonBlock: { backgroundColor: "#DDEBE4", borderRadius: 999 },
  backPill: { height: 38, width: 92 },
  statusPill: { height: 28, width: 88 },
  lineStrong: { height: 16, width: "72%" },
  lineMedium: { height: 12, width: "54%" },
  lineWide: { height: 12, width: "92%" },
  metricsRow: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  metricCard: {
    backgroundColor: "#F8F5EE",
    borderColor: "#D8D4C9",
    borderRadius: 12,
    borderWidth: 1,
    flex: 1,
    gap: 10,
    minWidth: 96,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  metricCardWide: {
    backgroundColor: "#F8F5EE",
    borderColor: "#D8D4C9",
    borderRadius: 12,
    borderWidth: 1,
    flex: 1.4,
    gap: 10,
    minWidth: 150,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  metricLabel: { height: 10, width: "58%" },
  metricLabelWide: { height: 10, width: "42%" },
  metricValue: { height: 18, width: "44%" },
  metricValueWide: { height: 14, width: "74%" },
  card: {
    backgroundColor: "#FFFDF8",
    borderColor: "#D8D4C9",
    borderRadius: 16,
    borderWidth: 1,
    gap: 12,
    padding: 14,
  },
  cardHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  sectionTitle: { height: 16, width: "38%" },
  tinyPill: { height: 24, width: 70 },
  tinyPillWide: { height: 24, width: 108 },
  buttonRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  primaryButton: { height: 42, width: 148 },
  secondaryButton: { height: 42, width: 112 },
  formGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  formField: { flex: 1, gap: 8, minWidth: 140 },
  inputLabel: { height: 10, width: "34%" },
  inputLabelWide: { height: 10, width: "22%" },
  input: { borderRadius: 12, height: 46, width: "100%" },
  textarea: { borderRadius: 14, height: 108, width: "100%" },
  questionCard: {
    backgroundColor: "#F8F5EE",
    borderColor: "#D8D4C9",
    borderRadius: 14,
    borderWidth: 1,
    gap: 10,
    padding: 12,
  },
  questionHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  questionTitle: { height: 14, width: "48%" },
  questionChip: { height: 24, width: 74 },
  actionChip: { height: 34, width: 84 },
});
