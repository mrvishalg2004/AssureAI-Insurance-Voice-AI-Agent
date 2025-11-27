'use client';

import React, { useState, useRef } from 'react';
import { Upload, FileSpreadsheet, AlertCircle, CheckCircle2, X } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Alert, AlertDescription } from './ui/alert';
import { Progress } from './ui/progress';

interface UploadResponse {
  message: string;
  summary: {
    totalRows: number;
    validRows: number;
    savedContacts: number;
    errors: number;
    duplicatesFound: number;
  };
  contacts: Array<{
    id: string;
    name: string;
    phone: string;
    status: string;
  }>;
  errors: string[];
  duplicates: string[];
}

export function BulkCallUpload() {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadResult, setUploadResult] = useState<UploadResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
  const ALLOWED_TYPES = ['.csv', '.xlsx', '.xls'];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    setError(null);
    setUploadResult(null);

    if (!selectedFile) return;

    // Validate file type
    const fileExt = '.' + selectedFile.name.split('.').pop()?.toLowerCase();
    if (!ALLOWED_TYPES.includes(fileExt)) {
      setError(`Invalid file type. Please upload ${ALLOWED_TYPES.join(', ')} files only.`);
      return;
    }

    // Validate file size
    if (selectedFile.size > MAX_FILE_SIZE) {
      setError(`File size exceeds 5MB. Please upload a smaller file.`);
      return;
    }

    setFile(selectedFile);
  };

  const handleUpload = async () => {
    if (!file) {
      setError('Please select a file first');
      return;
    }

    setUploading(true);
    setError(null);
    setUploadProgress(0);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('checkDuplicates', 'true');

      // Get token from localStorage
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication required. Please login.');
      }

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

      // Simulate progress (since we can't track actual upload progress easily)
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90));
      }, 200);

      const response = await fetch(`${apiUrl}/api/bulk-calls/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || data.details || 'Upload failed');
      }

      setUploadResult(data);
      setFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (err: any) {
      console.error('Upload error:', err);
      setError(err.message || 'Failed to upload file');
    } finally {
      setUploading(false);
      setTimeout(() => setUploadProgress(0), 1000);
    }
  };

  const handleRemoveFile = () => {
    setFile(null);
    setError(null);
    setUploadResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Upload Contact List
        </CardTitle>
        <CardDescription>
          Upload a CSV or Excel file (.csv, .xlsx, .xls) with contact information. Maximum file size: 5MB
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* File Input */}
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={handleFileChange}
              disabled={uploading}
              className="hidden"
              id="file-upload"
            />
            <label
              htmlFor="file-upload"
              className="flex items-center justify-center w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-gray-400 transition-colors"
            >
              <FileSpreadsheet className="h-5 w-5 mr-2 text-gray-500" />
              <span className="text-sm text-gray-600">
                {file ? file.name : 'Choose file or drag and drop'}
              </span>
            </label>
          </div>
          
          {file && !uploading && (
            <Button
              variant="outline"
              size="icon"
              onClick={handleRemoveFile}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* File Info */}
        {file && (
          <div className="text-sm text-gray-600 space-y-1">
            <p><strong>File:</strong> {file.name}</p>
            <p><strong>Size:</strong> {(file.size / 1024).toFixed(2)} KB</p>
            <p><strong>Type:</strong> {file.type || 'Unknown'}</p>
          </div>
        )}

        {/* Upload Progress */}
        {uploading && (
          <div className="space-y-2">
            <Progress value={uploadProgress} />
            <p className="text-sm text-center text-gray-600">
              {uploadProgress < 90 ? 'Uploading...' : 'Processing contacts...'}
            </p>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Success Result */}
        {uploadResult && (
          <Alert className="border-green-200 bg-green-50">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertDescription>
              <div className="space-y-2">
                <p className="font-semibold text-green-900">{uploadResult.message}</p>
                <div className="grid grid-cols-2 gap-2 text-sm text-green-800">
                  <div>Total Rows: {uploadResult.summary.totalRows}</div>
                  <div>Valid Rows: {uploadResult.summary.validRows}</div>
                  <div>Saved Contacts: {uploadResult.summary.savedContacts}</div>
                  <div>Errors: {uploadResult.summary.errors}</div>
                  {uploadResult.summary.duplicatesFound > 0 && (
                    <div className="col-span-2 text-yellow-700">
                      ⚠️ {uploadResult.summary.duplicatesFound} duplicate(s) found
                    </div>
                  )}
                </div>
                {uploadResult.errors.length > 0 && (
                  <details className="mt-2">
                    <summary className="cursor-pointer text-sm font-medium">
                      View Errors ({uploadResult.errors.length})
                    </summary>
                    <ul className="mt-2 space-y-1 text-xs text-red-600 max-h-32 overflow-y-auto">
                      {uploadResult.errors.map((err, idx) => (
                        <li key={idx}>{err}</li>
                      ))}
                    </ul>
                  </details>
                )}
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Upload Button */}
        <Button
          onClick={handleUpload}
          disabled={!file || uploading}
          className="w-full"
        >
          {uploading ? (
            <>Processing...</>
          ) : (
            <>
              <Upload className="h-4 w-4 mr-2" />
              Process & Start Calls
            </>
          )}
        </Button>

        {/* Instructions */}
        <div className="mt-4 p-4 bg-blue-50 rounded-lg">
          <h4 className="text-sm font-semibold text-blue-900 mb-2">File Format Requirements:</h4>
          <ul className="text-xs text-blue-800 space-y-1 list-disc list-inside">
            <li>Required columns: <strong>name</strong>, <strong>phone</strong></li>
            <li>Optional columns: city, email, notes</li>
            <li>Phone numbers should be 10-15 digits</li>
            <li>First row should contain column headers</li>
          </ul>
          <p className="text-xs text-blue-700 mt-2">
            Example: name, phone, city, email, notes
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
