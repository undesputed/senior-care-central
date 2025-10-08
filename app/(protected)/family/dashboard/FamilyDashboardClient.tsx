"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Search, Filter, Heart, Star, Calendar, MessageCircle, MapPin, ArrowLeft } from "lucide-react";

interface Agency {
  id: string;
  name: string;
  address: string;
  priceRange: string;
  rating: number;
  reviewCount: number;
  matchPercentage: number;
  specialties: string[];
  image: string;
  isFavorited: boolean;
}

// Mock data for demonstration
const agencies: Agency[] = [
  {
    id: "1",
    name: "Concierge Care Advisors",
    address: "2608 2nd Ave #224, Seattle, WA 98121, USA",
    priceRange: "$800-1200/pm",
    rating: 4.8,
    reviewCount: 167,
    matchPercentage: 92,
    specialties: ["Memory Care", "Post-Surgery Recovery", "Dementia", "Stroke Recovery"],
    image: "/api/placeholder/400/200",
    isFavorited: false
  },
  {
    id: "2",
    name: "Concierge Care Advisors",
    address: "2608 2nd Ave #224, Seattle, WA 98121, USA",
    priceRange: "$800-1200/pm",
    rating: 4.8,
    reviewCount: 167,
    matchPercentage: 92,
    specialties: ["Memory Care", "Post-Surgery Recovery", "Dementia", "Stroke Recovery"],
    image: "/api/placeholder/400/200",
    isFavorited: false
  },
  {
    id: "3",
    name: "Concierge Care Advisors",
    address: "2608 2nd Ave #224, Seattle, WA 98121, USA",
    priceRange: "$800-1200/pm",
    rating: 4.8,
    reviewCount: 167,
    matchPercentage: 92,
    specialties: ["Memory Care", "Post-Surgery Recovery", "Dementia", "Stroke Recovery"],
    image: "/api/placeholder/400/200",
    isFavorited: false
  },
  {
    id: "4",
    name: "Concierge Care Advisors",
    address: "2608 2nd Ave #224, Seattle, WA 98121, USA",
    priceRange: "$800-1200/pm",
    rating: 4.8,
    reviewCount: 167,
    matchPercentage: 92,
    specialties: ["Memory Care", "Post-Surgery Recovery", "Dementia", "Stroke Recovery"],
    image: "/api/placeholder/400/200",
    isFavorited: false
  },
  {
    id: "5",
    name: "Concierge Care Advisors",
    address: "2608 2nd Ave #224, Seattle, WA 98121, USA",
    priceRange: "$800-1200/pm",
    rating: 4.8,
    reviewCount: 167,
    matchPercentage: 92,
    specialties: ["Memory Care", "Post-Surgery Recovery", "Dementia", "Stroke Recovery"],
    image: "/api/placeholder/400/200",
    isFavorited: false
  },
  {
    id: "6",
    name: "Concierge Care Advisors",
    address: "2608 2nd Ave #224, Seattle, WA 98121, USA",
    priceRange: "$800-1200/pm",
    rating: 4.8,
    reviewCount: 167,
    matchPercentage: 92,
    specialties: ["Memory Care", "Post-Surgery Recovery", "Dementia", "Stroke Recovery"],
    image: "/api/placeholder/400/200",
    isFavorited: false
  }
];

