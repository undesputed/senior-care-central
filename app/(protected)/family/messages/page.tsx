import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import FamilyMessagesClient from "./FamilyMessagesClient";

export default async function FamilyMessagesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/family/login");
  }

  // Get family profile
  const { data: family } = await supabase
    .from('families')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle();

  return <FamilyMessagesClient />;
}
