import React, { type ReactNode } from 'react';

export function TestProviders({ children }: { children: ReactNode }) {
  return React.createElement('div', {}, children);
}

// Mock data for testing
export const mockPreferences = {
  theme: 'dark',
  accentColor: 'blue',
};

export const mockPreferencesDefault = {
  theme: 'system',
  accentColor: 'blue',
};

export const mockCompany = {
  id: 'test-company',
  name: 'Test Company',
  gstNumber: 'GST123456789',
  address: 'Test Address',
  phone: '1234567890',
  email: 'test@company.com',
};

export const mockCustomer = {
  id: 'test-customer',
  name: 'Test Customer',
  email: 'customer@test.com',
  phone: '9876543210',
  address: 'Customer Address',
  companyId: 'test-company',
};
