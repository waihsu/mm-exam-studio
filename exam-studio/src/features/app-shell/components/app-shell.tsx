import React from "react";
import {
  StyleSheet,
  View,
  type ViewProps,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type AppShellProps = ViewProps & {
  children: React.ReactNode;
};

export const AppShell = ({ children, style, ...rest }: AppShellProps) => (
  <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
    <View style={[styles.container, style]} {...rest}>
      {children}
    </View>
  </SafeAreaView>
);

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F4F6FA",
  },
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 16,
  },
});
