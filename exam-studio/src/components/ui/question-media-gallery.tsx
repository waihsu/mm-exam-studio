import { Image } from "expo-image";
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { WebView } from "react-native-webview";

type QuestionMediaGalleryProps = {
  imageUrls: string[];
  emptyLabel?: string | null;
};

export const QuestionMediaGallery = ({
  imageUrls,
  emptyLabel = null,
}: QuestionMediaGalleryProps) => {
  const normalizedUrls = imageUrls.filter((value) => value.trim().length > 0);

  if (normalizedUrls.length === 0) {
    if (!emptyLabel) {
      return null;
    }

    return <Text style={styles.emptyLabel}>{emptyLabel}</Text>;
  }

  return (
    <View style={styles.gallery}>
      {normalizedUrls.map((imageUrl, index) => (
        <View key={`${imageUrl}-${index + 1}`} style={styles.frame}>
          {isSvgSource(imageUrl) ? (
            <WebView
              originWhitelist={["*"]}
              scrollEnabled={false}
              source={{ html: buildSvgHtml(imageUrl) }}
              style={styles.webview}
            />
          ) : (
            <Image
              source={imageUrl}
              style={styles.image}
              contentFit="contain"
              transition={180}
            />
          )}
        </View>
      ))}
    </View>
  );
};

const isSvgSource = (value: string) => {
  const normalized = value.trim().toLowerCase();
  return (
    normalized.startsWith("data:image/svg+xml") ||
    normalized.endsWith(".svg") ||
    normalized.includes(".svg?")
  );
};

const buildSvgHtml = (source: string) => `<!DOCTYPE html>
<html>
  <head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0" />
    <style>
      html, body {
        margin: 0;
        padding: 0;
        background: #ffffff;
        overflow: hidden;
      }
      .frame {
        align-items: center;
        display: flex;
        height: 100vh;
        justify-content: center;
        width: 100vw;
      }
      img {
        display: block;
        height: 100%;
        object-fit: contain;
        width: 100%;
      }
    </style>
  </head>
  <body>
    <div class="frame">
      <img src=${JSON.stringify(source)} />
    </div>
  </body>
</html>`;

const styles = StyleSheet.create({
  gallery: {
    gap: 10,
  },
  frame: {
    backgroundColor: "#FFFFFF",
    borderColor: "#D8DEE9",
    borderRadius: 12,
    borderWidth: 1,
    minHeight: 164,
    overflow: "hidden",
    padding: 10,
  },
  image: {
    height: 180,
    width: "100%",
  },
  webview: {
    backgroundColor: "transparent",
    height: 180,
    width: "100%",
  },
  emptyLabel: {
    color: "#64748B",
    fontSize: 12,
  },
});
