/**
 * Complaint Service
 * Handles complaint registration, ticket generation, and API communication
 */

import {
  ComplaintData,
  ComplaintResponse,
  ComplaintAPIRequest,
  CitizenDetails,
  DocumentFile,
  ApiError,
} from './types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

/**
 * Generate complaint ticket number
 * Format: MUM-CIVIC-2025-XXXXX
 */
export function generateComplaintTicket(): string {
  const year = new Date().getFullYear();
  const randomNum = Math.floor(Math.random() * 100000);
  return `MUM-CIVIC-${year}-${String(randomNum).padStart(5, '0')}`;
}

/**
 * Validate phone number (Indian format)
 */
export function validatePhoneNumber(phone: string): boolean {
  // Accept formats: +91xxxxxxxxxx, 91xxxxxxxxxx, 0xxxxxxxxxx, xxxxxxxxxx
  const phoneRegex = /^(?:\+91|91|0)?[6-9]\d{9}$/;
  return phoneRegex.test(phone.replace(/\s+/g, ''));
}

/**
 * Format phone number to E.164 format (+91xxxxxxxxxx)
 */
export function formatPhoneNumber(phone: string): string {
  let cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 10) {
    cleaned = '91' + cleaned;
  } else if (cleaned.startsWith('0')) {
    cleaned = '91' + cleaned.substring(1);
  } else if (!cleaned.startsWith('91')) {
    cleaned = '91' + cleaned;
  }
  return '+' + cleaned;
}

/**
 * Create complaint in system
 */
export async function registerComplaint(
  complaintData: ComplaintData
): Promise<ComplaintResponse> {
  try {
    // Validate required fields
    if (!complaintData.citizenDetails?.phone) {
      throw new Error('Phone number is required for complaint registration');
    }

    if (!validatePhoneNumber(complaintData.citizenDetails.phone)) {
      throw new Error('Invalid phone number format');
    }

    if (!complaintData.location) {
      throw new Error('Location is required');
    }

    if (!complaintData.category) {
      throw new Error('Issue category is required');
    }

    if (!complaintData.description) {
      throw new Error('Issue description is required');
    }

    // Format phone number
    const formattedPhone = formatPhoneNumber(complaintData.citizenDetails.phone);

    // Generate ticket number
    const ticketNumber = generateComplaintTicket();

    // Prepare API request
    const apiRequest: ComplaintAPIRequest = {
      citizenDetails: {
        ...complaintData.citizenDetails,
        phone: formattedPhone,
      },
      location: complaintData.location,
      coordinates: complaintData.locationLat && complaintData.locationLng
        ? {
            lat: complaintData.locationLat,
            lng: complaintData.locationLng,
          }
        : undefined,
      category: complaintData.category,
      subCategory: complaintData.subCategory,
      description: complaintData.description,
      severity: complaintData.severity,
      source: 'chat',
    };

    // Add documents if present
    if (complaintData.documents && complaintData.documents.length > 0) {
      apiRequest.documents = complaintData.documents.map((doc) => ({
        name: doc.name,
        type: doc.type,
        base64: doc.base64 || '',
      }));
    }

    console.log('[ComplaintService] Registering complaint:', apiRequest);

    // Call backend API to register complaint
    const response = await fetch(`${API_BASE_URL}/complaints/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(apiRequest),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        errorData.error?.message || `API error: ${response.statusText}`
      );
    }

    const result = await response.json();

    return {
      success: true,
      message: 'Complaint registered successfully',
      ticketNumber: ticketNumber,
      complaintId: result.complaintId,
      estimatedResolutionTime: result.estimatedResolutionTime,
      nextSteps: result.nextSteps,
    };
  } catch (error) {
    console.error('[ComplaintService] Error registering complaint:', error);

    const errorMessage = error instanceof Error ? error.message : String(error);

    return {
      success: false,
      message: 'Failed to register complaint',
      error: errorMessage,
    };
  }
}

/**
 * Get complaint status by ticket number
 */
export async function getComplaintStatus(
  ticketNumber: string
): Promise<ComplaintResponse> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/complaints/status/${ticketNumber}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`API error: ${response.statusText}`);
    }

    const result = await response.json();

    return {
      success: true,
      message: 'Status fetched successfully',
      ...result,
    };
  } catch (error) {
    console.error('[ComplaintService] Error fetching status:', error);

    const errorMessage = error instanceof Error ? error.message : String(error);

    return {
      success: false,
      message: 'Failed to fetch status',
      error: errorMessage,
    };
  }
}

/**
 * Update complaint
 */
export async function updateComplaint(
  complaintId: string,
  updates: Partial<ComplaintData>
): Promise<ComplaintResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/complaints/${complaintId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updates),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.statusText}`);
    }

    const result = await response.json();

    return {
      success: true,
      message: 'Complaint updated successfully',
      ...result,
    };
  } catch (error) {
    console.error('[ComplaintService] Error updating complaint:', error);

    const errorMessage = error instanceof Error ? error.message : String(error);

    return {
      success: false,
      message: 'Failed to update complaint',
      error: errorMessage,
    };
  }
}

