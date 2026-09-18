import React, { useEffect } from "react";
import { Animated, Easing, StyleSheet, View } from "react-native";

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

export const PaperTemplateDetailLoadingState = () => {
  const pulse = React.useRef(new Animated.Value(0.4)).current;

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
          toValue: 0.4,
          useNativeDriver: true,
        }),
      ])
    );

    loop.start();
    return () => loop.stop();
  }, [pulse]);

  return (
    <>
      <View style={styles.card}>
        <View style={styles.headerRow}>
          <SkeletonBlock animatedValue={pulse} style={styles.title} />
          <SkeletonBlock animatedValue={pulse} style={styles.pill} />
        </View>
        <SkeletonBlock animatedValue={pulse} style={styles.meta} />
        <View style={styles.metricRow}>
          {[0, 1, 2].map(index => (
            <MetricSkeleton
              key={`template-metric-${index}`}
              animatedValue={pulse}
            />
          ))}
        </View>
        <SkeletonBlock animatedValue={pulse} style={styles.metaWide} />
      </View>

      <View style={styles.card}>
        <SkeletonBlock animatedValue={pulse} style={styles.sectionHeading} />
        <View style={styles.difficultyGrid}>
          {[0, 1, 2, 3].map(index => (
            <DifficultySkeleton
              key={`difficulty-${index}`}
              animatedValue={pulse}
            />
          ))}
        </View>
      </View>

      <View style={styles.card}>
        <SkeletonBlock animatedValue={pulse} style={styles.sectionHeading} />
        {[0, 1, 2].map(index => (
          <View key={`section-${index}`} style={styles.listRow}>
            <SkeletonBlock animatedValue={pulse} style={styles.badge} />
            <View style={styles.listBody}>
              <SkeletonBlock animatedValue={pulse} style={styles.lineStrong} />
              <SkeletonBlock animatedValue={pulse} style={styles.lineSoft} />
            </View>
          </View>
        ))}
      </View>

      <View style={styles.card}>
        <SkeletonBlock animatedValue={pulse} style={styles.sectionHeading} />
        <SkeletonBlock animatedValue={pulse} style={styles.inputLabel} />
        <SkeletonBlock animatedValue={pulse} style={styles.input} />
        <SkeletonBlock animatedValue={pulse} style={styles.button} />
      </View>
    </>
  );
};

const MetricSkeleton = ({
  animatedValue,
}: {
  animatedValue: Animated.Value;
}) => (
  <View style={styles.metricChip}>
    <SkeletonBlock animatedValue={animatedValue} style={styles.metricLabel} />
    <SkeletonBlock animatedValue={animatedValue} style={styles.metricValue} />
  </View>
);

const DifficultySkeleton = ({
  animatedValue,
}: {
  animatedValue: Animated.Value;
}) => (
  <View style={styles.difficultyChip}>
    <SkeletonBlock
      animatedValue={animatedValue}
      style={styles.difficultyLabel}
    />
    <SkeletonBlock
      animatedValue={animatedValue}
      style={styles.difficultyValue}
    />
  </View>
);

const styles = StyleSheet.create({
  skeletonBlock: { backgroundColor: "#DDEBE4", borderRadius: 999 },
  card: {
    backgroundColor: "#FFFDF8",
    borderColor: "#D8D4C9",
    borderRadius: 24,
    borderWidth: 1,
    gap: 14,
    padding: 18,
  },
  headerRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  title: { height: 20, width: "52%" },
  pill: { height: 28, width: 88 },
  meta: { height: 12, width: "46%" },
  metaWide: { height: 12, width: "68%" },
  metricRow: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  metricChip: {
    backgroundColor: "#F8F5EE",
    borderColor: "#D8D4C9",
    borderRadius: 16,
    borderWidth: 1,
    flex: 1,
    gap: 10,
    minHeight: 68,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  metricLabel: { height: 10, width: "58%" },
  metricValue: { height: 18, width: "38%" },
  sectionHeading: { height: 16, width: "34%" },
  difficultyGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  difficultyChip: {
    backgroundColor: "#F8F5EE",
    borderColor: "#D8D4C9",
    borderRadius: 16,
    borderWidth: 1,
    gap: 10,
    minWidth: 136,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  difficultyLabel: { height: 10, width: "62%" },
  difficultyValue: { height: 15, width: "44%" },
  listRow: { alignItems: "flex-start", flexDirection: "row", gap: 12 },
  badge: { borderRadius: 12, height: 42, width: 42 },
  listBody: { flex: 1, gap: 8 },
  lineStrong: { height: 14, width: "56%" },
  lineSoft: { height: 12, width: "78%" },
  inputLabel: { height: 10, width: "24%" },
  input: { borderRadius: 16, height: 52, width: "100%" },
  button: { borderRadius: 16, height: 48, width: "100%" },
});
