import { useRef, useState } from 'react';
import { Upload, X, FileIcon, Image as ImageIcon, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DocumentFile } from '@/lib/types';

interface DocumentUploadProps {
  onDocumentsChange?: (documents: DocumentFile[]) => void;
  maxFiles?: number;
  maxFileSize?: number; // in bytes
  acceptedFormats?: string[];
}

const DEFAULT_ACCEPTED_FORMATS = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/pdf',
];
const DEFAULT_MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export default function DocumentUpload({
  onDocumentsChange,
  maxFiles = 5,
  maxFileSize = DEFAULT_MAX_FILE_SIZE,
  acceptedFormats = DEFAULT_ACCEPTED_FORMATS,
}: DocumentUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [documents, setDocuments] = useState<DocumentFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
  const [errors, setErrors] = useState<string[]>([]);

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const processFiles = async (files: FileList) => {
    const newErrors: string[] = [];
    const newDocuments: DocumentFile[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      // Check file count
      if (documents.length + newDocuments.length >= maxFiles) {
        newErrors.push(`Maximum ${maxFiles} files allowed`);
        break;
      }

      // Check file type
      if (!acceptedFormats.includes(file.type)) {
        newErrors.push(`${file.name} - Unsupported file type. Allowed: JPEG, PNG, WebP, PDF`);
        continue;
      }

      // Check file size
      if (file.size > maxFileSize) {
        newErrors.push(
          `${file.name} - File too large. Maximum: ${(maxFileSize / 1024 / 1024).toFixed(1)}MB`
        );
        continue;
      }

      // Read file
      const docId = `doc-${Date.now()}-${i}`;
      setUploadProgress((prev) => ({ ...prev, [docId]: 0 }));

      try {
        const base64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => {
            resolve(reader.result as string);
          };
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });

        let preview: string | undefined;
        if (file.type.startsWith('image/')) {
          preview = base64;
        }

        const newDoc: DocumentFile = {
          id: docId,
          name: file.name,
          type: file.type,
          size: file.size,
          base64: base64,
          preview: preview,
          uploadedAt: new Date(),
        };

        newDocuments.push(newDoc);
        setUploadProgress((prev) => ({ ...prev, [docId]: 100 }));
      } catch (error) {
        newErrors.push(`${file.name} - Failed to read file`);
      }
    }

    // Update state
    if (newDocuments.length > 0) {
      const allDocuments = [...documents, ...newDocuments];
      setDocuments(allDocuments);
      onDocumentsChange?.(allDocuments);
    }

    if (newErrors.length > 0) {
      setErrors(newErrors);
      setTimeout(() => setErrors([]), 5000);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    processFiles(files);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      processFiles(e.target.files);
      e.target.value = '';
    }
  };

  const removeDocument = (docId: string) => {
    const updated = documents.filter((doc) => doc.id !== docId);
    setDocuments(updated);
    onDocumentsChange?.(updated);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5" />
            Attach Photos or Documents
            <Badge variant="outline" className="ml-auto">
              {documents.length}/{maxFiles}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`
              border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
              transition-colors duration-200
              ${
                isDragging
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-950'
                  : 'border-gray-300 dark:border-gray-600 hover:border-gray-400'
              }
            `}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept={acceptedFormats.join(',')}
              onChange={handleFileSelect}
              className="hidden"
            />

            <div className="flex flex-col items-center gap-3">
              <Upload className="w-12 h-12 text-gray-400" />
              <div>
                <p className="text-lg font-medium text-gray-700 dark:text-gray-300">
                  Click to upload or drag and drop
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  PNG, JPG, WebP or PDF (Max {(maxFileSize / 1024 / 1024).toFixed(1)}MB)
                </p>
              </div>
              <Button type="button" variant="outline" size="sm">
                Select Files
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Error Messages */}
      {errors.length > 0 && (
        <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-700 rounded-lg p-4">
          {errors.map((error, idx) => (
            <p key={idx} className="text-sm text-red-700 dark:text-red-300">
              ❌ {error}
            </p>
          ))}
        </div>
      )}

      {/* Uploaded Documents */}
      {documents.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Attached Documents</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {documents.map((doc) => (
                <div
                  key={doc.id}
                  className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700"
                >
                  {/* Preview */}
                  <div className="flex-shrink-0">
                    {doc.preview ? (
                      <img
                        src={doc.preview}
                        alt={doc.name}
                        className="w-12 h-12 rounded object-cover"
                      />
                    ) : doc.type === 'application/pdf' ? (
                      <div className="w-12 h-12 bg-red-100 dark:bg-red-900 rounded flex items-center justify-center">
                        <FileIcon className="w-6 h-6 text-red-600 dark:text-red-300" />
                      </div>
                    ) : (
                      <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded flex items-center justify-center">
                        <ImageIcon className="w-6 h-6 text-blue-600 dark:text-blue-300" />
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                      {doc.name}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {formatFileSize(doc.size)} • {new Date(doc.uploadedAt).toLocaleString()}
                    </p>
                  </div>

                  {/* Status */}
                  <div className="flex-shrink-0 flex items-center gap-2">
                    {uploadProgress[doc.id] === 100 && (
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    )}
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeDocument(doc.id)}
                      className="h-8 w-8 p-0"
                    >
                      <X className="w-4 h-4 text-gray-500 hover:text-red-500" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Info Message */}
      <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-700 rounded-lg p-3">
        <p className="text-sm text-blue-700 dark:text-blue-300">
          💡 <strong>Tip:</strong> Adding photos or documents helps us resolve your issue faster and more accurately.
        </p>
      </div>
    </div>
  );
}
