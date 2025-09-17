import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { createClient as createBrowserClient } from "@/lib/supabase/client";

export default async function ProviderDashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/provider/login");
  }

  const { data: agency } = await supabase
    .from('agencies')
    .select('status')
    .eq('owner_id', user.id)
    .maybeSingle();

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
            {agency?.status !== 'published' ? (
              <PublishBanner />
            ) : (
              <PublishedBanner />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function PublishBanner() {
  'use client'
  const supabase = createBrowserClient()
  const onPublish = async () => {
    const res = await fetch('/api/provider/publish', { method: 'POST' })
    const json = await res.json()
    if (!res.ok) {
      toast.error('Cannot publish', { description: json.error })
      return
    }
    toast.success('Profile published')
    window.location.reload()
  }
  return (
    <div className="mt-4 rounded-lg border border-yellow-300 bg-yellow-50 p-4">
      <div className="mb-2 font-medium">Your agency profile is in draft and not yet visible to clients.</div>
      <Button onClick={onPublish} style={{ backgroundColor: '#9bc3a2' }}>Publish My Profile</Button>
    </div>
  )
}

function PublishedBanner() {
  'use client'
  const onUnpublish = async () => {
    const ok = confirm('Unpublishing will remove your profile from search results. Proceed?')
    if (!ok) return
    const res = await fetch('/api/provider/unpublish', { method: 'POST' })
    const json = await res.json()
    if (!res.ok) {
      toast.error('Cannot unpublish', { description: json.error })
      return
    }
    toast.success('Profile moved to draft')
    window.location.reload()
  }
  return (
    <div className="mt-4 rounded-lg border border-green-300 bg-green-50 p-4">
      <div className="mb-2 font-medium">Your profile is published and visible to clients.</div>
      <Button variant="outline" onClick={onUnpublish}>Revert to Draft</Button>
    </div>
  )
}


