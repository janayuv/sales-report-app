# GST Rate Splitting Implementation

## ✅ **Feature Implemented**

The system now splits invoices that have multiple GST rates into separate rows with "A" suffix added to the invoice number.

## 🎯 **How It Works**

### **Example Scenario**
If invoice `342471` has:
- Some items with 9% GST (CGST 4.5% + SGST 4.5%)
- Some items with 0% GST

The system will create:
- `342471A` - for items with 9% GST
- `342471A` - for items with 0% GST (if there are multiple rates)

## 🔧 **Implementation Details**

### **Three-Pass Algorithm**

#### **Pass 1: Collect GST Rates**
```typescript
// First pass: collect all GST rates per invoice
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

#### **Pass 2: Group by Invoice + GST Rate**
```typescript
// Create group key: invoice number + GST rate
const groupKey = hasMultipleGstRates ? `${invoiceNo}_${gstRate}` : invoiceNo;

// Group and sum values by this key
if (groupedMap.has(groupKey)) {
  // Sum the specified fields
  existing['ass_val'] = existingAssVal + rowAssVal;
  existing['c gst'] = existingCGst + rowCGst;
  // ... etc
}
```

#### **Pass 3: Update Invoice Numbers**
```typescript
// If invoice has multiple GST rates, add "A" suffix
if (gstRates.size > 1) {
  row.invno = `${invoiceNo}A`;
  console.log(`Split invoice: ${invoiceNo} -> ${invoiceNo}A`);
}
```

## 📊 **GST Rate Calculation**

The system calculates GST rates from tax amounts:

### **IGST Calculation**
```
GST Rate = (IGST Amount / Assessable Value) × 100
```

### **CGST + SGST Calculation**
```
GST Rate = ((CGST Amount + SGST Amount) / Assessable Value) × 100
```

### **Rounding**
All rates are rounded to 2 decimal places for consistency.

## 🎯 **Example Output**

### **Before Splitting**:
```
Invoice 342471:
- Row 1: Product A, GST: 9% (CGST: 4.5%, SGST: 4.5%)
- Row 2: Product B, GST: 9% (CGST: 4.5%, SGST: 4.5%)
- Row 3: Product C, GST: 0% (No tax)
```

### **After Splitting**:
```
Invoice 342471A:
- Combined: Products A + B, GST: 9%, Summed values

Invoice 342471A:
- Product C, GST: 0%, Original values
```

## 🔍 **Debugging Output**

The console will show:
```
Starting grouping process with 7085 rows
Processing row 1: Invoice 342471, GST Rate: 9, Group Key: 342471_9
Processing row 2: Invoice 342471, GST Rate: 9, Group Key: 342471_9
Processing row 3: Invoice 342471, GST Rate: 0, Group Key: 342471_0
Split invoice: 342471 -> 342471A (multiple GST rates)
Final row 1: Invoice 342471A, ass_val: 50000, c gst: 4500
Final row 2: Invoice 342471A, ass_val: 10000, c gst: 0
```

## 🚀 **Testing**

1. **Import your Excel file** with transformation
2. **Check browser console** for GST rate analysis
3. **Look for "Split invoice" messages** in console
4. **Verify output** shows invoices with "A" suffix where applicable
5. **Check that values are properly grouped** by GST rate

## 📋 **Key Features**

- ✅ **Detects multiple GST rates** per invoice
- ✅ **Groups by invoice + GST rate** combination
- ✅ **Adds "A" suffix** to split invoices
- ✅ **Sums values correctly** within each GST group
- ✅ **Maintains data integrity** with proper validation
- ✅ **Provides detailed logging** for debugging

The system now intelligently splits invoices with mixed GST rates!
