"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { 
  ArrowLeft, 
  Heart, 
  Star, 
  MapPin, 
  MessageCircle, 
  UserPlus, 
  Check,
  Leaf,
  Phone,
  Mail,
  Globe,
  Calendar
} from "lucide-react";

interface AgencyService {
  service_id: string;
  services: {
    name: string;
    slug: string;
  };
}

interface AgencyServiceStrength {
  service_id: string;
  points: number;
  services: {
    name: string;
    slug: string;
  };
}

interface AgencyServiceRate {
  service_id: string;
  pricing_format: string;
  min_amount: number;
  max_amount: number;
  services: {
    name: string;
    slug: string;
  };
}

interface AgencyServiceArea {
  city: string;
  state: string;
}

interface Agency {
  id: string;
  business_name: string;
  description: string;
  phone: string;
  email: string;
  website: string;
  logo_url: string;
  year_established: number;
  agency_service_areas: AgencyServiceArea[];
  agency_services: AgencyService[];
  agency_service_strengths: AgencyServiceStrength[];
  agency_service_rates: AgencyServiceRate[];
}

interface AgencyDetailsClientProps {
  agency: Agency;
}

export default function AgencyDetailsClient({ agency }: AgencyDetailsClientProps) {
  const router = useRouter();
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [isInviteSent, setIsInviteSent] = useState(false);
  const [isFavorited, setIsFavorited] = useState(false);

  const handleBack = () => {
    router.back();
  };

  const handleFavorite = () => {
    setIsFavorited(!isFavorited);
  };

  const handleInvite = () => {
    setIsInviteModalOpen(true);
  };

  const handleConfirmInvite = () => {
    setIsInviteSent(true);
    setIsInviteModalOpen(false);
  };

  const handleMessage = () => {
    // Navigate to messages page
    router.push('/family/messages');
  };

  // Calculate average rating and review count (mock data for now)
  const rating = 4.8;
  const reviewCount = 167;
  const matchPercentage = 92;

  // Get primary location
  const primaryLocation = agency.agency_service_areas[0];
  const location = primaryLocation ? `${primaryLocation.city}, ${primaryLocation.state}` : 'Location not specified';

  // Calculate price range from service rates
  const monthlyRates = agency.agency_service_rates.filter(rate => rate.pricing_format === 'monthly');
  const minPrice = Math.min(...monthlyRates.map(rate => rate.min_amount || 0));
  const maxPrice = Math.max(...monthlyRates.map(rate => rate.max_amount || 0));
  const priceRange = monthlyRates.length > 0 ? `$${minPrice}-${maxPrice}/pm` : 'Contact for pricing';

  // Get specialties (services with high strength points)
  const specialties = agency.agency_service_strengths
    .filter(strength => strength.points >= 4)
    .map(strength => strength.services.name);

  // Get all services offered
  const servicesOffered = agency.agency_services.map(service => service.services.name);

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="mb-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleBack}
          className="mb-4 p-0 h-auto text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{agency.business_name}</h1>
            <p className="text-gray-600 flex items-center mb-2">
              <MapPin className="w-4 h-4 mr-1" />
              {location}
            </p>
            <p className="text-sm text-gray-500">Price range: {priceRange}</p>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="text-right">
              <div className="flex items-center">
                <Star className="w-4 h-4 fill-yellow-400 text-yellow-400 mr-1" />
                <span className="font-medium text-gray-900">{rating} rating</span>
              </div>
              <p className="text-xs text-gray-500">based on {reviewCount} reviews</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleFavorite}
              className="p-2"
            >
              <Heart className={`w-5 h-5 ${isFavorited ? 'fill-red-500 text-red-500' : 'text-gray-400'}`} />
            </Button>
          </div>
        </div>
      </div>

      {/* Match Information */}
      <div className="bg-green-100 border border-green-200 rounded-lg p-4 mb-6">
        <div className="flex items-center">
          <div className="flex items-center justify-center w-8 h-8 bg-green-200 rounded-full mr-3">
            <Leaf className="w-4 h-4 text-green-600" />
          </div>
          <div>
            <p className="font-medium text-green-800">Matched {matchPercentage}%</p>
            <p className="text-sm text-green-700">
              We matched you because they offer dementia care, are within your budget, and have availability next week.
            </p>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex space-x-4 mb-8">
        <Button
          onClick={handleMessage}
          className="flex-1 bg-green-600 hover:bg-green-700 text-white"
        >
          <MessageCircle className="w-4 h-4 mr-2" />
          MESSAGE
        </Button>
        <Button
          onClick={handleInvite}
          variant="outline"
          className="flex-1 border-green-600 text-green-600 hover:bg-green-50"
        >
          <UserPlus className="w-4 h-4 mr-2" />
          {isInviteSent ? 'INVITE SENT' : 'INVITE'}
        </Button>
      </div>

      {/* Main Image */}
      <div className="mb-8">
        <div className="relative">
          <img
            src="/api/placeholder/800/400"
            alt={agency.business_name}
            className="w-full h-64 object-cover rounded-lg"
          />
          <div className="absolute bottom-4 left-4 flex space-x-2">
            <div className="w-2 h-2 bg-white rounded-full"></div>
            <div className="w-2 h-2 bg-white/50 rounded-full"></div>
            <div className="w-2 h-2 bg-white/50 rounded-full"></div>
            <div className="w-2 h-2 bg-white/50 rounded-full"></div>
            <div className="w-2 h-2 bg-white/50 rounded-full"></div>
          </div>
        </div>
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Specialties */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Specialties</h3>
          <ul className="space-y-2">
            {specialties.map((specialty, index) => (
              <li key={index} className="flex items-center text-gray-700">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                {specialty}
              </li>
            ))}
          </ul>
        </div>

        {/* Services Offered */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Services Offered</h3>
          <ul className="space-y-2">
            {servicesOffered.map((service, index) => (
              <li key={index} className="flex items-center text-gray-700">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                {service}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Contact Information */}
      <div className="mt-8 p-6 bg-gray-50 rounded-lg">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {agency.phone && (
            <div className="flex items-center">
              <Phone className="w-4 h-4 text-gray-500 mr-2" />
              <span className="text-gray-700">{agency.phone}</span>
            </div>
          )}
          {agency.email && (
            <div className="flex items-center">
              <Mail className="w-4 h-4 text-gray-500 mr-2" />
              <span className="text-gray-700">{agency.email}</span>
            </div>
          )}
          {agency.website && (
            <div className="flex items-center">
              <Globe className="w-4 h-4 text-gray-500 mr-2" />
              <a href={agency.website} className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">
                {agency.website}
              </a>
            </div>
          )}
          {agency.year_established && (
            <div className="flex items-center">
              <Calendar className="w-4 h-4 text-gray-500 mr-2" />
              <span className="text-gray-700">Est. {agency.year_established}</span>
            </div>
          )}
        </div>
      </div>

      {/* Description */}
      {agency.description && (
        <div className="mt-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">About</h3>
          <p className="text-gray-700 leading-relaxed">{agency.description}</p>
        </div>
      )}

      {/* Invite Modal */}
      <Dialog open={isInviteModalOpen} onOpenChange={setIsInviteModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center">Invite Agency to Care Request</DialogTitle>
          </DialogHeader>
          <div className="text-center py-4">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                <Check className="w-4 h-4 text-white" />
              </div>
            </div>
            <p className="text-gray-600 mb-6">
              You're about to invite '{agency.business_name}' to review your care request. 
              They will be able to see your care needs, schedule, and budget details, and can respond with a proposal.
            </p>
            <Button
              onClick={handleConfirmInvite}
              className="w-full bg-green-600 hover:bg-green-700 text-white"
            >
              INVITE
            </Button>
            <p className="text-xs text-gray-500 mt-4">
              Inviting an agency does not commit you to a contract. You can cancel offers before deciding.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
