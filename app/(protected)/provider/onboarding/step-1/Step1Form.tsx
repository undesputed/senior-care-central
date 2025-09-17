"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { createClient } from "@/lib/supabase/client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import Link from "next/link";

const currentYear = new Date().getFullYear();

const schema = z.object({
  business_name: z.string().min(3, "Business name is required").max(50, "Max 50 characters"),
  business_registration_number: z.string().max(20, "Max 20 characters").optional().or(z.literal("")),
  year_established: z
    .string()
    .optional()
    .or(z.literal(""))
    .refine((val) => {
      if (!val) return true;
      const n = Number(val);
      return Number.isInteger(n) && n >= 1900 && n <= currentYear;
    }, `Year must be between 1900 and ${currentYear}`),
  website: z.string().url("Enter a valid URL").optional().or(z.literal("")),
  phone: z.string().min(7, "Enter a valid phone number"),
  admin_contact_name: z
    .string()
    .min(2, "At least 2 characters")
    .max(50, "Max 50 characters"),
  cities: z.string().min(1, "Enter at least one city"),
  postal_codes: z.string().min(1, "Enter postal codes or coverage radius"),
  coverage_radius_km: z
    .string()
    .optional()
    .or(z.literal(""))
    .refine((v) => (v === "" ? true : /^\d+$/.test(v)), "Enter a whole number (km)"),
});

type FormValues = z.infer<typeof schema>;

