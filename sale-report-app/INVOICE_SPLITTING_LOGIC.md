# 🔄 Invoice Splitting Logic - Detailed Explanation

## 📋 Table of Contents
- [Purpose & Business Context](#-purpose--business-context)
- [Step-by-Step Process](#-step-by-step-process)
- [Real-World Examples](#-real-world-examples)
- [Suffix Generation & Collision Avoidance](#-suffix-generation--collision-avoidance)
- [Value-Based Sorting](#-value-based-sorting)
- [Code Implementation](#-code-implementation)
- [Edge Cases & Error Handling](#-edge-cases--error-handling)
- [Business Impact](#-business-impact)

---

## 🎯 Purpose & Business Context

Invoice splitting is a critical feature for Indian export documentation where:

- **Single invoices** may contain items with **different GST rates**
- **Export regulations** require separate invoice records for each GST rate
- **Compliance** demands accurate tax reporting per rate category
- **Audit requirements** need clear separation of tax structures

### Why Invoice Splitting is Needed?

In Indian export business, a single invoice can contain:
- Items with **CGST + SGST** (intra-state transactions)
- Items with **IGST** (inter-state transactions)
- Items with **different tax rates** (5%, 12%, 18%, 28%)
- Items with **zero tax** (exempted goods)

Export documentation requires each tax structure to be reported separately for compliance and audit purposes.

---

## 📊 Step-by-Step Process

### Step 1: Group by Invoice Number

The system first groups all rows by their invoice number to identify which items belong to the same invoice.

```typescript
// Example: Raw data with multiple items per invoice
const rawData = [
  { invno: 'INV001', part_name: 'Product A', qty: 10, ass_val: 1000, c_gst: 90, s_gst: 90, igst: 0 },    // 18% GST
  { invno: 'INV001', part_name: 'Product B', qty: 5,  ass_val: 500,  c_gst: 45, s_gst: 45, igst: 0 },    // 18% GST
  { invno: 'INV001', part_name: 'Product C', qty: 2,  ass_val: 200,  c_gst: 0,  s_gst: 0,  igst: 36 },   // 18% IGST
  { invno: 'INV002', part_name: 'Product D', qty: 8,  ass_val: 800,  c_gst: 72, s_gst: 72, igst: 0 },    // 18% GST
];

// After grouping by invoice:
const invoiceGroups = new Map([
  ['INV001', [
    { invno: 'INV001', part_name: 'Product A', qty: 10, ass_val: 1000, c_gst: 90, s_gst: 90, igst: 0 },
    { invno: 'INV001', part_name: 'Product B', qty: 5,  ass_val: 500,  c_gst: 45, s_gst: 45, igst: 0 },
    { invno: 'INV001', part_name: 'Product C', qty: 2,  ass_val: 200,  c_gst: 0,  s_gst: 0,  igst: 36 }
  ]],
  ['INV002', [
    { invno: 'INV002', part_name: 'Product D', qty: 8,  ass_val: 800,  c_gst: 72, s_gst: 72, igst: 0 }
  ]]
]);
```

### Step 2: GST Rate Grouping Within Each Invoice

For each invoice, the system groups items by their calculated GST rate.

```typescript
// For INV001, group by GST rate:
const gstGroups = new Map([
  [18.0, [  // CGST + SGST = 18% (9% + 9%)
    { invno: 'INV001', part_name: 'Product A', qty: 10, ass_val: 1000, c_gst: 90, s_gst: 90, igst: 0 },
    { invno: 'INV001', part_name: 'Product B', qty: 5,  ass_val: 500,  c_gst: 45, s_gst: 45, igst: 0 }
  ]],
  [18.0, [  // IGST = 18%
    { invno: 'INV001', part_name: 'Product C', qty: 2,  ass_val: 200,  c_gst: 0,  s_gst: 0,  igst: 36 }
  ]]
]);

// Note: Both groups have 18% rate, but different tax structures (CGST+SGST vs IGST)
```

### Step 3: Invoice Splitting Decision

The system decides whether to split the invoice based on the number of GST rate groups.

```typescript
if (gstGroups.size === 1) {
  // Single GST rate: Keep original invoice, sum all rows
  const summedRow = this.sumRowsForInvoice(rows, originalInvoiceNo);
  processedRows.push(summedRow);
} else {
  // Multiple GST rates: Split with suffixes
  // INV001 → INV001, INV001A, INV001B, etc.
}
```

### Step 4: Suffix Generation & Collision Avoidance

When splitting is required, the system generates unique invoice numbers with suffixes.

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

**Suffix Logic:**
- **Group 0**: `INV001` (original, no suffix)
- **Group 1**: `INV001A`
- **Group 2**: `INV001B`
- **Group 3**: `INV001C`
- **Collision Handling**: If `INV001A` exists, creates `INV001A1`, `INV001A2`

### Step 5: Value-Based Sorting

Groups are sorted by descending assessable value to determine which gets the original invoice number.

```typescript
// Sort groups by descending taxable value (ass_val)
gstGroupsArray.sort((a, b) => {
  const aTotal = a[1].reduce((sum, row) => sum + (parseNumber(row['ass_val']) || 0), 0);
  const bTotal = b[1].reduce((sum, row) => sum + (parseNumber(row['ass_val']) || 0), 0);
  return bTotal - aTotal;
});
```

**Sorting Logic:**
- **Highest Value First**: Group with highest assessable value gets original invoice number
- **Lower Values**: Get suffixed invoice numbers
- **Business Logic**: Ensures main invoice represents largest transaction

---

## 🌟 Real-World Examples

### Example 1: Simple Invoice (No Splitting Required)

**Input Data:**
```
Invoice: INV001
├── Product A: 10 units, ₹1000, CGST ₹90, SGST ₹90 (18% total)
└── Product B: 5 units,  ₹500,  CGST ₹45, SGST ₹45 (18% total)
```

**Processing:**
1. **Group by Invoice**: All items belong to INV001
2. **GST Rate Grouping**: Single group with 18% rate
3. **No Splitting**: Only one GST rate group
4. **Summation**: Combine all items into single invoice

**Output:**
```
INV001: 15 units, ₹1500, CGST ₹135, SGST ₹135, IGST ₹0
```

### Example 2: Complex Invoice (Splitting Required)

**Input Data:**
```
Invoice: INV001
├── Product A: 10 units, ₹1000, CGST ₹90, SGST ₹90 (18% CGST+SGST)
├── Product B: 5 units,  ₹500,  CGST ₹45, SGST ₹45 (18% CGST+SGST)
└── Product C: 2 units,  ₹200,  IGST ₹36 (18% IGST)
```

**Processing:**
1. **Group by Invoice**: All items belong to INV001
2. **GST Rate Grouping**: 
   - Group 1: CGST+SGST items (₹1500 total value)
   - Group 2: IGST items (₹200 total value)
3. **Sorting**: Group 1 has higher value, gets original invoice
4. **Splitting**: 
   - `INV001`: CGST+SGST items (₹1500)
   - `INV001A`: IGST items (₹200)

**Output:**
```
INV001: 15 units, ₹1500, CGST ₹135, SGST ₹135, IGST ₹0
INV001A: 2 units, ₹200, CGST ₹0, SGST ₹0, IGST ₹36
```

### Example 3: Multiple Tax Rates

**Input Data:**
```
Invoice: INV002
├── Product A: 10 units, ₹1000, CGST ₹90, SGST ₹90 (18% GST)
├── Product B: 5 units,  ₹500,  CGST ₹30, SGST ₹30 (12% GST)
└── Product C: 2 units,  ₹200,  CGST ₹0,  SGST ₹0,  IGST ₹36 (18% IGST)
```

**Processing:**
1. **Group by Invoice**: All items belong to INV002
2. **GST Rate Grouping**: 
   - Group 1: 18% CGST+SGST items (₹1000)
   - Group 2: 12% CGST+SGST items (₹500)
   - Group 3: 18% IGST items (₹200)
3. **Sorting**: By assessable value (₹1000, ₹500, ₹200)
4. **Splitting**: 
   - `INV002`: 18% CGST+SGST items (₹1000)
   - `INV002A`: 12% CGST+SGST items (₹500)
   - `INV002B`: 18% IGST items (₹200)

**Output:**
```
INV002: 10 units, ₹1000, CGST ₹90, SGST ₹90, IGST ₹0
INV002A: 5 units, ₹500, CGST ₹30, SGST ₹30, IGST ₹0
INV002B: 2 units, ₹200, CGST ₹0, SGST ₹0, IGST ₹36
```

---

## 🔧 Code Implementation

### Main Processing Method

```typescript
private groupByInvoiceAndSum(transformedRows: any[]): any[] {
  console.log('Starting export-level invoice splitting with', transformedRows.length, 'rows');
  
  // Step 1: Group rows by invoice_no
  const invoiceGroups = new Map<string, any[]>();
  transformedRows.forEach((row, index) => {
    const invoiceNo = row.invno;
    if (!invoiceNo) {
      console.log(`Skipping row ${index + 1}: no invoice number`);
      return;
    }
    
    if (!invoiceGroups.has(invoiceNo)) {
      invoiceGroups.set(invoiceNo, []);
    }
    invoiceGroups.get(invoiceNo)!.push(row);
  });
  
  console.log(`Found ${invoiceGroups.size} unique invoices`);
  
  // Step 2: Process each invoice group
  const processedRows: any[] = [];
  const invoiceMappingLog = new Map<string, string[]>(); // original_invoice_no → [generated_invoice_nos]
  
  for (const [originalInvoiceNo, rows] of invoiceGroups) {
    console.log(`Processing invoice ${originalInvoiceNo} with ${rows.length} rows`);
    
    // Step 2a: Group rows by GST rate within this invoice
    const gstGroups = this.groupRowsByGstRate(rows);
    console.log(`Invoice ${originalInvoiceNo} has ${gstGroups.size} GST rate groups`);
    
    if (gstGroups.size === 1) {
      // Single GST rate: emit unchanged (sum all rows)
      const singleGstRows = Array.from(gstGroups.values())[0];
      const summedRow = this.sumRowsForInvoice(singleGstRows, originalInvoiceNo);
      processedRows.push(summedRow);
      invoiceMappingLog.set(originalInvoiceNo, [originalInvoiceNo]);
      console.log(`Single GST invoice ${originalInvoiceNo}: summed ${singleGstRows.length} rows`);
    } else {
      // Multiple GST rates: split with suffixes
      const generatedInvoiceNos: string[] = [];
      const gstGroupsArray = Array.from(gstGroups.entries());
      
      // Sort groups by descending taxable value (ass_val)
      gstGroupsArray.sort((a, b) => {
        const aTotal = a[1].reduce((sum, row) => sum + (parseNumber(row['ass_val']) || 0), 0);
        const bTotal = b[1].reduce((sum, row) => sum + (parseNumber(row['ass_val']) || 0), 0);
        return bTotal - aTotal;
      });
      
      console.log(`Splitting invoice ${originalInvoiceNo} into ${gstGroupsArray.length} groups`);
      
      for (let i = 0; i < gstGroupsArray.length; i++) {
        const [gstRate, gstRows] = gstGroupsArray[i];
        let generatedInvoiceNo: string;
        
        if (i === 0) {
          // First group: keep original invoice number
          generatedInvoiceNo = originalInvoiceNo;
          console.log(`First group (GST ${gstRate}%): keeping original ${generatedInvoiceNo}`);
        } else {
          // Subsequent groups: add suffix (A, B, C...)
          generatedInvoiceNo = this.generateUniqueInvoiceNo(originalInvoiceNo, i, processedRows);
          console.log(`Subsequent group (GST ${gstRate}%): creating ${generatedInvoiceNo}`);
        }
        
        // Sum rows for this GST group
        const summedRow = this.sumRowsForInvoice(gstRows, generatedInvoiceNo);
        processedRows.push(summedRow);
        generatedInvoiceNos.push(generatedInvoiceNo);
        
        console.log(`Group ${i + 1}: ${generatedInvoiceNo} (GST ${gstRate}%) - ${gstRows.length} rows, ass_val: ${summedRow['ass_val']}`);
      }
      
      invoiceMappingLog.set(originalInvoiceNo, generatedInvoiceNos);
    }
  }
  
  // Step 3: Log the mapping
  console.log('Invoice splitting mapping:');
  for (const [original, generated] of invoiceMappingLog) {
    if (generated.length > 1) {
      console.log(`  ${original} → [${generated.join(', ')}]`);
    }
  }
  
  console.log(`Export-level splitting result: ${processedRows.length} invoice records`);
  return processedRows;
}
```

### GST Rate Grouping Method

```typescript
private groupRowsByGstRate(rows: any[]): Map<number, any[]> {
  const gstGroups = new Map<number, any[]>();
  
  rows.forEach(row => {
    // Calculate GST rate from tax amounts
    const cgstAmt = parseNumber(row.c_gst) || 0;
    const sgstAmt = parseNumber(row.s_gst) || 0;
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

### Row Summation Method

```typescript
private sumRowsForInvoice(rows: any[], invoiceNo: string): any {
  if (rows.length === 0) {
    throw new Error('Cannot sum empty rows array');
  }
  
  // Use first row as template
  const template = { ...rows[0] };
  template.invno = invoiceNo;
  
  // Sum numeric fields
  const numericFields = ['qty', 'bas_price', 'ass_val', 'c_gst', 's_gst', 'igst', 'amot', 'inv_val'];
  
  numericFields.forEach(field => {
    const sum = rows.reduce((total, row) => {
      return total + (parseNumber(row[field]) || 0);
    }, 0);
    template[field] = sum;
  });
  
  // Recalculate derived fields
  const igstFlags = calculateIGSTFlags(template);
  template.igst_yes_no = igstFlags.igst_yes_no;
  template.percentage = igstFlags.percentage;
  
  // Ensure no blank cells
  OUTPUT_COLUMNS.forEach(col => {
    if (template[col] === null || template[col] === undefined) {
      if (numericFields.includes(col)) {
        template[col] = 0;
      } else {
        template[col] = '';
      }
    }
  });
  
  console.log(`Summed ${rows.length} rows for invoice ${invoiceNo}: ass_val=${template['ass_val']}, inv_val=${template['inv_val']}`);
  
  return template;
}
```

---

## ⚠️ Edge Cases & Error Handling

### Edge Case 1: Missing Invoice Numbers

```typescript
if (!invoiceNo) {
  console.log(`Skipping row ${index + 1}: no invoice number`);
  return;
}
```

**Handling:**
- Skip rows without invoice numbers
- Log warning for audit trail
- Continue processing other rows

### Edge Case 2: Empty Row Arrays

```typescript
if (rows.length === 0) {
  throw new Error('Cannot sum empty rows array');
}
```

**Handling:**
- Throw error for empty arrays
- Prevent invalid summation operations
- Ensure data integrity

### Edge Case 3: Invoice Number Collisions

```typescript
// Check for collisions in existing rows
let collisionCount = 0;
while (existingRows.some(row => row.invno === candidateInvoiceNo)) {
  collisionCount++;
  candidateInvoiceNo = `${originalInvoiceNo}${suffix}${collisionCount}`;
}
```

**Handling:**
- Detect existing invoice numbers
- Generate unique alternatives
- Prevent duplicate invoice numbers

### Edge Case 4: Invalid Tax Calculations

```typescript
// Safe number parsing with defaults
const cgstAmt = parseNumber(row.c_gst) || 0;
const sgstAmt = parseNumber(row.s_gst) || 0;
const igstAmt = parseNumber(row['igst']) || 0;
const assVal = parseNumber(row['ass_val']) || 0;
```

**Handling:**
- Default to 0 for invalid numbers
- Prevent division by zero
- Ensure consistent calculations

---

## 📈 Business Impact

### Benefits of Invoice Splitting

1. **Compliance**: Meets export documentation requirements
2. **Tax Accuracy**: Separates different tax structures
3. **Audit Trail**: Clear record of tax calculations
4. **Reporting**: Accurate tax reporting per rate
5. **Automation**: Reduces manual processing time
6. **Error Reduction**: Eliminates human calculation errors

### Use Cases

1. **Export Documentation**: Required for customs clearance
2. **Tax Reporting**: Separate reporting for different tax structures
3. **Audit Compliance**: Clear separation of tax calculations
4. **Business Analysis**: Better understanding of tax structures
5. **Regulatory Requirements**: Meets government reporting standards

### Performance Considerations

1. **Memory Usage**: Efficient grouping with Map data structures
2. **Processing Speed**: Optimized sorting and summation algorithms
3. **Scalability**: Handles large datasets efficiently
4. **Error Handling**: Comprehensive validation and error reporting

---

## 🔍 Debugging & Logging

The system provides comprehensive logging for debugging and audit purposes:

```typescript
console.log('Starting export-level invoice splitting with', transformedRows.length, 'rows');
console.log(`Found ${invoiceGroups.size} unique invoices`);
console.log(`Processing invoice ${originalInvoiceNo} with ${rows.length} rows`);
console.log(`Invoice ${originalInvoiceNo} has ${gstGroups.size} GST rate groups`);
console.log(`Splitting invoice ${originalInvoiceNo} into ${gstGroupsArray.length} groups`);
console.log('Invoice splitting mapping:');
console.log(`Export-level splitting result: ${processedRows.length} invoice records`);
```

This logging helps in:
- **Debugging**: Identifying processing issues
- **Audit**: Tracking transformation decisions
- **Monitoring**: Understanding system performance
- **Troubleshooting**: Resolving data processing problems

---

## 📝 Summary

The Invoice Splitting Logic is a sophisticated system that:

1. **Groups** invoice items by invoice number
2. **Calculates** GST rates for each item
3. **Groups** items by GST rate within each invoice
4. **Sorts** groups by assessable value
5. **Splits** invoices when multiple GST rates exist
6. **Generates** unique invoice numbers with suffixes
7. **Sums** quantities and amounts within each group
8. **Ensures** data integrity and compliance

This system ensures that complex export transactions are properly documented and comply with Indian tax regulations while maintaining data accuracy and audit trails.
