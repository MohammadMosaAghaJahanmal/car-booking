import { useState } from "react";
import { useLocalSearchParams, Link } from "expo-router";
import { View } from "react-native";
import { AuthShell } from "@/components/auth-shell";
import { AlertBox, Button, Field, Label } from "@/components/ui/kit";
import { api, messageFrom } from "@/lib/api";
export default function Reset() {
  const params = useLocalSearchParams<{ token?: string }>();
  const [token, setToken] = useState(params.token || "");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");
  const submit = async () => {
    if (password.length < 8)
      return setError("Password must contain at least 8 characters.");
    if (password !== confirm) return setError("Passwords do not match.");
    try {
      setLoading(true);
      setError("");
      const { data } = await api.post("/auth/reset-password", {
        token,
        password,
      });
      setMsg(data.message);
    } catch (e) {
      setError(messageFrom(e));
    } finally {
      setLoading(false);
    }
  };
  return (
    <AuthShell
      eyebrow="Secure reset"
      title="New password"
      description="Choose a strong password you have not used before."
    >
      <View style={{ gap: 15 }}>
        {msg ? (
          <>
            <AlertBox message={msg} type="success" />
            <Link
              href="/login"
              style={{
                textAlign: "center",
                color: "#2563eb",
                fontWeight: "900",
              }}
            >
              Continue to sign in
            </Link>
          </>
        ) : (
          <>
            <View>
              <Label>Reset token</Label>
              <Field
                value={token}
                onChangeText={setToken}
                autoCapitalize="none"
                placeholder="Token from email"
              />
            </View>
            <View>
              <Label>New password</Label>
              <Field
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                placeholder="At least 8 characters"
              />
            </View>
            <View>
              <Label>Confirm password</Label>
              <Field
                value={confirm}
                onChangeText={setConfirm}
                secureTextEntry
                placeholder="Repeat password"
              />
            </View>
            <AlertBox message={error} />
            <Button title="Reset password" loading={loading} onPress={submit} />
          </>
        )}
      </View>
    </AuthShell>
  );
}
