/**
 * Complaint and Document Type Definitions
 * Shared types for complaint registration system
 */

export interface DocumentFile {
  id: string;
  name: string;
  type: string; // 'image/jpeg', 'image/png', 'application/pdf', etc
  size: number;
  base64?: string; // Base64 encoded file content for API transmission
  uploadedAt: Date;
  preview?: string; // Data URL for preview
}

export interface CitizenDetails {
  name?: string;
  phone?: string;
  email?: string;
  ward?: string;
  locality?: string;
}

export interface ComplaintData {
  id?: string; // Generated on server
  ticketNumber?: string; // Format: MUM-CIVIC-2025-XXXXX
  citizenDetails: CitizenDetails;
  location: string; // Full location from Google Maps
  locationLat?: number;
  locationLng?: number;
  category: string; // pothole, garbage, streetlight, water, sewage, etc
  subCategory?: string;
  description: string; // Detailed issue description
  severity: 'Low' | 'Medium' | 'High' | 'Critical';
  documents: DocumentFile[];
  createdAt: Date;
  status: 'Draft' | 'Submitted' | 'Acknowledged' | 'InProgress' | 'Resolved' | 'Closed';
  priority?: 'Low' | 'Medium' | 'High';
  aiNotes?: string; // Notes from AI conversation
  conversationHistory?: string; // Full chat history
}

export interface ComplaintResponse {
  success: boolean;
  message: string;
  ticketNumber?: string;
  complaintId?: string;
  estimatedResolutionTime?: string;
  nextSteps?: string[];
  error?: string;
}

export interface WhatsAppMessage {
  to: string; // Phone number in E.164 format (+91xxxxxxxxxx)
  messageBody: string;
  ticketNumber: string;
  complaintId: string;
}

export interface WhatsAppResponse {
  success: boolean;
  messageSid?: string;
  message?: string;
  error?: string;
  to?: string;
}

export interface UploadProgressEvent {
  loaded: number;
  total: number;
  percentage: number;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, any>;
}

export interface ComplaintAPIRequest {
  citizenDetails: CitizenDetails;
  location: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
  category: string;
  subCategory?: string;
  description: string;
  severity: string;
  documents?: Array<{
    name: string;
    type: string;
    base64: string;
  }>;
  source: 'chat' | 'form' | 'whatsapp';
}
