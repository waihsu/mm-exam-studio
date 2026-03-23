import { useRouter, type RelativePathString } from "expo-router";
import React from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  View,
  type ScrollViewProps,
} from "react-native";
import { AppShell } from "@/features/app-shell/components/app-shell";
import { useTranslation } from "@/i18n";
import { settingsUiStyles } from "./settings-ui.styles";

type SettingsPageProps = {
  title: string;
  subtitle: string;
  showBack?: boolean;
  backHref?: RelativePathString;
  children: React.ReactNode;
  scrollProps?: Omit<ScrollViewProps, "children">;
};

export const SettingsPage = ({
  title,
  subtitle,
  showBack = false,
  backHref = "/settings" as RelativePathString,
  children,
  scrollProps,
}: SettingsPageProps) => {
  const router = useRouter();
  const { t } = useTranslation("common");

  return (
    <AppShell>
      <View style={settingsUiStyles.pageHeader}>
        {showBack ? (
          <Pressable
            style={({ pressed }) => [
              settingsUiStyles.backButton,
              pressed && settingsUiStyles.buttonPressed,
            ]}
            onPress={() => router.replace(backHref)}
          >
            <Text style={settingsUiStyles.backButtonLabel}>{t("actions.back")}</Text>
          </Pressable>
        ) : null}
        <Text style={settingsUiStyles.heading}>{title}</Text>
        <Text style={settingsUiStyles.subheading}>{subtitle}</Text>
      </View>
      <ScrollView
        alwaysBounceVertical
        showsVerticalScrollIndicator={false}
        contentContainerStyle={settingsUiStyles.scrollContent}
        {...scrollProps}
      >
        {children}
      </ScrollView>
    </AppShell>
  );
};

export const SettingsCard = ({ children }: { children: React.ReactNode }) => (
  <View style={settingsUiStyles.card}>{children}</View>
);

export const SettingsLinkRow = ({
  title,
  hint,
  value,
  onPress,
}: {
  title: string;
  hint: string;
  value?: string;
  onPress: () => void;
}) => (
  <SettingsLinkRowInner title={title} hint={hint} value={value} onPress={onPress} />
);

const SettingsLinkRowInner = ({
  title,
  hint,
  value,
  onPress,
}: {
  title: string;
  hint: string;
  value?: string;
  onPress: () => void;
}) => {
  const { t } = useTranslation("common");

  return (
    <Pressable
      style={({ pressed }) => [
        settingsUiStyles.settingRow,
        pressed && settingsUiStyles.buttonPressed,
      ]}
      onPress={onPress}
    >
      <View style={settingsUiStyles.settingTextWrap}>
        <Text style={settingsUiStyles.settingTitle}>{title}</Text>
        <Text style={settingsUiStyles.settingHint}>{hint}</Text>
      </View>
      <Text style={settingsUiStyles.settingValue}>{value ?? t("actions.open")}</Text>
    </Pressable>
  );
};

export const SettingsLoadingRow = ({ label }: { label: string }) => (
  <View style={settingsUiStyles.loadingRow}>
    <ActivityIndicator color="#2563EB" />
    <Text style={settingsUiStyles.metaText}>{label}</Text>
  </View>
);

type OptionRowProps = {
  options: Array<{ value: string | number; label: string }>;
  selectedValue: string | number;
  onPress: (value: string) => void;
  disabled?: boolean;
};

export const OptionRow = ({
  options,
  selectedValue,
  onPress,
  disabled,
}: OptionRowProps) => (
  <View style={settingsUiStyles.optionRow}>
    {options.map((option) => {
      const isActive = String(option.value) === String(selectedValue);
      return (
        <Pressable
          key={`option-${option.value}`}
          disabled={disabled}
          style={({ pressed }) => [
            settingsUiStyles.optionChip,
            isActive && settingsUiStyles.optionChipActive,
            disabled && settingsUiStyles.buttonDisabled,
            pressed && !disabled && settingsUiStyles.buttonPressed,
          ]}
          onPress={() => onPress(String(option.value))}
        >
          <Text
            style={[
              settingsUiStyles.optionChipLabel,
              isActive && settingsUiStyles.optionChipLabelActive,
            ]}
          >
            {option.label}
          </Text>
        </Pressable>
      );
    })}
  </View>
);
