export interface Client {
  id?: number;
  name: string;
  email: string;
  phone?: string;
  address?: {
    street: string;
    city: string;
    state?: string;
    zipCode: string;
    country: string;
  };
  companyName?: string;
  contactPerson?: string;
  taxNumber?: string;
  notes?: string;
  createdAt?: Date;
  updatedAt?: Date;
} 