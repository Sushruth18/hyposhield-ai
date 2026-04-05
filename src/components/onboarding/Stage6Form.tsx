import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Upload, X, FileText } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface Stage6Data {
  medical_summary?: string;
  prescription_summary?: string;
}

interface Stage6FormProps {
  initialData?: Partial<Stage6Data>;
  onNext: (data: Stage6Data) => void;
  onSkip: () => void;
  isSubmitting?: boolean;
}

export function Stage6Form({ initialData, onNext, onSkip, isSubmitting = false }: Stage6FormProps) {
  const [medicalSummary, setMedicalSummary] = useState(initialData?.medical_summary || '');
  const [prescriptionSummary, setPrescriptionSummary] = useState(
    initialData?.prescription_summary || ''
  );
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const validFiles = files.filter((file) => {
      const validTypes = ['application/pdf', 'image/jpeg', 'image/png'];
      if (!validTypes.includes(file.type)) {
        toast({
          title: 'Invalid file type',
          description: 'Please upload PDF, JPG, or PNG files only',
          variant: 'destructive',
        });
        return false;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: 'File too large',
          description: 'Files must be less than 5MB',
          variant: 'destructive',
        });
        return false;
      }
      return true;
    });

    setUploadedFiles((prev) => [...prev, ...validFiles]);
  };

  const removeFile = (index: number) => {
    setUploadedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Note: In a production app, you would:
    // 1. Upload files to storage (e.g., Supabase Storage)
    // 2. Send to Groq API for extraction
    // 3. Parse the response

    onNext({
      medical_summary: medicalSummary,
      prescription_summary: prescriptionSummary,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">
          This step is optional. Upload documents to help us understand your medical history better.
        </p>

        {/* File Upload */}
        <div className="border-2 border-dashed rounded-lg p-6 hover:bg-muted/50 transition">
          <label className="cursor-pointer">
            <input
              type="file"
              multiple
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={handleFileUpload}
              className="hidden"
            />
            <div className="flex flex-col items-center gap-2">
              <Upload className="h-8 w-8 text-muted-foreground" />
              <div className="text-center">
                <p className="font-semibold text-sm">Upload Medical Documents</p>
                <p className="text-xs text-muted-foreground">
                  PDF, JPG, or PNG (up to 5MB each)
                </p>
              </div>
            </div>
          </label>
        </div>

        {/* Uploaded Files List */}
        {uploadedFiles.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-semibold">Uploaded Files ({uploadedFiles.length})</p>
            <div className="space-y-2">
              {uploadedFiles.map((file, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-muted rounded">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium truncate">{file.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {(file.size / 1024).toFixed(1)} KB
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeFile(index)}
                    className="p-1 hover:bg-destructive/10 rounded"
                  >
                    <X className="h-4 w-4 text-destructive" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Medical Summary */}
        <div className="space-y-2">
          <Label htmlFor="medical_summary">
            Medical Diagnosis Summary (optional)
          </Label>
          <Textarea
            id="medical_summary"
            placeholder="e.g., Type 2 Diabetes diagnosed in 2015, currently controlled with Metformin..."
            value={medicalSummary}
            onChange={(e) => setMedicalSummary(e.target.value)}
            rows={4}
          />
        </div>

        {/* Prescription Summary */}
        <div className="space-y-2">
          <Label htmlFor="prescription_summary">
            Current Medications (optional)
          </Label>
          <Textarea
            id="prescription_summary"
            placeholder="e.g., Metformin 1000mg twice daily, Lisinopril 10mg once daily..."
            value={prescriptionSummary}
            onChange={(e) => setPrescriptionSummary(e.target.value)}
            rows={4}
          />
        </div>

        <div className="p-3 bg-blue-50 border border-blue-200 rounded text-sm text-blue-900">
          <p className="font-semibold mb-1">💡 Pro Tip:</p>
          <p>
            Your medical information helps us personalize risk predictions and health insights.
            This data is encrypted and never shared.
          </p>
        </div>
      </div>

      <div className="flex gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={onSkip}
          className="flex-1"
          disabled={isSubmitting}
        >
          Skip for Now
        </Button>
        <Button type="submit" className="flex-1" disabled={isSubmitting}>
          {isSubmitting ? 'Saving...' : 'Complete Onboarding'}
        </Button>
      </div>
    </form>
  );
}
