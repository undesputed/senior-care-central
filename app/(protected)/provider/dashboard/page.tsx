import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SignOutButton } from "@/components/auth/sign-out-button";

export default async function ProviderDashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/provider/login");
  }

  return (
    <div className="min-h-[100dvh] px-4 py-8" style={{ backgroundColor: "#c2dacc" }}>
      <div className="mx-auto max-w-3xl">
        <Card className="rounded-2xl border-0 shadow-lg" style={{ backgroundColor: "#ffffff" }}>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Provider Dashboard</CardTitle>
            <SignOutButton />
          </CardHeader>
          <CardContent>
            <p>Welcome{user.email ? `, ${user.email}` : ""}. Your provider portal will appear here.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}


