import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Upload, CloudUpload } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { parsePDFText } from "@/lib/pdfParser";

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUploadComplete: () => void;
}

interface UploadResult {
  filename: string;
  success: boolean;
  candidateId?: number;
  error?: string;
}

export default function UploadModal({ isOpen, onClose, onUploadComplete }: UploadModalProps) {
  const [uploading, setUploading] = useState(false);
  const [uploadResults, setUploadResults] = useState<UploadResult[]>([]);
  const { toast } = useToast();

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    const pdfFiles = files.filter(file => file.type === 'application/pdf');
    
    if (pdfFiles.length === 0) {
      toast({
        title: "Error",
        description: "Please select PDF files only.",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);
    setUploadResults([]);

    try {
      // Process each PDF file
      const results: UploadResult[] = [];
      
      for (const file of pdfFiles) {
        try {
          // Extract text from PDF
          const extractedText = await parsePDFText(file);
          const candidateInfo = extractCandidateInfo(extractedText, file.name);
          
          // Create candidate via API
          const response = await apiRequest('POST', '/api/candidates', candidateInfo);
          const candidate = await response.json();
          
          results.push({
            filename: file.name,
            success: true,
            candidateId: candidate.id
          });
        } catch (error) {
          results.push({
            filename: file.name,
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }
      
      setUploadResults(results);
      
      const successCount = results.filter(r => r.success).length;
      if (successCount > 0) {
        toast({
          title: "Upload Complete",
          description: `Successfully processed ${successCount} resume(s)`,
        });
        onUploadComplete();
      }
      
    } catch (error) {
      toast({
        title: "Upload Failed",
        description: "An error occurred while processing the files.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const extractCandidateInfo = (text: string, filename: string) => {
    // Simple extraction logic - can be enhanced with more sophisticated parsing
    const emailMatch = text.match(/[\w\.-]+@[\w\.-]+\.\w+/);
    const lines = text.split('\n').filter(line => line.trim().length > 0);
    const nameMatch = lines[0]; // First non-empty line often contains name
    
    // Extract skills (simple keyword matching)
    const skills: string[] = [];
    const skillKeywords = ['react', 'javascript', 'python', 'java', 'node.js', 'angular', 'vue', 'sql', 'aws', 'docker'];
    skillKeywords.forEach(skill => {
      if (text.toLowerCase().includes(skill)) {
        skills.push(skill);
      }
    });
    
    return {
      name: nameMatch?.trim() || filename.replace('.pdf', ''),
      email: emailMatch?.[0] || 'email-not-found@unknown.com',
      score: '?',
      status: 'attention',
      remark: `Uploaded resume. Skills detected: ${skills.join(', ') || 'None detected'}. Requires manual scoring.`,
      flags: ['Not Scored Yet'],
      scoreBreakdown: { skills: 0, collaboration: 0, problemSolving: 0, culturalFit: 0 },
      rawText: text.substring(0, 500) // Store first 500 chars for reference
    };
  };

  const handleClose = () => {
    setUploadResults([]);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl bg-card">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-card-foreground">
            Upload Resume Files
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Upload PDF resumes for automated parsing and candidate assessment
          </DialogDescription>
        </DialogHeader>
        
        <div className="p-6">
          <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
            <CloudUpload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-card-foreground mb-4">Drag and drop PDF files here, or click to browse</p>
            <input
              type="file"
              id="resume-upload"
              multiple
              accept=".pdf"
              onChange={handleFileSelect}
              className="hidden"
              disabled={uploading}
            />
            <Button
              onClick={() => document.getElementById('resume-upload')?.click()}
              disabled={uploading}
              className="bg-secondary text-secondary-foreground hover:bg-secondary/80"
            >
              <Upload className="mr-2 h-4 w-4" />
              Choose Files
            </Button>
          </div>
          
          {uploading && (
            <div className="mt-4 flex items-center gap-3">
              <div className="loading-spinner"></div>
              <span className="text-card-foreground">Processing resumes...</span>
            </div>
          )}
          
          {uploadResults.length > 0 && (
            <div className="mt-4 space-y-2">
              <h4 className="font-semibold text-card-foreground">Upload Results:</h4>
              {uploadResults.map((result, index) => (
                <div
                  key={index}
                  className={`p-3 rounded-lg ${
                    result.success 
                      ? 'bg-[hsl(var(--chart-1))]/10 text-[hsl(var(--chart-1))]' 
                      : 'bg-destructive/10 text-destructive'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{result.filename}</span>
                    <span>-</span>
                    <span>{result.success ? 'Processed successfully' : 'Processing failed'}</span>
                  </div>
                  {result.success && result.candidateId && (
                    <div className="text-sm mt-1">Added to attention queue</div>
                  )}
                  {!result.success && result.error && (
                    <div className="text-sm mt-1">Error: {result.error}</div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
