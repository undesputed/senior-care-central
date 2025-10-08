"use client";

import React, { useEffect, useRef, useState, forwardRef } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, MapPin, ChevronDown } from "lucide-react";
import { Loader } from "@googlemaps/js-api-loader";

interface LocationAutocompleteProps {
  value?: string;
  onChange: (value: string) => void;
  onError?: (error: string) => void;
  placeholder?: string;
  className?: string;
  id?: string;
  disabled?: boolean;
}

// Declare global google namespace for TypeScript
declare global {
  interface Window {
    google: typeof google;
  }
}

// Hardcoded US cities as fallback
const US_CITIES = [
  "New York, NY", "Los Angeles, CA", "Chicago, IL", "Houston, TX", "Phoenix, AZ",
  "Philadelphia, PA", "San Antonio, TX", "San Diego, CA", "Dallas, TX", "San Jose, CA",
  "Austin, TX", "Jacksonville, FL", "Fort Worth, TX", "Columbus, OH", "Charlotte, NC",
  "San Francisco, CA", "Indianapolis, IN", "Seattle, WA", "Denver, CO", "Washington, DC",
  "Boston, MA", "El Paso, TX", "Nashville, TN", "Detroit, MI", "Oklahoma City, OK",
  "Portland, OR", "Las Vegas, NV", "Memphis, TN", "Louisville, KY", "Baltimore, MD",
  "Milwaukee, WI", "Albuquerque, NM", "Tucson, AZ", "Fresno, CA", "Sacramento, CA",
  "Mesa, AZ", "Kansas City, MO", "Atlanta, GA", "Long Beach, CA", "Colorado Springs, CO",
  "Raleigh, NC", "Miami, FL", "Virginia Beach, VA", "Omaha, NE", "Oakland, CA",
  "Minneapolis, MN", "Tulsa, OK", "Arlington, TX", "Tampa, FL", "New Orleans, LA",
  "Wichita, KS", "Cleveland, OH", "Bakersfield, CA", "Aurora, CO", "Anaheim, CA",
  "Honolulu, HI", "Santa Ana, CA", "Corpus Christi, TX", "Riverside, CA", "Lexington, KY",
  "Stockton, CA", "Henderson, NV", "Saint Paul, MN", "St. Louis, MO", "Milwaukee, WI",
  "Columbus, OH", "Plano, TX", "Anchorage, AK", "Lincoln, NE", "Orlando, FL",
  "Irvine, CA", "Newark, NJ", "Toledo, OH", "Durham, NC", "Chula Vista, CA",
  "Fort Wayne, IN", "Jersey City, NJ", "St. Petersburg, FL", "Laredo, TX", "Madison, WI",
  "Chandler, AZ", "Buffalo, NY", "Lubbock, TX", "Scottsdale, AZ", "Reno, NV",
  "Glendale, AZ", "Gilbert, AZ", "Winston-Salem, NC", "North Las Vegas, NV", "Norfolk, VA",
  "Chesapeake, VA", "Garland, TX", "Irving, TX", "Hialeah, FL", "Fremont, CA",
  "Boise, ID", "Richmond, VA", "Baton Rouge, LA", "Spokane, WA", "Des Moines, IA",
  "Tacoma, WA", "San Bernardino, CA", "Modesto, CA", "Fontana, CA", "Santa Clarita, CA",
  "Birmingham, AL", "Oxnard, CA", "Fayetteville, NC", "Moreno Valley, CA", "Rochester, NY",
  "Glendale, CA", "Huntington Beach, CA", "Salt Lake City, UT", "Grand Rapids, MI", "Amarillo, TX",
  "Yonkers, NY", "Aurora, IL", "Montgomery, AL", "Akron, OH", "Little Rock, AR",
  "Huntsville, AL", "Augusta, GA", "Portland, ME", "Grand Prairie, TX", "Columbus, GA",
  "Tallahassee, FL", "Overland Park, KS", "Tempe, AZ", "McKinney, TX", "Mobile, AL",
  "Cape Coral, FL", "Shreveport, LA", "Frisco, TX", "Knoxville, TN", "Worcester, MA",
  "Brownsville, TX", "Vancouver, WA", "Fort Lauderdale, FL", "Sioux Falls, SD", "Ontario, CA",
  "Chattanooga, TN", "Providence, RI", "Newport News, VA", "Rancho Cucamonga, CA", "Santa Rosa, CA",
  "Oceanside, CA", "Salinas, CA", "Salem, OR", "Rockford, IL", "Pomona, CA",
  "Pasadena, CA", "Joliet, IL", "Pembroke Pines, FL", "Paterson, NJ", "Hampton, VA",
  "Lancaster, CA", "Alexandria, VA", "Palmdale, CA", "Corona, CA", "Salinas, CA",
  "Springfield, MO", "Pasadena, TX", "Fort Collins, CO", "Hayward, CA", "Pomona, CA",
  "Cary, NC", "Rockford, IL", "Alexandria, VA", "Escondido, CA", "McKinney, TX",
  "Kansas City, KS", "Joliet, IL", "Sunnyvale, CA", "Torrance, CA", "Bridgeport, CT",
  "Lakewood, CO", "Hollywood, FL", "Paterson, NJ", "Naperville, IL", "Syracuse, NY",
  "Mesquite, TX", "Dayton, OH", "Savannah, GA", "Clarksville, TN", "Orange, CA",
  "Pasadena, CA", "Fullerton, CA", "Killeen, TX", "Frisco, TX", "Hampton, VA",
  "McAllen, TX", "Warren, MI", "West Valley City, UT", "Columbia, SC", "Olathe, KS",
  "Sterling Heights, MI", "New Haven, CT", "Miramar, FL", "Waco, TX", "Thousand Oaks, CA",
  "Cedar Rapids, IA", "Charleston, SC", "Visalia, CA", "Topeka, KS", "Elizabeth, NJ",
  "Gainesville, FL", "Thornton, CO", "Roseville, CA", "Carrollton, TX", "Coral Springs, FL",
  "Stamford, CT", "Simi Valley, CA", "Concord, CA", "Hartford, CT", "Kent, WA",
  "Lafayette, LA", "Midland, TX", "Surprise, AZ", "Denton, TX", "Victorville, CA",
  "Evansville, IN", "Santa Clara, CA", "Abilene, TX", "Athens, GA", "Vallejo, CA",
  "Allentown, PA", "Norman, OK", "Beaumont, TX", "Independence, MO", "Murfreesboro, TN",
  "Ann Arbor, MI", "Springfield, IL", "Berkeley, CA", "Peoria, IL", "Provo, UT",
  "El Monte, CA", "Columbia, MO", "Lansing, MI", "Fargo, ND", "Downey, CA",
  "Costa Mesa, CA", "Wilmington, NC", "Arvada, CO", "Inglewood, CA", "Miami Gardens, FL",
  "Carlsbad, CA", "Westminster, CO", "Rochester, MN", "Odessa, TX", "Manchester, NH",
  "Elgin, IL", "West Jordan, UT", "Round Rock, TX", "Clearwater, FL", "Waterbury, CT",
  "Gresham, OR", "Fairfield, CA", "Billings, MT", "Lowell, MA", "San Buenaventura, CA",
  "Pueblo, CO", "High Point, NC", "West Covina, CA", "Richmond, CA", "Murrieta, CA",
  "Cambridge, MA", "Antioch, CA", "Temecula, CA", "Norwalk, CA", "Centennial, CO",
  "Everett, WA", "Palm Bay, FL", "Wichita Falls, TX", "Green Bay, WI", "Daly City, CA",
  "Burbank, CA", "Santa Maria, CA", "El Cajon, CA", "San Mateo, CA", "Lewisville, TX",
  "South Bend, IN", "Lakeland, FL", "Erie, PA", "Tyler, TX", "Pearland, TX",
  "College Station, TX", "Kenosha, WI", "Sandy Springs, GA", "Clovis, CA", "Flint, MI",
  "Roanoke, VA", "Albany, NY", "Jurupa Valley, CA", "Compton, CA", "San Angelo, TX",
  "Hillsboro, OR", "Lawton, OK", "Renton, WA", "Vista, CA", "Davie, FL",
  "Greeley, CO", "Mission Viejo, CA", "Portsmouth, VA", "Dearborn, MI", "South Gate, CA",
  "Tuscaloosa, AL", "Livonia, MI", "New Bedford, MA", "Vacaville, CA", "Brockton, MA",
  "Roswell, GA", "Beaverton, OR", "Quincy, MA", "Sparks, NV", "Yakima, WA",
  "Lee's Summit, MO", "Federal Way, WA", "Carson, CA", "Santa Monica, CA", "Hesperia, CA",
  "Allen, TX", "Rio Rancho, NM", "Yuma, AZ", "Westminster, CA", "Orem, UT",
  "Lynn, MA", "Redding, CA", "Spokane Valley, WA", "Miami Beach, FL", "League City, TX",
  "Lawrence, KS", "Santa Barbara, CA", "Plantation, FL", "Sandy, UT", "Sunrise, FL",
  "Macon, GA", "Longmont, CO", "Boca Raton, FL", "San Marcos, TX", "Greenville, NC",
  "Waukegan, IL", "Fall River, MA", "Chico, CA", "Newton, MA", "San Leandro, CA",
  "Hawthorne, CA", "Citrus Heights, CA", "Largo, FL", "Lakewood, WA", "Marietta, GA",
  "Mission, TX", "Troy, MI", "Madera, CA", "Joplin, MO", "Chino, CA",
  "Redwood City, CA", "Edinburg, TX", "Cranston, RI", "Parma, OH", "New Rochelle, NY",
  "Lake Forest, CA", "Napa, CA", "Hammond, IN", "Fayetteville, AR", "Bloomington, IN",
  "Danbury, CT", "Richmond, KY", "Bryan, TX", "Westland, MI", "Bellingham, WA",
  "West Sacramento, CA", "Auburn, WA", "Santa Fe, NM", "Daytona Beach, FL", "Lynchburg, VA",
  "Racine, WI", "Des Plaines, IL", "St. Joseph, MO", "Tempe, AZ", "Layton, UT",
  "Missouri City, TX", "Redondo Beach, CA", "Santa Clara, CA", "Greenville, SC", "Waco, TX",
  "Janesville, WI", "Thornton, CO", "West Valley City, UT", "Oshkosh, WI", "Boulder, CO",
  "Kenner, LA", "Burbank, CA", "Cheyenne, WY", "Santa Monica, CA", "Henderson, NV",
  "Erie, PA", "Tyler, TX", "Pearland, TX", "College Station, TX", "Kenosha, WI",
  "Sandy Springs, GA", "Clovis, CA", "Flint, MI", "Roanoke, VA", "Albany, NY"
];

