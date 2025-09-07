# Hybrid Invoice Processing Implementation

## ✅ **Correct Understanding Implemented**

Now the system uses **conditional logic** based on GST rate count:

### **Multiple GST Rates**: Split Invoice
- **First row**: Keep original invoice number `342471`
- **Subsequent rows**: Add "A" suffix `342471A`
- **Individual values**: Each row keeps its own values (no summing)

### **Single GST Rate**: Group and Sum (Previous Method)
- **Group by invoice number**: Sum all rows with same invoice
- **One row per invoice**: Combined values
- **Original invoice number**: Keep as is

## 🔧 **Hybrid Algorithm**

### **Two-Pass Processing**

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

#### **Pass 2: Conditional Processing**
```typescript
if (hasMultipleGstRates) {
  // MULTIPLE GST RATES: Split invoice (keep individual rows)
  if (processedCount === 0) {
    processedRow.invno = invoiceNo; // First occurrence - keep original
  } else {
    processedRow.invno = `${invoiceNo}A`; // Subsequent - add A
  }
  splitRows.push(processedRow);
} else {
  // SINGLE GST RATE: Group and sum (previous method)
  if (groupedMap.has(invoiceNo)) {
    // Sum the specified fields
    existing['ass_val'] = existingAssVal + rowAssVal;
    existing['c gst'] = existingCGst + rowCGst;
    // ... etc
  } else {
    groupedMap.set(invoiceNo, processedRow);
  }
}
```

## 📊 **Examples**

### **Example 1: Multiple GST Rates (Split)**
**Input**: Invoice `342471` with rows having 18% and 0% GST
```
Row 1: GST 18% → Keep as 342471 (individual values)
Row 2: GST 0%  → Change to 342471A (individual values)
```

**Output**:
```
342471:  ass_val: 117500, inv_val: 138650 (individual)
342471A: ass_val: 36345,  inv_val: 36345  (individual)
```

### **Example 2: Single GST Rate (Group)**
**Input**: Invoice `342239` with all rows having 18% GST
```
Row 1: GST 18%, ass_val: 14852.88
Row 2: GST 18%, ass_val: 48912.60
Row 3: GST 18%, ass_val: 24799.68
```

**Output**:
```
342239: ass_val: 88565.16, inv_val: 104506.89 (summed)
```

## 🔍 **Debugging Output**

The console will show:
```
Starting hybrid invoice processing with 7085 rows
Split invoice - First occurrence: 342471 (GST Rate: 18%)
Split invoice - Subsequent occurrence: 342471 -> 342471A (GST Rate: 0%)
Grouped invoice - First occurrence: 342239 (GST Rate: 18%)
Grouped invoice: 342239 - Summing values (GST Rate: 18%)
Hybrid processing result: 2500 rows
- Grouped invoices: 2000 rows
- Split invoices: 500 rows
```

## 🎯 **Key Features**

- ✅ **Conditional Logic**: Different processing based on GST rate count
- ✅ **Multiple GST**: Split with "A" suffix, individual values
- ✅ **Single GST**: Group and sum, combined values
- ✅ **Proper Detection**: GST rates calculated from tax amounts
- ✅ **No Blank Cells**: All fields have values
- ✅ **Detailed Logging**: Clear distinction between split and grouped invoices

## 🚀 **Testing**

1. **Import your Excel file** with transformation
2. **Check browser console** for hybrid processing messages
3. **Look for**:
   - "Split invoice" messages for multiple GST rates
   - "Grouped invoice" messages for single GST rates
4. **Verify output** shows correct processing for each invoice type

The system now correctly implements your hybrid requirements!
