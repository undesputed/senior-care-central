"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import Link from "next/link";
import { Upload, FileText, Image, X, CheckCircle } from "lucide-react";

interface UploadedFile {
  id: string;
  file_type: string;
  file_name: string;
  file_path: string;
  file_size: number;
  mime_type: string;
  photo_category?: string;
}

interface FileWithPreview extends File {
  preview?: string;
}

export default function UploadsForm() {
  const supabase = createClient();
  const [agencyId, setAgencyId] = useState<string>("");
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Document files
  const [registrationFile, setRegistrationFile] = useState<FileWithPreview | null>(null);
  const [backgroundCheckFile, setBackgroundCheckFile] = useState<FileWithPreview | null>(null);
  const [trainingFile, setTrainingFile] = useState<FileWithPreview | null>(null);
  
  // Photo files
  const [photoFiles, setPhotoFiles] = useState<FileWithPreview[]>([]);
  const [photoCategories, setPhotoCategories] = useState<Record<string, string>>({});

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      const { data: agency } = await supabase
        .from('agencies')
        .select('id')
        .eq('owner_id', user.id)
        .maybeSingle();
      
      if (!agency) return;
      
      setAgencyId(agency.id);
      
      // Load existing uploads
      const { data: uploads } = await supabase
        .from('agency_uploads')
        .select('*')
        .eq('agency_id', agency.id)
        .order('created_at');
      
      if (uploads) {
        setUploadedFiles(uploads);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const validateFile = (file: File, type: 'document' | 'photo'): string | null => {
    const maxSize = type === 'document' ? 10 * 1024 * 1024 : 5 * 1024 * 1024; // 10MB for docs, 5MB for photos
    const allowedTypes = type === 'document' 
      ? ['application/pdf', 'image/jpeg', 'image/png']
      : ['image/jpeg', 'image/png'];
    
    if (file.size > maxSize) {
      return `File size must be less than ${type === 'document' ? '10MB' : '5MB'}`;
    }
    
    if (!allowedTypes.includes(file.type)) {
      return `File type must be ${type === 'document' ? 'PDF, JPG, or PNG' : 'JPG or PNG'}`;
    }
    
    return null;
  };

  const uploadFile = async (file: File, fileType: string, photoCategory?: string): Promise<string | null> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
    const folderPath = fileType === 'photo' ? 'photos' : fileType;
    const filePath = `agency-${agencyId}/${folderPath}/${fileName}`;
    
    const { error: uploadError } = await supabase.storage
      .from(fileType === 'photo' ? 'agency-photos' : 'agency-docs')
      .upload(filePath, file);
    
    if (uploadError) {
      throw new Error(uploadError.message);
    }
    
    // Save metadata to database
    const { error: dbError } = await supabase
      .from('agency_uploads')
      .insert({
        agency_id: agencyId,
        file_type: fileType,
        file_name: file.name,
        file_path: filePath,
        file_size: file.size,
        mime_type: file.type,
        photo_category: photoCategory
      });
    
    if (dbError) {
      throw new Error(dbError.message);
    }
    
    return filePath;
  };

  const handleDocumentUpload = async (file: File, type: 'registration' | 'background_check' | 'training') => {
    const validation = validateFile(file, 'document');
    if (validation) {
      toast.error(validation);
      return;
    }
    
    setUploading(true);
    try {
      await uploadFile(file, type);
      toast.success(`${type.replace('_', ' ')} uploaded successfully`);
      
      // Update state
      if (type === 'registration') setRegistrationFile(file);
      else if (type === 'background_check') setBackgroundCheckFile(file);
      else if (type === 'training') setTrainingFile(file);
      
      // Reload uploads
      const { data: uploads } = await supabase
        .from('agency_uploads')
        .select('*')
        .eq('agency_id', agencyId);
      
      if (uploads) setUploadedFiles(uploads);
    } catch (error: any) {
      toast.error("Upload failed", { description: error.message });
    } finally {
      setUploading(false);
    }
  };

  const handlePhotoUpload = async (files: FileList) => {
    if (photoFiles.length + files.length > 10) {
      toast.error("Maximum 10 photos allowed");
      return;
    }
    
    setUploading(true);
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const validation = validateFile(file, 'photo');
        if (validation) {
          toast.error(`Photo ${i + 1}: ${validation}`);
          continue;
        }
        
        await uploadFile(file, 'photo', 'care_team'); // Default category
        setPhotoFiles(prev => [...prev, file]);
      }
      
      toast.success(`${files.length} photo(s) uploaded successfully`);
      
      // Reload uploads
      const { data: uploads } = await supabase
        .from('agency_uploads')
        .select('*')
        .eq('agency_id', agencyId);
      
      if (uploads) setUploadedFiles(uploads);
    } catch (error: any) {
      toast.error("Upload failed", { description: error.message });
    } finally {
      setUploading(false);
    }
  };

  const onSaveNext = async () => {
    setSaving(true);
    try {
      // Check if at least one document is uploaded
      const hasDocuments = uploadedFiles.some(f => f.file_type !== 'photo');
      if (!hasDocuments) {
        toast.error("Please upload at least one document");
        return;
      }
      
      toast.success("Uploads saved successfully");
      window.location.href = '/provider/dashboard';
    } catch (error: any) {
      toast.error("Save failed", { description: error.message });
    } finally {
      setSaving(false);
    }
  };

  const getUploadedCount = (type: string) => {
    return uploadedFiles.filter(f => f.file_type === type).length;
  };

  return (
    <div className="space-y-6">
      {/* Documents Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Upload Documents
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Registration Document */}
          <div className="space-y-2">
            <Label htmlFor="registration">
              Govt Business Registration (PDF or photo) <span className="text-red-500">*</span>
            </Label>
            <div className="flex items-center gap-2">
              <Input
                id="registration"
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleDocumentUpload(file, 'registration');
                }}
                disabled={uploading}
              />
              {getUploadedCount('registration') > 0 && (
                <CheckCircle className="h-5 w-5 text-green-500" />
              )}
            </div>
          </div>

          {/* Background Check Document */}
          <div className="space-y-2">
            <Label htmlFor="background-check">
              Staff Background Check Certification
            </Label>
            <div className="flex items-center gap-2">
              <Input
                id="background-check"
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleDocumentUpload(file, 'background_check');
                }}
                disabled={uploading}
              />
              {getUploadedCount('background_check') > 0 && (
                <CheckCircle className="h-5 w-5 text-green-500" />
              )}
            </div>
          </div>

          {/* Training Document */}
          <div className="space-y-2">
            <Label htmlFor="training">
              Any training/accreditation documents
            </Label>
            <div className="flex items-center gap-2">
              <Input
                id="training"
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleDocumentUpload(file, 'training');
                }}
                disabled={uploading}
              />
              {getUploadedCount('training') > 0 && (
                <CheckCircle className="h-5 w-5 text-green-500" />
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Photos Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Image className="h-5 w-5" />
            Photos
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="photos">
              Select up to 10 pictures max
            </Label>
            <Input
              id="photos"
              type="file"
              accept=".jpg,.jpeg,.png"
              multiple
              onChange={(e) => {
                const files = e.target.files;
                if (files) handlePhotoUpload(files);
              }}
              disabled={uploading}
            />
            <p className="text-sm text-muted-foreground">
              Categories: Care team, Facilities (if any), Clients (with permission)
            </p>
            {getUploadedCount('photo') > 0 && (
              <p className="text-sm text-green-600">
                {getUploadedCount('photo')} photo(s) uploaded
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Uploaded Files Summary */}
      {uploadedFiles.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Uploaded Files</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {uploadedFiles.map((file) => (
                <div key={file.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    <span className="text-sm">{file.file_name}</span>
                    <span className="text-xs text-muted-foreground">
                      ({Math.round(file.file_size / 1024)}KB)
                    </span>
                  </div>
                  <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                    {file.file_type.replace('_', ' ')}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex items-center justify-between pt-4">
        <Link href="/provider/onboarding/step-4" className="underline text-gray-600 hover:text-gray-800">
          ← Back
        </Link>
        <Button 
          onClick={onSaveNext} 
          disabled={saving || uploading} 
          className="bg-green-600 hover:bg-green-700 px-6"
        >
          {saving ? "Saving..." : "Next →"}
        </Button>
      </div>
    </div>
  );
}