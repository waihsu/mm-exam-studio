import React, { useEffect } from "react";
import {
  Animated,
  Easing,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

type PracticeSessionLoadingStateProps = {
  title: string;
};

type SkeletonBlockProps = {
  animatedValue: Animated.Value;
  style?: object;
};

const SkeletonBlock = ({ animatedValue, style }: SkeletonBlockProps) => (
  <Animated.View style={[styles.skeleton, style, { opacity: animatedValue }]} />
);

export function PracticeSessionLoadingState({
  title,
}: PracticeSessionLoadingStateProps) {
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
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.headerCard}>
        <SkeletonBlock animatedValue={pulse} style={styles.backLink} />
        <Text style={styles.title}>{title}</Text>
        <SkeletonBlock animatedValue={pulse} style={styles.heading} />
        <SkeletonBlock animatedValue={pulse} style={styles.metaLine} />
        <View style={styles.headerStatsRow}>
          {[0, 1, 2, 3].map(index => (
            <SkeletonBlock
              key={index}
              animatedValue={pulse}
              style={styles.statPill}
            />
          ))}
        </View>
      </View>

      <View style={styles.navigatorCard}>
        <View style={styles.navigatorHeader}>
          <SkeletonBlock animatedValue={pulse} style={styles.navigatorTitle} />
          <SkeletonBlock animatedValue={pulse} style={styles.navigatorMeta} />
        </View>
        <View style={styles.navigatorRow}>
          {Array.from({ length: 8 }).map((_, index) => (
            <SkeletonBlock
              key={index}
              animatedValue={pulse}
              style={styles.navigatorChip}
            />
          ))}
        </View>
      </View>

      <View style={styles.questionCard}>
        <View style={styles.questionHeader}>
          <SkeletonBlock animatedValue={pulse} style={styles.questionLabel} />
          <View style={styles.questionMetaRow}>
            <SkeletonBlock animatedValue={pulse} style={styles.metaBadge} />
            <SkeletonBlock animatedValue={pulse} style={styles.metaBadge} />
          </View>
        </View>
        <SkeletonBlock animatedValue={pulse} style={styles.lineStrong} />
        <SkeletonBlock animatedValue={pulse} style={styles.lineWide} />
        <SkeletonBlock animatedValue={pulse} style={styles.lineMedium} />
        {[0, 1, 2, 3].map(index => (
          <SkeletonBlock
            key={index}
            animatedValue={pulse}
            style={styles.option}
          />
        ))}
      </View>

      <View style={styles.footerCard}>
        <SkeletonBlock animatedValue={pulse} style={styles.button} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { gap: 12, paddingBottom: 20 },
  skeleton: { backgroundColor: "#DDEBE4", borderRadius: 999 },
  title: { color: "#48766B", fontSize: 13, fontWeight: "800" },
  headerCard: {
    backgroundColor: "#FFFDF8",
    borderColor: "#D8D4C9",
    borderRadius: 16,
    borderWidth: 1,
    gap: 10,
    padding: 14,
  },
  backLink: { height: 14, width: 118 },
  heading: { height: 24, width: "62%" },
  metaLine: { height: 12, width: "48%" },
  headerStatsRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  statPill: { height: 30, width: 94 },
  navigatorCard: {
    backgroundColor: "#FFFDF8",
    borderColor: "#D8D4C9",
    borderRadius: 16,
    borderWidth: 1,
    gap: 8,
    padding: 12,
  },
  navigatorHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  navigatorTitle: { height: 13, width: 132 },
  navigatorMeta: { height: 12, width: 86 },
  navigatorRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  navigatorChip: { height: 34, width: 34 },
  questionCard: {
    backgroundColor: "#FFFDF8",
    borderColor: "#D8D4C9",
    borderRadius: 16,
    borderWidth: 1,
    gap: 10,
    padding: 14,
  },
  questionHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  questionLabel: { height: 16, width: 44 },
  questionMetaRow: { flexDirection: "row", gap: 6 },
  metaBadge: { height: 24, width: 84 },
  lineStrong: { height: 14, width: "74%" },
  lineWide: { height: 14, width: "92%" },
  lineMedium: { height: 14, width: "66%" },
  option: { borderRadius: 12, height: 54, width: "100%" },
  footerCard: {
    backgroundColor: "#FFFDF8",
    borderColor: "#D8D4C9",
    borderRadius: 16,
    borderWidth: 1,
    padding: 12,
  },
  button: { borderRadius: 12, height: 46, width: "100%" },
});