export default function FamilyDashboardClient() {
  const [searchQuery, setSearchQuery] = useState("John Doe, 123456");
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  
  // Filter states
  const [location, setLocation] = useState("123456");
  const [careTypes, setCareTypes] = useState({
    "In-Home Care": true,
    "Assisted Living": true,
    "Nursing Home": true,
    "Memory Care": true,
    "Respite Care": true,
    "Hospice Care": true
  });
  const [priceRange, setPriceRange] = useState("");
  const [genderPreference, setGenderPreference] = useState({
    "Male Caregiver": true,
    "Female Caregiver": false,
    "No Preference": true
  });
  const [specialtyServices, setSpecialtyServices] = useState({
    "Alzheimer's / Dementia Care": true,
    "Stroke Recovery": true,
    "Diabetes Management": true,
    "24/7 Nursing Staff": true,
    "Limited Mobility Support": true,
    "Post-Surgery Care": true,
    "Cancer Support": true,
    "Palliative Care": true
  });
  const [ratings, setRatings] = useState({
    "All": true,
    "3 stars & up": true,
    "4 stars & up": true,
    "5 stars only": true
  });
  const [verifiedOnly, setVerifiedOnly] = useState(true);

  const toggleFavorite = (agencyId: string) => {
    setFavorites(prev => {
      const newFavorites = new Set(prev);
      if (newFavorites.has(agencyId)) {
        newFavorites.delete(agencyId);
      } else {
        newFavorites.add(agencyId);
      }
      return newFavorites;
    });
  };

  const handleCareTypeChange = (type: string, checked: boolean) => {
    setCareTypes(prev => ({ ...prev, [type]: checked }));
  };

  const handleGenderPreferenceChange = (preference: string, checked: boolean) => {
    setGenderPreference(prev => ({ ...prev, [preference]: checked }));
  };

  const handleSpecialtyServiceChange = (service: string, checked: boolean) => {
    setSpecialtyServices(prev => ({ ...prev, [service]: checked }));
  };

  const handleRatingChange = (rating: string, checked: boolean) => {
    setRatings(prev => ({ ...prev, [rating]: checked }));
  };

  return (
    <div className="space-y-6">
      {/* Search Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Search</h1>
          <p className="text-gray-600">Showing results 20</p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 mb-1">Explore</label>
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="John Doe, 123456"
              className="w-64"
            />
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            className="mt-6"
            onClick={() => setIsFilterOpen(true)}
          >
            <Filter className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Agency Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {agencies.map((agency) => (
          <Card 
            key={agency.id} 
            className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
            onClick={() => {
              // Navigate to agency details page
              window.location.href = `/family/agencies/${agency.id}`;
            }}
          >
            {/* Image Section */}
            <div className="relative">
              <img
                src={agency.image}
                alt={agency.name}
                className="w-full h-48 object-cover"
              />
              {/* Match Badge */}
              <Badge className="absolute top-3 left-3 bg-green-600 text-white">
                Matched {agency.matchPercentage}%
              </Badge>
              {/* Favorite Button */}
              <Button
                variant="ghost"
                size="sm"
                className="absolute top-3 right-3 p-2 bg-white/80 hover:bg-white"
                onClick={() => toggleFavorite(agency.id)}
              >
                <Heart 
                  className={`w-4 h-4 ${
                    favorites.has(agency.id) 
                      ? 'fill-red-500 text-red-500' 
                      : 'text-gray-600'
                  }`} 
                />
              </Button>
            </div>

            <CardContent className="p-4">
              {/* Agency Name and Address */}
              <div className="mb-3">
                <h3 className="font-bold text-gray-900 text-lg">{agency.name}</h3>
                <p className="text-sm text-gray-600 flex items-center">
                  <MapPin className="w-3 h-3 mr-1" />
                  {agency.address}
                </p>
              </div>

              {/* Price and Rating */}
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-xs text-gray-500">Price range</p>
                  <p className="text-lg font-semibold text-green-600">{agency.priceRange}</p>
                </div>
                <div className="text-right">
                  <div className="flex items-center">
                    <Star className="w-4 h-4 fill-yellow-400 text-yellow-400 mr-1" />
                    <span className="font-medium text-gray-900">{agency.rating} rating</span>
                  </div>
                  <p className="text-xs text-gray-500">based on {agency.reviewCount} reviews</p>
                </div>
              </div>

              {/* Specialties */}
              <div className="mb-4">
                <p className="text-sm font-medium text-gray-900 mb-2">Specialties</p>
                <div className="flex flex-wrap gap-1">
                  {agency.specialties.map((specialty, index) => (
                    <Badge 
                      key={index} 
                      variant="secondary" 
                      className="text-xs bg-gray-100 text-gray-700"
                    >
                      {specialty}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-2">
                <Button 
                  variant="outline" 
                  className="flex-1 bg-green-50 text-green-700 border-green-200 hover:bg-green-100"
                >
                  <Calendar className="w-4 h-4 mr-2" />
                  INVITE
                </Button>
                <Button 
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                >
                  <MessageCircle className="w-4 h-4 mr-2" />
                  MESSAGE
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filter Modal */}
      <Dialog open={isFilterOpen} onOpenChange={setIsFilterOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center space-x-4 mb-4">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setIsFilterOpen(false)}
                className="p-2"
              >
                <ArrowLeft className="w-4 h-4" />
              </Button>
              <DialogTitle className="text-xl font-bold">Filter Agencies</DialogTitle>
            </div>
          </DialogHeader>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Left Column */}
            <div className="space-y-6">
              {/* Location */}
              <div>
                <Label htmlFor="location" className="text-sm font-medium">Location</Label>
                <Input
                  id="location"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="mt-1"
                />
              </div>

              {/* Care Type */}
              <div>
                <Label className="text-sm font-medium">Care Type:</Label>
                <div className="mt-2 space-y-2">
                  {Object.keys(careTypes).map((type) => (
                    <div key={type} className="flex items-center space-x-2">
                      <Checkbox
                        id={`care-${type}`}
                        checked={careTypes[type]}
                        onCheckedChange={(checked) => handleCareTypeChange(type, checked as boolean)}
                      />
                      <Label htmlFor={`care-${type}`} className="text-sm">{type}</Label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Price Range */}
              <div>
                <Label className="text-sm font-medium">Price range</Label>
                <RadioGroup value={priceRange} onValueChange={setPriceRange} className="mt-2">
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="under-15k" id="under-15k" />
                    <Label htmlFor="under-15k" className="text-sm">Under $15,000/month</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="15k-25k" id="15k-25k" />
                    <Label htmlFor="15k-25k" className="text-sm">$15,000-25,000/month</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="25k-40k" id="25k-40k" />
                    <Label htmlFor="25k-40k" className="text-sm">$25,000-40,000/month</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="40k-plus" id="40k-plus" />
                    <Label htmlFor="40k-plus" className="text-sm">$40,000+/month</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="flexible" id="flexible" />
                    <Label htmlFor="flexible" className="text-sm">Flexible / Discuss during consultation</Label>
                  </div>
                </RadioGroup>
              </div>

              {/* Gender Preference */}
              <div>
                <Label className="text-sm font-medium">Gender Preference:</Label>
                <div className="mt-2 space-y-2">
                  {Object.keys(genderPreference).map((preference) => (
                    <div key={preference} className="flex items-center space-x-2">
                      <Checkbox
                        id={`gender-${preference}`}
                        checked={genderPreference[preference]}
                        onCheckedChange={(checked) => handleGenderPreferenceChange(preference, checked as boolean)}
                      />
                      <Label htmlFor={`gender-${preference}`} className="text-sm">{preference}</Label>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              {/* Specialty Services */}
              <div>
                <Label className="text-sm font-medium">Specialty Services:</Label>
                <div className="mt-2 space-y-2">
                  {Object.keys(specialtyServices).map((service) => (
                    <div key={service} className="flex items-center space-x-2">
                      <Checkbox
                        id={`specialty-${service}`}
                        checked={specialtyServices[service]}
                        onCheckedChange={(checked) => handleSpecialtyServiceChange(service, checked as boolean)}
                      />
                      <Label htmlFor={`specialty-${service}`} className="text-sm">{service}</Label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Ratings */}
              <div>
                <Label className="text-sm font-medium">Ratings:</Label>
                <div className="mt-2 space-y-2">
                  {Object.keys(ratings).map((rating) => (
                    <div key={rating} className="flex items-center space-x-2">
                      <Checkbox
                        id={`rating-${rating}`}
                        checked={ratings[rating]}
                        onCheckedChange={(checked) => handleRatingChange(rating, checked as boolean)}
                      />
                      <Label htmlFor={`rating-${rating}`} className="text-sm">{rating}</Label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Verified Providers Only */}
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Verified Providers Only:</Label>
                <Switch
                  checked={verifiedOnly}
                  onCheckedChange={setVerifiedOnly}
                />
              </div>
            </div>
          </div>

          {/* Filter Actions */}
          <div className="flex justify-end space-x-4 mt-8 pt-6 border-t">
            <Button variant="outline" onClick={() => setIsFilterOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => setIsFilterOpen(false)}>
              Apply Filters
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
