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
import { Upload, X, Image } from "lucide-react";

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
    .refine((v) => (v === "" ? true : /^\d+$/.test(v ?? "")), "Enter a whole number (km)"),
});

type FormValues = z.infer<typeof schema>;

export default function Step1Form({ email }: { email: string | null }) {
  const supabase = createClient();
  const router = useRouter();
  const [initializing, setInitializing] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [logoUrl, setLogoUrl] = useState<string>("");
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
          "business_name,business_registration_number,year_established,website,logo_url,phone,admin_contact_name,cities,postal_codes,coverage_radius_km"
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
        setLogoUrl(data.logo_url ?? "");
        setValue("phone", data.phone ?? "");
        setValue("admin_contact_name", data.admin_contact_name ?? "");
        setValue("cities", Array.isArray(data.cities) ? data.cities.join(", ") : (data.cities ?? ""));
        setValue(
          "postal_codes",
          Array.isArray(data.postal_codes) ? data.postal_codes.join(", ") : (data.postal_codes ?? "")
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
          logo_url: logoUrl || null,
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
        logo_url: logoUrl || null,
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

  const handleLogoUpload = async (file: File) => {
    // Validate file
    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      toast.error("Logo file must be less than 5MB");
      return;
    }
    
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      toast.error("Logo must be a JPG, PNG, or WebP image");
      return;
    }

    setUploading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get agency ID
      const { data: agency } = await supabase
        .from('agencies')
        .select('id')
        .eq('owner_id', user.id)
        .maybeSingle();

      if (!agency) {
        toast.error("Agency not found");
        return;
      }

      // Upload to storage
      const fileExt = file.name.split('.').pop();
      const fileName = `logo-${Date.now()}.${fileExt}`;
      const filePath = `agency-${agency.id}/logo/${fileName}`;
      
      const { error: uploadError } = await supabase.storage
        .from('agency-photos')
        .upload(filePath, file);

      if (uploadError) {
        throw new Error(uploadError.message);
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('agency-photos')
        .getPublicUrl(filePath);

      // Update agency record
      const { error: updateError } = await supabase
        .from('agencies')
        .update({ logo_url: publicUrl })
        .eq('id', agency.id);

      if (updateError) {
        throw new Error(updateError.message);
      }

      setLogoUrl(publicUrl);
      toast.success("Logo uploaded successfully");
    } catch (error: any) {
      toast.error("Upload failed", { description: error.message });
    } finally {
      setUploading(false);
    }
  };

  const removeLogo = async () => {
    setUploading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('agencies')
        .update({ logo_url: null })
        .eq('owner_id', user.id);

      if (error) {
        throw new Error(error.message);
      }

      setLogoUrl("");
      toast.success("Logo removed");
    } catch (error: any) {
      toast.error("Failed to remove logo", { description: error.message });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="text-sm text-muted-foreground">{saving ? "Saving..." : initializing ? "Loading..." : "All changes autosaved"}</div>

      <div className="grid gap-4">
        <div className="space-y-2">
          <Label htmlFor="business_name">Business Name <span className="text-red-500">*</span></Label>
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
          <Label>Business Logo</Label>
          {logoUrl ? (
            <div className="flex items-center gap-4 p-4 border rounded-lg bg-gray-50">
              <img 
                src={logoUrl} 
                alt="Business logo" 
                className="w-16 h-16 object-cover rounded border"
              />
              <div className="flex-1">
                <p className="text-sm text-gray-600">Logo uploaded</p>
                <p className="text-xs text-gray-500">Click to replace or remove</p>
              </div>
              <div className="flex gap-2">
                <Input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleLogoUpload(file);
                  }}
                  disabled={uploading}
                  className="hidden"
                  id="logo-upload"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => document.getElementById('logo-upload')?.click()}
                  disabled={uploading}
                >
                  <Upload className="h-4 w-4 mr-1" />
                  Replace
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={removeLogo}
                  disabled={uploading}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ) : (
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
              <Input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleLogoUpload(file);
                }}
                disabled={uploading}
                className="hidden"
                id="logo-upload"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => document.getElementById('logo-upload')?.click()}
                disabled={uploading}
                className="w-full"
              >
                <Upload className="h-4 w-4 mr-2" />
                {uploading ? "Uploading..." : "Upload Business Logo"}
              </Button>
              <p className="text-xs text-gray-500 mt-2">
                JPG, PNG, or WebP (max 5MB)
              </p>
            </div>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone">Phone Number <span className="text-red-500">*</span></Label>
          <Input id="phone" placeholder="(555) 123-4567" {...register("phone")} aria-invalid={!!errors.phone} />
          {errors.phone && <p className="text-sm text-red-600" role="alert">{errors.phone.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" value={email ?? ""} disabled />
        </div>

        <div className="space-y-2">
          <Label htmlFor="admin_contact_name">Admin Contact Name <span className="text-red-500">*</span></Label>
          <Input id="admin_contact_name" placeholder="Jane Doe" {...register("admin_contact_name")} aria-invalid={!!errors.admin_contact_name} />
          {errors.admin_contact_name && <p className="text-sm text-red-600" role="alert">{errors.admin_contact_name.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="cities">City / Cities of Service (comma separated) <span className="text-red-500">*</span></Label>
          <Input id="cities" placeholder="San Jose, Palo Alto" {...register("cities")} aria-invalid={!!errors.cities} />
          {errors.cities && <p className="text-sm text-red-600" role="alert">{errors.cities.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="postal_codes">Postal Code(s) or Coverage Radius (comma separated for codes) <span className="text-red-500">*</span></Label>
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


