export interface Client {
  id?: number;
  name: string;
  email: string;
  phone?: string;
  // Address can be an object in the frontend model
  address?: {
    street: string;
    city: string;
    state?: string;
    zipCode: string;
    country: string;
  } | string; // Or a string when coming from the backend
  // Individual address fields for backend compatibility
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
  companyName?: string;
  contactPerson?: string;
  taxNumber?: string;
  notes?: string;
  createdAt?: Date;
  updatedAt?: Date;
} 