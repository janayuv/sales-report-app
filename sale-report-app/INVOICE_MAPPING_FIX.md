# Invoice Number Mapping Fix

## ✅ **Issue Identified**
You correctly pointed out that `invoice_no` is NOT the invoice number. Looking at your Excel data:

- `invoice_no`: `"20250801004205997410"` (This is a transaction/reference number)
- `Invno`: `"342239"` (This is the actual invoice number)

## 🔧 **Fixes Applied**

### 1. **Updated Column Mappings**
**File**: `src/utils/transformation.ts`

**Before**:
```typescript
{
  targetColumn: 'invno',
  sourceColumns: ['invoice_no', 'invno', 'invoice_number', 'invoiceno'],
  required: true
}
```

**After**:
```typescript
{
  targetColumn: 'invno',
  sourceColumns: ['invno', 'invoice_number', 'invoiceno'],
  required: true
}
```

**Result**: Now correctly maps `Invno` → `invno` instead of `invoice_no` → `invno`

### 2. **Updated Validation Logic**
**File**: `src/utils/transformation.ts`

**Before**: Validated against transformed field names
**After**: Validates against source field names

```typescript
// Required field validation - check source fields
const requiredFieldMappings = [
  { target: 'cust_code', sources: ['cust_cde'] },
  { target: 'inv_date', sources: ['IO_DATE'] },
  { target: 'invno', sources: ['Invno'] }  // ✅ Now checks Invno
];
```

### 3. **Updated Numeric Field Validation**
**File**: `src/utils/transformation.ts`

Now validates against the correct source fields:
```typescript
const numericFieldMappings = [
  { target: 'qty', sources: ['io_qty'] },
  { target: 'bas_price', sources: ['rate_pre_unit'] },
  { target: 'ass_val', sources: ['ASSESSABLE_VALUE'] },
  { target: 'c gst', sources: ['CGST_AMT'] },
  { target: 's gst', sources: ['SGST_AMT'] },
  { target: 'igst', sources: ['IGST_AMT'] },
  { target: 'amot', sources: ['Amortisation_cost', 'Total_Amorization'] },
  { target: 'inv_val', sources: ['Total_Inv_Value', 'invoice_Total', 'Grand_total'] },
  { target: 'percentage', sources: ['CGST_RATE', 'SGST_RATE', 'IGST_RATE'] }
];
```

## 📊 **Correct Field Mappings**

Based on your Excel data, the correct mappings are:

| Target Column | Source Column | Example Value |
|---------------|---------------|---------------|
| `cust_code` | `cust_cde` | `"C001"` |
| `cust_name` | `cust_name` | `"HYUNDAI MOTOR INDIA LIMITED-PLANT I"` |
| `inv_date` | `IO_DATE` | `"2025-08-01"` |
| `invno` | `Invno` | `"342239"` ✅ |
| `part_code` | `prod_cde` | `"53295010"` |
| `part_name` | `prod_name_ko` | `"CLEANER COMPLETE AIR - SU2I DSL CLAB"` |
| `tariff` | `tariff_code` | `"8421.31.00"` |
| `qty` | `io_qty` | `"36"` |
| `bas_price` | `rate_pre_unit` | `"412.58"` |
| `ass_val` | `ASSESSABLE_VALUE` | `"14852.88"` |
| `c gst` | `CGST_AMT` | `"1336.7592"` |
| `s gst` | `SGST_AMT` | `"1336.7592"` |
| `igst` | `IGST_AMT` | `"0"` |
| `amot` | `Amortisation_cost` or `Total_Amorization` | `"0"` |
| `inv_val` | `Total_Inv_Value` or `invoice_Total` or `Grand_total` | `"104506.89"` |

## 🎯 **What This Fixes**

1. **Correct Invoice Numbers**: Now uses `Invno` (342239) instead of `invoice_no` (20250801004205997410)
2. **Proper Validation**: Validates against actual source fields in your Excel data
3. **Accurate Mapping**: Column detection will now find the correct fields
4. **Better Error Messages**: Shows which source fields were checked for validation

## 🚀 **Next Steps**

1. **Test the Import**: Try importing your Excel file again
2. **Check Transformation**: Use "Import with Transformation" to verify column mappings
3. **Verify Output**: Ensure the output shows correct invoice numbers (342239, not 20250801004205997410)

The system now correctly identifies `Invno` as the invoice number field!
