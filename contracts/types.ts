/**
 * Canonical TypeScript Interfaces for MediPick Domain Entities
 * Shared across Customer UI and Pharmacy UI
 */

export type UserRole = 'CUSTOMER' | 'PHARMACY_STAFF' | 'PHARMACIST' | 'PHARMACY_ADMIN';

export type StaffRole =
  | 'Owner / Chief Pharmacist'
  | 'Pharmacy Owner'
  | 'Investor'
  | 'Designated Manager / Pharmacist'
  | 'Staff Pharmacist'
  | 'Dispensary Assistant'
  | 'Dispensary Cashier';

export interface StaffPermissions {
  canReviewRx: boolean;
  canApproveQuotes: boolean;
  canManageInventory: boolean;
  canViewFinancials: boolean;
  canManageStaff: boolean;
  canProcessRefunds: boolean;
}

export interface User {
  id: string;
  phone: string;
  email?: string;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
}

export interface PharmacyStaffProfile {
  id: string;
  userId: string;
  pharmacyId: string;
  staffRole: StaffRole;
  slmcNumber?: string;
  isOwner: boolean;
  isDesignatedManager: boolean;
  onDuty: boolean;
}

export interface Pharmacy {
  id: string;
  name: string;
  registrationNumber: string;
  nmraLicense?: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  latitude: number;
  longitude: number;
  isOpen: boolean;
  deliveryRadiusKm: number;
  status: 'PENDING' | 'VERIFIED' | 'SUSPENDED';
}

export type OrderStatus =
  | 'PENDING'
  | 'QUOTED'
  | 'CONFIRMED'
  | 'PREPARING'
  | 'DISPENSED'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'REJECTED';

export interface Order {
  id: string;
  orderNumber: string;
  customerId: string;
  pharmacyId: string;
  status: OrderStatus;
  totalAmount: number;
  deliveryFee: number;
  isPickup: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Prescription {
  id: string;
  customerId: string;
  fileKey: string;
  fileUrl: string;
  aiClarityScore: number;
  aiSealDetected: boolean;
  pharmacistNotes?: string;
  status: 'PENDING' | 'VERIFIED' | 'REJECTED';
  createdAt: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
  meta?: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
  };
}
