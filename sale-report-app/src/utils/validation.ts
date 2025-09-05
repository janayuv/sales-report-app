import { z } from 'zod';

// Company validation schema
export const companySchema = z.object({
  name: z.string().min(1, 'Company name is required'),
  key: z
    .string()
    .min(1, 'Company key is required')
    .regex(/^[a-z_]+$/, 'Company key must be lowercase with underscores only'),
});

export type CompanyFormData = z.infer<typeof companySchema>;

// Customer validation schema
export const customerSchema = z.object({
  customer_name: z.string().min(1, 'Customer name is required'),
  tally_name: z.string().min(1, 'Tally name is required'),
  gst_no: z
    .string()
    .optional()
    .refine(val => {
      if (!val) return true;
      return /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(
        val
      );
    }, 'Invalid GST number format'),
  category_id: z.number().nullable().optional(),
});

export type CustomerFormData = z.infer<typeof customerSchema>;

// Excel file validation schema
export const excelFileSchema = z.object({
  file: z.instanceof(File).refine(file => {
    const validTypes = [
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel.sheet.macroEnabled.12',
    ];
    return (
      validTypes.includes(file.type) ||
      file.name.endsWith('.xls') ||
      file.name.endsWith('.xlsx')
    );
  }, 'Please upload a valid Excel file (.xls or .xlsx)'),
});

export type ExcelFileFormData = z.infer<typeof excelFileSchema>;

// Report row validation schema
export const reportRowSchema = z.object({
  invoice_no: z.string().min(1, 'Invoice number is required'),
  invoice_date: z.string().min(1, 'Invoice date is required'),
  supplier_name_raw: z.string().min(1, 'Supplier name is required'),
  gst_rate: z
    .number()
    .min(0, 'GST rate must be non-negative')
    .max(100, 'GST rate cannot exceed 100%'),
  cgst_amt: z.number().min(0, 'CGST amount must be non-negative'),
  sgst_amt: z.number().min(0, 'SGST amount must be non-negative'),
  igst_amt: z.number().min(0, 'IGST amount must be non-negative'),
  total_amount: z.number().min(0, 'Total amount must be non-negative'),
});

export type ReportRowData = z.infer<typeof reportRowSchema>;

// Tally export validation schema
export const tallyExportSchema = z.object({
  notes: z.string().optional(),
  include_mappings: z.boolean().default(true),
});

export type TallyExportFormData = z.infer<typeof tallyExportSchema>;

// Settings validation schema
export const settingsSchema = z.object({
  suffix_strategy: z.enum(['alphabetic', 'numeric']).default('alphabetic'),
  decimal_places: z.number().min(0).max(4).default(2),
  auto_backup: z.boolean().default(true),
  backup_interval_days: z.number().min(1).max(365).default(7),
});

export type SettingsFormData = z.infer<typeof settingsSchema>;

// Search/filter validation schemas
export const searchSchema = z.object({
  query: z.string().optional(),
  company_id: z.number().optional(),
  date_from: z.string().optional(),
  date_to: z.string().optional(),
  status: z.enum(['all', 'uploaded', 'processed', 'exported']).default('all'),
});

export type SearchFormData = z.infer<typeof searchSchema>;

// Utility functions for validation
export function validateGSTNumber(gstNo: string): boolean {
  const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
  return gstRegex.test(gstNo);
}

export function validateInvoiceNumber(invoiceNo: string): boolean {
  // Basic validation - can be customized based on business rules
  return invoiceNo.length > 0 && invoiceNo.length <= 50;
}

export function validateAmount(amount: number): boolean {
  return amount >= 0 && amount <= 999999999.99;
}

export function validateGSTRate(rate: number): boolean {
  return rate >= 0 && rate <= 100;
}

// Custom error messages
export const validationMessages = {
  required: 'This field is required',
  invalidEmail: 'Please enter a valid email address',
  invalidGST: 'Please enter a valid GST number',
  invalidAmount: 'Please enter a valid amount',
  invalidDate: 'Please enter a valid date',
  fileTooLarge: 'File size must be less than 10MB',
  invalidFileType: 'Please upload a valid Excel file',
} as const;
