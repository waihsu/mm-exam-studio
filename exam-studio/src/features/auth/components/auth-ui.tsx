import React, { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type PressableProps,
  type StyleProp,
  type TextInputProps,
  type ViewStyle,
} from "react-native";
import { useTranslation } from "@/i18n";

type AuthBannerProps = {
  message?: string | null;
  tone?: "error" | "info" | "success";
};

type AuthButtonProps = {
  label: string;
  loading?: boolean;
  variant?: "primary" | "secondary";
  style?: StyleProp<ViewStyle>;
} & Omit<PressableProps, "children" | "style">;

type AuthFieldProps = TextInputProps & {
  label: string;
  helperText?: string | null;
  containerStyle?: StyleProp<ViewStyle>;
  secureToggle?: boolean;
};

type AuthConsentProps = {
  checked: boolean;
  helperText?: string | null;
  labelPrefix: string;
  linkLabel: string;
  onPressLink: () => void;
  onToggle: () => void;
};

export const AuthBanner = ({ message, tone = "info" }: AuthBannerProps) => {
  if (!message?.trim()) {
    return null;
  }

  return (
    <View
      style={[
        styles.banner,
        tone === "error" && styles.bannerError,
        tone === "info" && styles.bannerInfo,
        tone === "success" && styles.bannerSuccess,
      ]}
    >
      <Text
        style={[
          styles.bannerText,
          tone === "error" && styles.bannerTextError,
          tone === "info" && styles.bannerTextInfo,
          tone === "success" && styles.bannerTextSuccess,
        ]}
      >
        {message}
      </Text>
    </View>
  );
};

export const AuthButton = ({
  disabled,
  label,
  loading,
  style,
  variant = "primary",
  ...rest
}: AuthButtonProps) => (
  <Pressable
    disabled={disabled || loading}
    style={({ pressed }) => [
      styles.button,
      variant === "primary" ? styles.buttonPrimary : styles.buttonSecondary,
      (disabled || loading) && styles.buttonDisabled,
      pressed && !(disabled || loading) && styles.buttonPressed,
      style,
    ]}
    {...rest}
  >
    {loading ? (
      <ActivityIndicator color={variant === "primary" ? "#FFFFFF" : "#0F172A"} />
    ) : (
      <Text
        style={[
          styles.buttonLabel,
          variant === "primary" ? styles.buttonLabelPrimary : styles.buttonLabelSecondary,
        ]}
      >
        {label}
      </Text>
    )}
  </Pressable>
);

export const AuthField = ({
  containerStyle,
  helperText,
  label,
  secureTextEntry,
  secureToggle,
  style,
  ...rest
}: AuthFieldProps) => {
  const [revealed, setRevealed] = useState(false);
  const isSecureField = Boolean(secureTextEntry || secureToggle);
  const { t } = useTranslation("common");

  return (
    <View style={[styles.fieldGroup, containerStyle]}>
      <View style={styles.fieldHeader}>
        <Text style={styles.fieldLabel}>{label}</Text>
        {isSecureField ? (
          <Pressable onPress={() => setRevealed((current) => !current)}>
            <Text style={styles.fieldToggle}>
              {revealed ? t("actions.hide") : t("actions.show")}
            </Text>
          </Pressable>
        ) : null}
      </View>

      <TextInput
        placeholderTextColor="#94A3B8"
        secureTextEntry={isSecureField ? !revealed : secureTextEntry}
        style={[styles.input, style]}
        {...rest}
      />

      {helperText?.trim() ? <Text style={styles.helperText}>{helperText}</Text> : null}
    </View>
  );
};

export const AuthConsent = ({
  checked,
  helperText,
  labelPrefix,
  linkLabel,
  onPressLink,
  onToggle,
}: AuthConsentProps) => (
  <View style={styles.consentGroup}>
    <Pressable onPress={onToggle} style={({ pressed }) => [styles.consentRow, pressed && styles.consentRowPressed]}>
      <View style={[styles.checkbox, checked && styles.checkboxChecked]}>
        {checked ? <Text style={styles.checkboxIcon}>✓</Text> : null}
      </View>
      <Text style={styles.consentText}>
        {labelPrefix}{" "}
        <Text onPress={onPressLink} style={styles.consentLink}>
          {linkLabel}
        </Text>
      </Text>
    </Pressable>
    {helperText?.trim() ? <Text style={styles.consentHelper}>{helperText}</Text> : null}
  </View>
);

