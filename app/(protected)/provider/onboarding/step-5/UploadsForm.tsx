"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { FileText, Image as ImageIcon, CheckCircle } from "lucide-react";

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

  // Photo files
  const [photoFiles, setPhotoFiles] = useState<FileWithPreview[]>([]);

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
      
      // File uploaded successfully
      
      // Reload uploads
      const { data: uploads } = await supabase
        .from('agency_uploads')
        .select('*')
        .eq('agency_id', agencyId);
      
      if (uploads) setUploadedFiles(uploads);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Upload failed';
      toast.error("Upload failed", { description: errorMessage });
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
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Upload failed';
      toast.error("Upload failed", { description: errorMessage });
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
      
      // Analyze onboarding completion status
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("User not found");
        return;
      }

      // Get agency data
      const { data: agency } = await supabase
        .from('agencies')
        .select('id, business_name, phone, admin_contact_name, cities, postal_codes, onboarding_completed')
        .eq('owner_id', user.id)
        .single();

      if (!agency) {
        toast.error("Agency not found");
        return;
      }

      // Check if all required onboarding steps are completed
      const hasBasicInfo = agency.business_name && 
                          agency.phone && 
                          agency.admin_contact_name && 
                          agency.cities && 
                          agency.cities.length > 0 && 
                          agency.postal_codes && 
                          agency.postal_codes.length > 0;

      // Check services (Step 2)
      const { data: services } = await supabase
        .from('agency_services')
        .select('service_id')
        .eq('agency_id', agency.id)
        .limit(1);

      // Check star points (Step 3)
      const { data: strengths } = await supabase
        .from('agency_service_strengths')
        .select('points')
        .eq('agency_id', agency.id)
        .limit(1);

      // Check rates (Step 4)
      const { data: rates } = await supabase
        .from('agency_service_rates')
        .select('service_id')
        .eq('agency_id', agency.id)
        .limit(1);

      // Determine if onboarding is complete
      const isOnboardingComplete = hasBasicInfo && 
                                   services && services.length > 0 && 
                                   strengths && strengths.length > 0 && 
                                   rates && rates.length > 0 && 
                                   hasDocuments;

      // Update agency status based on completion
      const newStatus = isOnboardingComplete ? 'completed' : 'draft';
      const onboardingCompleted = isOnboardingComplete;

      const { error: updateError } = await supabase
        .from('agencies')
        .update({ 
          status: newStatus,
          onboarding_completed: onboardingCompleted
        })
        .eq('id', agency.id);

      if (updateError) {
        throw new Error(updateError.message);
      }

      if (isOnboardingComplete) {
        toast.success("Onboarding completed successfully! Your agency is now ready.");
      } else {
        toast.success("Progress saved. Please complete all steps to finish onboarding.");
      }
      
      window.location.href = '/provider/dashboard';
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Save failed';
      toast.error("Save failed", { description: errorMessage });
    } finally {
      setSaving(false);
    }
  };

  const getUploadedCount = (type: string) => {
    return uploadedFiles.filter(f => f.file_type === type).length;
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col items-center gap-4">
        {/* Documents Section */}
        <div className="p-4 rounded-lg border" style={{ width: '358px', border: '1px solid #E8E8E8', borderRadius: '8px' }}>
          <div className="flex items-center gap-2 mb-4">
            <FileText className="h-5 w-5" />
            <h3 className="text-lg font-medium">Upload Documents</h3>
          </div>
          
          <div className="space-y-4">
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
                  style={{
                    width: '100%',
                    height: '54px',
                    borderRadius: '8px',
                    padding: '16px',
                    border: '1px solid #E8E8E8'
                  }}
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
                  style={{
                    width: '100%',
                    height: '54px',
                    borderRadius: '8px',
                    padding: '16px',
                    border: '1px solid #E8E8E8'
                  }}
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
                  style={{
                    width: '100%',
                    height: '54px',
                    borderRadius: '8px',
                    padding: '16px',
                    border: '1px solid #E8E8E8'
                  }}
                />
                {getUploadedCount('training') > 0 && (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Photos Section */}
        <div className="p-4 rounded-lg border" style={{ width: '358px', border: '1px solid #E8E8E8', borderRadius: '8px' }}>
          <div className="flex items-center gap-2 mb-4">
            <ImageIcon className="h-5 w-5" />
            <h3 className="text-lg font-medium">Photos</h3>
          </div>
          
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
              style={{
                width: '100%',
                height: '54px',
                borderRadius: '8px',
                padding: '16px',
                border: '1px solid #E8E8E8'
              }}
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
        </div>

        {/* Uploaded Files Summary */}
        {uploadedFiles.length > 0 && (
          <div className="p-4 rounded-lg border" style={{ width: '358px', border: '1px solid #E8E8E8', borderRadius: '8px' }}>
            <h3 className="text-lg font-medium mb-4">Uploaded Files</h3>
            <div className="space-y-2">
              {uploadedFiles.map((file) => (
                <div key={file.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <FileText className="h-4 w-4 flex-shrink-0" />
                    <div className="flex flex-col min-w-0 flex-1">
                      <span className="text-sm truncate" title={file.file_name}>
                        {file.file_name}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {Math.round(file.file_size / 1024)}KB
                      </span>
                    </div>
                  </div>
                  <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded flex-shrink-0 ml-2">
                    {file.file_type.replace('_', ' ')}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div
        role="separator"
        aria-orientation="horizontal"
        className="w-full my-4"
        style={{
          borderBottom: '1px solid #E8E8E8',
          width: '358px',
          margin: '0 auto'
        }}
      ></div>

      <div className="flex flex-col items-center space-y-4 pt-6">
        <button
          type="button"
          onClick={onSaveNext}
          disabled={saving || uploading}
          className="text-white font-medium flex items-center justify-center hover:opacity-90 disabled:opacity-50"
          style={{ 
            backgroundColor: '#71A37A',
            width: '358px',
            height: '54px',
            borderRadius: '8px',
            padding: '16px'
          }}
        >
          {saving ? 'Saving...' : 'NEXT →'}
        </button>
        <button
          type="button"
          onClick={() => window.location.href = '/provider/onboarding/step-4'}
          disabled={saving || uploading}
          className="text-white font-medium flex items-center justify-center hover:opacity-90 disabled:opacity-50"
          style={{ 
            backgroundColor: '#ffffff',
            color: '#000000',
            width: '358px',
            height: '54px',
            borderRadius: '8px',
            padding: '16px',
            border: '1px solid #E8E8E8'
          }}
        >
          BACK
        </button>
      </div>
    </div>
  );
}