/**
 * Extract severity from text using keywords
 */
export function extractSeverityFromText(text: string): 'Low' | 'Medium' | 'High' | 'Critical' {
  const textLower = text.toLowerCase();

  if (
    textLower.includes('critical') ||
    textLower.includes('emergency') ||
    textLower.includes('life threatening') ||
    textLower.includes('danger') ||
    textLower.includes('dangerous')
  ) {
    return 'Critical';
  } else if (
    textLower.includes('high') ||
    textLower.includes('urgent') ||
    textLower.includes('blocking') ||
    textLower.includes('hazard') ||
    textLower.includes('affecting many')
  ) {
    return 'High';
  } else if (
    textLower.includes('medium') ||
    textLower.includes('moderate') ||
    textLower.includes('affecting some')
  ) {
    return 'Medium';
  }

  return 'Low';
}

/**
 * Identify issue category from description
 */
export function identifyCategory(description: string): string {
  const text = description.toLowerCase();

  if (text.includes('pothole') || text.includes('road') || text.includes('pavement')) {
    return 'Potholes & road damage';
  } else if (
    text.includes('garbage') ||
    text.includes('waste') ||
    text.includes('litter') ||
    text.includes('trash')
  ) {
    return 'Garbage disposal & cleanliness';
  } else if (
    text.includes('streetlight') ||
    text.includes('light') ||
    text.includes('lamp') ||
    text.includes('street light')
  ) {
    return 'Streetlights & street lighting';
  } else if (
    text.includes('water') ||
    text.includes('leak') ||
    text.includes('pipe') ||
    text.includes('supply')
  ) {
    return 'Water supply & drainage';
  } else if (
    text.includes('sewage') ||
    text.includes('sewer') ||
    text.includes('drain') ||
    text.includes('overflow')
  ) {
    return 'Sewage & sanitation';
  } else if (
    text.includes('electricity') ||
    text.includes('electric') ||
    text.includes('power') ||
    text.includes('cable')
  ) {
    return 'Electricity issues';
  } else if (
    text.includes('traffic') ||
    text.includes('parking') ||
    text.includes('vehicle') ||
    text.includes('congestion')
  ) {
    return 'Traffic & parking';
  } else if (text.includes('park') || text.includes('garden') || text.includes('green')) {
    return 'Parks & public spaces';
  } else if (
    text.includes('building') ||
    text.includes('construction') ||
    text.includes('encroachment')
  ) {
    return 'Building code violations';
  } else if (text.includes('noise') || text.includes('sound')) {
    return 'Noise complaints';
  }

  return 'Other';
}

export default {
  generateComplaintTicket,
  validatePhoneNumber,
  formatPhoneNumber,
  registerComplaint,
  getComplaintStatus,
  updateComplaint,
  extractSeverityFromText,
  identifyCategory,
};