export default function Step1Form({ email }: { email: string | null }) {
  const supabase = createClient();
  const router = useRouter();
  const [initializing, setInitializing] = useState(true);
  const [saving, setSaving] = useState(false);
  const saveTimer = useRef<NodeJS.Timeout | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isValid },
    watch,
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    mode: "onChange",
    defaultValues: {
      business_name: "",
      business_registration_number: "",
      year_established: "",
      website: "",
      phone: "",
      admin_contact_name: "",
      cities: "",
      postal_codes: "",
      coverage_radius_km: "",
    },
  });

  // Load existing agency data
  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data, error } = await supabase
        .from("agencies")
        .select(
          "business_name,business_registration_number,year_established,website,phone,admin_contact_name,cities,postal_codes,coverage_radius_km"
        )
        .eq("owner_id", user.id)
        .limit(1)
        .maybeSingle();
      if (error) {
        toast.error("Failed to load agency", { description: error.message });
      } else if (data) {
        setValue("business_name", data.business_name ?? "");
        setValue("business_registration_number", data.business_registration_number ?? "");
        setValue("year_established", data.year_established ? String(data.year_established) : "");
        setValue("website", data.website ?? "");
        setValue("phone", data.phone ?? "");
        setValue("admin_contact_name", data.admin_contact_name ?? "");
        setValue("cities", Array.isArray(data.cities) ? data.cities.join(", ") : data.cities ?? "");
        setValue(
          "postal_codes",
          Array.isArray(data.postal_codes) ? data.postal_codes.join(", ") : data.postal_codes ?? ""
        );
        setValue("coverage_radius_km", data.coverage_radius_km ? String(data.coverage_radius_km) : "");
      }
      setInitializing(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const debouncedSave = (values: FormValues) => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      setSaving(true);
      const citiesArray = values.cities.split(",").map((s) => s.trim()).filter(Boolean);
      const postalArray = values.postal_codes.split(",").map((s) => s.trim()).filter(Boolean);
      const year = values.year_established ? Number(values.year_established) : null;
      const radius = values.coverage_radius_km ? Number(values.coverage_radius_km) : null;
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setSaving(false);
        return;
      }
      const { error } = await supabase
        .from("agencies")
        .update({
          business_name: values.business_name,
          business_registration_number: values.business_registration_number || null,
          year_established: year,
          website: values.website || null,
          phone: values.phone,
          admin_contact_name: values.admin_contact_name,
          cities: citiesArray,
          postal_codes: postalArray,
          coverage_radius_km: radius,
          email: email ?? null,
        })
        .eq("owner_id", user.id);
      setSaving(false);
      if (error) {
        toast.error("Autosave failed", { description: error.message });
      }
    }, 500);
  };

  // Autosave on change
  const watched = watch();
  useEffect(() => {
    const parse = schema.safeParse(watched);
    if (parse.success) {
      debouncedSave(watched);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [watched.business_name, watched.business_registration_number, watched.year_established, watched.website, watched.phone, watched.admin_contact_name, watched.cities, watched.postal_codes, watched.coverage_radius_km]);

  const onNext = async () => {
    const parse = await schema.safeParseAsync(watched);
    if (!parse.success) {
      toast.error("Please fix errors before continuing");
      return;
    }
    // Final synchronous save then navigate
    setSaving(true);
    const citiesArray = watched.cities.split(",").map((s) => s.trim()).filter(Boolean);
    const postalArray = watched.postal_codes.split(",").map((s) => s.trim()).filter(Boolean);
    const year = watched.year_established ? Number(watched.year_established) : null;
    const radius = watched.coverage_radius_km ? Number(watched.coverage_radius_km) : null;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setSaving(false); return; }
    const { error } = await supabase
      .from("agencies")
      .update({
        business_name: watched.business_name,
        business_registration_number: watched.business_registration_number || null,
        year_established: year,
        website: watched.website || null,
        phone: watched.phone,
        admin_contact_name: watched.admin_contact_name,
        cities: citiesArray,
        postal_codes: postalArray,
        coverage_radius_km: radius,
        email: email ?? null,
      })
      .eq("owner_id", user.id);
    setSaving(false);
    if (error) {
      toast.error("Save failed", { description: error.message });
      return;
    }
    router.push("/provider/onboarding/step-2");
  };

  return (
    <div className="space-y-4">
      <div className="text-sm text-muted-foreground">{saving ? "Saving..." : initializing ? "Loading..." : "All changes autosaved"}</div>

      <div className="grid gap-4">
        <div className="space-y-2">
          <Label htmlFor="business_name">Business Name</Label>
          <Input id="business_name" placeholder="Acme Senior Care" {...register("business_name")} aria-invalid={!!errors.business_name} />
          {errors.business_name && <p className="text-sm text-red-600" role="alert">{errors.business_name.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="business_registration_number">Business Registration Number</Label>
          <Input id="business_registration_number" placeholder="123456" {...register("business_registration_number")} aria-invalid={!!errors.business_registration_number} />
          {errors.business_registration_number && <p className="text-sm text-red-600" role="alert">{errors.business_registration_number.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="year_established">Year Established</Label>
          <Input id="year_established" inputMode="numeric" placeholder="2005" {...register("year_established")} aria-invalid={!!errors.year_established} />
          {errors.year_established && <p className="text-sm text-red-600" role="alert">{errors.year_established.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="website">Website</Label>
          <Input id="website" placeholder="https://example.com" {...register("website")} aria-invalid={!!errors.website} />
          {errors.website && <p className="text-sm text-red-600" role="alert">{errors.website.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone">Phone Number</Label>
          <Input id="phone" placeholder="(555) 123-4567" {...register("phone")} aria-invalid={!!errors.phone} />
          {errors.phone && <p className="text-sm text-red-600" role="alert">{errors.phone.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" value={email ?? ""} disabled />
        </div>

        <div className="space-y-2">
          <Label htmlFor="admin_contact_name">Admin Contact Name</Label>
          <Input id="admin_contact_name" placeholder="Jane Doe" {...register("admin_contact_name")} aria-invalid={!!errors.admin_contact_name} />
          {errors.admin_contact_name && <p className="text-sm text-red-600" role="alert">{errors.admin_contact_name.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="cities">City / Cities of Service (comma separated)</Label>
          <Input id="cities" placeholder="San Jose, Palo Alto" {...register("cities")} aria-invalid={!!errors.cities} />
          {errors.cities && <p className="text-sm text-red-600" role="alert">{errors.cities.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="postal_codes">Postal Code(s) or Coverage Radius (comma separated for codes)</Label>
          <Input id="postal_codes" placeholder="95112, 95113" {...register("postal_codes")} aria-invalid={!!errors.postal_codes} />
          {errors.postal_codes && <p className="text-sm text-red-600" role="alert">{errors.postal_codes.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="coverage_radius_km">Coverage Radius (km)</Label>
          <Input id="coverage_radius_km" inputMode="numeric" placeholder="25" {...register("coverage_radius_km")} aria-invalid={!!errors.coverage_radius_km} />
          {errors.coverage_radius_km && <p className="text-sm text-red-600" role="alert">{errors.coverage_radius_km.message}</p>}
        </div>
      </div>

      <div className="flex items-center justify-between">
        <Link href="/provider/dashboard" className="underline">Save & Exit</Link>
        <Button onClick={onNext} disabled={!isValid} style={{ backgroundColor: "#9bc3a2" }}>Next</Button>
      </div>
    </div>
  );
}


