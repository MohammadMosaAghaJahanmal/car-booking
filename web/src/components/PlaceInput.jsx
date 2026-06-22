import { useEffect, useRef } from "react";
import { useMapsLibrary } from "@vis.gl/react-google-maps";

function PlaceInput({ label, name, latName, lngName, form, setForm, required }) {
  const inputRef = useRef(null);
  const places = useMapsLibrary("places");

  useEffect(() => {
    if (!places || !inputRef.current) return;

    const autocomplete = new places.Autocomplete(inputRef.current, {
      fields: ["formatted_address", "geometry"],
    });

    const listener = autocomplete.addListener("place_changed", () => {
      const place = autocomplete.getPlace();

      if (!place.geometry) return;

      setForm((prev) => ({
        ...prev,
        [name]: place.formatted_address,
        [latName]: place.geometry.location.lat(),
        [lngName]: place.geometry.location.lng(),
      }));
    });

    return () => {
      listener.remove();
    };
  }, [places, name, latName, lngName, setForm, required]);

  return (
    <input
      ref={inputRef}
      placeholder={label}
      value={form[name] || ""}
      onChange={(e) =>
        setForm((prev) => ({
          ...prev,
          [name]: e.target.value,
        }))
      }
      className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3.5 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
      required={required}
    />
  );
}

export default PlaceInput;