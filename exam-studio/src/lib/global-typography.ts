import { Platform, StyleSheet, Text, TextInput, type TextStyle } from "react-native";
import { Fonts } from "@/constants/theme";

const MM_TYPography_PATCH_FLAG = "__mm_exam_typography_patch_v1__";

const globalScope = globalThis as unknown as Record<string, unknown>;

const getWeightNumber = (fontWeight: TextStyle["fontWeight"]): number => {
  if (typeof fontWeight === "number") {
    return fontWeight;
  }

  if (typeof fontWeight === "string") {
    const parsed = Number.parseInt(fontWeight, 10);
    if (Number.isFinite(parsed)) {
      return parsed;
    }

    if (fontWeight === "bold") return 700;
    if (fontWeight === "normal") return 400;
  }

  return 400;
};

const isTextLikeStyle = (style: Record<string, unknown>) =>
  "fontSize" in style ||
  "fontWeight" in style ||
  "lineHeight" in style ||
  "letterSpacing" in style ||
  "textAlign" in style ||
  "textTransform" in style ||
  "fontStyle" in style ||
  "textDecorationLine" in style;

const pickSansFamily = (weight: number) => {
  if (weight >= 700) return Fonts.sansBold;
  if (weight >= 600) return Fonts.sansSemiBold;
  if (weight >= 500) return Fonts.sansMedium;
  return Fonts.sans;
};

const pickDisplayFamily = (weight: number) => {
  if (weight >= 800) return Fonts.display;
  if (weight >= 700) return Fonts.displayBold;
  return Fonts.displaySemiBold;
};

const isDisplayStyleKey = (key: string) => {
  const normalized = key.toLowerCase();
  return (
    normalized.includes("title") ||
    normalized.includes("heading") ||
    normalized.includes("hero") ||
    normalized.includes("eyebrow") ||
    normalized.includes("brand") ||
    normalized.includes("launch")
  );
};

if (!globalScope[MM_TYPography_PATCH_FLAG]) {
  globalScope[MM_TYPography_PATCH_FLAG] = true;

  const originalCreate = StyleSheet.create.bind(StyleSheet);
  const patchedCreate = ((styles: Record<string, unknown>) => {
    const nextStyles: Record<string, unknown> = { ...styles };

    Object.keys(styles).forEach((key) => {
      const value = styles[key];
      if (!value || typeof value !== "object" || Array.isArray(value)) {
        return;
      }

      const style = value as Record<string, unknown>;
      if (!isTextLikeStyle(style) || style.fontFamily) {
        return;
      }

      const weight = getWeightNumber(style.fontWeight as TextStyle["fontWeight"]);
      const preferredFamily = isDisplayStyleKey(key)
        ? pickDisplayFamily(weight)
        : pickSansFamily(weight);

      nextStyles[key] = {
        ...style,
        fontFamily: preferredFamily,
      };
    });

    return originalCreate(nextStyles as never);
  }) as typeof StyleSheet.create;

  (
    StyleSheet as unknown as {
      create: typeof StyleSheet.create;
    }
  ).create = patchedCreate;

  if (Platform.OS !== "web") {
    const defaultTextStyle = { fontFamily: Fonts.sans };
    const textDefaults = (Text as unknown as { defaultProps?: Record<string, unknown> })
      .defaultProps;
    const inputDefaults = (
      TextInput as unknown as { defaultProps?: Record<string, unknown> }
    ).defaultProps;

    (Text as unknown as { defaultProps?: Record<string, unknown> }).defaultProps = {
      ...textDefaults,
      style: [defaultTextStyle, textDefaults?.style].filter(Boolean),
    };

    (TextInput as unknown as { defaultProps?: Record<string, unknown> }).defaultProps = {
      ...inputDefaults,
      style: [defaultTextStyle, inputDefaults?.style].filter(Boolean),
    };
  }
}
