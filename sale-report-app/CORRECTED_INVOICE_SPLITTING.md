# Corrected Invoice Splitting Implementation

## ✅ **Fixed Implementation**

I've corrected the invoice splitting logic to match your exact requirements:

### **Your Requirement**:
- **First row**: Keep original invoice number `342471` (no "A" suffix)
- **Second row**: Add "A" suffix `342471A`
- **Individual values**: Each row keeps its own values (not summed)
- **inv_val**: Calculated per row (138650 for first row, 36345 for second row)

## 🔧 **Corrected Logic**

### **Before (Incorrect)**:
- Grouped and summed all rows with same invoice number
- All rows got "A" suffix for multi-GST invoices

### **After (Correct)**:
- **Keep rows separate** (no grouping/summing)
- **First occurrence**: Keep original invoice number
- **Subsequent occurrences**: Add "A" suffix
- **Individual values**: Each row maintains its own values

## 📊 **Implementation Details**

### **Two-Pass Algorithm**

#### **Pass 1: Analyze GST Rates**
```typescript
// Collect all GST rates per invoice
transformedRows.forEach((row, index) => {
  const invoiceNo = row.invno;
  
  // Calculate GST rate from tax amounts
  const cgstAmt = parseNumber(row['c gst']) || 0;
  const sgstAmt = parseNumber(row['s gst']) || 0;
  const igstAmt = parseNumber(row['igst']) || 0;
  const assVal = parseNumber(row['ass_val']) || 0;
  
  let gstRate = 0;
  if (igstAmt > 0 && assVal > 0) {
    gstRate = Math.round((igstAmt / assVal) * 100 * 100) / 100;
  } else if ((cgstAmt > 0 || sgstAmt > 0) && assVal > 0) {
    gstRate = Math.round(((cgstAmt + sgstAmt) / assVal) * 100 * 100) / 100;
  }
  
  invoiceGstMap.get(invoiceNo)!.add(gstRate);
});
```

#### **Pass 2: Process Each Row Individually**
```typescript
// Track how many times each invoice has been processed
const invoiceProcessedCount = new Map<string, number>();

transformedRows.forEach((row, index) => {
  const invoiceNo = row.invno;
  const processedCount = invoiceProcessedCount.get(invoiceNo)!;
  
  // Update invoice number based on occurrence
  if (hasMultipleGstRates) {
    if (processedCount === 0) {
      processedRow.invno = invoiceNo; // First occurrence - keep original
    } else {
      processedRow.invno = `${invoiceNo}A`; // Subsequent - add A
    }
  } else {
    processedRow.invno = invoiceNo; // Single GST rate - keep original
  }
  
  // Keep individual row values (no summing)
  processedRow['ass_val'] = parseNumber(row['ass_val']) || 0;
  processedRow['c gst'] = parseNumber(row['c gst']) || 0;
  // ... etc
});
```

## 🎯 **Expected Output**

### **Your Example**:
```
Invoice 342471 (multiple GST rates):
- Row 1: GST 18% → Keep as 342471
- Row 2: GST 0% → Change to 342471A
```

### **Result**:
```
C209  Innovative Moulds Craft Private Limited  2025-08-03  RH  342471  I2001280  PA66 GF35%  3902.10.00  500  235  117500  10575  10575  0  0  138650  no  18
C209  Innovative Moulds Craft Private Limited  2025-08-03  RH  342471A  I2000480  XPP 11705 (TALC 30%)  3902.10.00  500  72.69  36345  0  0  0  0  36345  no  0
```

## 🔍 **Debugging Output**

The console will show:
```
Starting invoice processing with 7085 rows
First occurrence: 342471 (GST Rate: 18%)
Subsequent occurrence: 342471 -> 342471A (GST Rate: 0%)
Processing row 1: Invoice 342471, GST Rate: 18%, ass_val: 117500
Processing row 2: Invoice 342471A, GST Rate: 0%, ass_val: 36345
Processed data result: 7085 rows
```

## 🚀 **Key Features**

- ✅ **Individual rows**: No grouping or summing
- ✅ **First occurrence**: Keeps original invoice number
- ✅ **Subsequent occurrences**: Adds "A" suffix
- ✅ **Individual values**: Each row maintains its own values
- ✅ **Proper inv_val**: Calculated per row
- ✅ **GST rate detection**: Based on tax amounts
- ✅ **No blank cells**: All fields have values

## 📋 **Testing**

1. **Import your Excel file** with transformation
2. **Check browser console** for occurrence tracking
3. **Verify output** shows:
   - First row: Original invoice number
   - Second row: Invoice number with "A" suffix
   - Individual values for each row
   - Correct inv_val calculations

The system now correctly implements your invoice splitting requirements!
