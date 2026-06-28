import { useEffect, useMemo, useRef, useState } from "react";
import {
  Image,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import MapView, {
  Marker,
  PROVIDER_GOOGLE,
  MapPressEvent,
} from "react-native-maps";
import DateTimePicker, {
  DateTimePickerChangeEvent,
} from "@react-native-community/datetimepicker";
import * as Location from "expo-location";
import { z } from "zod";
import { api, messageFrom, assetUrl } from "@/lib/api";
import type { Car } from "@/lib/types";
import { AlertBox, Button, Card } from "@/components/ui/kit";
import {
  PlaceAutocomplete,
  PlacePoint,
} from "@/components/booking/PlaceAutocomplete";
import { C, shadow } from "@/constants/app-theme";

type PickerMode = "date" | "time" | null;
type Notice = { type: "error" | "info" | "success"; message: string } | null;
const point = (): PlacePoint => ({ address: "", lat: null, lng: null });
const initialSchedule = () => {
  const value = new Date(Date.now() + 60 * 60 * 1000);
  value.setSeconds(0, 0);
  return value;
};
const pad = (value: number) => String(value).padStart(2, "0");
const dateValue = (value: Date) =>
  `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(value.getDate())}`;
const timeValue = (value: Date) =>
  `${pad(value.getHours())}:${pad(value.getMinutes())}`;
const prettyDate = (value: Date) =>
  value.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
const prettyTime = (value: Date) =>
  value.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
const imageFor = (url?: string | null) =>
  assetUrl(url) ||
  "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=900";
const distanceBetween = (a: PlacePoint, b: PlacePoint) => {
  if (a.lat == null || a.lng == null || b.lat == null || b.lng == null)
    return 0;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180,
    dLng = ((b.lng - a.lng) * Math.PI) / 180,
    x =
      Math.sin(dLat / 2) ** 2 +
      Math.cos((a.lat * Math.PI) / 180) *
        Math.cos((b.lat * Math.PI) / 180) *
        Math.sin(dLng / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
};
const bookingForm = z.object({
  carId: z.number().int().positive("Choose a vehicle"),
  pickup: z.object({
    address: z
      .string()
      .trim()
      .min(3, "Select a pickup from the suggestions or map"),
    lat: z.number(),
    lng: z.number(),
  }),
  drop: z.object({
    address: z
      .string()
      .trim()
      .min(3, "Select a destination from the suggestions or map"),
    lat: z.number(),
    lng: z.number(),
  }),
  distanceKm: z.number().positive("Choose two different locations"),
  schedule: z
    .date()
    .refine(
      (value) => value.getTime() > Date.now(),
      "Choose a future pickup time",
    ),
});

export default function Home() {
  const [cars, setCars] = useState<Car[]>([]);
  const [hero, setHero] = useState("");
  const [selected, setSelected] = useState<number | null>(null);
  const [pickup, setPickup] = useState<PlacePoint>(point);
  const [drop, setDrop] = useState<PlacePoint>(point);
  const [selecting, setSelecting] = useState<"pickup" | "drop">("pickup");
  const [schedule, setSchedule] = useState(initialSchedule);
  const [picker, setPicker] = useState<PickerMode>(null);
  const [loading, setLoading] = useState(false);
  const [locating, setLocating] = useState(false);
  const [notice, setNotice] = useState<Notice>(null);
  const [success, setSuccess] = useState(false);
  const [completedRoute, setCompletedRoute] = useState<{
    pickup: string;
    drop: string;
  } | null>(null);
  const map = useRef<MapView>(null);

  useEffect(() => {
    Promise.all([api.get("/cars"), api.get("/settings/home")])
      .then(([fleet, settings]) => {
        setCars(fleet.data);
        setHero(settings.data.heroImageUrl || "");
        if (fleet.data[0]) setSelected(fleet.data[0].id);
      })
      .catch((error) =>
        setNotice({
          type: "error",
          message: messageFrom(error, "We could not load the available fleet."),
        }),
      );
  }, []);
  const km = useMemo(() => distanceBetween(pickup, drop), [pickup, drop]);
  const car = cars.find((item) => item.id === selected);
  const total = car ? km * Number(car.pricePerKm) : 0;
  const bias =
    pickup.lat != null && pickup.lng != null
      ? { lat: pickup.lat, lng: pickup.lng }
      : null;
  useEffect(() => {
    if (
      pickup.lat != null &&
      pickup.lng != null &&
      drop.lat != null &&
      drop.lng != null
    )
      map.current?.fitToCoordinates(
        [
          { latitude: pickup.lat, longitude: pickup.lng },
          { latitude: drop.lat, longitude: drop.lng },
        ],
        {
          edgePadding: { top: 55, right: 55, bottom: 55, left: 55 },
          animated: true,
        },
      );
  }, [pickup.lat, pickup.lng, drop.lat, drop.lng]);

  const addressFor = async (lat: number, lng: number, fallback: string) => {
    try {
      const [place] = await Location.reverseGeocodeAsync({
        latitude: lat,
        longitude: lng,
      });
      return place
        ? [place.name, place.street, place.district, place.city, place.region]
            .filter(Boolean)
            .filter((item, index, all) => all.indexOf(item) === index)
            .join(", ")
        : fallback;
    } catch {
      return fallback;
    }
  };
  const currentLocation = async () => {
    try {
      setLocating(true);
      setNotice(null);
      const permission = await Location.requestForegroundPermissionsAsync();
      if (!permission.granted)
        return setNotice({
          type: "error",
          message:
            "Location access is off. Allow it in Settings, or search for your pickup address.",
        });
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      const { latitude: lat, longitude: lng } = location.coords;
      const address = await addressFor(lat, lng, "Current location");
      setPickup({ address, lat, lng });
      setSelecting("drop");
      map.current?.animateToRegion(
        {
          latitude: lat,
          longitude: lng,
          latitudeDelta: 0.035,
          longitudeDelta: 0.035,
        },
        600,
      );
    } catch (error) {
      setNotice({
        type: "error",
        message: messageFrom(
          error,
          "Your current location is unavailable. Check that location services are enabled.",
        ),
      });
    } finally {
      setLocating(false);
    }
  };
  const mapTap = async (event: MapPressEvent) => {
    const { latitude: lat, longitude: lng } = event.nativeEvent.coordinate;
    const fallback = `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
    if (selecting === "pickup") {
      setPickup({ address: "Finding pickup address…", lat, lng });
      setPickup({ address: await addressFor(lat, lng, fallback), lat, lng });
      setSelecting("drop");
    } else {
      setDrop({ address: "Finding destination…", lat, lng });
      setDrop({ address: await addressFor(lat, lng, fallback), lat, lng });
    }
  };
  const changeSchedule = (_event: DateTimePickerChangeEvent, value: Date) => {
    if (Platform.OS === "android") setPicker(null);
    const next = new Date(schedule);
    if (picker === "date")
      next.setFullYear(value.getFullYear(), value.getMonth(), value.getDate());
    else next.setHours(value.getHours(), value.getMinutes(), 0, 0);
    setSchedule(next);
    setNotice(
      next.getTime() <= Date.now()
        ? { type: "error", message: "Pickup time must be in the future." }
        : null,
    );
  };
  const book = async () => {
    const parsed = bookingForm.safeParse({
      carId: selected,
      pickup,
      drop,
      distanceKm: km,
      schedule,
    });
    if (!parsed.success)
      return setNotice({
        type: "error",
        message:
          parsed.error.issues[0]?.message ||
          "Please complete the booking details.",
      });
    try {
      setLoading(true);
      setNotice({ type: "info", message: "Securing your ride…" });
      await api.post("/bookings", {
        carId: parsed.data.carId,
        pickupAddress: pickup.address,
        pickupLat: pickup.lat,
        pickupLng: pickup.lng,
        dropAddress: drop.address,
        dropLat: drop.lat,
        dropLng: drop.lng,
        distanceKm: Number(km.toFixed(2)),
        travelDate: dateValue(schedule),
        travelTime: timeValue(schedule),
      });
      setCompletedRoute({ pickup: pickup.address, drop: drop.address });
      setPickup(point());
      setDrop(point());
      setSelecting("pickup");
      setSchedule(initialSchedule());
      setNotice(null);
      setSuccess(true);
    } catch (error) {
      setNotice({
        type: "error",
        message: messageFrom(
          error,
          "We could not create your booking. Please review the details and try again.",
        ),
      });
    } finally {
      setLoading(false);
    }
  };

  const closeSuccess = () => {
    setSuccess(false);
    setCompletedRoute(null);
  };

  return (
    <>
      <ScrollView
        style={styles.page}
        contentContainerStyle={styles.pageContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.hero}>
          {hero ? (
            <Image
              source={{ uri: assetUrl(hero) }}
              style={StyleSheet.absoluteFill}
              resizeMode="cover"
            />
          ) : null}
          <View style={styles.heroShade} />
          <View style={styles.heroGlow} />
          <SafeAreaView style={styles.heroContent}>
            <View style={styles.heroPill}>
              <View style={styles.liveDot} />
              <Text style={styles.heroPillText}>AVAILABLE 24/7</Text>
            </View>
            <Text style={styles.heroTitle}>
              Your next ride,{"\n"}
              <Text style={styles.heroAccent}>beautifully planned.</Text>
            </Text>
            <Text style={styles.heroSub}>
              Search any destination, schedule your pickup, and watch the
              journey unfold.
            </Text>
            <View style={styles.trustRow}>
              {["Upfront fare", "Live tracking", "Secure pay"].map((item) => (
                <View key={item} style={styles.trustItem}>
                  <Text style={styles.trustCheck}>✓</Text>
                  <Text style={styles.trustText}>{item}</Text>
                </View>
              ))}
            </View>
          </SafeAreaView>
        </View>
        <View style={styles.body}>
          <Card style={styles.planner}>
            <View style={styles.stepRow}>
              <View>
                <Text style={styles.cardKicker}>PLAN YOUR JOURNEY</Text>
                <Text style={styles.heading}>Where can we take you?</Text>
              </View>
              <View style={styles.stepBadge}>
                <Text style={styles.stepNumber}>1</Text>
              </View>
            </View>
            <Pressable
              onPress={currentLocation}
              disabled={locating}
              style={({ pressed }) => [
                styles.locationButton,
                pressed && { opacity: 0.75 },
              ]}
            >
              <View style={styles.locationIcon}>
                <Text style={styles.locationIconText}>⌖</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.locationTitle}>
                  {locating
                    ? "Finding your location…"
                    : "Use my current location"}
                </Text>
                <Text style={styles.locationSub}>
                  Set your pickup instantly
                </Text>
              </View>
              <Text style={styles.chevron}>›</Text>
            </Pressable>
            <View style={styles.routeInputs}>
              <View style={styles.routeLine} />
              <PlaceAutocomplete
                label="Pickup"
                placeholder="Search pickup location"
                markerColor={C.blue}
                value={pickup}
                onChange={setPickup}
                onFocus={() => setSelecting("pickup")}
              />
              <PlaceAutocomplete
                label="Destination"
                placeholder="Where are you going?"
                markerColor={C.red}
                value={drop}
                onChange={setDrop}
                bias={bias}
                onFocus={() => setSelecting("drop")}
              />
            </View>
            <View style={styles.scheduleTitleRow}>
              <View>
                <Text style={styles.miniLabel}>PICKUP SCHEDULE</Text>
                <Text style={styles.scheduleHint}>Choose a date and time</Text>
              </View>
              <Text style={styles.calendarGlyph}>◫</Text>
            </View>
            <View style={styles.scheduleRow}>
              <Pressable
                onPress={() => setPicker("date")}
                style={styles.scheduleButton}
              >
                <Text style={styles.scheduleIcon}>◷</Text>
                <View>
                  <Text style={styles.scheduleLabel}>Date</Text>
                  <Text style={styles.scheduleValue}>
                    {prettyDate(schedule)}
                  </Text>
                </View>
              </Pressable>
              <Pressable
                onPress={() => setPicker("time")}
                style={styles.scheduleButton}
              >
                <Text style={styles.scheduleIcon}>◴</Text>
                <View>
                  <Text style={styles.scheduleLabel}>Time</Text>
                  <Text style={styles.scheduleValue}>
                    {prettyTime(schedule)}
                  </Text>
                </View>
              </Pressable>
            </View>
            {picker ? (
              <View>
                <DateTimePicker
                  value={schedule}
                  mode={picker}
                  minimumDate={picker === "date" ? new Date() : undefined}
                  display={Platform.OS === "ios" ? "spinner" : "default"}
                  onValueChange={changeSchedule}
                  onDismiss={() => setPicker(null)}
                />
                {Platform.OS === "ios" ? (
                  <Pressable
                    onPress={() => setPicker(null)}
                    style={styles.pickerDone}
                  >
                    <Text style={styles.pickerDoneText}>Done</Text>
                  </Pressable>
                ) : null}
              </View>
            ) : null}
          </Card>

          <View style={styles.sectionHead}>
            <View>
              <Text style={styles.sectionEyebrow}>OUR FLEET</Text>
              <Text style={styles.section}>Choose your ride</Text>
            </View>
            <Text style={styles.fleetCount}>{cars.length} available</Text>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.carList}
          >
            {cars.map((item) => {
              const active = selected === item.id;
              return (
                <Pressable
                  key={item.id}
                  onPress={() => setSelected(item.id)}
                  style={[styles.car, active && styles.carSelected]}
                >
                  <View>
                    <Image
                      source={{ uri: imageFor(item.imageUrl) }}
                      style={styles.carImage}
                    />
                    <View
                      style={[styles.carChoice, active && styles.carChoiceOn]}
                    >
                      <Text
                        style={[
                          styles.carChoiceText,
                          active && { color: "#fff" },
                        ]}
                      >
                        {active ? "✓" : "+"}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.carCopy}>
                    <Text style={styles.carName}>{item.name}</Text>
                    <Text style={styles.muted}>{item.type}</Text>
                    <View style={styles.carBottom}>
                      <Text style={styles.price}>
                        {"$" + Number(item.pricePerKm).toFixed(2)}
                      </Text>
                      <Text style={styles.perKm}> / km</Text>
                    </View>
                  </View>
                </Pressable>
              );
            })}
          </ScrollView>

          <View style={styles.sectionHead}>
            <View>
              <Text style={styles.sectionEyebrow}>ROUTE PREVIEW</Text>
              <Text style={styles.section}>Fine-tune on the map</Text>
            </View>
            <View style={styles.mapToggle}>
              <Pressable
                onPress={() => setSelecting("pickup")}
                style={[
                  styles.mapToggleItem,
                  selecting === "pickup" && styles.mapToggleOn,
                ]}
              >
                <Text
                  style={[
                    styles.mapToggleText,
                    selecting === "pickup" && styles.mapToggleTextOn,
                  ]}
                >
                  Pickup
                </Text>
              </Pressable>
              <Pressable
                onPress={() => setSelecting("drop")}
                style={[
                  styles.mapToggleItem,
                  selecting === "drop" && styles.mapToggleOn,
                ]}
              >
                <Text
                  style={[
                    styles.mapToggleText,
                    selecting === "drop" && styles.mapToggleTextOn,
                  ]}
                >
                  Drop
                </Text>
              </Pressable>
            </View>
          </View>
          <View style={styles.map}>
            <MapView
              ref={map}
              provider={PROVIDER_GOOGLE}
              style={{ flex: 1 }}
              initialRegion={{
                latitude: 34.5553,
                longitude: 69.2075,
                latitudeDelta: 0.12,
                longitudeDelta: 0.12,
              }}
              onPress={mapTap}
              showsUserLocation
            >
              {pickup.lat != null && pickup.lng != null ? (
                <Marker
                  coordinate={{ latitude: pickup.lat, longitude: pickup.lng }}
                  title="Pickup"
                  pinColor={C.blue}
                />
              ) : null}
              {drop.lat != null && drop.lng != null ? (
                <Marker
                  coordinate={{ latitude: drop.lat, longitude: drop.lng }}
                  title="Destination"
                  pinColor={C.red}
                />
              ) : null}
            </MapView>
            <View pointerEvents="none" style={styles.mapHint}>
              <Text style={styles.mapHintText}>Tap map to set {selecting}</Text>
            </View>
          </View>

          <Card style={styles.fareCard}>
            <View style={styles.fareTop}>
              <View>
                <Text style={styles.fareLabel}>ESTIMATED TOTAL</Text>
                <Text style={styles.farePrice}>{"$" + total.toFixed(2)}</Text>
                <Text style={styles.fareCaption}>
                  {car
                    ? car.name +
                      " · " +
                      Number(car.pricePerKm).toFixed(2) +
                      "/km"
                    : "Choose your vehicle"}
                </Text>
              </View>
              <View style={styles.distanceBox}>
                <Text style={styles.distanceValue}>
                  {km ? km.toFixed(1) : "—"}
                </Text>
                <Text style={styles.distanceLabel}>KM</Text>
              </View>
            </View>
            <View style={styles.divider} />
            <View style={styles.summaryRow}>
              <Text style={styles.summaryText}>
                ◫ {prettyDate(schedule)} at {prettyTime(schedule)}
              </Text>
              <Text style={styles.summaryText}>Upfront estimate</Text>
            </View>
            <View style={styles.notice}>
              <AlertBox message={notice?.message} type={notice?.type} />
            </View>
            <Button
              title={
                km
                  ? "Confirm ride · $" + total.toFixed(2)
                  : "Complete your route"
              }
              loading={loading}
              disabled={!km || !selected}
              onPress={book}
            />
            <Text style={styles.fareFoot}>
              No surprise fees. Final fare is confirmed before payment.
            </Text>
          </Card>
        </View>
      </ScrollView>
      <Modal
        visible={success}
        transparent
        animationType="fade"
        onRequestClose={closeSuccess}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.successCard}>
            <View style={styles.successIcon}>
              <Text style={styles.successCheck}>✓</Text>
            </View>
            <Text style={styles.successTitle}>Your ride is booked!</Text>
            <Text style={styles.successMessage}>
              We sent your request to the team. You can follow its status from
              My Rides.
            </Text>
            <View style={styles.successRoute}>
              <Text numberOfLines={2} style={styles.successPoint}>
                ● {completedRoute?.pickup}
              </Text>
              <View style={styles.successLine} />
              <Text
                numberOfLines={2}
                style={[styles.successPoint, { color: C.red }]}
              >
                ● {completedRoute?.drop}
              </Text>
            </View>
            <Button title="Great, got it" onPress={closeSuccess} />
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: C.bg },
  pageContent: { paddingBottom: 110 },
  hero: { height: 500, backgroundColor: C.navy, overflow: "hidden" },
  heroShade: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "rgba(2,6,23,.72)",
  },
  heroGlow: {
    position: "absolute",
    width: 310,
    height: 310,
    borderRadius: 155,
    backgroundColor: "rgba(37,99,235,.25)",
    right: -110,
    top: -70,
  },
  heroContent: {
    paddingHorizontal: 22,
    paddingTop: 50,
    justifyContent: "center",
    flex: 1,
  },
  heroPill: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: "rgba(96,165,250,.32)",
    backgroundColor: "rgba(30,64,175,.2)",
    borderRadius: 99,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  liveDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: "#4ade80" },
  heroPillText: {
    color: "#bfdbfe",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1.4,
  },
  heroTitle: {
    color: "#fff",
    fontSize: 42,
    lineHeight: 46,
    fontWeight: "900",
    letterSpacing: -1.6,
    marginTop: 22,
  },
  heroAccent: { color: "#60a5fa" },
  heroSub: {
    color: "#cbd5e1",
    fontSize: 16,
    lineHeight: 24,
    marginTop: 17,
    maxWidth: 340,
  },
  trustRow: { flexDirection: "row", flexWrap: "wrap", gap: 14, marginTop: 25 },
  trustItem: { flexDirection: "row", alignItems: "center", gap: 6 },
  trustCheck: { color: "#4ade80", fontWeight: "900" },
  trustText: { color: "#e2e8f0", fontSize: 12, fontWeight: "700" },
  body: { paddingHorizontal: 15, marginTop: -48, gap: 22 },
  planner: { padding: 20, borderRadius: 28 },
  stepRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12,
  },
  cardKicker: {
    color: C.blue,
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1.6,
  },
  heading: {
    fontSize: 25,
    lineHeight: 31,
    fontWeight: "900",
    color: C.text,
    letterSpacing: -0.6,
    marginTop: 5,
  },
  stepBadge: {
    width: 38,
    height: 38,
    borderRadius: 14,
    backgroundColor: C.blueSoft,
    alignItems: "center",
    justifyContent: "center",
  },
  stepNumber: { color: C.blue, fontWeight: "900", fontSize: 16 },
  locationButton: {
    marginTop: 18,
    minHeight: 64,
    borderRadius: 18,
    backgroundColor: C.blueSoft,
    borderWidth: 1,
    borderColor: "#dbeafe",
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
  },
  locationIcon: {
    width: 38,
    height: 38,
    borderRadius: 13,
    backgroundColor: C.blue,
    alignItems: "center",
    justifyContent: "center",
  },
  locationIconText: { color: "#fff", fontSize: 21, fontWeight: "900" },
  locationTitle: { color: C.blue, fontWeight: "900", fontSize: 14 },
  locationSub: { color: "#64748b", fontSize: 11, marginTop: 2 },
  chevron: { color: C.blue, fontSize: 26 },
  routeInputs: { marginTop: 20, gap: 15, position: "relative" },
  routeLine: {
    position: "absolute",
    left: 9,
    top: 49,
    bottom: 49,
    width: 2,
    backgroundColor: "#dbeafe",
  },
  scheduleTitleRow: {
    marginTop: 22,
    paddingTop: 18,
    borderTopWidth: 1,
    borderTopColor: "#eef2f7",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  miniLabel: {
    color: C.muted,
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1.2,
  },
  scheduleHint: { color: C.text, fontWeight: "800", marginTop: 4 },
  calendarGlyph: { color: C.blue, fontSize: 21 },
  scheduleRow: { flexDirection: "row", gap: 10, marginTop: 12 },
  scheduleButton: {
    flex: 1,
    minHeight: 68,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: C.line,
    backgroundColor: "#f8fafc",
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
  },
  scheduleIcon: { fontSize: 20, color: C.blue },
  scheduleLabel: {
    fontSize: 10,
    color: C.muted,
    fontWeight: "800",
    textTransform: "uppercase",
  },
  scheduleValue: {
    fontSize: 13,
    color: C.text,
    fontWeight: "900",
    marginTop: 4,
  },
  pickerDone: {
    alignSelf: "flex-end",
    backgroundColor: C.blueSoft,
    borderRadius: 12,
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  pickerDoneText: { color: C.blue, fontWeight: "900" },
  sectionHead: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    gap: 10,
    paddingHorizontal: 3,
  },
  sectionEyebrow: {
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1.5,
    color: C.blue,
  },
  section: {
    fontSize: 23,
    fontWeight: "900",
    color: C.text,
    letterSpacing: -0.5,
    marginTop: 4,
  },
  fleetCount: { color: C.muted, fontSize: 12, fontWeight: "700" },
  carList: { gap: 13, paddingHorizontal: 3, paddingVertical: 4 },
  car: {
    width: 220,
    borderRadius: 22,
    overflow: "hidden",
    backgroundColor: "#fff",
    borderWidth: 2,
    borderColor: "transparent",
    ...shadow,
  },
  carSelected: { borderColor: C.blue },
  carImage: { width: "100%", height: 125, backgroundColor: "#e2e8f0" },
  carChoice: {
    position: "absolute",
    right: 11,
    top: 11,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "rgba(255,255,255,.92)",
    alignItems: "center",
    justifyContent: "center",
  },
  carChoiceOn: { backgroundColor: C.blue },
  carChoiceText: { color: C.blue, fontWeight: "900", fontSize: 17 },
  carCopy: { padding: 14 },
  carName: { fontSize: 17, fontWeight: "900", color: C.text },
  muted: { color: C.muted, fontSize: 12, marginTop: 3 },
  carBottom: { flexDirection: "row", alignItems: "baseline", marginTop: 9 },
  price: { color: C.blue, fontSize: 17, fontWeight: "900" },
  perKm: { color: C.muted, fontSize: 11, fontWeight: "700" },
  mapToggle: {
    flexDirection: "row",
    backgroundColor: "#e9eef6",
    borderRadius: 12,
    padding: 3,
  },
  mapToggleItem: { paddingHorizontal: 9, paddingVertical: 7, borderRadius: 9 },
  mapToggleOn: { backgroundColor: "#fff", ...shadow },
  mapToggleText: { fontSize: 10, fontWeight: "900", color: C.muted },
  mapToggleTextOn: { color: C.blue },
  map: {
    height: 290,
    borderRadius: 26,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: C.line,
    ...shadow,
  },
  mapHint: {
    position: "absolute",
    top: 12,
    alignSelf: "center",
    backgroundColor: "rgba(2,6,23,.82)",
    borderRadius: 99,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  mapHintText: { color: "#fff", fontWeight: "800", fontSize: 11 },
  fareCard: {
    backgroundColor: C.navy,
    borderColor: C.navy,
    borderRadius: 28,
    padding: 21,
  },
  fareTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  fareLabel: {
    color: "#60a5fa",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1.5,
  },
  farePrice: {
    color: "#fff",
    fontSize: 38,
    fontWeight: "900",
    letterSpacing: -1.2,
    marginTop: 4,
  },
  fareCaption: { color: "#94a3b8", fontSize: 12, marginTop: 3 },
  distanceBox: {
    width: 72,
    height: 72,
    borderRadius: 22,
    backgroundColor: "rgba(37,99,235,.18)",
    borderWidth: 1,
    borderColor: "rgba(96,165,250,.25)",
    alignItems: "center",
    justifyContent: "center",
  },
  distanceValue: { color: "#fff", fontWeight: "900", fontSize: 19 },
  distanceLabel: {
    color: "#60a5fa",
    fontWeight: "900",
    fontSize: 9,
    letterSpacing: 1,
    marginTop: 2,
  },
  divider: { height: 1, backgroundColor: "#1e293b", marginVertical: 17 },
  summaryRow: { flexDirection: "row", justifyContent: "space-between", gap: 8 },
  summaryText: { color: "#94a3b8", fontSize: 11, fontWeight: "700" },
  notice: { marginTop: 14 },
  fareFoot: {
    color: "#64748b",
    fontSize: 10,
    textAlign: "center",
    marginTop: 11,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(2,6,23,.72)",
    alignItems: "center",
    justifyContent: "center",
    padding: 22,
  },
  successCard: {
    width: "100%",
    maxWidth: 390,
    borderRadius: 30,
    backgroundColor: "#fff",
    padding: 24,
    ...shadow,
  },
  successIcon: {
    width: 68,
    height: 68,
    borderRadius: 24,
    backgroundColor: C.greenSoft,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
  },
  successCheck: { color: C.green, fontSize: 34, fontWeight: "900" },
  successTitle: {
    textAlign: "center",
    fontSize: 25,
    fontWeight: "900",
    color: C.text,
    marginTop: 17,
  },
  successMessage: {
    textAlign: "center",
    color: C.muted,
    lineHeight: 21,
    marginTop: 8,
  },
  successRoute: {
    marginVertical: 20,
    borderRadius: 18,
    backgroundColor: "#f8fafc",
    padding: 15,
  },
  successPoint: { fontSize: 12, color: C.blue, fontWeight: "700" },
  successLine: {
    height: 18,
    width: 2,
    backgroundColor: C.line,
    marginLeft: 4,
    marginVertical: 3,
  },
});
