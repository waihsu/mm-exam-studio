import React, { useMemo, useState } from "react";
import {
  Platform,
  StyleSheet,
  Text,
  UIManager,
  View,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from "react-native";
import {
  buildMathHtmlDocument,
  hasMathSegments,
  normalizeMathForNativeText,
  parseMathSegments,
} from "@/features/math/utils/math-rich-text";

type MathRichTextProps = {
  content?: string | null;
  inline?: boolean;
  containerStyle?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  renderMode?: "auto" | "native";
};

const hasNativeWebView = () => {
  if (Platform.OS === "web") {
    return false;
  }

  try {
    return Boolean(UIManager.getViewManagerConfig("RNCWebView"));
  } catch {
    return false;
  }
};

const getWebViewComponent = () => {
  if (!hasNativeWebView()) {
    return null;
  }

  try {
    const module = require("react-native-webview") as {
      WebView?: React.ComponentType<Record<string, unknown>>;
    };
    return module.WebView ?? null;
  } catch {
    return null;
  }
};

const toCssColor = (value: TextStyle["color"]) =>
  typeof value === "string" ? value : undefined;

export const MathRichText = ({
  content,
  inline = false,
  containerStyle,
  textStyle,
  renderMode = "auto",
}: MathRichTextProps) => {
  const value = content ?? "";
  const [webViewFailed, setWebViewFailed] = useState(false);
  const [webViewHeight, setWebViewHeight] = useState(inline ? 28 : 48);
  const flattenedTextStyle = StyleSheet.flatten(textStyle);
  const containsMath = hasMathSegments(value);
  const WebView = useMemo(() => getWebViewComponent(), []);

  if (!value.trim()) {
    return null;
  }

  if (!containsMath) {
    return (
      <Text style={[styles.baseText, textStyle]}>{value}</Text>
    );
  }

  const shouldUseWebView =
    renderMode === "auto" && !webViewFailed && Platform.OS !== "web" && WebView;

  if (shouldUseWebView) {
    const html = buildMathHtmlDocument(value, {
      inline,
      fontSize: flattenedTextStyle?.fontSize,
      lineHeight: flattenedTextStyle?.lineHeight,
      textColor: toCssColor(flattenedTextStyle?.color),
    });

    return (
      <View style={[styles.webViewWrap, inline && styles.webViewWrapInline, containerStyle]}>
        <WebView
          originWhitelist={["*"]}
          scrollEnabled={false}
          showsVerticalScrollIndicator={false}
          nestedScrollEnabled={false}
          overScrollMode="never"
          source={{ html }}
          style={[
            styles.webView,
            inline && styles.webViewInline,
            { height: Math.max(webViewHeight, inline ? 28 : 48) },
          ]}
          onError={() => setWebViewFailed(true)}
          onHttpError={() => setWebViewFailed(true)}
          onMessage={(event: { nativeEvent: { data: string } }) => {
            const nextHeight = Number.parseInt(event.nativeEvent.data, 10);
            if (Number.isFinite(nextHeight) && nextHeight > 0) {
              setWebViewHeight(nextHeight);
            }
          }}
        />
      </View>
    );
  }

  const segments = parseMathSegments(value);
  return (
    <View
      style={[
        inline ? styles.inlineSegments : styles.blockSegments,
        containerStyle,
      ]}
    >
      {segments.map((segment, index) =>
        segment.type === "text" ? (
          <Text
            key={`text-${index}`}
            style={[
              styles.baseText,
              inline ? styles.inlineText : styles.blockText,
              textStyle,
            ]}
          >
            {segment.value}
          </Text>
        ) : (
          <Text
            key={`math-${index}`}
            style={[
              styles.fallbackMath,
              segment.displayMode && styles.fallbackMathBlock,
              inline && styles.fallbackMathInline,
              textStyle,
            ]}
          >
            {normalizeMathForNativeText(segment.value)}
          </Text>
        ),
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  baseText: {
    color: "#1E293B",
    fontSize: 15,
    lineHeight: 22,
  },
  webViewWrap: {
    alignSelf: "stretch",
    minHeight: 48,
  },
  webViewWrapInline: {
    alignSelf: "flex-start",
    minHeight: 28,
  },
  webView: {
    backgroundColor: "transparent",
    width: "100%",
  },
  webViewInline: {
    minWidth: 24,
  },
  blockSegments: {
    gap: 8,
  },
  inlineSegments: {
    alignItems: "center",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 4,
  },
  inlineText: {
    flexShrink: 1,
  },
  blockText: {
    width: "100%",
  },
  fallbackMath: {
    backgroundColor: "#EEF4FF",
    borderColor: "#C9D9FF",
    borderRadius: 10,
    borderWidth: 1,
    color: "#1D4ED8",
    fontFamily: Platform.select({ ios: "Menlo", android: "monospace", default: "monospace" }),
    fontSize: 14,
    lineHeight: 20,
    overflow: "hidden",
    paddingHorizontal: 9,
    paddingVertical: 5,
  },
  fallbackMathBlock: {
    backgroundColor: "#F7FAFF",
    borderLeftColor: "#7DA7FF",
    borderLeftWidth: 3,
    marginTop: 2,
    paddingVertical: 8,
    width: "100%",
  },
  fallbackMathInline: {
    marginVertical: 1,
  },
});
