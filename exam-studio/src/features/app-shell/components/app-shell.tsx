import React from "react";
import {
  StyleSheet,
  View,
  type ViewProps,
} from "react-native";
import { BottomTabBarHeightContext } from "@react-navigation/bottom-tabs";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

type AppShellProps = ViewProps & {
  children: React.ReactNode;
};

export const AppShell = ({ children, style, ...rest }: AppShellProps) => (
  <AppShellInner style={style} {...rest}>
    {children}
  </AppShellInner>
);

const AppShellInner = ({ children, style, ...rest }: AppShellProps) => {
  const insets = useSafeAreaInsets();
  const tabBarHeight = React.useContext(BottomTabBarHeightContext) ?? 0;
  const bottomPadding = tabBarHeight > 0 ? 16 : insets.bottom + 16;

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
      <View
        style={[styles.container, { paddingBottom: bottomPadding }, style]}
        {...rest}
      >
        {children}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F4F6FA",
  },
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
    gap: 16,
  },
});
