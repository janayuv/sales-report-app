# Import Transformation System

## Overview

The Import Transformation System allows you to map uploaded CSV files to a standardized export format. This system handles column mapping, data validation, date parsing, numeric conversion, and automatic calculation of derived fields.

## Target Output Format

The system transforms data to this exact CSV header format:
```csv
cust_code,cust_name,inv_date,RE,invno,part_code,part_name,tariff,qty,bas_price,ass_val,c gst,s gst,igst,amot,inv_val,igst yes/no,percentage
```

## Column Mappings

The system automatically detects and maps the following columns:

| Target Column | Source Column Options | Description |
|--------------|----------------------|-------------|
| `cust_code` | `cust_cde`, `customer_code`, `cust_code`, `custcode` | Customer code (Required) |
| `cust_name` | `cust_name`, `customer_name`, `client_name`, `custname` | Customer name |
| `inv_date` | `io_date`, `invoice_date`, `inv_date`, `date`, `invoicedate` | Invoice date (Required) |
| `invno` | `invoice_no`, `invno`, `invoice_number`, `invoiceno` | Invoice number (Required) |
| `part_code` | `prod_cde`, `prod_cust_no`, `part_code`, `product_code`, `prodcode` | Product/part code |
| `part_name` | `prod_name_ko`, `part_name`, `product_name`, `prodname` | Product/part name |
| `tariff` | `tariff_code`, `tariff`, `hs_code`, `tariffcode` | Tariff/HS code |
| `qty` | `io_qty`, `qty`, `quantity`, `ioqty` | Quantity |
| `bas_price` | `rate_pre_unit`, `bas_price`, `base_price`, `unit_price`, `ratepreunit` | Base/unit price |
| `ass_val` | `assessable_value`, `ass_val`, `assessable`, `assessablevalue` | Assessable value |
| `c gst` | `cgst_amt`, `c_gst`, `cgst`, `cgstamt` | CGST amount |
| `s gst` | `sgst_amt`, `s_gst`, `sgst`, `sgstamt` | SGST amount |
| `igst` | `igst_amt`, `igst`, `igstamt` | IGST amount |
| `amot` | `amortisation_cost`, `amot`, `amortization`, `amortisationcost` | Amortization cost |
| `inv_val` | `total_inv_value`, `invoice_total`, `grand_total`, `inv_val`, `totalinvvalue`, `grandtotal` | Invoice total value |

## Data Transformation Rules

### 1. Header Normalization
- Input headers are normalized by trimming whitespace, converting to lowercase, replacing spaces with underscores, and removing non-alphanumeric characters
- The system uses fuzzy matching to find the best column matches

### 2. Date Parsing
- **Format Priority**: DD/MM/YYYY (e.g., "17/05/2025" → "2025-05-17")
- Also supports: YYYY-MM-DD, DD-MM-YYYY
- Output format: ISO 8601 (YYYY-MM-DD)

### 3. Number Parsing
- Removes commas, currency symbols (₹$€£¥), and extra spaces
- Handles Indian number format (e.g., "1,25,000.00" → 125000)
- Supports negative numbers in parentheses (accounting format)

### 4. RE Code Derivation
The RE code is automatically calculated from the invoice date using:
- **Year Mapping**: Configurable year-to-letter mapping (e.g., 2025 → 'R')
- **Month Codes**: Jan→A, Feb→B, Mar→C, Apr→D, May→E, Jun→F, Jul→G, Aug→H, Sep→I, Oct→J, Nov→K, Dec→L
- **Formula**: RE = YEAR_MAP[year] + MONTH_CODE[month]
- **Example**: 17/05/2025 → inv_date=2025-05-17 → RE = 'R' + 'E' = 'RE'

