import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function ProfileRedirectPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/family/login");
  }

  // Get user role from profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();

  const role = profile?.role || 'family';

  // Redirect to appropriate profile page based on role
  if (role === 'provider') {
    redirect('/provider/profile');
  } else {
    redirect('/family/profile');
  }
}
