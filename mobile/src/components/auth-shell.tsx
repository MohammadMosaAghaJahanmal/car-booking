import React from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { C } from "@/constants/app-theme";
export function AuthShell({
  eyebrow,
  title,
  description,
  children,
}: React.PropsWithChildren<{
  eyebrow: string;
  title: string;
  description: string;
}>) {
  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ flexGrow: 1, backgroundColor: C.bg }}
      >
        <View style={s.hero}>
          <SafeAreaView>
            <View style={s.logo}>
              <Text style={s.logoText}>CB</Text>
            </View>
            <Text style={s.eyebrow}>{eyebrow}</Text>
            <Text style={s.title}>{title}</Text>
            <Text style={s.desc}>{description}</Text>
          </SafeAreaView>
        </View>
        <View style={s.form}>{children}</View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
const s = StyleSheet.create({
  hero: {
    backgroundColor: C.navy,
    minHeight: 330,
    paddingHorizontal: 24,
    paddingBottom: 60,
  },
  logo: {
    marginTop: 24,
    width: 48,
    height: 48,
    borderRadius: 15,
    backgroundColor: C.blue,
    alignItems: "center",
    justifyContent: "center",
  },
  logoText: { color: "#fff", fontWeight: "900" },
  eyebrow: {
    marginTop: 42,
    color: "#60a5fa",
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 2,
    textTransform: "uppercase",
  },
  title: {
    color: "#fff",
    fontSize: 38,
    fontWeight: "900",
    letterSpacing: -1,
    marginTop: 12,
  },
  desc: { color: "#94a3b8", fontSize: 16, lineHeight: 25, marginTop: 12 },
  form: {
    marginTop: -32,
    marginHorizontal: 18,
    backgroundColor: "#fff",
    borderRadius: 28,
    padding: 22,
    borderWidth: 1,
    borderColor: C.line,
    marginBottom: 30,
  },
});
