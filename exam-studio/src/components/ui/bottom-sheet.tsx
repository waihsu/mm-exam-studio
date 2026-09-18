import React, { useCallback, useEffect, useMemo, useRef } from "react";
import {
  Animated,
  Modal,
  PanResponder,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type BottomSheetProps = {
  visible: boolean;
  title: string;
  subtitle?: string;
  actionLabel?: string;
  onClose: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
};

const CLOSE_DRAG_DISTANCE = 72;

export const BottomSheet = ({
  visible,
  title,
  subtitle,
  actionLabel = "Done",
  onClose,
  children,
  footer,
}: BottomSheetProps) => {
  const { height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const translateY = useRef(new Animated.Value(height)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      translateY.setValue(height);
      backdropOpacity.setValue(0);

      Animated.parallel([
        Animated.timing(translateY, {
          toValue: 0,
          duration: 220,
          useNativeDriver: true,
        }),
        Animated.timing(backdropOpacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
      return;
    }

    translateY.setValue(height);
    backdropOpacity.setValue(0);
  }, [backdropOpacity, height, translateY, visible]);

  const closeSheet = useCallback(() => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: height,
        duration: 180,
        useNativeDriver: true,
      }),
      Animated.timing(backdropOpacity, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start(({ finished }) => {
      if (finished) {
        onClose();
      }
    });
  }, [backdropOpacity, height, onClose, translateY]);

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, gestureState) =>
          Math.abs(gestureState.dy) > Math.abs(gestureState.dx) && gestureState.dy > 6,
        onPanResponderMove: (_, gestureState) => {
          if (gestureState.dy > 0) {
            translateY.setValue(gestureState.dy);
          }
        },
        onPanResponderRelease: (_, gestureState) => {
          if (gestureState.dy > CLOSE_DRAG_DISTANCE || gestureState.vy > 1.1) {
            closeSheet();
            return;
          }

          Animated.spring(translateY, {
            toValue: 0,
            damping: 18,
            stiffness: 180,
            mass: 0.9,
            useNativeDriver: true,
          }).start();
        },
        onPanResponderTerminate: () => {
          Animated.spring(translateY, {
            toValue: 0,
            damping: 18,
            stiffness: 180,
            mass: 0.9,
            useNativeDriver: true,
          }).start();
        },
      }),
    [closeSheet, translateY],
  );

  return (
    <Modal
      animationType="none"
      transparent
      visible={visible}
      onRequestClose={closeSheet}
    >
      <View style={styles.overlay}>
        <Animated.View style={[styles.backdrop, { opacity: backdropOpacity }]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={closeSheet} />
        </Animated.View>

        <Animated.View
          style={[
            styles.sheet,
            {
              transform: [{ translateY }],
            },
          ]}
        >
          <View {...panResponder.panHandlers} style={styles.dragArea}>
            <View style={styles.dragHandle} />
          </View>

          <View style={styles.header}>
            <View style={styles.headerTextWrap}>
              <Text style={styles.title}>{title}</Text>
              {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
            </View>
            <Pressable
              style={({ pressed }) => [styles.headerAction, pressed && styles.buttonPressed]}
              onPress={closeSheet}
            >
              <Text style={styles.headerActionLabel}>{actionLabel}</Text>
            </Pressable>
          </View>

          <View style={styles.body}>{children}</View>
          {footer ? (
            <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 16) }]}>
              {footer}
            </View>
          ) : null}
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(32, 35, 33, 0.34)",
  },
  sheet: {
    backgroundColor: "#FFFDF8",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "82%",
    paddingHorizontal: 16,
    paddingTop: 2,
  },
  dragArea: {
    alignItems: "center",
    paddingBottom: 8,
    paddingTop: 10,
  },
  dragHandle: {
    backgroundColor: "#BBD5C9",
    borderRadius: 999,
    height: 5,
    width: 52,
  },
  header: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: 12,
    justifyContent: "space-between",
    paddingBottom: 8,
  },
  headerTextWrap: {
    flex: 1,
    gap: 2,
  },
  title: {
    color: "#202321",
    fontSize: 18,
    fontWeight: "800",
  },
  subtitle: {
    color: "#6E706B",
    fontSize: 13,
  },
  headerAction: {
    borderColor: "#CFC9BD",
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  headerActionLabel: {
    color: "#4F514B",
    fontSize: 12,
    fontWeight: "700",
  },
  body: {
    flexShrink: 1,
    paddingBottom: 8,
  },
  footer: {
    backgroundColor: "#FFFDF8",
    borderTopColor: "#D8D4C9",
    borderTopWidth: 1,
    elevation: 10,
    marginHorizontal: -16,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 16,
    shadowColor: "#202321",
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.08,
    shadowRadius: 14,
  },
  buttonPressed: {
    opacity: 0.85,
  },
});
