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
      <ActivityIndicator
        color={variant === "primary" ? "#FFFDF8" : "#4F514B"}
      />
    ) : (
      <Text
        style={[
          styles.buttonLabel,
          variant === "primary"
            ? styles.buttonLabelPrimary
            : styles.buttonLabelSecondary,
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
          <Pressable onPress={() => setRevealed(current => !current)}>
            <Text style={styles.fieldToggle}>
              {revealed ? t("actions.hide") : t("actions.show")}
            </Text>
          </Pressable>
        ) : null}
      </View>

      <TextInput
        placeholderTextColor="#A29E95"
        secureTextEntry={isSecureField ? !revealed : secureTextEntry}
        style={[styles.input, style]}
        {...rest}
      />

      {helperText?.trim() ? (
        <Text style={styles.helperText}>{helperText}</Text>
      ) : null}
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
    <Pressable
      onPress={onToggle}
      style={({ pressed }) => [
        styles.consentRow,
        pressed && styles.consentRowPressed,
      ]}
    >
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
    {helperText?.trim() ? (
      <Text style={styles.consentHelper}>{helperText}</Text>
    ) : null}
  </View>
);

const styles = StyleSheet.create({
  banner: {
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  bannerError: {
    backgroundColor: "#FBE9E5",
    borderColor: "#E8B7AB",
  },
  bannerInfo: {
    backgroundColor: "#E7EFE9",
    borderColor: "#BBD5C9",
  },
  bannerSuccess: {
    backgroundColor: "#E7EFE9",
    borderColor: "#BBD5C9",
  },
  bannerText: {
    fontSize: 13,
    fontWeight: "600",
    lineHeight: 19,
  },
  bannerTextError: {
    color: "#B6473A",
  },
  bannerTextInfo: {
    color: "#48766B",
  },
  bannerTextSuccess: {
    color: "#48766B",
  },
  button: {
    alignItems: "center",
    borderRadius: 16,
    justifyContent: "center",
    minHeight: 54,
    paddingHorizontal: 16,
  },
  buttonPrimary: {
    backgroundColor: "#48766B",
  },
  buttonSecondary: {
    backgroundColor: "#E7EFE9",
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
    color: "#FFFDF8",
  },
  buttonLabelSecondary: {
    color: "#4F514B",
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
    color: "#202321",
    fontSize: 14,
    fontWeight: "700",
  },
  fieldToggle: {
    color: "#48766B",
    fontSize: 13,
    fontWeight: "700",
  },
  input: {
    backgroundColor: "#FFFDF8",
    borderColor: "#CFC9BD",
    borderRadius: 16,
    borderWidth: 1,
    color: "#202321",
    fontSize: 16,
    minHeight: 54,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  helperText: {
    color: "#6E706B",
    fontSize: 12,
    lineHeight: 18,
  },
  consentGroup: {
    gap: 8,
  },
  consentRow: {
    alignItems: "flex-start",
    backgroundColor: "#F8F5EE",
    borderColor: "#D8D4C9",
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
    backgroundColor: "#FFFDF8",
    borderColor: "#CFC9BD",
    borderRadius: 7,
    borderWidth: 1.5,
    height: 22,
    justifyContent: "center",
    marginTop: 1,
    width: 22,
  },
  checkboxChecked: {
    backgroundColor: "#48766B",
    borderColor: "#48766B",
  },
  checkboxIcon: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "800",
  },
  consentText: {
    color: "#4F514B",
    flex: 1,
    fontSize: 13,
    fontWeight: "600",
    lineHeight: 20,
  },
  consentLink: {
    color: "#48766B",
    fontWeight: "800",
    textDecorationLine: "underline",
  },
  consentHelper: {
    color: "#B6473A",
    fontSize: 12,
    fontWeight: "600",
    lineHeight: 18,
    paddingHorizontal: 4,
  },
});
