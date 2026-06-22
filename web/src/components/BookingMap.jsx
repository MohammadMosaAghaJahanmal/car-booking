import { Map, Marker, useMap } from "@vis.gl/react-google-maps";
import { useEffect } from "react";

function RouteLine({ form, setForm }) {
  const map = useMap();

  useEffect(() => {
    if (!map || !form.pickupLat || !form.dropLat) return;

    const directionsService = new google.maps.DirectionsService();
    const directionsRenderer = new google.maps.DirectionsRenderer({
      suppressMarkers: true,
    });

    directionsRenderer.setMap(map);

    directionsService.route(
      {
        origin: {
          lat: Number(form.pickupLat),
          lng: Number(form.pickupLng),
        },
        destination: {
          lat: Number(form.dropLat),
          lng: Number(form.dropLng),
        },
        travelMode: google.maps.TravelMode.DRIVING,
      },
      (result, status) => {
        if (status === "OK") {
          directionsRenderer.setDirections(result);

          const route = result.routes[0].legs[0];

          const distanceKm = route.distance.value / 1000;

          setForm((prev) => ({
            ...prev,
            distanceKm: distanceKm.toFixed(2),
          }));
        }
      }
    );

    return () => {
      directionsRenderer.setMap(null);
    };
  }, [map, form.pickupLat, form.pickupLng, form.dropLat, form.dropLng]);

  return null;
}

function BookingMap({ form, setForm, selecting }) {
  const center = form.pickupLat
  ? {
      lat: Number(form.pickupLat),
      lng: Number(form.pickupLng),
    }
  : { lat: 49.1659, lng: -123.9401 };

  const handleClick = (e) => {
    const lat = e.detail.latLng.lat;
    const lng = e.detail.latLng.lng;

    if (selecting === "pickup") {
      setForm((prev) => ({
        ...prev,
        pickupLat: lat,
        pickupLng: lng,
        pickupAddress: `Lat: ${lat}, Lng: ${lng}`,
      }));
    }

    if (selecting === "drop") {
      setForm((prev) => ({
        ...prev,
        dropLat: lat,
        dropLng: lng,
        dropAddress: `Lat: ${lat}, Lng: ${lng}`,
      }));
    }
  };

  return (
    <div className="h-[400px] rounded-2xl overflow-hidden shadow">
      <Map defaultCenter={center} defaultZoom={12} onClick={handleClick}>
        {form.pickupLat && (
          <Marker
            position={{
              lat: Number(form.pickupLat),
              lng: Number(form.pickupLng),
            }}
          />
        )}

        {form.dropLat && (
          <Marker
            position={{
              lat: Number(form.dropLat),
              lng: Number(form.dropLng),
            }}
          />
        )}

        <RouteLine form={form} setForm={setForm} />
      </Map>
    </div>
  );
}

export default BookingMap;