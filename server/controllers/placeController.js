const GOOGLE_PLACES_URL = "https://maps.googleapis.com/maps/api/place";

const mapsKey = () => process.env.GOOGLE_PLACES_API_KEY || process.env.GOOGLE_MAPS_API_KEY;

const googleRequest = async (path, params) => {
  const key = mapsKey();
  if (!key) {
    const error = new Error("Place suggestions are not configured. Add GOOGLE_PLACES_API_KEY to the server environment.");
    error.status = 503;
    throw error;
  }
  const query = new URLSearchParams({ ...params, key });
  const response = await fetch(`${GOOGLE_PLACES_URL}/${path}/json?${query}`, { signal: AbortSignal.timeout(8000) });
  if (!response.ok) throw new Error("Google Places could not be reached");
  const data = await response.json();
  if (!["OK", "ZERO_RESULTS"].includes(data.status)) {
    const error = new Error(data.status === "REQUEST_DENIED"
      ? "Google rejected the Places key. Enable Places API and check its server-key restrictions."
      : "Place suggestions are temporarily unavailable.");
    error.status = 502;
    throw error;
  }
  return data;
};

exports.autocomplete = async (req, res) => {
  try {
    const { input, sessionToken, language, lat, lng } = req.validated.query;
    const params = { input, language };
    if (sessionToken) params.sessiontoken = sessionToken;
    if (lat != null && lng != null) {
      params.location = `${lat},${lng}`;
      params.radius = "50000";
    }
    const data = await googleRequest("autocomplete", params);
    res.json({ suggestions: (data.predictions || []).map((place) => ({
      placeId: place.place_id,
      description: place.description,
      primaryText: place.structured_formatting?.main_text || place.description,
      secondaryText: place.structured_formatting?.secondary_text || "",
    })) });
  } catch (error) {
    res.status(error.status || 500).json({ message: error.message || "Could not find places" });
  }
};

exports.details = async (req, res) => {
  try {
    const { placeId, sessionToken, language } = req.validated.query;
    const params = { place_id: placeId, fields: "formatted_address,geometry,name", language };
    if (sessionToken) params.sessiontoken = sessionToken;
    const data = await googleRequest("details", params);
    const location = data.result?.geometry?.location;
    if (!location) return res.status(404).json({ message: "That place has no map location" });
    res.json({ address: data.result.formatted_address || data.result.name, lat: location.lat, lng: location.lng });
  } catch (error) {
    res.status(error.status || 500).json({ message: error.message || "Could not load place details" });
  }
};
