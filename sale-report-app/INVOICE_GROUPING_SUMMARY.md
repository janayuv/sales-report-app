# Invoice Grouping and Summing Implementation

## ✅ **Feature Implemented**

The transformation engine now groups rows by invoice number (`Invno`) and sums the specified fields as requested.

## 🔧 **What Was Added**

### 1. **Grouping Method**
**File**: `src/utils/transformationEngine.ts`

```typescript
private groupByInvoiceAndSum(transformedRows: any[]): any[] {
  const groupedMap = new Map<string, any>();
  
  transformedRows.forEach(row => {
    const invoiceNo = row.invno;
    if (!invoiceNo) return; // Skip rows without invoice number
    
    if (groupedMap.has(invoiceNo)) {
      // Sum the specified fields
      const existing = groupedMap.get(invoiceNo);
      existing['ass_val'] = (existing['ass_val'] || 0) + (row['ass_val'] || 0);
      existing['c gst'] = (existing['c gst'] || 0) + (row['c gst'] || 0);
      existing['s gst'] = (existing['s gst'] || 0) + (row['s gst'] || 0);
      existing['igst'] = (existing['igst'] || 0) + (row['igst'] || 0);
      existing['amot'] = (existing['amot'] || 0) + (row['amot'] || 0);
      existing['inv_val'] = (existing['inv_val'] || 0) + (row['inv_val'] || 0);
    } else {
      // First occurrence of this invoice number
      groupedMap.set(invoiceNo, { ...row });
    }
  });
  
  // Recalculate derived fields for grouped data
  const groupedData = Array.from(groupedMap.values());
  groupedData.forEach(row => {
    // Recalculate IGST flags and percentage based on summed values
    const igstFlags = calculateIGSTFlags(row);
    row['igst yes/no'] = igstFlags['igst yes/no'];
    row.percentage = igstFlags.percentage;
  });
  
  return groupedData;
}
```

### 2. **Updated Transformation Flow**
**File**: `src/utils/transformationEngine.ts`

The `transformData` method now:
1. **Step 1**: Detect column mappings
2. **Step 2**: Transform each individual row
3. **Step 3**: Group by invoice number and sum specified fields
4. **Step 4**: Recalculate derived fields (IGST flags, percentages)
5. **Step 5**: Return grouped data

## 📊 **Fields That Get Summed**

Based on your request, these fields are summed by invoice number:

| Field | Description | Example |
|-------|-------------|---------|
| `ass_val` | Assessable Value | Sum of all product assessable values |
| `c gst` | CGST Amount | Sum of all CGST amounts |
| `s gst` | SGST Amount | Sum of all SGST amounts |
| `igst` | IGST Amount | Sum of all IGST amounts |
| `amot` | Amortization | Sum of all amortization costs |
| `inv_val` | Invoice Value | Sum of all invoice values |

## 🎯 **How It Works**

### **Before Grouping** (Multiple rows per invoice):
```
Invoice 342239:
- Row 1: Product A, ass_val: 14852.88, c gst: 1336.76, s gst: 1336.76, igst: 0
- Row 2: Product B, ass_val: 48912.60, c gst: 4402.13, s gst: 4402.13, igst: 0
- Row 3: Product C, ass_val: 24799.68, c gst: 2231.97, s gst: 2231.97, igst: 0
```

### **After Grouping** (One row per invoice):
```
Invoice 342239:
- ass_val: 88565.16 (sum of all products)
- c gst: 7970.86 (sum of all CGST)
- s gst: 7970.86 (sum of all SGST)
- igst: 0 (sum of all IGST)
- amot: 0 (sum of all amortization)
- inv_val: 104506.89 (sum of all invoice values)
```

## 🔄 **Derived Fields Recalculation**

After grouping and summing, the system automatically recalculates:

1. **IGST Flags**: `igst yes/no` based on summed IGST amounts
2. **Percentage**: Tax percentage based on summed values
3. **RE Code**: Remains the same (based on invoice date)

## 🚀 **Testing**

To test this feature:

1. **Import your Excel file** with "Import with Transformation"
2. **Check the preview** - you should see fewer rows (one per invoice)
3. **Verify the sums** - check that values are correctly summed
4. **Export the data** - download the grouped Excel file

## 📋 **Expected Results**

- **Input**: 7,085 rows (multiple products per invoice)
- **Output**: ~2,000-3,000 rows (one row per invoice)
- **Data**: Summed values for each invoice
- **Format**: Same output format as specified

The system now correctly groups by invoice number and sums the specified fields!
