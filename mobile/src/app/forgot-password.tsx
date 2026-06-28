import { useState } from "react";
import { Link } from "expo-router";
import { Text, View } from "react-native";
import { AuthShell } from "@/components/auth-shell";
import { AlertBox, Button, Field, Label } from "@/components/ui/kit";
import { api, messageFrom } from "@/lib/api";
export default function Forgot() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");
  const [dev, setDev] = useState("");
  const submit = async () => {
    try {
      setLoading(true);
      setError("");
      const { data } = await api.post("/auth/forgot-password", {
        email: email.trim().toLowerCase(),
      });
      setMsg(data.message);
      setDev(data.developmentResetUrl || "");
    } catch (e) {
      setError(messageFrom(e));
    } finally {
      setLoading(false);
    }
  };
  return (
    <AuthShell
      eyebrow="Account recovery"
      title="Forgot password?"
      description="We will send a secure, 15-minute reset link."
    >
      <View style={{ gap: 16 }}>
        {msg ? (
          <>
            <AlertBox message={msg} type="success" />
            {dev ? (
              <Link
                href={dev as never}
                style={{
                  textAlign: "center",
                  color: "#d97706",
                  fontWeight: "900",
                }}
              >
                Open development reset link
              </Link>
            ) : null}
          </>
        ) : (
          <>
            <View>
              <Label>Email</Label>
              <Field
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                placeholder="you@example.com"
              />
            </View>
            <AlertBox message={error} />
            <Button
              title="Send reset link"
              loading={loading}
              onPress={submit}
            />
          </>
        )}
        <Text style={{ textAlign: "center" }}>
          <Link href="/login" style={{ color: "#2563eb", fontWeight: "900" }}>
            Back to sign in
          </Link>
        </Text>
      </View>
    </AuthShell>
  );
}
