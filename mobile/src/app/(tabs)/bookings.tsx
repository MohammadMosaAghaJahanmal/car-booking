import { useCallback, useState } from "react";
import {
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { router, useFocusEffect } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { api, messageFrom } from "@/lib/api";
import type { Booking } from "@/lib/types";
import { AlertBox, Button, Card, Field } from "@/components/ui/kit";
import { C } from "@/constants/app-theme";
const statuses = [
  "all",
  "pending",
  "accepted",
  "completed",
  "cancelled",
] as const;
export default function Bookings() {
  const [list, setList] = useState<Booking[]>([]),
    [status, setStatus] = useState<(typeof statuses)[number]>("all"),
    [search, setSearch] = useState(""),
    [loading, setLoading] = useState(false),
    [error, setError] = useState("");
  const load = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await api.get("/bookings/my-bookings", {
        params: { status: status === "all" ? "" : status, search, limit: 50 },
      });
      setList(data.bookings || data);
      setError("");
    } catch (e) {
      setError(messageFrom(e, "Could not load bookings."));
    } finally {
      setLoading(false);
    }
  }, [status, search]);
  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );
  const cancel = (id: number) =>
    Alert.alert(
      "Cancel booking?",
      "Paid bookings are refunded when eligible.",
      [
        { text: "Keep ride" },
        {
          text: "Cancel ride",
          style: "destructive",
          onPress: async () => {
            try {
              await api.put("/bookings/" + id + "/cancel");
              load();
            } catch (e) {
              Alert.alert("Could not cancel", messageFrom(e));
            }
          },
        },
      ],
    );
  return (
    <SafeAreaView style={s.page} edges={["top", "left", "right"]}>
      <View style={s.header}>
        <Text style={s.kicker}>YOUR TRAVEL DASHBOARD</Text>
        <Text style={s.title}>My rides</Text>
        <Text style={s.sub}>Payments, upcoming journeys and ride history.</Text>
      </View>
      <ScrollView
        style={s.scroll}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={load} />
        }
        contentContainerStyle={s.body}
      >
        <Field
          placeholder="Search car or location"
          value={search}
          onChangeText={setSearch}
          onSubmitEditing={load}
        />
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 8 }}
        >
          {statuses.map((x) => (
            <Pressable
              key={x}
              onPress={() => setStatus(x)}
              style={[s.chip, status === x && s.chipOn]}
            >
              <Text style={[s.chipText, status === x && { color: "#fff" }]}>
                {x}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
        <AlertBox message={error} />
        {list.map((b) => (
          <Card key={b.id}>
            <View style={s.row}>
              <View>
                <Text style={s.id}>Booking #{b.id}</Text>
                <Text style={s.car}>
                  {b.Car?.name || "Car"} · {b.Car?.type}
                </Text>
              </View>
              <View
                style={[
                  s.badge,
                  {
                    backgroundColor:
                      b.status === "completed"
                        ? C.greenSoft
                        : b.status === "cancelled"
                          ? C.redSoft
                          : C.blueSoft,
                  },
                ]}
              >
                <Text
                  style={{
                    fontWeight: "900",
                    fontSize: 10,
                    color:
                      b.status === "completed"
                        ? C.green
                        : b.status === "cancelled"
                          ? C.red
                          : C.blue,
                  }}
                >
                  {b.status.toUpperCase()}
                </Text>
              </View>
            </View>
            <View style={s.route}>
              <Text style={s.point}>● {b.pickupAddress}</Text>
              <View style={s.line} />
              <Text style={[s.point, { color: C.red }]}>● {b.dropAddress}</Text>
            </View>
            <View style={s.grid}>
              {[
                ["Date", b.travelDate],
                ["Time", String(b.travelTime).slice(0, 5)],
                ["Distance", b.distanceKm + " km"],
                ["Payment", b.paymentStatus],
              ].map(([a, v]) => (
                <View key={a} style={s.stat}>
                  <Text style={s.statLabel}>{a}</Text>
                  <Text style={s.statValue}>{v}</Text>
                </View>
              ))}
            </View>
            <View style={s.total}>
              <Text style={{ color: C.muted }}>Total</Text>
              <Text style={{ fontWeight: "900", fontSize: 22 }}>
                {"$" + Number(b.totalPrice).toFixed(2)}
              </Text>
            </View>
            {b.status !== "cancelled" && (
              <View style={{ gap: 8, marginTop: 14 }}>
                {b.paymentStatus === "unpaid" && (
                  <Button
                    title="Pay securely"
                    onPress={() =>
                      router.push({
                        pathname: "/payment/[id]",
                        params: { id: String(b.id) },
                      })
                    }
                  />
                )}
                {b.status === "accepted" && (
                  <Button
                    title="Track driver live"
                    variant="secondary"
                    onPress={() =>
                      router.push({
                        pathname: "/tracking/[id]",
                        params: { id: String(b.id) },
                      })
                    }
                  />
                )}
                {b.status === "pending" && (
                  <Button
                    title="Cancel booking"
                    variant="danger"
                    onPress={() => cancel(b.id)}
                  />
                )}
              </View>
            )}
          </Card>
        ))}
        {!loading && !list.length ? (
          <Text style={s.empty}>No rides match this filter.</Text>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}
const s = StyleSheet.create({
  page: { flex: 1, backgroundColor: C.navy },
  scroll: { backgroundColor: C.bg },
  header: {
    backgroundColor: C.navy,
    paddingHorizontal: 22,
    paddingTop: 18,
    paddingBottom: 34,
  },
  kicker: {
    color: "#60a5fa",
    fontWeight: "900",
    fontSize: 11,
    letterSpacing: 1.7,
  },
  title: { color: "#fff", fontSize: 36, fontWeight: "900", marginTop: 8 },
  sub: { color: "#94a3b8", marginTop: 8 },
  body: { paddingHorizontal: 16, paddingTop: 18, gap: 14, paddingBottom: 110 },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 30,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: C.line,
  },
  chipOn: { backgroundColor: C.blue, borderColor: C.blue },
  chipText: { fontWeight: "800", textTransform: "capitalize", color: C.muted },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  id: { fontWeight: "900", fontSize: 17, color: C.text },
  car: { color: C.muted, marginTop: 4 },
  badge: { paddingHorizontal: 9, paddingVertical: 6, borderRadius: 20 },
  route: { marginTop: 18, gap: 7 },
  point: { color: C.blue, fontWeight: "700", lineHeight: 20 },
  line: {
    height: 12,
    borderLeftWidth: 1,
    borderStyle: "dashed",
    borderColor: "#cbd5e1",
    marginLeft: 4,
  },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 17 },
  stat: {
    width: "47%",
    padding: 11,
    borderRadius: 12,
    backgroundColor: "#f8fafc",
  },
  statLabel: { fontSize: 10, color: C.muted, textTransform: "uppercase" },
  statValue: { fontWeight: "800", marginTop: 3, textTransform: "capitalize" },
  total: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 16,
    paddingTop: 14,
    borderTopWidth: 1,
    borderColor: C.line,
  },
  empty: { textAlign: "center", color: C.muted, padding: 30 },
});