### 5. IGST Flag & Percentage Calculation
- **IGST Flag**: 'yes' if IGST_RATE > 0 or IGST_AMT > 0, otherwise 'no'
- **Percentage Logic**:
  - If IGST flag = 'yes': Use IGST_RATE
  - If IGST flag = 'no': Use (CGST_RATE + SGST_RATE) if available
  - Fallback: Calculate from (CGST_AMT + SGST_AMT) / ASSESSABLE_VALUE * 100

## Validation Rules

### Required Fields
- `cust_code` (customer code)
- `inv_date` (invoice date)  
- `invno` (invoice number)

### Data Validation
- **Dates**: Must be valid and parseable
- **Numbers**: Must be numeric after cleaning
- **Missing Values**: Flagged for required fields

## Usage Instructions

### 1. Import with Transformation
1. Go to the Reports section
2. Click "Import Reports" → "Import with Transformation"
3. Select your CSV file
4. The Transformation Dialog will open automatically

### 2. Configure Mappings
1. **Review Auto-detected Mappings**: The system will show detected column mappings
2. **Adjust Mappings**: Use dropdown menus to change source column assignments
3. **Configure Year Mapping**: Add/edit year codes as needed
4. **Load Presets**: Use "Indian Export Format" or "Basic Format" presets

### 3. Transform & Preview
1. Click "Transform Data" to process the file
2. Review the preview showing first 10 rows
3. Check for any errors or warnings
4. Verify the transformation summary

### 4. Apply or Export
- **Apply**: Import transformed data into the application
- **Export**: Download transformed data as CSV file

## Configuration Presets

### Indian Export Format
- Pre-configured for Indian export documentation
- Includes comprehensive year mapping (2021-2025)
- All standard column mappings enabled

### Basic Format
- Minimal configuration for simple imports
- Only required field mappings
- Current year mapping only

### Custom Presets
- Save your own configurations using the "Save" button
- Presets are stored locally in browser storage

## Example Transformation

**Input Data (sample_input_data.csv):**
```csv
invoice_no,cust_cde,cust_name,IO_DATE,prod_cde,prod_name_ko,tariff_code,io_qty,rate_pre_unit,ASSESSABLE_VALUE,CGST_AMT,SGST_AMT,IGST_AMT,Total_Inv_Value
INV2025001,CUST001,ABC Industries Ltd,17/05/2025,PROD001,Industrial Pump,85414900,25,5000.00,125000.00,11250.00,11250.00,0.00,147500.00
```

**Output Data:**
```csv
cust_code,cust_name,inv_date,RE,invno,part_code,part_name,tariff,qty,bas_price,ass_val,c gst,s gst,igst,amot,inv_val,igst yes/no,percentage
CUST001,ABC Industries Ltd,2025-05-17,RE,INV2025001,PROD001,Industrial Pump,85414900,25,5000,125000,11250,11250,0,,147500,no,18
```

## Error Handling

### Common Issues
1. **Missing Required Fields**: Ensure cust_code, inv_date, and invno are present
2. **Invalid Dates**: Check date format (prefer DD/MM/YYYY)
3. **Non-numeric Values**: Remove text from numeric fields
4. **Missing Year Codes**: Add year mappings for all years in your data

### Validation Messages
- **Red Errors**: Must be fixed before import
- **Yellow Warnings**: Should be reviewed but won't prevent import
- **Blue Info**: General information about the transformation

## Technical Details

### File Structure
- `src/utils/transformation.ts`: Core transformation utilities and types
- `src/utils/transformationEngine.ts`: Main transformation engine class
- `src/components/TransformationDialog.tsx`: UI component for transformation

### API Methods
```typescript
// Create transformation engine
const engine = new TransformationEngine(config);

// Transform data
const result = engine.transformData(inputData, sourceHeaders);

// Export to CSV
const csvContent = engine.exportToCSV(result.data);
```

## Support

For issues or questions about the transformation system:
1. Check the error messages in the preview panel
2. Verify your input data format matches expected patterns
3. Review the detected mappings and adjust as needed
4. Use the sample data file as a reference for proper formatting