export const authUiStyles = StyleSheet.create({
  sectionKicker: {
    color: "#0F172A",
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  sectionTitle: {
    color: "#0F172A",
    fontSize: 26,
    fontWeight: "800",
    letterSpacing: -0.5,
    lineHeight: 31,
  },
  sectionDescription: {
    color: "#475569",
    fontSize: 14,
    lineHeight: 21,
  },
  sectionHeader: {
    gap: 6,
  },
  actionStack: {
    gap: 12,
  },
  splitRow: {
    flexDirection: "row",
    gap: 10,
  },
  splitColumn: {
    flex: 1,
  },
  caption: {
    color: "#64748B",
    fontSize: 13,
    lineHeight: 19,
    textAlign: "center",
  },
  textLink: {
    alignSelf: "center",
  },
  textLinkLabel: {
    color: "#0F172A",
    fontSize: 14,
    fontWeight: "700",
  },
});

const styles = StyleSheet.create({
  banner: {
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  bannerError: {
    backgroundColor: "#FEF2F2",
    borderColor: "#FECACA",
  },
  bannerInfo: {
    backgroundColor: "#EFF6FF",
    borderColor: "#BFDBFE",
  },
  bannerSuccess: {
    backgroundColor: "#ECFDF5",
    borderColor: "#A7F3D0",
  },
  bannerText: {
    fontSize: 13,
    fontWeight: "600",
    lineHeight: 19,
  },
  bannerTextError: {
    color: "#B91C1C",
  },
  bannerTextInfo: {
    color: "#1D4ED8",
  },
  bannerTextSuccess: {
    color: "#047857",
  },
  button: {
    alignItems: "center",
    borderRadius: 16,
    justifyContent: "center",
    minHeight: 54,
    paddingHorizontal: 16,
  },
  buttonPrimary: {
    backgroundColor: "#0F172A",
  },
  buttonSecondary: {
    backgroundColor: "#E2E8F0",
  },
  buttonDisabled: {
    opacity: 0.55,
  },
  buttonPressed: {
    opacity: 0.92,
  },
  buttonLabel: {
    fontSize: 15,
    fontWeight: "800",
    letterSpacing: 0.2,
  },
  buttonLabelPrimary: {
    color: "#FFFFFF",
  },
  buttonLabelSecondary: {
    color: "#0F172A",
  },
  fieldGroup: {
    gap: 8,
  },
  fieldHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  fieldLabel: {
    color: "#0F172A",
    fontSize: 14,
    fontWeight: "700",
  },
  fieldToggle: {
    color: "#2563EB",
    fontSize: 13,
    fontWeight: "700",
  },
  input: {
    backgroundColor: "#FFFFFF",
    borderColor: "#CBD5E1",
    borderRadius: 16,
    borderWidth: 1,
    color: "#0F172A",
    fontSize: 16,
    minHeight: 54,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  helperText: {
    color: "#64748B",
    fontSize: 12,
    lineHeight: 18,
  },
  consentGroup: {
    gap: 8,
  },
  consentRow: {
    alignItems: "flex-start",
    backgroundColor: "#F8FAFC",
    borderColor: "#E2E8F0",
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  consentRowPressed: {
    opacity: 0.92,
  },
  checkbox: {
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderColor: "#CBD5E1",
    borderRadius: 7,
    borderWidth: 1.5,
    height: 22,
    justifyContent: "center",
    marginTop: 1,
    width: 22,
  },
  checkboxChecked: {
    backgroundColor: "#0F172A",
    borderColor: "#0F172A",
  },
  checkboxIcon: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "800",
  },
  consentText: {
    color: "#334155",
    flex: 1,
    fontSize: 13,
    fontWeight: "600",
    lineHeight: 20,
  },
  consentLink: {
    color: "#1D4ED8",
    fontWeight: "800",
    textDecorationLine: "underline",
  },
  consentHelper: {
    color: "#B91C1C",
    fontSize: 12,
    fontWeight: "600",
    lineHeight: 18,
    paddingHorizontal: 4,
  },
});
