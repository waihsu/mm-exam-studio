import React, { useEffect, useRef } from "react";
import {
  Animated,
  Easing,
  Image,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useTranslation } from "react-i18next";

type LaunchSplashScreenProps = {
  onFinished: () => void;
};

const BRAND_LOGO = require("../../../../assets/images/logo-glow.png");

export const LaunchSplashScreen = ({ onFinished }: LaunchSplashScreenProps) => {
  const { t } = useTranslation("common");
  const rootOpacity = useRef(new Animated.Value(1)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const logoScale = useRef(new Animated.Value(0.88)).current;
  const titleOpacity = useRef(new Animated.Value(0)).current;
  const titleTranslateY = useRef(new Animated.Value(14)).current;
  const pulseOpacity = useRef(new Animated.Value(0.28)).current;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseOpacity, {
          duration: 1100,
          easing: Easing.inOut(Easing.ease),
          toValue: 0.6,
          useNativeDriver: true,
        }),
        Animated.timing(pulseOpacity, {
          duration: 1100,
          easing: Easing.inOut(Easing.ease),
          toValue: 0.24,
          useNativeDriver: true,
        }),
      ]),
    );

    const intro = Animated.sequence([
      Animated.parallel([
        Animated.timing(logoOpacity, {
          duration: 380,
          easing: Easing.out(Easing.cubic),
          toValue: 1,
          useNativeDriver: true,
        }),
        Animated.timing(logoScale, {
          duration: 540,
          easing: Easing.out(Easing.back(1.25)),
          toValue: 1,
          useNativeDriver: true,
        }),
      ]),
      Animated.parallel([
        Animated.timing(titleOpacity, {
          duration: 280,
          easing: Easing.out(Easing.cubic),
          toValue: 1,
          useNativeDriver: true,
        }),
        Animated.timing(titleTranslateY, {
          duration: 280,
          easing: Easing.out(Easing.cubic),
          toValue: 0,
          useNativeDriver: true,
        }),
      ]),
      Animated.delay(360),
      Animated.timing(rootOpacity, {
        duration: 280,
        easing: Easing.inOut(Easing.ease),
        toValue: 0,
        useNativeDriver: true,
      }),
    ]);

    pulse.start();
    intro.start(({ finished }) => {
      pulse.stop();
      if (finished) {
        onFinished();
      }
    });

    return () => {
      pulse.stop();
      intro.stop();
    };
  }, [
    logoOpacity,
    logoScale,
    onFinished,
    pulseOpacity,
    rootOpacity,
    titleOpacity,
    titleTranslateY,
  ]);

  return (
    <Animated.View pointerEvents="auto" style={[styles.overlay, { opacity: rootOpacity }]}>
      <View style={styles.background}>
        <Animated.View style={[styles.glowPrimary, { opacity: pulseOpacity }]} />
        <View style={styles.glowSecondary} />
      </View>

      <View style={styles.content}>
        <Animated.View
          style={[
            styles.logoWrap,
            {
              opacity: logoOpacity,
              transform: [{ scale: logoScale }],
            },
          ]}
        >
          <Image source={BRAND_LOGO} style={styles.logo} resizeMode="contain" />
        </Animated.View>

        <Animated.View
          style={{
            opacity: titleOpacity,
            transform: [{ translateY: titleTranslateY }],
          }}
        >
          <Text style={styles.eyebrow}>MM EXAM STUDIO</Text>
          <Text style={styles.title}>{t("app.launchTagline")}</Text>
          <Text style={styles.subtitle}>{t("app.launchingWorkspace")}</Text>
        </Animated.View>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#208AEF",
    justifyContent: "center",
    zIndex: 100,
  },
  background: {
    ...StyleSheet.absoluteFillObject,
    overflow: "hidden",
  },
  glowPrimary: {
    backgroundColor: "rgba(255,255,255,0.24)",
    borderRadius: 220,
    height: 360,
    left: "50%",
    marginLeft: -180,
    marginTop: -180,
    position: "absolute",
    top: "38%",
    width: 360,
  },
  glowSecondary: {
    backgroundColor: "rgba(7,30,61,0.12)",
    borderRadius: 320,
    bottom: -150,
    height: 340,
    left: -40,
    position: "absolute",
    width: 340,
  },
  content: {
    alignItems: "center",
    gap: 18,
    paddingHorizontal: 28,
  },
  logoWrap: {
    alignItems: "center",
    justifyContent: "center",
  },
  logo: {
    height: 138,
    width: 138,
  },
  eyebrow: {
    color: "rgba(255,255,255,0.84)",
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 2.2,
    textAlign: "center",
  },
  title: {
    color: "#FFFFFF",
    fontSize: 28,
    fontWeight: "900",
    lineHeight: 34,
    marginTop: 10,
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