const LocationAutocomplete = forwardRef<HTMLInputElement, LocationAutocompleteProps>(
  ({ value, onChange, onError, placeholder = "City, State or ZIP code", className, id, disabled }, ref) => {
    const inputRef = useRef<HTMLInputElement>(null);
    const [suggestions, setSuggestions] = useState<string[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [useGoogleAPI, setUseGoogleAPI] = useState(false);

    // Filter cities based on input
    const filterCities = (input: string) => {
      if (!input || input.length < 2) return [];
      
      const filtered = US_CITIES.filter(city => 
        city.toLowerCase().includes(input.toLowerCase())
      );
      return filtered.slice(0, 8); // Show max 8 suggestions
    };

    // Handle input changes
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value;
      onChange(newValue);
      
      if (newValue.length >= 2) {
        const filtered = filterCities(newValue);
        setSuggestions(filtered);
        setShowSuggestions(filtered.length > 0);
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    };

    // Handle suggestion selection
    const handleSuggestionClick = (suggestion: string) => {
      onChange(suggestion);
      setShowSuggestions(false);
      setSuggestions([]);
    };

    // Handle input focus
    const handleInputFocus = () => {
      if (value && value.length >= 2) {
        const filtered = filterCities(value);
        setSuggestions(filtered);
        setShowSuggestions(filtered.length > 0);
      }
    };

    // Handle input blur (with delay to allow clicking suggestions)
    const handleInputBlur = () => {
      setTimeout(() => {
        setShowSuggestions(false);
      }, 200);
    };

    // Try to initialize Google API as fallback (optional)
    useEffect(() => {
      const tryGoogleAPI = async () => {
        if (!process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY) return;
        
        try {
          setIsLoading(true);
          const loader = new Loader({
            apiKey: process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY,
            version: "weekly",
            libraries: ["places"],
          });

          await loader.load();
          setUseGoogleAPI(true);
        } catch (error) {
          console.log("Google Places API not available, using hardcoded cities");
        } finally {
          setIsLoading(false);
        }
      };

      tryGoogleAPI();
    }, []);

    return (
      <div className="relative">
        <div className="relative">
          <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            ref={ref || inputRef}
            id={id}
            type="text"
            value={value || ""}
            onChange={handleInputChange}
            onFocus={handleInputFocus}
            onBlur={handleInputBlur}
            placeholder={placeholder}
            className={`pl-10 ${className || ""}`}
            disabled={disabled}
            autoComplete="off"
          />
          {isLoading && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
            </div>
          )}
        </div>
        
        {/* Suggestions Dropdown */}
        {showSuggestions && suggestions.length > 0 && (
          <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
            {suggestions.map((suggestion, index) => (
              <button
                key={index}
                type="button"
                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
                onClick={() => handleSuggestionClick(suggestion)}
              >
                <div className="flex items-center">
                  <MapPin className="w-4 h-4 text-gray-400 mr-2" />
                  {suggestion}
                </div>
              </button>
            ))}
          </div>
        )}
        
        <p className="text-xs text-gray-500 mt-1">
          {useGoogleAPI ? "Type to search for US cities and states" : "Type to search from 500+ US cities"}
        </p>
      </div>
    );
  }
);

LocationAutocomplete.displayName = "LocationAutocomplete";

export default LocationAutocomplete;
