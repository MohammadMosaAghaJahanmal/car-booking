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
      className="w-full border p-3 rounded-lg"
      required={required}
    />
  );
}

export default PlaceInput;