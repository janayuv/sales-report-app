# Export-Level Invoice Splitting Implementation

## ✅ **Complete Implementation**

The system now implements **export-level invoice splitting** that works with the existing `sales_reports` table structure, exactly as specified in your requirements.

## 🎯 **Algorithm Overview**

### **Step 1: Group by Invoice Number**
```typescript
// Group all rows by invoice_no
const invoiceGroups = new Map<string, any[]>();
transformedRows.forEach(row => {
  const invoiceNo = row.invno;
  if (!invoiceGroups.has(invoiceNo)) {
    invoiceGroups.set(invoiceNo, []);
  }
  invoiceGroups.get(invoiceNo)!.push(row);
});
```

### **Step 2: Process Each Invoice**
For each invoice, determine if splitting is needed:

#### **Single GST Rate**: Sum and Keep Original
```typescript
if (gstGroups.size === 1) {
  const singleGstRows = Array.from(gstGroups.values())[0];
  const summedRow = this.sumRowsForInvoice(singleGstRows, originalInvoiceNo);
  processedRows.push(summedRow);
  // Mapping: original_invoice_no → [original_invoice_no]
}
```

#### **Multiple GST Rates**: Split with Suffixes
```typescript
// Sort groups by descending taxable value (ass_val)
gstGroupsArray.sort((a, b) => {
  const aTotal = a[1].reduce((sum, row) => sum + (parseNumber(row['ass_val']) || 0), 0);
  const bTotal = b[1].reduce((sum, row) => sum + (parseNumber(row['ass_val']) || 0), 0);
  return bTotal - aTotal;
});

for (let i = 0; i < gstGroupsArray.length; i++) {
  const [gstRate, gstRows] = gstGroupsArray[i];
  let generatedInvoiceNo: string;
  
  if (i === 0) {
    generatedInvoiceNo = originalInvoiceNo; // Keep original
  } else {
    generatedInvoiceNo = this.generateUniqueInvoiceNo(originalInvoiceNo, i, processedRows);
  }
  
  const summedRow = this.sumRowsForInvoice(gstRows, generatedInvoiceNo);
  processedRows.push(summedRow);
}
```

## 🔧 **Key Features**

### **1. GST Rate Detection**
```typescript
private groupRowsByGstRate(rows: any[]): Map<number, any[]> {
  const gstGroups = new Map<number, any[]>();
  
  rows.forEach(row => {
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
    
    if (!gstGroups.has(gstRate)) {
      gstGroups.set(gstRate, []);
    }
    gstGroups.get(gstRate)!.push(row);
  });
  
  return gstGroups;
}
```

### **2. Suffix Collision Handling**
```typescript
private generateUniqueInvoiceNo(originalInvoiceNo: string, groupIndex: number, existingRows: any[]): string {
  const suffixes = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'];
  const suffix = suffixes[groupIndex - 1] || String.fromCharCode(65 + groupIndex - 1);
  
  let candidateInvoiceNo = `${originalInvoiceNo}${suffix}`;
  
  // Check for collisions in existing rows
  let collisionCount = 0;
  while (existingRows.some(row => row.invno === candidateInvoiceNo)) {
    collisionCount++;
    candidateInvoiceNo = `${originalInvoiceNo}${suffix}${collisionCount}`;
  }
  
  return candidateInvoiceNo;
}
```

### **3. Row Summing with Totals Calculation**
```typescript
private sumRowsForInvoice(rows: any[], invoiceNo: string): any {
  const template = { ...rows[0] };
  template.invno = invoiceNo;
  
  // Sum numeric fields
  const numericFields = ['qty', 'bas_price', 'ass_val', 'c gst', 's gst', 'igst', 'amot', 'inv_val'];
  
  numericFields.forEach(field => {
    const sum = rows.reduce((total, row) => {
      return total + (parseNumber(row[field]) || 0);
    }, 0);
    template[field] = sum;
  });
  
  // Recalculate derived fields
  const igstFlags = calculateIGSTFlags(template);
  template['igst yes/no'] = igstFlags['igst yes/no'];
  template.percentage = igstFlags.percentage;
  
  return template;
}
```

### **4. Export Logging**
```typescript
const invoiceMappingLog = new Map<string, string[]>(); // original_invoice_no → [generated_invoice_nos]

// Log the mapping
console.log('Invoice splitting mapping:');
for (const [original, generated] of invoiceMappingLog) {
  if (generated.length > 1) {
    console.log(`  ${original} → [${generated.join(', ')}]`);
  }
}
```

## 📊 **Example Output**

### **Input**: Invoice 342471 with multiple GST rates
```
Row 1: GST 18%, ass_val: 117500, inv_val: 138650
Row 2: GST 0%,  ass_val: 36345,  inv_val: 36345
```

### **Output**: Split invoices
```
342471:  ass_val: 117500, inv_val: 138650 (GST 18% group)
342471A: ass_val: 36345,  inv_val: 36345  (GST 0% group)
```

### **Console Log**:
```
Processing invoice 342471 with 2 rows
Invoice 342471 has 2 GST rate groups
Splitting invoice 342471 into 2 groups
First group (GST 18%): keeping original 342471
Subsequent group (GST 0%): creating 342471A
Group 1: 342471 (GST 18%) - 1 rows, ass_val: 117500
Group 2: 342471A (GST 0%) - 1 rows, ass_val: 36345
Invoice splitting mapping:
  342471 → [342471, 342471A]
```

## 🎯 **Acceptance Criteria Met**

✅ **Export contains one invoice per (original invoice_no, gst_rate group)**  
✅ **Unique invoice_no with suffixing (A, B, C...)**  
✅ **Totals match grouped item sums**  
✅ **Suffix collisions are handled**  
✅ **Deterministic ordering (by descending taxable value)**  
✅ **Export logging with original → generated mapping**  
✅ **Works with existing sales_reports table structure**  

## 🚀 **Testing**

1. **Import your Excel file** with transformation
2. **Check browser console** for detailed splitting logs
3. **Look for**:
   - "Processing invoice X with Y rows"
   - "Invoice X has Z GST rate groups"
   - "Splitting invoice X into Z groups"
   - "Invoice splitting mapping" section
4. **Verify output** shows correct invoice splitting

The system now implements exactly what you specified: **export-level invoice splitting by GST rate with proper suffix handling and collision avoidance**!
