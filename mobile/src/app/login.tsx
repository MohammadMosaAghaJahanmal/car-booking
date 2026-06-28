import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { Link, router } from "expo-router";
import { AuthShell } from "@/components/auth-shell";
import { AlertBox, Button, Field, Label } from "@/components/ui/kit";
import { useAuth } from "@/context/auth";
import { messageFrom } from "@/lib/api";
export default function Login() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const submit = async () => {
    if (!email || !password) return setError("Enter your email and password.");
    try {
      setLoading(true);
      setError("");
      const account = await signIn(email.trim().toLowerCase(), password);
      router.replace(account.role === "user" ? "/(tabs)/home" : "/(tabs)/role");
    } catch (e) {
      setError(messageFrom(e, "The email or password is incorrect."));
    } finally {
      setLoading(false);
    }
  };
  return (
    <AuthShell
      eyebrow="Welcome back"
      title="Sign in"
      description="Manage bookings, payments and live rides from your pocket."
    >
      <View style={{ gap: 16 }}>
        <View>
          <Label>Email</Label>
          <Field
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            placeholder="you@example.com"
          />
        </View>
        <View>
          <View
            style={{ flexDirection: "row", justifyContent: "space-between" }}
          >
            <Label>Password</Label>
            <Link
              href="/forgot-password"
              style={{ color: "#2563eb", fontWeight: "800", fontSize: 12 }}
            >
              Forgot password?
            </Link>
          </View>
          <View>
            <Field
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!show}
              autoComplete="current-password"
              placeholder="Your password"
              style={{ paddingRight: 72 }}
            />
            <Pressable
              onPress={() => setShow((v) => !v)}
              style={{ position: "absolute", right: 12, top: 15 }}
            >
              <Text style={{ fontWeight: "800", color: "#64748b" }}>
                {show ? "Hide" : "Show"}
              </Text>
            </Pressable>
          </View>
        </View>
        <AlertBox message={error} />
        <Button title="Sign in" loading={loading} onPress={submit} />
        <Text style={{ textAlign: "center", color: "#64748b" }}>
          New here?{" "}
          <Link
            href="/register"
            style={{ color: "#2563eb", fontWeight: "900" }}
          >
            Create account
          </Link>
        </Text>
      </View>
    </AuthShell>
  );
}
