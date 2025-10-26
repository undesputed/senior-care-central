"use client";

import { useState, useMemo, useEffect } from "react";
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
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

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
  description?: string;
  phone?: string;
  email?: string;
  website?: string;
  permitVerified?: boolean;
  cities?: string[];
  coverageRadius?: number;
}

// This will be replaced with real data from the API

export default function FamilyDashboardClient() {
  const router = useRouter();
  const supabase = createClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [agencies, setAgencies] = useState<Agency[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [inviteLoading, setInviteLoading] = useState<string | null>(null);
  
  // Filter states
  const [location, setLocation] = useState("");
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
    "24-Hour Care": true,
    "Transfers": true,
    "Transportation": true,
    "Feeding": true,
    "Anxiety Reduction": true,
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
  const [verifiedOnly, setVerifiedOnly] = useState(false);

  // Fetch agencies on component mount
  useEffect(() => {
    const fetchAgencies = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/agencies');
        console.log('API Response status:', response.status);
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error('API Error:', errorText);
          throw new Error(`Failed to fetch agencies: ${response.status}`);
        }
        
        const data = await response.json();
        setAgencies(data.agencies || []);
        setError(null);
      } catch (err) {
        console.error('Error fetching agencies:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch agencies');
        // Fallback to empty array
        setAgencies([]);
      } finally {
        setLoading(false);
      }
    };

    fetchAgencies();
  }, []);

  // Check if any filters are active
  const hasActiveFilters = () => {
    return location !== "" || 
           !Object.values(careTypes).every(Boolean) || // If not all care types are selected
           priceRange !== "" ||
           !Object.values(genderPreference).every(Boolean) || // If not all gender preferences are selected
           !Object.values(specialtyServices).every(Boolean) || // If not all specialty services are selected
           !Object.values(ratings).every(Boolean) || // If not all ratings are selected
           verifiedOnly;
  };

  // Filter agencies based on all criteria
  const filteredAgencies = useMemo(() => {
    return agencies.filter(agency => {
      // Search query filter
      if (searchQuery && searchQuery.trim() !== "") {
        const query = searchQuery.toLowerCase();
        const matchesName = agency.name.toLowerCase().includes(query);
        const matchesAddress = agency.address.toLowerCase().includes(query);
        const matchesSpecialties = agency.specialties.some(specialty => 
          specialty.toLowerCase().includes(query)
        );
        
        if (!matchesName && !matchesAddress && !matchesSpecialties) {
          return false;
        }
      }

      // Location filter (if location is specified)
      if (location && location.trim() !== "") {
        const agencyLocation = agency.address.toLowerCase();
        const searchLocation = location.toLowerCase();
        if (!agencyLocation.includes(searchLocation)) {
          return false;
        }
      }

      // Care type filter
      const selectedCareTypes = Object.entries(careTypes)
        .filter(([_, selected]) => selected)
        .map(([type, _]) => type);
      
      if (selectedCareTypes.length > 0) {
        const hasMatchingCareType = selectedCareTypes.some(careType => {
          // Map care types to specialties (more flexible matching)
          const careTypeMapping: { [key: string]: string[] } = {
            "In-Home Care": ["In-Home Care", "Personal Care", "24-Hour Care", "Transfers", "Feeding", "Transportation"],
            "Assisted Living": ["Assisted Living", "Personal Care", "24-Hour Care", "Transfers", "Feeding"],
            "Nursing Home": ["Nursing Home", "24-Hour Care", "Transfers", "Feeding", "Medical Care"],
            "Memory Care": ["Memory Care", "Alzheimer's / Dementia Care", "Dementia", "Anxiety Reduction", "24-Hour Care"],
            "Respite Care": ["Respite Care", "24-Hour Care", "Transfers", "Feeding", "Transportation"],
            "Hospice Care": ["Hospice Care", "Palliative Care", "24-Hour Care", "Anxiety Reduction"]
          };
          
          const specialties = careTypeMapping[careType] || [];
          return specialties.some(specialty => 
            agency.specialties.some(agencySpecialty => 
              agencySpecialty.toLowerCase().includes(specialty.toLowerCase())
            )
          );
        });
        
        if (!hasMatchingCareType) {
          return false;
        }
      }

      // Price range filter
      if (priceRange) {
        const agencyPrice = agency.priceRange;
        const priceMatch = {
          "under-15k": agencyPrice.includes("$500") || agencyPrice.includes("$600") || 
                      agencyPrice.includes("$800") || agencyPrice.includes("$1200"),
          "15k-25k": agencyPrice.includes("$1500") || agencyPrice.includes("$1800") || 
                    agencyPrice.includes("$2000") || agencyPrice.includes("$2200"),
          "25k-40k": agencyPrice.includes("$3000") || agencyPrice.includes("$3500"),
          "40k-plus": agencyPrice.includes("$5000"),
          "flexible": true
        };
        
        if (!priceMatch[priceRange as keyof typeof priceMatch]) {
          return false;
        }
      }

      // Specialty services filter
      const selectedSpecialties = Object.entries(specialtyServices)
        .filter(([_, selected]) => selected)
        .map(([service, _]) => service);
      
      if (selectedSpecialties.length > 0) {
        const hasMatchingSpecialty = selectedSpecialties.some(specialty => 
          agency.specialties.some(agencySpecialty => 
            agencySpecialty.toLowerCase().includes(specialty.toLowerCase()) ||
            specialty.toLowerCase().includes(agencySpecialty.toLowerCase())
          )
        );
        
        if (!hasMatchingSpecialty) {
          return false;
        }
      }

      // Rating filter
      const selectedRatings = Object.entries(ratings)
        .filter(([_, selected]) => selected)
        .map(([rating, _]) => rating);
      
      if (selectedRatings.length > 0) {
        const ratingMatch = {
          "All": true,
          "3 stars & up": agency.rating >= 3.0,
          "4 stars & up": agency.rating >= 4.0,
          "5 stars only": agency.rating >= 5.0
        };
        
        const hasMatchingRating = selectedRatings.some(rating => 
          ratingMatch[rating as keyof typeof ratingMatch]
        );
        
        if (!hasMatchingRating) {
          return false;
        }
      }

      // Verified providers filter (mock implementation)
      if (verifiedOnly) {
        // For demo purposes, assume agencies with rating >= 4.5 are verified
        if (agency.rating < 4.5) {
          return false;
        }
      }

      return true;
    });
  }, [searchQuery, location, careTypes, priceRange, specialtyServices, ratings, verifiedOnly, agencies]);

  // Clear all filters
  const clearAllFilters = () => {
    setSearchQuery("");
    setLocation("");
    setCareTypes({
      "In-Home Care": true,
      "Assisted Living": true,
      "Nursing Home": true,
      "Memory Care": true,
      "Respite Care": true,
      "Hospice Care": true
    });
    setPriceRange("");
    setGenderPreference({
      "Male Caregiver": true,
      "Female Caregiver": false,
      "No Preference": true
    });
    setSpecialtyServices({
      "24-Hour Care": true,
      "Transfers": true,
      "Transportation": true,
      "Feeding": true,
      "Anxiety Reduction": true,
      "Alzheimer's / Dementia Care": true,
      "Stroke Recovery": true,
      "Diabetes Management": true,
      "24/7 Nursing Staff": true,
      "Limited Mobility Support": true,
      "Post-Surgery Care": true,
      "Cancer Support": true,
      "Palliative Care": true
    });
    setRatings({
      "All": true,
      "3 stars & up": true,
      "4 stars & up": true,
      "5 stars only": true
    });
    setVerifiedOnly(false);
  };

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

  const handleInvite = async (agency: Agency) => {
    try {
      setInviteLoading(agency.id);
      
      // Get current family info
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('Please log in to send invitations');
        return;
      }

      const { data: family } = await supabase
        .from('families')
        .select('full_name')
        .eq('user_id', user.id)
        .single();

      if (!family) {
        toast.error('Family profile not found');
        return;
      }

      const response = await fetch('/api/chat/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agencyId: agency.id,
          familyUserId: user.id,
          familyName: family.full_name || 'Family',
          agencyName: agency.name
        })
      });

      const result = await response.json();

      if (response.ok) {
        if (result.exists) {
          toast.success('Invitation sent to existing conversation!');
        } else {
          toast.success('Invitation sent! Check your messages for their response.');
        }
        router.push('/family/messages');
      } else {
        toast.error(result.error || 'Failed to send invitation');
      }
    } catch (error) {
      console.error('Error sending invitation:', error);
      toast.error('Failed to send invitation');
    } finally {
      setInviteLoading(null);
    }
  };

  // Show loading state
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Search</h1>
            <p className="text-gray-600">Loading agencies...</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="overflow-hidden bg-white animate-pulse">
              <div className="h-48 bg-gray-200"></div>
              <CardContent className="p-4">
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-3 bg-gray-200 rounded mb-4"></div>
                <div className="h-3 bg-gray-200 rounded w-2/3"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Search</h1>
            <p className="text-gray-600">Error loading agencies</p>
          </div>
        </div>
        <div className="text-center py-12">
          <div className="text-red-500 text-lg mb-2">Failed to load agencies</div>
          <p className="text-gray-400 mb-4">{error}</p>
          <Button 
            onClick={() => window.location.reload()} 
            variant="outline"
          >
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Search</h1>
          <p className="text-gray-600">Showing {filteredAgencies.length} results</p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 mb-1">Explore</label>
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search agencies, locations, or services..."
              className="w-64"
            />
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            className={`mt-6 ${hasActiveFilters() ? 'text-white' : ''}`}
            style={hasActiveFilters() ? { backgroundColor: '#71A37A', borderColor: '#71A37A' } : {}}
            onClick={() => setIsFilterOpen(true)}
          >
            <Filter className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Agency Cards Grid */}
      {filteredAgencies.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-500 text-lg mb-2">No agencies found</div>
          <p className="text-gray-400 mb-4">Try adjusting your search criteria or filters</p>
          <Button variant="outline" onClick={clearAllFilters}>
            Clear All Filters
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAgencies.map((agency) => (
          <Card 
            key={agency.id} 
            className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer flex flex-col h-full bg-white"
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
              <Badge 
                className="absolute top-3 left-3 text-white rounded-md px-2 py-1 text-sm font-medium"
                style={{ backgroundColor: '#71A37A' }}
              >
                Matched {agency.matchPercentage}%
              </Badge>
              {/* Favorite Button */}
              <Button
                variant="ghost"
                size="sm"
                className="absolute top-3 right-3 p-2 bg-white/90 hover:bg-white border border-gray-200 rounded-full"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleFavorite(agency.id);
                }}
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

            <CardContent className="px-4 pt-4 pb-0 flex flex-col h-full">
              {/* Agency Name and Address */}
              <div className="mb-4">
                <h3 className="font-bold text-gray-900 text-lg mb-2">{agency.name}</h3>
                <p className="text-sm text-gray-600 flex items-center">
                  <MapPin className="w-3 h-3 mr-1" />
                  {agency.address}
                </p>
              </div>

              {/* Price and Rating */}
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-xs text-gray-500 mb-1">Price range</p>
                  <p className="text-lg font-semibold text-green-600">{agency.priceRange}</p>
                </div>
                <div className="text-right">
                  <div className="flex items-center justify-end mb-1">
                    <Star className="w-4 h-4 fill-green-500 text-green-500 mr-1" />
                    <span className="font-medium text-green-600">{agency.rating} rating</span>
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
                      variant="outline" 
                      className="text-xs bg-gray-50 text-gray-700 border-gray-300 rounded-full px-2 py-1"
                    >
                      {specialty}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-2 mt-auto -mx-4 -mb-4 -mt-4" style={{ marginBottom: '-16px' }}>
                <Button 
                  variant="outline" 
                  className="flex-1 text-gray-700 rounded-none border-gray-200"
                  style={{ backgroundColor: 'transparent' }}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleInvite(agency);
                  }}
                  disabled={inviteLoading === agency.id}
                >
                  <Calendar className="w-4 h-4 mr-2" />
                  {inviteLoading === agency.id ? 'SENDING...' : 'INVITE'}
                </Button>
                <Button 
                  className="flex-1 text-white rounded-none"
                  style={{ backgroundColor: '#71A37A' }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <MessageCircle className="w-4 h-4 mr-2" />
                  MESSAGE
                </Button>
              </div>
            </CardContent>
          </Card>
          ))}
        </div>
      )}

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
                        checked={careTypes[type as keyof typeof careTypes]}
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
                        checked={genderPreference[preference as keyof typeof genderPreference]}
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
                        checked={specialtyServices[service as keyof typeof specialtyServices]}
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
                        checked={ratings[rating as keyof typeof ratings]}
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
          <div className="flex justify-between mt-8 pt-6 border-t">
            <Button variant="outline" onClick={clearAllFilters}>
              Clear All Filters
            </Button>
            <div className="flex space-x-4">
              <Button variant="outline" onClick={() => setIsFilterOpen(false)}>
                Cancel
              </Button>
              <Button onClick={() => setIsFilterOpen(false)}>
                Apply Filters
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
