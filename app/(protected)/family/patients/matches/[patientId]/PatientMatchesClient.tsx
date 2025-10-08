"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LoadingButton } from "@/components/ui/loading-button";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ArrowLeft, Heart, Search, SlidersHorizontal, Phone, Mail, Globe, Filter, Star, MessageCircle, Calendar, MapPin } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

interface Match {
  id: string;
  agencyId: string;
  agencyName: string;
  agencyDescription: string;
  agencyPhone: string;
  agencyEmail: string;
  agencyWebsite: string;
  agencyLogo: string;
  score: number;
  normalizedScore: {
    label: string;
    stars: string;
    color: string;
  };
  breakdown: {
    location: boolean;
    budget: number;
    primaryCare: number;
    generalCare: number;
    addOns: number;
  };
  tags: string[];
  createdAt: string;
}

interface Pagination {
  offset: number;
  limit: number;
  total: number;
  hasMore: boolean;
}

interface PatientMatchesClientProps {
  patientId: string;
  patientName: string;
}

export default function PatientMatchesClient({ patientId, patientName }: PatientMatchesClientProps) {
  const [matches, setMatches] = useState<Match[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    offset: 0,
    limit: 10,
    total: 0,
    hasMore: false
  });
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [search, setSearch] = useState("");
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  
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

  useEffect(() => {
    loadMatches();
  }, [patientId]);

  // Check if matches exist and offer to recalculate if none found
  useEffect(() => {
    const checkAndOfferRecalculation = async () => {
      if (matches.length === 0 && !loading) {
        // Check if patient has any matches at all
        const response = await fetch(`/api/matching/check?patientId=${patientId}`);
        if (response.ok) {
          const data = await response.json();
          if (data.hasMatches === false) {
            // No matches exist, could offer to recalculate
            console.log('No matches found for patient, recalculation available');
          }
        }
      }
    };

    if (matches.length === 0 && !loading) {
      checkAndOfferRecalculation();
    }
  }, [matches.length, loading, patientId]);

  const loadMatches = async (offset = 0, append = false) => {
    try {
      if (offset === 0) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }

      const response = await fetch(
        `/api/matching/list?patientId=${patientId}&offset=${offset}&limit=10`
      );

      if (!response.ok) {
        throw new Error('Failed to load matches');
      }

      const data = await response.json();
      
      if (append) {
        setMatches(prev => [...prev, ...data.matches]);
      } else {
        setMatches(data.matches);
      }
      
      setPagination(data.pagination);
    } catch (error) {
      console.error('Error loading matches:', error);
      toast.error("Failed to load matches");
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const recalculateMatches = async () => {
    try {
      setLoading(true);
      toast.info("Recalculating matches...");
      
      const response = await fetch('/api/matching/run', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ patientId }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to recalculate matches');
      }

      const data = await response.json();
      toast.success(`Found ${data.matchesCreated} new matches!`);
      
      // Reload matches after recalculation
      await loadMatches();
    } catch (error) {
      console.error('Error recalculating matches:', error);
      toast.error("Failed to recalculate matches");
    } finally {
      setLoading(false);
    }
  };

  const handleLoadMore = () => {
    loadMatches(pagination.offset + pagination.limit, true);
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

  const getScoreBadgeClass = (score: number) => {
    if (score >= 85) return 'bg-green-600';
    if (score >= 70) return 'bg-emerald-500';
    if (score >= 60) return 'bg-yellow-500';
    return 'bg-gray-400';
  };

  const getScoreColor = (color: string) => {
    switch (color) {
      case 'green': return 'bg-green-600 text-white';
      case 'emerald': return 'bg-emerald-500 text-white';
      case 'yellow': return 'bg-yellow-500 text-white';
      default: return 'bg-gray-400 text-white';
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        {/* Header Skeleton */}
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-8 w-48 mb-2" />
            <Skeleton className="h-4 w-64" />
          </div>
          <div className="flex items-center space-x-4">
            <Skeleton className="h-10 w-64" />
            <Skeleton className="h-10 w-10" />
            <Skeleton className="h-10 w-32" />
          </div>
        </div>

        {/* Content Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="overflow-hidden">
              <Skeleton className="w-full h-48" />
              <CardContent className="p-4">
                <Skeleton className="h-6 w-3/4 mb-2" />
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-1/2 mb-4" />
                <div className="flex space-x-2">
                  <Skeleton className="h-8 flex-1" />
                  <Skeleton className="h-8 flex-1" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Care Matches</h1>
          <p className="text-gray-600">Matches for {patientName} - {pagination.total} agencies found</p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search agencies..."
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
          <Button 
            variant="outline" 
            size="sm" 
            className="mt-6"
            onClick={recalculateMatches}
            disabled={loading}
          >
            {loading ? "Refreshing..." : "Refresh Matches"}
          </Button>
        </div>
      </div>

      {/* Agency Cards Grid */}
      {matches.length === 0 ? (
        <Card className="w-full max-w-2xl mx-auto">
          <CardContent className="text-center py-12">
            <Heart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No matches found</h3>
            <p className="text-gray-600 mb-6">
              We couldn't find any agencies that match your requirements. 
              Try recalculating matches or adjusting your preferences.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button 
                onClick={recalculateMatches}
                disabled={loading}
                className="bg-green-600 hover:bg-green-700"
              >
                {loading ? "Calculating..." : "Recalculate Matches"}
              </Button>
              <Link href="/family/patients">
                <Button variant="outline">Back to Patients</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {matches.map((match) => (
            <Card 
              key={match.id} 
              className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => {
                // Navigate to agency details page
                window.location.href = `/family/agencies/${match.agencyId}`;
              }}
            >
              {/* Image Section */}
              <div className="relative">
                <img
                  src={match.agencyLogo || "/api/placeholder/400/200"}
                  alt={match.agencyName}
                  className="w-full h-48 object-cover"
                />
                {/* Match Badge */}
                <Badge className={`absolute top-3 left-3 ${getScoreBadgeClass(match.score)} text-white`}>
                  Matched {Math.round(match.score)}%
                </Badge>
                {/* Favorite Button */}
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute top-3 right-3 p-2 bg-white/80 hover:bg-white"
                  onClick={() => toggleFavorite(match.agencyId)}
                >
                  <Heart 
                    className={`w-4 h-4 ${
                      favorites.has(match.agencyId) 
                        ? 'fill-red-500 text-red-500' 
                        : 'text-gray-600'
                    }`} 
                  />
                </Button>
              </div>

              <CardContent className="p-4">
                {/* Agency Name and Address */}
                <div className="mb-3">
                  <h3 className="font-bold text-gray-900 text-lg">{match.agencyName}</h3>
                  <p className="text-sm text-gray-600 flex items-center">
                    <MapPin className="w-3 h-3 mr-1" />
                    Seattle, WA
                  </p>
                </div>

                {/* Price and Rating */}
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-xs text-gray-500">Price range</p>
                    <p className="text-lg font-semibold text-green-600">$1,000-2,000/pm</p>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center">
                      <Star className="w-4 h-4 fill-yellow-400 text-yellow-400 mr-1" />
                      <span className="font-medium text-gray-900">4.8 rating</span>
                    </div>
                    <p className="text-xs text-gray-500">based on 167 reviews</p>
                  </div>
                </div>

                {/* Specialties */}
                <div className="mb-4">
                  <p className="text-sm font-medium text-gray-900 mb-2">Specialties</p>
                  <div className="flex flex-wrap gap-1">
                    {match.tags.slice(0, 3).map((tag, index) => (
                      <Badge 
                        key={index} 
                        variant="secondary" 
                        className="text-xs bg-gray-100 text-gray-700"
                      >
                        {tag}
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
      )}

      {/* Load More Button */}
      {pagination.hasMore && (
        <div className="text-center">
          <Button 
            onClick={handleLoadMore}
            disabled={loadingMore}
            variant="outline"
          >
            {loadingMore ? "Loading..." : "Load More"}
          </Button>
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