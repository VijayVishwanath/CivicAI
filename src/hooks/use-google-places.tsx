import { useEffect } from "react";

type PlaceResult = any;

/**
 * Ensure Google Maps JS API script is loaded.
 * This loads the main Maps API script which is required before importing places library.
 */
function ensureGoogleMapsScript(apiKey: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (!apiKey) {
      reject(new Error("Google Maps API key is not provided."));
      return;
    }

    const google = (window as any).google;

    // If already loaded, resolve immediately
    if (google?.maps) {
      resolve();
      return;
    }

    // Check if script is already being loaded
    const existingScript = document.querySelector(
      'script[src*="maps.googleapis.com/maps/api/js"]'
    );

    if (existingScript) {
      // Script exists, wait for it to load
      if (existingScript.hasAttribute("data-loaded")) {
        resolve();
      } else {
        existingScript.addEventListener("load", () => {
          existingScript.setAttribute("data-loaded", "true");
          resolve();
        });
        existingScript.addEventListener("error", () => {
          reject(new Error("Failed to load Google Maps API"));
        });
      }
      return;
    }

    // Create and append the script
    const script = document.createElement("script");
  script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}`;
    script.async = true;
    script.defer = true;

    script.addEventListener("load", () => {
      script.setAttribute("data-loaded", "true");
      resolve();
    });

    script.addEventListener("error", () => {
      reject(new Error("Failed to load Google Maps API"));
    });

    document.head.appendChild(script);
  });
}

/**
 * Initialize Google Maps API and load the places library.
 * Uses the modern Maps JS API with dynamic library imports.
 */
async function initGoogleMaps(apiKey: string): Promise<any> {
  // First ensure the main Maps API script is loaded
  await ensureGoogleMapsScript(apiKey);

  const google = (window as any).google;

  if (!google?.maps) {
    throw new Error("Google Maps API not loaded.");
  }

  // Import the places library dynamically
  const placesLibrary = await google.maps.importLibrary("places");
  return placesLibrary;
}

/**
 * Hook to attach a Google Places Autocomplete web component and handle place selection.
 *
 * Creates a PlaceAutocompleteElement web component, appends it to a container,
 * and listens for 'gmp-select' events to get the selected place details.
 *
 * Usage:
 *  const containerRef = useRef<HTMLDivElement>(null);
 *  useGooglePlacesAutocomplete(
 *    containerRef,
 *    (place) => setLocation(place.formattedAddress),
 *    { includedRegionCodes: ['in'] }
 *  );
 */
export function useGooglePlacesAutocomplete(
  containerRef: React.RefObject<HTMLDivElement>,
  onPlaceSelected: (place: PlaceResult) => void,
  options?: {
    includedRegionCodes?: string[];
    includedPrimaryTypes?: string[];
  },
) {
  useEffect(() => {
    if (!containerRef?.current) return;

    let autocompleteElement: any = null;
    let listener: any = null;
    let mounted = true;

    const initializeAutocomplete = async () => {
      try {
  const apiKey = "AIzaSyAnwXmR3_GgSbs5TFXmm5L88E2AzWxFD_M";
  const placesLibrary = await initGoogleMaps(apiKey);
        
        if (!mounted || !containerRef.current) return;

        const google = (window as any).google;

        // Create the PlaceAutocompleteElement web component
        autocompleteElement = new google.maps.places.PlaceAutocompleteElement({
          includedRegionCodes: options?.includedRegionCodes || [],
          includedPrimaryTypes: options?.includedPrimaryTypes || [],
        });

        // Append to the container
        containerRef.current.appendChild(autocompleteElement);

        // Listen for the gmp-select event (place selection)
        // @ts-ignore - web component event
        listener = autocompleteElement.addEventListener("gmp-select", async (event: any) => {
          const { placePrediction } = event;
          if (placePrediction) {
            try {
              const place = placePrediction.toPlace();
              // Fetch the fields we need
              await place.fetchFields({
                fields: ["displayName", "formattedAddress", "location", "addressComponents"],
              });
              onPlaceSelected(place);
            } catch (err) {
              // console.warn("Error fetching place details:", err);
            }
          }
        });
      } catch (err) {
        // Fail silently - the app should still work
        // console.warn("Google Places Autocomplete init failed:", err);
      }
    };

    // Load the API asynchronously
    const controller = new AbortController();
    initializeAutocomplete().catch(() => {
      // Silently fail
    });

    return () => {
      mounted = false;
      controller.abort();
      try {
        if (autocompleteElement?.parentNode) {
          autocompleteElement.parentNode.removeChild(autocompleteElement);
        }
      } catch (e) {}
    };
  }, [containerRef, onPlaceSelected, options?.includedRegionCodes, options?.includedPrimaryTypes]);
}

export default useGooglePlacesAutocomplete;
