import { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";
import { api, messageFrom } from "@/lib/api";
import { getSocket } from "@/lib/socket";
import type { Booking, RideTracking } from "@/lib/types";
import { AlertBox, Card } from "@/components/ui/kit";
import { C } from "@/constants/app-theme";
export default function Tracking() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [booking, setBooking] = useState<Booking | null>(null),
    [track, setTrack] = useState<RideTracking | null>(null),
    [online, setOnline] = useState(false),
    [error, setError] = useState("");
  useEffect(() => {
    let active = true,
      sock: any;
    api
      .get("/tracking/" + id)
      .then((r) => {
        setBooking(r.data.booking);
        setTrack(r.data.tracking);
        setOnline(Boolean(r.data.tracking?.isSharing));
      })
      .catch((e) => setError(messageFrom(e)));
    getSocket().then((s) => {
      if (!active) return;
      sock = s;
      s.emit("join-booking", Number(id));
      s.on("driver-location", (u: RideTracking) => {
        setTrack((v) => ({ ...v, ...u }) as RideTracking);
        setOnline(true);
      });
      s.on("driver-offline", () => setOnline(false));
    });
    return () => {
      active = false;
      sock?.off("driver-location");
      sock?.off("driver-offline");
    };
  }, [id]);
  const lat = track?.latitude ?? booking?.pickupLat ?? 34.5553,
    lng = track?.longitude ?? booking?.pickupLng ?? 69.2075;
  return (
    <SafeAreaView style={s.page}>
      <View style={s.top}>
        <Text style={s.back} onPress={() => router.back()}>
          ← Back
        </Text>
        <Text style={s.kicker}>RIDE TRACKING</Text>
        <Text style={s.title}>Booking #{id}</Text>
        <View
          style={[
            s.status,
            { backgroundColor: online ? C.greenSoft : C.amberSoft },
          ]}
        >
          <View
            style={[s.dot, { backgroundColor: online ? C.green : C.amber }]}
          />
          <Text
            style={{ fontWeight: "900", color: online ? C.green : C.amber }}
          >
            {online ? "Driver is sharing live" : "Waiting for driver location"}
          </Text>
        </View>
      </View>
      <AlertBox message={error} />
      <View style={s.map}>
        <MapView
          provider={PROVIDER_GOOGLE}
          style={{ flex: 1 }}
          region={{
            latitude: Number(lat),
            longitude: Number(lng),
            latitudeDelta: 0.03,
            longitudeDelta: 0.03,
          }}
        >
          {track?.latitude != null && track.longitude != null ? (
            <Marker
              coordinate={{
                latitude: track.latitude,
                longitude: track.longitude,
              }}
              title={track.Driver?.name || "Your driver"}
              pinColor={C.blue}
            />
          ) : null}
          {booking?.pickupLat != null && booking.pickupLng != null ? (
            <Marker
              coordinate={{
                latitude: booking.pickupLat,
                longitude: booking.pickupLng,
              }}
              title="Pickup"
              pinColor={C.green}
            />
          ) : null}
          {booking?.dropLat != null && booking.dropLng != null ? (
            <Marker
              coordinate={{
                latitude: booking.dropLat,
                longitude: booking.dropLng,
              }}
              title="Destination"
              pinColor={C.red}
            />
          ) : null}
        </MapView>
      </View>
      <Card style={s.info}>
        <Text style={{ fontWeight: "900", fontSize: 18 }}>
          {track?.Driver?.name || "Driver not assigned yet"}
        </Text>
        <Text style={{ color: C.muted, marginTop: 5 }}>
          Last update:{" "}
          {track?.lastSeen
            ? new Date(track.lastSeen).toLocaleTimeString()
            : "No location received"}
        </Text>
        <Text style={{ marginTop: 15, lineHeight: 21, color: C.text }}>
          ● {booking?.pickupAddress}
          {"\n"}
          {"\n"}
          <Text style={{ color: C.red }}>● {booking?.dropAddress}</Text>
        </Text>
      </Card>
    </SafeAreaView>
  );
}
const s = StyleSheet.create({
  page: { flex: 1, backgroundColor: C.navy },
  top: { backgroundColor: C.navy, padding: 22, paddingBottom: 24 },
  back: { color: "#93c5fd", fontWeight: "800" },
  kicker: {
    color: "#60a5fa",
    fontWeight: "900",
    fontSize: 11,
    letterSpacing: 1.5,
    marginTop: 25,
  },
  title: { color: "#fff", fontSize: 32, fontWeight: "900", marginTop: 6 },
  status: {
    marginTop: 14,
    padding: 11,
    borderRadius: 13,
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
    alignSelf: "flex-start",
  },
  dot: { width: 9, height: 9, borderRadius: 5 },
  map: { flex: 1, minHeight: 330 },
  info: { margin: 16 },
});
