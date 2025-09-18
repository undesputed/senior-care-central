"use client";

import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export default function ProfileActions() {
  const router = useRouter();

  const handleEditProfile = () => {
    router.push('/provider/onboarding/step-1');
  };

  const handleBackToDashboard = () => {
    router.push('/provider/dashboard');
  };

  return (
    <div className="mt-6 flex flex-col sm:flex-row gap-4">
      <Button 
        onClick={handleEditProfile}
        variant="outline"
      >
        Edit Profile
      </Button>
      <Button 
        onClick={handleBackToDashboard}
        variant="outline"
      >
        Back to Dashboard
      </Button>
    </div>
  );
}
