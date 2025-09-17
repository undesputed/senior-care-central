"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

type UploadKind = 'doc' | 'photo'

const MAX_DOCS = 5;
const MAX_PHOTOS = 10;
const MAX_DOC_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_PHOTO_SIZE = 10 * 1024 * 1024; // 10MB

export default function UploadsForm() {
  const supabase = createClient();
  const [agencyId, setAgencyId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const docInputRef = useRef<HTMLInputElement | null>(null);
  const photoInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: agency } = await supabase.from('agencies').select('id').eq('owner_id', user.id).maybeSingle();
      if (agency) setAgencyId(agency.id);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const validateFiles = (files: FileList, kind: UploadKind) => {
    const arr = Array.from(files);
    const max = kind === 'doc' ? MAX_DOCS : MAX_PHOTOS;
    if (arr.length > max) {
      toast.error(`Max ${max} ${kind === 'doc' ? 'documents' : 'photos'}`);
      return null;
    }
    const sizeCap = kind === 'doc' ? MAX_DOC_SIZE : MAX_PHOTO_SIZE;
    const ok = arr.every((f) => f.size <= sizeCap && (
      kind === 'doc' ? ["application/pdf","image/jpeg","image/png"].includes(f.type) : ["image/jpeg","image/png"].includes(f.type)
    ));
    if (!ok) {
      toast.error(kind === 'doc' ? "Only PDF, JPG, PNG up to 10MB" : "Only JPG or PNG up to 10MB");
      return null;
    }
    return arr;
  };

  const upload = async (files: File[], kind: UploadKind) => {
    if (!agencyId) return;
    setUploading(true);
    try {
      for (const f of files) {
        const path = `agency-${agencyId}/${Date.now()}-${f.name}`;
        const bucket = kind === 'doc' ? 'agency-docs' : 'agency-photos';
        const { error } = await supabase.storage.from(bucket).upload(path, f, { upsert: false });
        if (error) throw error;
      }
      toast.success('Upload completed');
    } catch (e: any) {
      toast.error('Upload failed', { description: e.message });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <p className="font-medium mb-2">Documents (PDF, JPG, PNG – up to 5 files) <span className="text-red-500">*</span></p>
        <input ref={docInputRef} type="file" multiple accept="application/pdf,image/jpeg,image/png" onChange={(e) => {
          if (!e.target.files) return;
          const files = validateFiles(e.target.files, 'doc');
          if (files) void upload(files, 'doc');
          if (docInputRef.current) docInputRef.current.value = '';
        }} />
      </div>

      <div>
        <p className="font-medium mb-2">Photos (JPG, PNG – up to 10 files)</p>
        <input ref={photoInputRef} type="file" multiple accept="image/jpeg,image/png" onChange={(e) => {
          if (!e.target.files) return;
          const files = validateFiles(e.target.files, 'photo');
          if (files) void upload(files, 'photo');
          if (photoInputRef.current) photoInputRef.current.value = '';
        }} />
      </div>
      <p className="text-sm text-muted-foreground">* Upload at least one document (business permit, certifications, etc.)</p>

      <div>
        <Button disabled={uploading} style={{ backgroundColor: "#9bc3a2" }}>Finish</Button>
      </div>
    </div>
  );
}


