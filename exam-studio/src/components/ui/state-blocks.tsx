import React from "react";
import {
  ActivityIndicator,
  Animated,
  Easing,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

export const InlineLoadingState = ({ label }: { label: string }) => (
  <View style={styles.loadingRow}>
    <ActivityIndicator color="#48766B" />
    <Text style={styles.metaText}>{label}</Text>
  </View>
);

export const InlineErrorState = ({ message }: { message: string }) => (
  <Text style={styles.errorText}>{message}</Text>
);

const SkeletonBar = ({
  animatedValue,
  style,
}: {
  animatedValue: Animated.Value;
  style?: object;
}) => <Animated.View style={[styles.skeletonBar, style, { opacity: animatedValue }]} />;

export const CardListSkeleton = ({
  count = 3,
}: {
  count?: number;
}) => {
  const pulse = React.useRef(new Animated.Value(0.38)).current;

  React.useEffect(() => {
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
          toValue: 0.38,
          useNativeDriver: true,
        }),
      ]),
    );

    loop.start();

    return () => {
      loop.stop();
    };
  }, [pulse]);

  return (
    <View style={styles.skeletonList}>
      {Array.from({ length: count }).map((_, index) => (
        <View key={`skeleton-card-${index}`} style={styles.skeletonCard}>
          <View style={styles.skeletonCardHeader}>
            <SkeletonBar animatedValue={pulse} style={styles.skeletonTitle} />
            <SkeletonBar animatedValue={pulse} style={styles.skeletonPill} />
          </View>
          <SkeletonBar animatedValue={pulse} style={styles.skeletonMeta} />
          <SkeletonBar animatedValue={pulse} style={styles.skeletonMetaWide} />
        </View>
      ))}
    </View>
  );
};

export const EmptyStateCard = ({
  title,
  hint,
  actionLabel,
  onAction,
}: {
  title: string;
  hint?: string | null;
  actionLabel?: string | null;
  onAction?: (() => void) | null;
}) => (
  <View style={styles.emptyStateBlock}>
    <Text style={styles.metaText}>{title}</Text>
    {hint ? <Text style={styles.metaMuted}>{hint}</Text> : null}
    {actionLabel && onAction ? (
      <Pressable
        style={({ pressed }) => [styles.secondaryButton, pressed && styles.buttonPressed]}
        onPress={onAction}
      >
        <Text style={styles.secondaryButtonLabel}>{actionLabel}</Text>
      </Pressable>
    ) : null}
  </View>
);

export const PageStateCard = ({
  title,
  hint,
  actionLabel,
  onAction,
  loading = false,
}: {
  title: string;
  hint?: string | null;
  actionLabel?: string | null;
  onAction?: (() => void) | null;
  loading?: boolean;
}) => (
  <View style={styles.pageStateWrap}>
    <View style={styles.pageStateCard}>
      {loading ? <ActivityIndicator color="#2563EB" /> : null}
      <Text style={styles.pageStateTitle}>{title}</Text>
      {hint ? <Text style={styles.pageStateHint}>{hint}</Text> : null}
      {actionLabel && onAction ? (
        <Pressable
          style={({ pressed }) => [styles.secondaryButton, pressed && styles.buttonPressed]}
          onPress={onAction}
        >
          <Text style={styles.secondaryButtonLabel}>{actionLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  </View>
);

const styles = StyleSheet.create({
  loadingRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
  },
  metaText: {
    color: "#4F514B",
    fontSize: 14,
    lineHeight: 20,
  },
  metaMuted: {
    color: "#6E706B",
    fontSize: 13,
    lineHeight: 20,
  },
  errorText: {
    color: "#B6473A",
    fontSize: 13,
    fontWeight: "600",
    lineHeight: 20,
  },
  emptyStateBlock: {
    alignItems: "flex-start",
    backgroundColor: "#F8F5EE",
    borderColor: "#D8D4C9",
    borderRadius: 14,
    borderWidth: 1,
    gap: 6,
    padding: 14,
  },
  pageStateWrap: {
    justifyContent: "center",
    minHeight: 240,
    paddingVertical: 24,
  },
  pageStateCard: {
    alignItems: "center",
    alignSelf: "stretch",
    backgroundColor: "#FFFDF8",
    borderColor: "#D8D4C9",
    borderRadius: 24,
    borderWidth: 1,
    gap: 10,
    paddingHorizontal: 18,
    paddingVertical: 24,
  },
  pageStateTitle: {
    color: "#202321",
    fontSize: 16,
    fontWeight: "700",
    textAlign: "center",
  },
  pageStateHint: {
    color: "#6E706B",
    fontSize: 13,
    lineHeight: 20,
    textAlign: "center",
  },
  skeletonBar: {
    backgroundColor: "#DDEBE4",
    borderRadius: 999,
  },
  skeletonList: {
    gap: 10,
  },
  skeletonCard: {
    backgroundColor: "#F8F5EE",
    borderColor: "#D8D4C9",
    borderRadius: 16,
    borderWidth: 1,
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  skeletonCardHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  skeletonTitle: {
    height: 14,
    width: "46%",
  },
  skeletonPill: {
    height: 24,
    width: 82,
  },
  skeletonMeta: {
    height: 11,
    width: "58%",
  },
  skeletonMetaWide: {
    height: 11,
    width: "82%",
  },
  secondaryButton: {
    alignItems: "center",
    backgroundColor: "#FFFDF8",
    borderColor: "#CFC9BD",
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: "center",
    minHeight: 42,
    paddingHorizontal: 14,
  },
  secondaryButtonLabel: {
    color: "#4F514B",
    fontSize: 14,
    fontWeight: "700",
  },
  buttonPressed: {
    opacity: 0.85,
  },
});
