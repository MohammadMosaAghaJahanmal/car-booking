import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { api, messageFrom } from "@/lib/api";
import { C, shadow } from "@/constants/app-theme";

export type PlacePoint = {
  address: string;
  lat: number | null;
  lng: number | null;
};
type Suggestion = {
  placeId: string;
  description: string;
  primaryText: string;
  secondaryText: string;
};

type Props = {
  label: string;
  placeholder: string;
  markerColor: string;
  value: PlacePoint;
  onChange: (point: PlacePoint) => void;
  bias?: { lat: number; lng: number } | null;
  onFocus?: () => void;
};

const sessionId = () =>
  Math.random().toString(36).slice(2) + Date.now().toString(36);

export function PlaceAutocomplete({
  label,
  placeholder,
  markerColor,
  value,
  onChange,
  bias,
  onFocus,
}: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [selecting, setSelecting] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState("");
  const session = useRef(sessionId());

  useEffect(() => {
    const input = query.trim();
    if (!open || input.length < 2) return;
    let active = true;
    const timer = setTimeout(async () => {
      try {
        setLoading(true);
        setError("");
        const { data } = await api.get("/places/autocomplete", {
          params: {
            input,
            sessionToken: session.current,
            ...(bias ? { lat: bias.lat, lng: bias.lng } : {}),
          },
        });
        if (!active) return;
        setSuggestions(data.suggestions || []);
        setSearched(true);
      } catch (requestError) {
        if (!active) return;
        setSuggestions([]);
        setSearched(true);
        setError(
          messageFrom(
            requestError,
            "Place suggestions are unavailable. Try again or choose the point on the map.",
          ),
        );
      } finally {
        if (active) setLoading(false);
      }
    }, 300);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [bias, open, query]);

  const showSearch = () => {
    session.current = sessionId();
    setQuery(value.lat == null ? value.address : "");
    setSuggestions([]);
    setSearched(false);
    setError("");
    setOpen(true);
    onFocus?.();
  };

  const updateQuery = (text: string) => {
    setQuery(text);
    setSuggestions([]);
    setSearched(false);
    setError("");
  };

  const choose = async (item: Suggestion) => {
    try {
      setSelecting(true);
      setError("");
      const { data } = await api.get("/places/details", {
        params: { placeId: item.placeId, sessionToken: session.current },
      });
      onChange({
        address: data.address || item.description,
        lat: Number(data.lat),
        lng: Number(data.lng),
      });
      setOpen(false);
    } catch (requestError) {
      setError(
        messageFrom(
          requestError,
          "Could not select that place. Please tap it again.",
        ),
      );
    } finally {
      setSelecting(false);
    }
  };

  const clear = () => {
    onChange({ address: "", lat: null, lng: null });
    setQuery("");
    setSuggestions([]);
    setSearched(false);
  };

  const helper =
    query.trim().length < 2
      ? "Type at least 2 characters to see matching places."
      : searched && !loading && !suggestions.length && !error
        ? "No matching places found. Try a nearby landmark or a broader name."
        : "";

  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{label}</Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Search ${label}`}
        onPress={showSearch}
        style={({ pressed }) => [
          styles.inputShell,
          pressed && styles.inputPressed,
        ]}
      >
        <View style={[styles.marker, { borderColor: markerColor }]}>
          <View style={[styles.markerDot, { backgroundColor: markerColor }]} />
        </View>
        <View style={styles.displayCopy}>
          <Text
            numberOfLines={1}
            style={value.address ? styles.displayValue : styles.placeholder}
          >
            {value.address || placeholder}
          </Text>
          {value.lat != null ? (
            <Text style={styles.selectedHint}>
              Selected place - tap to change
            </Text>
          ) : (
            <Text style={styles.searchHint}>Tap to search places</Text>
          )}
        </View>
        {value.address ? (
          <Pressable
            accessibilityLabel={`Clear ${label}`}
            onPress={(event) => {
              event.stopPropagation();
              clear();
            }}
            hitSlop={10}
            style={styles.clearButton}
          >
            <Text style={styles.clear}>X</Text>
          </Pressable>
        ) : (
          <Text style={styles.arrow}>›</Text>
        )}
      </Pressable>

      <Modal
        visible={open}
        animationType="slide"
        presentationStyle={Platform.OS === "ios" ? "pageSheet" : "fullScreen"}
        onRequestClose={() => setOpen(false)}
      >
        <SafeAreaView style={styles.sheet} edges={["top", "bottom"]}>
          <View style={styles.sheetHeader}>
            <Pressable
              onPress={() => setOpen(false)}
              hitSlop={12}
              style={styles.backButton}
            >
              <Text style={styles.backText}>‹</Text>
            </Pressable>
            <View style={styles.sheetHeading}>
              <Text style={styles.sheetKicker}>SEARCH LOCATION</Text>
              <Text style={styles.sheetTitle}>{label}</Text>
            </View>
            <View style={styles.headerSpacer} />
          </View>
          <View style={styles.sheetBody}>
            <View style={styles.searchShell}>
              <Text style={styles.searchIcon}>⌕</Text>
              <TextInput
                autoFocus
                value={query}
                onChangeText={updateQuery}
                placeholder={placeholder}
                placeholderTextColor="#94a3b8"
                autoCorrect={false}
                returnKeyType="search"
                style={styles.searchInput}
              />
              {loading || selecting ? (
                <ActivityIndicator size="small" color={C.blue} />
              ) : query ? (
                <Pressable onPress={() => updateQuery("")} hitSlop={10}>
                  <Text style={styles.searchClear}>X</Text>
                </Pressable>
              ) : null}
            </View>
            <View style={styles.contextRow}>
              <View
                style={[styles.contextDot, { backgroundColor: markerColor }]}
              />
              <Text style={styles.contextText}>
                Choose a suggestion to save its exact map location
              </Text>
            </View>
            {error ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorTitle}>
                  Suggestions could not load
                </Text>
                <Text style={styles.error}>{error}</Text>
              </View>
            ) : null}
            <FlatList
              data={suggestions}
              keyExtractor={(item) => item.placeId}
              keyboardShouldPersistTaps="always"
              keyboardDismissMode="on-drag"
              contentContainerStyle={styles.list}
              renderItem={({ item }) => (
                <Pressable
                  onPress={() => choose(item)}
                  disabled={selecting}
                  style={({ pressed }) => [
                    styles.suggestion,
                    pressed && styles.suggestionPressed,
                  ]}
                >
                  <View style={styles.pin}>
                    <Text style={styles.pinText}>●</Text>
                  </View>
                  <View style={styles.suggestionCopy}>
                    <Text numberOfLines={1} style={styles.primary}>
                      {item.primaryText}
                    </Text>
                    {item.secondaryText ? (
                      <Text numberOfLines={2} style={styles.secondary}>
                        {item.secondaryText}
                      </Text>
                    ) : null}
                  </View>
                  <Text style={styles.rowArrow}>›</Text>
                </Pressable>
              )}
              ListEmptyComponent={
                !error ? (
                  <View style={styles.empty}>
                    <View style={styles.emptyIcon}>
                      <Text style={styles.emptyIconText}>⌖</Text>
                    </View>
                    <Text style={styles.emptyTitle}>
                      {query.trim().length < 2
                        ? "Where should we go?"
                        : searched && !loading
                          ? "No places found"
                          : loading
                            ? "Finding places nearby..."
                            : "Start typing a place"}
                    </Text>
                    <Text style={styles.emptyText}>{helper}</Text>
                  </View>
                ) : null
              }
              ListFooterComponent={
                suggestions.length ? (
                  <Text style={styles.google}>Powered by Google</Text>
                ) : null
              }
            />
          </View>
        </SafeAreaView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 7 },
  label: {
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 1,
    color: C.muted,
    textTransform: "uppercase",
  },
  inputShell: {
    minHeight: 64,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: C.line,
    backgroundColor: "#f8fafc",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 15,
  },
  inputPressed: { borderColor: "#60a5fa", backgroundColor: "#fff" },
  marker: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  markerDot: { width: 6, height: 6, borderRadius: 3 },
  displayCopy: { flex: 1, paddingHorizontal: 12 },
  displayValue: { fontSize: 14, color: C.text, fontWeight: "800" },
  placeholder: { fontSize: 15, color: "#94a3b8", fontWeight: "600" },
  selectedHint: {
    fontSize: 10,
    color: C.green,
    fontWeight: "700",
    marginTop: 3,
  },
  searchHint: { fontSize: 10, color: C.muted, fontWeight: "600", marginTop: 3 },
  clearButton: {
    width: 30,
    height: 30,
    borderRadius: 10,
    backgroundColor: "#e2e8f0",
    alignItems: "center",
    justifyContent: "center",
  },
  clear: { color: C.muted, fontSize: 11, fontWeight: "900" },
  arrow: { color: "#94a3b8", fontSize: 25 },
  sheet: { flex: 1, backgroundColor: C.navy },
  sheetBody: {
    flex: 1,
    backgroundColor: "#fff",
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    overflow: "hidden",
  },
  sheetHeader: {
    height: 78,
    borderBottomWidth: 0,
    borderBottomColor: C.navy,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 15,
    backgroundColor: "rgba(255,255,255,.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  backText: { fontSize: 31, lineHeight: 34, color: "#fff" },
  sheetHeading: { flex: 1, alignItems: "center" },
  sheetKicker: {
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 1.4,
    color: C.blue,
  },
  sheetTitle: { fontSize: 19, fontWeight: "900", color: "#fff", marginTop: 2 },
  headerSpacer: { width: 44 },
  searchShell: {
    margin: 16,
    marginBottom: 10,
    minHeight: 60,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: "#bfdbfe",
    backgroundColor: "#f8fafc",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 15,
    ...shadow,
  },
  searchIcon: { fontSize: 24, color: C.blue },
  searchInput: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 15,
    fontSize: 16,
    color: C.text,
    fontWeight: "700",
  },
  searchClear: { color: C.muted, fontSize: 12, fontWeight: "900", padding: 8 },
  contextRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  contextDot: { width: 7, height: 7, borderRadius: 4 },
  contextText: { fontSize: 11, color: C.muted, fontWeight: "600" },
  list: { paddingHorizontal: 16, paddingBottom: 28, flexGrow: 1 },
  suggestion: {
    minHeight: 76,
    borderBottomWidth: 1,
    borderBottomColor: "#eef2f7",
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 10,
  },
  suggestionPressed: {
    backgroundColor: C.blueSoft,
    borderRadius: 16,
    paddingHorizontal: 8,
  },
  pin: {
    width: 42,
    height: 42,
    borderRadius: 15,
    backgroundColor: C.blueSoft,
    alignItems: "center",
    justifyContent: "center",
  },
  pinText: { color: C.blue, fontSize: 16 },
  suggestionCopy: { flex: 1 },
  primary: { color: C.text, fontWeight: "900", fontSize: 15 },
  secondary: { color: C.muted, fontSize: 12, lineHeight: 17, marginTop: 4 },
  rowArrow: { color: "#94a3b8", fontSize: 26 },
  google: {
    textAlign: "center",
    color: "#94a3b8",
    fontWeight: "700",
    fontSize: 10,
    paddingTop: 18,
  },
  empty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 28,
    paddingBottom: 80,
  },
  emptyIcon: {
    width: 70,
    height: 70,
    borderRadius: 25,
    backgroundColor: C.blueSoft,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyIconText: { fontSize: 31, color: C.blue },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "900",
    color: C.text,
    marginTop: 17,
    textAlign: "center",
  },
  emptyText: {
    fontSize: 13,
    lineHeight: 20,
    color: C.muted,
    textAlign: "center",
    marginTop: 7,
  },
  errorBox: {
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#fecdd3",
    backgroundColor: C.redSoft,
    padding: 14,
  },
  errorTitle: { color: C.red, fontWeight: "900", fontSize: 13 },
  error: {
    color: C.red,
    fontSize: 12,
    lineHeight: 18,
    fontWeight: "600",
    marginTop: 3,
  },
});
