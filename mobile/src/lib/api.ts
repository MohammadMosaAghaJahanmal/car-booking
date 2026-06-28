import { create, isAxiosError } from "axios";
import { Platform } from "react-native";
import { storage } from "./storage";

const fallbackHost =
  Platform.OS === "android" ? "http://10.0.2.2:5000" : "http://localhost:5000";
const configured = process.env.EXPO_PUBLIC_API_URL || fallbackHost;
export const SERVER_URL = configured.endsWith("/api")
  ? configured.slice(0, -4)
  : configured.replace(/\/$/, "");
export const API_URL = SERVER_URL + "/api";
export const assetUrl = (value?: string | null) => {
  if (!value) return "";
  if (value.startsWith("/")) return SERVER_URL + value;
  try {
    const parsed = new URL(value);
    if (["localhost", "127.0.0.1", "10.0.2.2"].includes(parsed.hostname))
      return SERVER_URL + parsed.pathname;
  } catch {}
  return value;
};

export const api = create({ baseURL: API_URL, timeout: 15000 });
api.interceptors.request.use(async (config) => {
  const token = await storage.getItemAsync("token");
  if (token) config.headers.Authorization = "Bearer " + token;
  return config;
});
export const messageFrom = (
  error: unknown,
  fallback = "Something went wrong. Please try again.",
) => {
  if (isAxiosError(error)) {
    if (error.code === "ECONNABORTED")
      return "The server took too long to respond at " + SERVER_URL + ".";
    if (!error.response)
      return (
        "Cannot reach the server at " +
        SERVER_URL +
        ". Keep the phone and computer on the same Wi-Fi, start the API, and allow port 5000 through the firewall."
      );
    return error.response.data?.message || fallback;
  }
  return fallback;
};
