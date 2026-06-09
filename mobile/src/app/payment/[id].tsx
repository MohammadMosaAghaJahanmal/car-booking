import { useEffect, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useStripe } from "@stripe/stripe-react-native";
import { api, messageFrom } from "@/lib/api";
import type { Booking } from "@/lib/types";
import { AlertBox, Button, Card } from "@/components/ui/kit";
import { C } from "@/constants/app-theme";
export default function Payment() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { initPaymentSheet, presentPaymentSheet } = useStripe();
  const [booking, setBooking] = useState<Booking | null>(null),
    [secret, setSecret] = useState(""),
    [ready, setReady] = useState(false),
    [loading, setLoading] = useState(true),
    [error, setError] = useState("");
  useEffect(() => {
    api
      .post("/payments/create-payment-intent", { bookingId: Number(id) })
      .then(async ({ data }) => {
        setBooking({ ...data.booking, Car: data.booking.car });
        setSecret(data.clientSecret);
        const result = await initPaymentSheet({
          merchantDisplayName: "CarBooking",
          paymentIntentClientSecret: data.clientSecret,
          returnURL: "carbooking://stripe-redirect",
          appearance: {
            colors: {
              primary: C.blue,
              background: "#eeeeee",
              componentBackground: "#f8fafc",
              componentBorder: C.line,
              primaryText: C.text,
              secondaryText: C.muted,
            },
          },
        });
        if (result.error) setError(result.error.message);
        else setReady(true);
      })
      .catch((e) => setError(messageFrom(e, "Could not prepare payment.")))
      .finally(() => setLoading(false));
  }, [id, initPaymentSheet]);
  const pay = async () => {
    setLoading(true);
    setError("");
    const result = await presentPaymentSheet();
    if (result.error) {
      if (result.error.code !== "Canceled") setError(result.error.message);
      setLoading(false);
      return;
    }
    try {
      const paymentIntentId = secret.split("_secret_")[0];
      await api.post("/payments/mark-paid", {
        bookingId: Number(id),
        paymentIntentId,
      });
      router.replace("/(tabs)/bookings");
    } catch (e) {
      setError(
        messageFrom(
          e,
          "Payment succeeded but confirmation failed. Check your rides.",
        ),
      );
    } finally {
      setLoading(false);
    }
  };
  return (
    <SafeAreaView style={s.page}>
      <ScrollView style={s.scroll} contentContainerStyle={s.body}>
        <Text style={s.back} onPress={() => router.back()}>
          ← Back
        </Text>
        <Text style={s.kicker}>SECURE CHECKOUT</Text>
        <Text style={s.title}>Complete payment</Text>
        <Text style={s.sub}>
          Card details are encrypted and handled directly by Stripe.
        </Text>
        <Card style={{ marginTop: 24 }}>
          {booking ? (
            <>
              <Text style={s.booking}>Booking #{booking.id}</Text>
              <Text style={s.car}>
                {booking.Car?.name} · {booking.Car?.type}
              </Text>
              <View style={s.route}>
                <Text>● {booking.pickupAddress}</Text>
                <Text style={{ color: C.red }}>● {booking.dropAddress}</Text>
              </View>
              <View style={s.total}>
                <Text style={{ color: C.muted }}>Total due (CAD)</Text>
                <Text style={s.price}>
                  {"$" + Number(booking.totalPrice).toFixed(2)}
                </Text>
              </View>
            </>
          ) : (
            <Text style={{ color: C.muted }}>Loading booking summary...</Text>
          )}
        </Card>
        <Card style={{ marginTop: 15 }}>
          <Text style={{ fontSize: 19, fontWeight: "900" }}>
            Payment method
          </Text>
          <Text style={{ color: C.muted, lineHeight: 21, marginTop: 8 }}>
            Tap below to open the secure Stripe payment sheet.
          </Text>
          <View style={{ gap: 12, marginTop: 18 }}>
            <AlertBox message={error} />
            <Button
              title="Pay securely"
              loading={loading}
              disabled={!ready}
              onPress={pay}
            />
          </View>
          <Text style={s.trust}>
            🔒 SSL encrypted · PCI compliant · Refund protection
          </Text>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}
const s = StyleSheet.create({
  page: { flex: 1, backgroundColor: C.navy },
  scroll: { backgroundColor: C.bg },
  body: { padding: 20, paddingBottom: 50 },
  back: { color: C.blue, fontWeight: "800", marginBottom: 30 },
  kicker: {
    color: C.blue,
    fontWeight: "900",
    fontSize: 11,
    letterSpacing: 1.5,
  },
  title: { fontSize: 34, fontWeight: "900", color: C.text, marginTop: 7 },
  sub: { color: C.muted, lineHeight: 23, marginTop: 9 },
  booking: { fontWeight: "900", fontSize: 20 },
  car: { color: C.muted, marginTop: 4 },
  route: { gap: 12, marginTop: 20 },
  total: {
    marginTop: 20,
    paddingTop: 18,
    borderTopWidth: 1,
    borderColor: C.line,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  price: { fontSize: 30, fontWeight: "900" },
  trust: { textAlign: "center", fontSize: 10, color: C.muted, marginTop: 16 },
});
