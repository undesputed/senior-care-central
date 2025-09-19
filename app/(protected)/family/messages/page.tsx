import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import FamilyDashboardLayout from "@/components/layout/FamilyDashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageCircle, Send, Inbox, Archive } from "lucide-react";

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

  return (
    <FamilyDashboardLayout 
      title="Messages" 
      userName={family?.full_name || user.email}
    >
      <div className="space-y-6">
        {/* Coming Soon Banner */}
        <Card className="border-purple-200 bg-purple-50">
          <CardHeader>
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <MessageCircle className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <CardTitle className="text-purple-900">Secure Messaging</CardTitle>
                <p className="text-purple-700 text-sm">Coming Soon</p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-purple-800">
              We're building a secure messaging system that will allow you to communicate 
              directly with care providers, ask questions, and coordinate care for your loved ones.
            </p>
          </CardContent>
        </Card>

        {/* Placeholder Content */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <div className="flex items-center space-x-2">
                <Inbox className="h-5 w-5 text-blue-600" />
                <CardTitle className="text-lg">Unread Messages</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-gray-900">0</p>
              <p className="text-sm text-gray-600">New messages</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center space-x-2">
                <Send className="h-5 w-5 text-green-600" />
                <CardTitle className="text-lg">Sent Messages</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-gray-900">0</p>
              <p className="text-sm text-gray-600">Messages sent</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center space-x-2">
                <Archive className="h-5 w-5 text-gray-600" />
                <CardTitle className="text-lg">Archived</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-gray-900">0</p>
              <p className="text-sm text-gray-600">Archived conversations</p>
            </CardContent>
          </Card>
        </div>

        {/* Empty State */}
        <Card>
          <CardContent className="p-12 text-center">
            <MessageCircle className="h-16 w-16 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Messages Yet</h3>
            <p className="text-gray-600 mb-6">
              Once you start communicating with care providers, your messages will appear here.
            </p>
            <div className="text-sm text-gray-500">
              <p>Messaging features coming soon:</p>
              <ul className="mt-2 space-y-1">
                <li>• Secure end-to-end messaging</li>
                <li>• File and photo sharing</li>
                <li>• Message history and search</li>
                <li>• Push notifications</li>
                <li>• Group conversations with care teams</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </FamilyDashboardLayout>
  );
}
