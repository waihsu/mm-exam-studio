import React, { useEffect, useRef } from "react";
import {
  Animated,
  Easing,
  StyleSheet,
  Text,
} from "react-native";
import { useTranslation } from "react-i18next";

type LaunchSplashScreenProps = {
  onFinished: () => void;
};

const SPLASH_ART = require("../../../../assets/images/launch-splash.png");

export const LaunchSplashScreen = ({ onFinished }: LaunchSplashScreenProps) => {
  const { t } = useTranslation("common");
  const rootOpacity = useRef(new Animated.Value(1)).current;
  const artOpacity = useRef(new Animated.Value(0)).current;
  const artScale = useRef(new Animated.Value(1.04)).current;
  const captionOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const intro = Animated.sequence([
      Animated.parallel([
        Animated.timing(artOpacity, {
          duration: 440,
          easing: Easing.out(Easing.cubic),
          toValue: 1,
          useNativeDriver: true,
        }),
        Animated.timing(artScale, {
          duration: 850,
          easing: Easing.out(Easing.cubic),
          toValue: 1,
          useNativeDriver: true,
        }),
      ]),
      Animated.timing(captionOpacity, {
        duration: 240,
        easing: Easing.out(Easing.cubic),
        toValue: 1,
        useNativeDriver: true,
      }),
      Animated.delay(460),
      Animated.timing(rootOpacity, {
        duration: 280,
        easing: Easing.inOut(Easing.ease),
        toValue: 0,
        useNativeDriver: true,
      }),
    ]);

    intro.start(({ finished }) => {
      if (finished) {
        onFinished();
      }
    });

    return () => {
      intro.stop();
    };
  }, [
    artOpacity,
    artScale,
    captionOpacity,
    onFinished,
    rootOpacity,
  ]);

  return (
    <Animated.View pointerEvents="auto" style={[styles.overlay, { opacity: rootOpacity }]}>
      <Animated.Image
        source={SPLASH_ART}
        resizeMode="cover"
        style={[styles.art, { opacity: artOpacity, transform: [{ scale: artScale }] }]}
      />
      <Animated.View style={[styles.caption, { opacity: captionOpacity }]}>
        <Text style={styles.eyebrow}>MM EXAM STUDIO</Text>
        <Text style={styles.subtitle}>{t("app.launchingWorkspace")}</Text>
      </Animated.View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#0B1530",
    zIndex: 100,
  },
  art: {
    ...StyleSheet.absoluteFillObject,
  },
  caption: {
    alignItems: "center",
    bottom: 72,
    left: 24,
    position: "absolute",
    right: 24,
  },
  eyebrow: {
    color: "rgba(255,255,255,0.84)",
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 2.2,
    textAlign: "center",
  },
  subtitle: {
    color: "rgba(255,255,255,0.88)",
    fontSize: 14,
    fontWeight: "600",
    lineHeight: 20,
    marginTop: 8,
    textAlign: "center",
  },
});
