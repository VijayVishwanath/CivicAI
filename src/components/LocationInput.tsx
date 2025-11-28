import { useRef, useState, useEffect, useCallback } from "react";
import { MapPin, Loader2, AlertCircle, X } from "lucide-react";

interface LocationInputProps {
  value: string;
  onChange: (value: string, placeDetails?: any) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  includedRegionCodes?: string[];
}

/**
 * LocationInput component using Google Places Autocomplete Service.
 * Fixed version: properly handles controlled input without freezing.
 */
export default function LocationInput({
  value,
  onChange,
  placeholder = "Search location or area...",
  className = "",
  disabled = false,
  includedRegionCodes = ["in"],
}: LocationInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [predictions, setPredictions] = useState<any[]>([]);
  const [showPredictions, setShowPredictions] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [inputValue, setInputValue] = useState(value);
  const autocompleteServiceRef = useRef<any>(null);
  const placesServiceRef = useRef<any>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout>();

  // Initialize Google Places Autocomplete Service
  useEffect(() => {
    if (disabled) return;

    let isMounted = true;

    const initAutocompleteService = async () => {
      try {
        // Remove usage of VITE_GOOGLE_MAPS_API_KEY

        // Ensure Google Maps API is loaded
        if (!(window as any).google?.maps) {
          console.log("[LocationInput] Loading Google Maps API script...");

          await new Promise<void>((resolve, reject) => {
            if ((window as any).google?.maps) {
              resolve();
              return;
            }

            const script = document.createElement("script");
            // Remove apiKey usage since VITE_GOOGLE_MAPS_API_KEY is removed
            script.src = `https://maps.googleapis.com/maps/api/js?libraries=places`;
            script.async = true;
            script.defer = false;

            script.onload = () => {
              console.log("[LocationInput] Google Maps API loaded successfully");
              resolve();
            };

            script.onerror = () => {
              console.error("[LocationInput] Failed to load Google Maps API");
              reject(new Error("Failed to load Google Maps API"));
            };

            document.head.appendChild(script);
          });
        }

        const google = (window as any).google;

        if (!isMounted) return;

        console.log("[LocationInput] Creating Autocomplete Service...");
        const autocompleteService = new google.maps.places.AutocompleteService();
        const placesService = new google.maps.places.PlacesService(
          document.createElement("div")
        );

        if (isMounted) {
          autocompleteServiceRef.current = autocompleteService;
          placesServiceRef.current = placesService;
          setApiError(null);
          console.log("[LocationInput] Autocomplete Service initialized successfully");
        }
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        console.error("[LocationInput] Init error:", errorMsg);
        if (isMounted) {
          setApiError(errorMsg);
        }
      }
    };

    initAutocompleteService();

    return () => {
      isMounted = false;
    };
  }, [disabled]);

  // Sync external value with internal state
  useEffect(() => {
    setInputValue(value);
  }, [value]);

  // Fetch predictions with debounce
  const fetchPredictions = useCallback(async (query: string) => {
    if (!query.trim()) {
      setPredictions([]);
      setShowPredictions(false);
      return;
    }

    if (!autocompleteServiceRef.current) {
      console.warn("[LocationInput] Autocomplete service not ready");
      return;
    }

    try {
      setIsLoading(true);
      console.log(`[LocationInput] Fetching predictions for: "${query}"`);

      const response = await autocompleteServiceRef.current.getPlacePredictions({
        input: query,
        componentRestrictions: {
          country: includedRegionCodes,
        },
      });

      if (response.predictions && response.predictions.length > 0) {
        console.log(`[LocationInput] Got ${response.predictions.length} predictions`);
        setPredictions(response.predictions);
        setShowPredictions(true);
      } else {
        console.log("[LocationInput] No predictions found");
        setPredictions([]);
        setShowPredictions(true);
      }
      setIsLoading(false);
    } catch (err) {
      console.error("[LocationInput] Error fetching predictions:", err);
      setPredictions([]);
      setIsLoading(false);
    }
  }, [includedRegionCodes]);

  // Handle local input change with debounce
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    onChange(newValue); // Always update parent immediately

    // Debounce prediction fetching
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      fetchPredictions(newValue);
    }, 300);
  };

  // Handle prediction selection
  const handleSelectPrediction = async (prediction: any) => {
    console.log("[LocationInput] Prediction selected:", prediction.main_text);

    setInputValue(prediction.description);
    onChange(prediction.description);
    setShowPredictions(false);
    setPredictions([]);

    if (!placesServiceRef.current || !prediction.place_id) {
      console.log("[LocationInput] No place_id available");
      return;
    }

    try {
      setIsLoading(true);
      console.log("[LocationInput] Fetching place details...");

      placesServiceRef.current.getDetails(
        {
          placeId: prediction.place_id,
          fields: [
            "name",
            "formatted_address",
            "geometry",
            "address_components",
          ],
        },
        (place: any, status: any) => {
          const google = (window as any).google;
          if (status === google.maps.places.PlacesServiceStatus.OK) {
            console.log("[LocationInput] Place details fetched:", place.formatted_address);

            // Update with full formatted address
            setInputValue(place.formatted_address);
            onChange(place.formatted_address, {
              formattedAddress: place.formatted_address,
              location: {
                lat: place.geometry?.location?.lat(),
                lng: place.geometry?.location?.lng(),
              },
              addressComponents: place.address_components,
              name: place.name,
            });

            setIsLoading(false);
          } else {
            console.error("[LocationInput] PlacesService error:", status);
            setIsLoading(false);
          }
        }
      );
    } catch (err) {
      console.error("[LocationInput] Error fetching place details:", err);
      setIsLoading(false);
    }
  };

  // Close predictions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setShowPredictions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
  }, []);

  return (
    <div className="space-y-2">
      {/* Error message */}
      {apiError && (
        <div className="flex items-start gap-2 text-sm text-red-600 bg-red-50 dark:bg-red-950/20 p-2 rounded">
          <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <p className="font-medium">Location Service Error</p>
            <p className="text-xs">{apiError}</p>
          </div>
        </div>
      )}

      {/* Input field */}
      <div ref={containerRef} className="relative">
        <div className="relative flex items-center">
          <MapPin className="absolute left-3 h-4 w-4 text-muted-foreground pointer-events-none" />
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={handleInputChange}
            placeholder={placeholder}
            disabled={disabled || isLoading}
            className={`pl-10 pr-10 flex h-10 w-full rounded-md border border-input bg-background py-2 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm ${className}`}
            aria-label="Location or Ward"
            autoComplete="off"
          />

          {/* Clear button */}
          {inputValue && (
            <button
              onClick={() => {
                setInputValue("");
                onChange("");
                setPredictions([]);
                setShowPredictions(false);
                inputRef.current?.focus();
              }}
              className="absolute right-3 text-muted-foreground hover:text-foreground cursor-pointer"
              aria-label="Clear location"
              type="button"
            >
              <X className="h-4 w-4" />
            </button>
          )}

          {/* Loading indicator */}
          {isLoading && (
            <div className="absolute right-3">
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            </div>
          )}
        </div>

        {/* Predictions dropdown */}
        {showPredictions && predictions.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-slate-900 border border-input rounded-md shadow-lg z-50 max-h-72 overflow-y-auto">
            {predictions.map((prediction, index) => (
              <button
                key={`${index}-${prediction.place_id}`}
                onClick={() => handleSelectPrediction(prediction)}
                className="w-full text-left px-4 py-3 hover:bg-slate-100 dark:hover:bg-slate-800 border-b last:border-b-0 text-sm transition-colors flex items-start gap-3"
                type="button"
              >
                <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0 text-muted-foreground" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{prediction.main_text}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {prediction.secondary_text}
                  </p>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* No results message */}
        {showPredictions && predictions.length === 0 && inputValue && !isLoading && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-slate-900 border border-input rounded-md shadow-lg z-50 px-4 py-3 text-sm text-muted-foreground">
            No locations found for "{inputValue}"
          </div>
        )}
      </div>

      {/* Helper text */}
      {!disabled && !apiError && (
        <p className="text-xs text-muted-foreground">
          Start typing to search for a location or area name.
        </p>
      )}
    </div>
  );
}
