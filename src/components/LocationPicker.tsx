import { useRef, useEffect } from "react";
import { MapPin } from "lucide-react";

interface LocationPickerProps {
  value: string;
  onChange: (address: string, placeDetails?: any) => void;
  placeholder?: string;
  disabled?: boolean;
}

/**
 * LocationPicker component using Google Address Selection widget.
 * Provides an embedded address picker iframe that handles full address selection
 * with proper autocomplete and validation.
 */
export default function LocationPicker({
  value,
  onChange,
  placeholder = "Select a location or address",
  disabled = false,
}: LocationPickerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    // Listen for messages from the iframe (address selection)
    const handleMessage = (event: MessageEvent) => {
      // Verify origin for security (adjust if needed for different deployment)
      if (!event.origin.includes("maps-solutions")) {
        return;
      }

      const data = event.data;
      console.log("[LocationPicker] Message received from iframe:", data);

      // Address Selection widget sends data when address is selected
      if (data && typeof data === "object") {
        const address = data.address || data.formatted_address || "";
        const placeDetails = {
          formattedAddress: address,
          addressComponents: data.address_components || [],
          location: data.location || { lat: null, lng: null },
          name: data.name || "",
          rawData: data,
        };

        console.log(
          "[LocationPicker] Address selected:",
          address,
          placeDetails
        );
        onChange(address, placeDetails);
      }
    };

    window.addEventListener("message", handleMessage);

    return () => {
      window.removeEventListener("message", handleMessage);
    };
  }, [onChange]);

  return (
    <div className="space-y-2">
      <div
        ref={containerRef}
        className="relative border border-input rounded-md overflow-hidden bg-background"
      >
        {/* Google Address Selection Widget Iframe */}
        <iframe
          ref={iframeRef}
          src="https://storage.googleapis.com/maps-solutions-psi6v635f6/address-selection/rgyo/address-selection.html"
          width="100%"
          height="100%"
          style={{
            border: "0",
            minHeight: "400px",
            display: disabled ? "none" : "block",
          }}
          loading="lazy"
          title="Address Selection Widget"
          allow="geolocation *"
        />

        {disabled && (
          <div className="p-4 text-sm text-muted-foreground flex items-center gap-2 min-h-[80px] bg-muted/50">
            <MapPin className="h-4 w-4" />
            <span>Location selection is disabled</span>
          </div>
        )}
      </div>

      {/* Helper text */}
      <p className="text-xs text-muted-foreground">
        Search and select your location or address using the map-based picker.
      </p>
    </div>
  );
}
