import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const supabase = await createClient();
    
    const { data: services, error } = await supabase
      .from('services')
      .select('id, name, description, category')
      .order('category', { ascending: true })
      .order('name', { ascending: true });

    if (error) {
      console.error('Error fetching services:', error);
      return NextResponse.json({ error: "Failed to fetch services" }, { status: 500 });
    }

    return NextResponse.json(services || []);
  } catch (error) {
    console.error('Error in services API:', error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
