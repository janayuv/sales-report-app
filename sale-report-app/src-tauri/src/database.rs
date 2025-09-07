use rusqlite::{Connection, Result};
use serde::{Deserialize, Serialize};
use tauri::AppHandle;
use std::io::Cursor;


#[derive(Debug, Serialize, Deserialize)]
pub struct Company {
    pub id: i32,
    pub name: String,
    pub key: String,
    pub created_at: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct UpdateCompanyRequest {
    pub name: Option<String>,
    pub key: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Category {
    pub id: i32,
    pub company_id: i32,
    pub name: String,
    pub description: Option<String>,
    pub created_at: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct SalesReport {
    pub id: i32,
    pub company_id: i32,
    pub cust_code: String,
    pub cust_name: String,
    pub inv_date: String,
    pub RE: String,
    pub invno: String,
    pub part_code: Option<String>,
    pub part_name: Option<String>,
    pub tariff: Option<String>,
    pub qty: f64,
    pub bas_price: f64,
    pub ass_val: f64,
    pub c_gst: f64,
    pub s_gst: f64,
    pub igst: f64,
    pub amot: f64,
    pub inv_val: f64,
    pub igst_yes_no: String,
    pub percentage: f64,
    pub created_at: String,
}

#[derive(Debug, Deserialize)]
pub struct CreateSalesReportRequest {
    pub company_id: i32,
    pub cust_code: String,
    pub cust_name: String,
    pub inv_date: String,
    pub RE: String,
    pub invno: String,
    pub part_code: Option<String>,
    pub part_name: Option<String>,
    pub tariff: Option<String>,
    pub qty: f64,
    pub bas_price: f64,
    pub ass_val: f64,
    pub c_gst: f64,
    pub s_gst: f64,
    pub igst: f64,
    pub amot: f64,
    pub inv_val: f64,
    pub igst_yes_no: String,
    pub percentage: f64,
}

#[derive(Debug, Deserialize)]
pub struct UpdateSalesReportRequest {
    pub cust_code: Option<String>,
    pub cust_name: Option<String>,
    pub inv_date: Option<String>,
    pub RE: Option<String>,
    pub invno: Option<String>,
    pub part_code: Option<String>,
    pub part_name: Option<String>,
    pub tariff: Option<String>,
    pub qty: Option<f64>,
    pub bas_price: Option<f64>,
    pub ass_val: Option<f64>,
    pub c_gst: Option<f64>,
    pub s_gst: Option<f64>,
    pub igst: Option<f64>,
    pub amot: Option<f64>,
    pub inv_val: Option<f64>,
    pub igst_yes_no: Option<String>,
    pub percentage: Option<f64>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Customer {
    pub id: i32,
    pub company_id: i32,
    pub customer_name: String,
    pub tally_name: String,
    pub gst_no: Option<String>,
    pub category_id: Option<i32>,
    pub category_name: Option<String>, // For display purposes
    pub created_at: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct CreateCustomerRequest {
    pub company_id: i32,
    pub customer_name: String,
    pub tally_name: String,
    pub gst_no: Option<String>,
    pub category_id: Option<i32>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct UpdateCustomerRequest {
    pub customer_name: Option<String>,
    pub tally_name: Option<String>,
    pub gst_no: Option<String>,
    pub category_id: Option<i32>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct CreateCategoryRequest {
    pub company_id: i32,
    pub name: String,
    pub description: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct UpdateCategoryRequest {
    pub name: Option<String>,
    pub description: Option<String>,
}

pub struct DatabaseManager {
    conn: Connection,
}

impl DatabaseManager {
    pub fn new(_app_handle: &AppHandle) -> Result<Self> {
        // For now, use a local database file
        let db_path = "sales_report.db";
        let conn = Connection::open(db_path)?;
        
        let manager = DatabaseManager { conn };
        manager.create_tables()?;
        manager.seed_initial_data()?;
        
        Ok(manager)
    }

    fn create_tables(&self) -> Result<()> {
        // Companies table
        self.conn.execute(
            "CREATE TABLE IF NOT EXISTS companies (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                key TEXT NOT NULL UNIQUE,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )",
            [],
        )?;

        // Categories table
        self.conn.execute(
            "CREATE TABLE IF NOT EXISTS categories (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                company_id INTEGER NOT NULL,
                name TEXT NOT NULL,
                description TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
                UNIQUE(company_id, name)
            )",
            [],
        )?;

        // Customers table - create with new schema
        self.conn.execute(
            "CREATE TABLE IF NOT EXISTS customers (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                company_id INTEGER NOT NULL,
                customer_name TEXT NOT NULL,
                tally_name TEXT NOT NULL,
                gst_no TEXT,
                category_id INTEGER,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
                FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL,
                UNIQUE(company_id, customer_name)
            )",
            [],
        )?;

        // Handle migration from old schema to new schema
        self.migrate_database()?;

        // Sales Reports table
        self.conn.execute(
            "CREATE TABLE IF NOT EXISTS sales_reports (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                company_id INTEGER NOT NULL,
                cust_code TEXT NOT NULL,
                cust_name TEXT NOT NULL,
                inv_date TEXT NOT NULL,
                RE TEXT NOT NULL,
                invno TEXT NOT NULL,
                part_code TEXT,
                part_name TEXT,
                tariff TEXT,
                qty REAL NOT NULL,
                bas_price REAL NOT NULL,
                ass_val REAL NOT NULL,
                c_gst REAL NOT NULL,
                s_gst REAL NOT NULL,
                igst REAL NOT NULL,
                amot REAL NOT NULL,
                inv_val REAL NOT NULL,
                igst_yes_no TEXT NOT NULL,
                percentage REAL NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
                UNIQUE(company_id, invno)
            )",
            [],
        )?;

        // UploadedReports table
        self.conn.execute(
            "CREATE TABLE IF NOT EXISTS uploaded_reports (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                company_id INTEGER NOT NULL,
                filename TEXT NOT NULL,
                uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                status TEXT NOT NULL DEFAULT 'uploaded',
                parsed_hash TEXT,
                FOREIGN KEY (company_id) REFERENCES companies(id)
            )",
            [],
        )?;

        // ReportRows table
        self.conn.execute(
            "CREATE TABLE IF NOT EXISTS report_rows (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                uploaded_report_id INTEGER NOT NULL,
                invoice_no TEXT NOT NULL,
                invoice_date DATE NOT NULL,
                customer_name_raw TEXT NOT NULL,
                gst_rate DECIMAL(5,2) NOT NULL,
                cgst_amt DECIMAL(10,2) NOT NULL,
                sgst_amt DECIMAL(10,2) NOT NULL,
                igst_amt DECIMAL(10,2) NOT NULL,
                total_amount DECIMAL(10,2) NOT NULL,
                extra_json TEXT,
                FOREIGN KEY (uploaded_report_id) REFERENCES uploaded_reports(id)
            )",
            [],
        )?;

        // TallyExports table
        self.conn.execute(
            "CREATE TABLE IF NOT EXISTS tally_exports (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                company_id INTEGER NOT NULL,
                uploaded_report_id INTEGER NOT NULL,
                generated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                file_path TEXT NOT NULL,
                notes TEXT,
                FOREIGN KEY (company_id) REFERENCES companies(id),
                FOREIGN KEY (uploaded_report_id) REFERENCES uploaded_reports(id)
            )",
            [],
        )?;

        // AuditLogs table
        self.conn.execute(
            "CREATE TABLE IF NOT EXISTS audit_logs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                company_id INTEGER NOT NULL,
                user_action TEXT NOT NULL,
                details_json TEXT NOT NULL,
                timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (company_id) REFERENCES companies(id)
            )",
            [],
        )?;

        // InvoiceMappings table
        self.conn.execute(
            "CREATE TABLE IF NOT EXISTS invoice_mappings (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                company_id INTEGER NOT NULL,
                original_invoice_no TEXT NOT NULL,
                split_invoice_no TEXT NOT NULL,
                gst_rate DECIMAL(5,2) NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (company_id) REFERENCES companies(id)
            )",
            [],
        )?;

        Ok(())
    }

    fn seed_initial_data(&self) -> Result<()> {
        // Check if companies already exist
        let count: i32 = self.conn.query_row(
            "SELECT COUNT(*) FROM companies",
            [],
            |row| row.get(0),
        )?;

        if count == 0 {
            // Insert Company A and Company B
            self.conn.execute(
                "INSERT INTO companies (name, key) VALUES (?, ?)",
                ["Company A", "company_a"],
            )?;

            self.conn.execute(
                "INSERT INTO companies (name, key) VALUES (?, ?)",
                ["Company B", "company_b"],
            )?;

            // Insert sample customer for Company A
            self.conn.execute(
                "INSERT INTO customers (company_id, customer_name, tally_name, gst_no, category)
                 VALUES (?, ?, ?, ?, ?)",
                rusqlite::params![
                    1,
                    "Sample Customer A",
                    "SAMPLE_CUSTOMER_A",
                    "22AAAAA0000A1Z5",
                    "General",
                ],
            )?;

            println!("Initial data seeded successfully");
        }

        Ok(())
    }

    pub fn get_companies(&self) -> Result<Vec<Company>> {
        let mut stmt = self.conn.prepare(
            "SELECT id, name, key, created_at FROM companies ORDER BY name",
        )?;

        let companies = stmt.query_map([], |row| {
            Ok(Company {
                id: row.get(0)?,
                name: row.get(1)?,
                key: row.get(2)?,
                created_at: row.get(3)?,
            })
        })?;

        companies.collect()
    }

    // Clear all data from database (development utility)
    pub fn clear_all_data(&self) -> Result<()> {
        println!("Clearing all data from database...");
        
        // Disable foreign key constraints temporarily
        self.conn.execute("PRAGMA foreign_keys = OFF", [])?;
        
        // Clear all tables in reverse dependency order to avoid foreign key constraints
        self.conn.execute("DELETE FROM invoice_mappings", [])?;
        self.conn.execute("DELETE FROM audit_logs", [])?;
        self.conn.execute("DELETE FROM tally_exports", [])?;
        self.conn.execute("DELETE FROM report_rows", [])?;
        self.conn.execute("DELETE FROM uploaded_reports", [])?;
        self.conn.execute("DELETE FROM sales_reports", [])?;
        self.conn.execute("DELETE FROM customers", [])?;
        self.conn.execute("DELETE FROM categories", [])?;
        self.conn.execute("DELETE FROM companies", [])?;
        
        // Reset auto-increment counters
        self.conn.execute("DELETE FROM sqlite_sequence", [])?;
        
        // Re-enable foreign key constraints
        self.conn.execute("PRAGMA foreign_keys = ON", [])?;
        
        // Verify that customers table is empty
        let customer_count: i32 = self.conn.query_row(
            "SELECT COUNT(*) FROM customers",
            [],
            |row| row.get(0),
        )?;
        
        println!("Customer records remaining after clear: {}", customer_count);
        println!("All data cleared successfully");
        Ok(())
    }

    pub fn update_company(&self, id: i32, company: UpdateCompanyRequest) -> Result<bool> {
        let mut updates = Vec::new();
        let mut params = Vec::new();

        if let Some(name) = company.name {
            updates.push("name = ?");
            params.push(name);
        }
        if let Some(key) = company.key {
            updates.push("key = ?");
            params.push(key);
        }

        if updates.is_empty() {
            return Ok(false);
        }

        params.push(id.to_string());
        let sql = format!(
            "UPDATE companies SET {} WHERE id = ?",
            updates.join(", ")
        );

        let mut stmt = self.conn.prepare(&sql)?;
        let rows_affected = stmt.execute(rusqlite::params_from_iter(params.iter()))?;

        Ok(rows_affected > 0)
    }

    pub fn get_customers_by_company(&self, company_id: i32) -> Result<Vec<Customer>> {
        let mut stmt = self.conn.prepare(
            "SELECT c.id, c.company_id, c.customer_name, c.tally_name, c.gst_no, 
                    c.category_id, cat.name as category_name, c.created_at 
             FROM customers c 
             LEFT JOIN categories cat ON c.category_id = cat.id 
             WHERE c.company_id = ? 
             ORDER BY c.customer_name",
        )?;

        let customers = stmt.query_map([company_id], |row| {
            Ok(Customer {
                id: row.get(0)?,
                company_id: row.get(1)?,
                customer_name: row.get(2)?,
                tally_name: row.get(3)?,
                gst_no: row.get(4)?,
                category_id: row.get(5)?,
                category_name: row.get(6)?,
                created_at: row.get(7)?,
            })
        })?;

        customers.collect()
    }

    pub fn search_customers(&self, company_id: i32, search_term: String) -> Result<Vec<Customer>> {
        let search_pattern = format!("%{}%", search_term);
        let mut stmt = self.conn.prepare(
            "SELECT c.id, c.company_id, c.customer_name, c.tally_name, c.gst_no, 
                    c.category_id, cat.name as category_name, c.created_at
             FROM customers c 
             LEFT JOIN categories cat ON c.category_id = cat.id 
             WHERE c.company_id = ?
             AND (c.customer_name LIKE ? OR c.tally_name LIKE ? OR c.gst_no LIKE ? OR cat.name LIKE ?)
             ORDER BY c.customer_name",
        )?;

        let customers = stmt.query_map(
            rusqlite::params![company_id, search_pattern, search_pattern, search_pattern, search_pattern],
            |row| {
                Ok(Customer {
                    id: row.get(0)?,
                    company_id: row.get(1)?,
                    customer_name: row.get(2)?,
                    tally_name: row.get(3)?,
                    gst_no: row.get(4)?,
                    category_id: row.get(5)?,
                    category_name: row.get(6)?,
                    created_at: row.get(7)?,
                })
            }
        )?;

        customers.collect()
    }

    pub fn create_customer(&self, customer: CreateCustomerRequest) -> Result<i32> {
        let mut stmt = self.conn.prepare(
            "INSERT INTO customers (company_id, customer_name, tally_name, gst_no, category_id) 
             VALUES (?, ?, ?, ?, ?)",
        )?;

        let id = stmt.insert(rusqlite::params![
            customer.company_id,
            customer.customer_name,
            customer.tally_name,
            customer.gst_no,
            customer.category_id,
        ])?;

        Ok(id as i32)
    }

    pub fn update_customer(&self, id: i32, customer: UpdateCustomerRequest) -> Result<bool> {
        let mut updates = Vec::new();
        let mut params = Vec::new();

        if let Some(customer_name) = customer.customer_name {
            updates.push("customer_name = ?");
            params.push(customer_name);
        }
        if let Some(tally_name) = customer.tally_name {
            updates.push("tally_name = ?");
            params.push(tally_name);
        }
        if let Some(gst_no) = customer.gst_no {
            updates.push("gst_no = ?");
            params.push(gst_no);
        }
        if let Some(category_id) = customer.category_id {
            updates.push("category_id = ?");
            params.push(category_id.to_string());
        }

        if updates.is_empty() {
            return Ok(false);
        }

        params.push(id.to_string());
        let sql = format!(
            "UPDATE customers SET {} WHERE id = ?",
            updates.join(", ")
        );

        let mut stmt = self.conn.prepare(&sql)?;
        let rows_affected = stmt.execute(rusqlite::params_from_iter(params.iter()))?;

        Ok(rows_affected > 0)
    }

    pub fn delete_customer(&self, id: i32) -> Result<bool> {
        let mut stmt = self.conn.prepare("DELETE FROM customers WHERE id = ?")?;
        let rows_affected = stmt.execute([id])?;
        Ok(rows_affected > 0)
    }

    // Category management methods
    pub fn get_categories_by_company(&self, company_id: i32) -> Result<Vec<Category>> {
        let mut stmt = self.conn.prepare(
            "SELECT id, company_id, name, description, created_at 
             FROM categories WHERE company_id = ? ORDER BY name",
        )?;

        let categories = stmt.query_map([company_id], |row| {
            Ok(Category {
                id: row.get(0)?,
                company_id: row.get(1)?,
                name: row.get(2)?,
                description: row.get(3)?,
                created_at: row.get(4)?,
            })
        })?;

        categories.collect()
    }

    pub fn create_category(&self, category: CreateCategoryRequest) -> Result<i32> {
        let mut stmt = self.conn.prepare(
            "INSERT INTO categories (company_id, name, description) 
             VALUES (?, ?, ?)",
        )?;

        let id = stmt.insert(rusqlite::params![
            category.company_id,
            category.name,
            category.description,
        ])?;

        Ok(id as i32)
    }

    pub fn update_category(&self, id: i32, category: UpdateCategoryRequest) -> Result<bool> {
        let mut updates = Vec::new();
        let mut params = Vec::new();

        if let Some(name) = category.name {
            updates.push("name = ?");
            params.push(name);
        }
        if let Some(description) = category.description {
            updates.push("description = ?");
            params.push(description);
        }

        if updates.is_empty() {
            return Ok(false);
        }

        params.push(id.to_string());

        let query = format!("UPDATE categories SET {} WHERE id = ?", updates.join(", "));
        let mut stmt = self.conn.prepare(&query)?;
        let rows_affected = stmt.execute(rusqlite::params_from_iter(params.iter()))?;

        Ok(rows_affected > 0)
    }

    pub fn delete_category(&self, id: i32) -> Result<bool> {
        let mut stmt = self.conn.prepare("DELETE FROM categories WHERE id = ?")?;
        let rows_affected = stmt.execute([id])?;
        Ok(rows_affected > 0)
    }

    pub fn get_category_by_name(&self, company_id: i32, name: &str) -> Result<Option<Category>> {
        let mut stmt = self.conn.prepare(
            "SELECT id, company_id, name, description, created_at 
             FROM categories WHERE company_id = ? AND name = ?",
        )?;

        let mut rows = stmt.query_map(rusqlite::params![company_id, name], |row| {
            Ok(Category {
                id: row.get(0)?,
                company_id: row.get(1)?,
                name: row.get(2)?,
                description: row.get(3)?,
                created_at: row.get(4)?,
            })
        })?;

        Ok(rows.next().transpose()?)
    }

    // Database migration method
    fn migrate_database(&self) -> Result<()> {
        // Check if the old 'category' column exists
        let mut stmt = self.conn.prepare(
            "SELECT COUNT(*) FROM pragma_table_info('customers') WHERE name='category'"
        )?;
        let old_column_exists: i32 = stmt.query_row([], |row| row.get(0))?;

        if old_column_exists > 0 {
            // Migration needed: old schema exists
            println!("Migrating database from old schema to new schema...");
            
            // Add category_id column if it doesn't exist
            self.conn.execute(
                "ALTER TABLE customers ADD COLUMN category_id INTEGER",
                [],
            ).ok(); // Ignore error if column already exists

            // Migrate existing category data to categories table
            let mut stmt = self.conn.prepare(
                "SELECT DISTINCT company_id, category FROM customers WHERE category IS NOT NULL AND category != ''"
            )?;
            
            let category_rows = stmt.query_map([], |row| {
                Ok((row.get::<_, i32>(0)?, row.get::<_, String>(1)?))
            })?;

            for row_result in category_rows {
                let (company_id, category_name) = row_result?;
                
                // Check if category already exists
                let mut check_stmt = self.conn.prepare(
                    "SELECT id FROM categories WHERE company_id = ? AND name = ?"
                )?;
                let existing_category: Result<i32, _> = check_stmt.query_row(
                    rusqlite::params![company_id, category_name], 
                    |row| row.get(0)
                );

                let category_id = match existing_category {
                    Ok(id) => id,
                    Err(_) => {
                        // Create new category
                        let mut insert_stmt = self.conn.prepare(
                            "INSERT INTO categories (company_id, name, description) VALUES (?, ?, ?)"
                        )?;
                        insert_stmt.insert(rusqlite::params![company_id, category_name, None::<String>])? as i32
                    }
                };

                // Update customers with the new category_id
                let mut update_stmt = self.conn.prepare(
                    "UPDATE customers SET category_id = ? WHERE company_id = ? AND category = ?"
                )?;
                update_stmt.execute(rusqlite::params![category_id, company_id, category_name])?;
            }

            // Drop the old category column
            // Note: SQLite doesn't support DROP COLUMN directly, so we'll leave it for now
            // The new code will use category_id instead
            println!("Database migration completed successfully!");
        }

        Ok(())
    }

    pub fn export_customers_csv(&self, company_id: i32) -> Result<String> {
        let customers = self.get_customers_by_company(company_id)?;
        
        let mut wtr = csv::Writer::from_writer(Cursor::new(Vec::new()));
        
        // Write header
        wtr.write_record(&["Customer Name", "Tally Name", "GST No", "Category", "Created At"])
            .map_err(|e| rusqlite::Error::SqliteFailure(
                rusqlite::ffi::Error::new(rusqlite::ffi::SQLITE_MISUSE),
                Some(format!("CSV write error: {}", e))
            ))?;
        
        // Write data
        for customer in customers {
            wtr.write_record(&[
                &customer.customer_name,
                &customer.tally_name,
                customer.gst_no.as_deref().unwrap_or(""),
                customer.category_name.as_deref().unwrap_or(""),
                &customer.created_at,
            ]).map_err(|e| rusqlite::Error::SqliteFailure(
                rusqlite::ffi::Error::new(rusqlite::ffi::SQLITE_MISUSE),
                Some(format!("CSV write error: {}", e))
            ))?;
        }
        
        wtr.flush().map_err(|e| rusqlite::Error::SqliteFailure(
            rusqlite::ffi::Error::new(rusqlite::ffi::SQLITE_MISUSE),
            Some(format!("CSV flush error: {}", e))
        ))?;
        
        let data = wtr.into_inner().map_err(|e| rusqlite::Error::SqliteFailure(
            rusqlite::ffi::Error::new(rusqlite::ffi::SQLITE_MISUSE),
            Some(format!("CSV inner error: {}", e))
        ))?;
        
        let csv_string = String::from_utf8(data.into_inner()).map_err(|e| rusqlite::Error::SqliteFailure(
            rusqlite::ffi::Error::new(rusqlite::ffi::SQLITE_MISUSE),
            Some(format!("UTF-8 error: {}", e))
        ))?;
        
        Ok(csv_string)
    }

    pub fn import_customers_csv(&self, company_id: i32, csv_data: String) -> Result<i32> {
        let mut rdr = csv::Reader::from_reader(csv_data.as_bytes());
        let mut imported_count = 0;
        let mut skipped_count = 0;
        let mut duplicate_count = 0;
        
        // Read headers first
        let headers: Vec<String> = rdr.headers().map_err(|e| rusqlite::Error::SqliteFailure(
            rusqlite::ffi::Error::new(rusqlite::ffi::SQLITE_MISUSE),
            Some(format!("CSV header error: {}", e))
        ))?.iter().map(|h| h.to_string()).collect();
        println!("Customer CSV Headers: {:?}", headers);
        
        // Create header mapping for flexible column access
        let header_map: std::collections::HashMap<String, usize> = headers.iter()
            .enumerate()
            .map(|(i, h)| (h.to_lowercase().replace(" ", "_"), i))
            .collect();
        
        println!("Customer Header mapping: {:?}", header_map);
        
        for (row_num, result) in rdr.records().enumerate() {
            let record = result.map_err(|e| rusqlite::Error::SqliteFailure(
                rusqlite::ffi::Error::new(rusqlite::ffi::SQLITE_MISUSE),
                Some(format!("CSV read error: {}", e))
            ))?;
            let row_index = row_num + 2; // +2 because we're 0-indexed and skipped header row
            
            println!("Processing customer row {} with {} columns", row_index, record.len());
            
            // Helper function to get field value by header name and clean it
            let get_field = |field_names: &[&str]| -> String {
                for field_name in field_names {
                    if let Some(&col_index) = header_map.get(&field_name.to_lowercase().replace(" ", "_")) {
                        if col_index < record.len() {
                            let value = record.get(col_index).unwrap_or("").to_string();
                            // Remove surrounding quotes and trim whitespace
                            return value.trim_matches('"').trim().to_string();
                        }
                    }
                }
                String::new()
            };
            
            // Extract fields using flexible header mapping
            let customer_name = get_field(&["customer_name", "cust_name", "client_name", "company_name", "name"]);
            let tally_name = get_field(&["tally_name", "tally_code", "customer_code", "cust_code", "code"]);
            let gst_no = get_field(&["gst_no", "gst_number", "gst", "tax_id", "tin"]);
            let category_name = get_field(&["category", "customer_category", "type", "group"]);
            
            // Validate required fields
            if customer_name.is_empty() {
                println!("Skipping row {}: Missing customer name", row_index);
                skipped_count += 1;
                continue;
            }
            
            if tally_name.is_empty() {
                println!("Skipping row {}: Missing tally name", row_index);
                skipped_count += 1;
                continue;
            }
            
            // Check if customer already exists
            let existing_count: i32 = self.conn.query_row(
                "SELECT COUNT(*) FROM customers WHERE company_id = ? AND customer_name = ?",
                rusqlite::params![company_id, customer_name],
                |row| row.get(0),
            )?;
            
            if existing_count > 0 {
                println!("Skipping row {}: Customer '{}' already exists", row_index, customer_name);
                duplicate_count += 1;
                continue;
            }
            
            // Handle category - create if it doesn't exist
            let mut category_id: Option<i32> = None;
            if !category_name.is_empty() {
                // Check if category exists
                if let Some(existing_category) = self.get_category_by_name(company_id, &category_name)? {
                    category_id = Some(existing_category.id);
                } else {
                    // Create new category
                    let new_category = CreateCategoryRequest {
                        company_id,
                        name: category_name.clone(),
                        description: None,
                    };
                    category_id = Some(self.create_category(new_category)?);
                }
            }
            
            // Insert new customer
            let mut stmt = self.conn.prepare(
                "INSERT INTO customers (company_id, customer_name, tally_name, gst_no, category_id) 
                 VALUES (?, ?, ?, ?, ?)",
            )?;
            
            stmt.execute(rusqlite::params![
                company_id,
                customer_name,
                tally_name,
                if gst_no.is_empty() { None } else { Some(gst_no) },
                category_id,
            ])?;
            
            imported_count += 1;
            println!("Successfully imported customer '{}' from row {}", customer_name, row_index);
        }
        
        println!("Customer import completed: {} imported, {} skipped, {} duplicates", 
                 imported_count, skipped_count, duplicate_count);
        
        Ok(imported_count)
    }

    // Sales Report methods
    pub fn get_sales_reports_by_company(&self, company_id: i32) -> Result<Vec<SalesReport>> {
        let mut stmt = self.conn.prepare(
            "SELECT id, company_id, cust_code, cust_name, inv_date, RE, invno, 
                    part_code, part_name, tariff, qty, bas_price, ass_val, 
                    c_gst, s_gst, igst, amot, inv_val, igst_yes_no, percentage, created_at 
             FROM sales_reports 
             WHERE company_id = ? 
             ORDER BY inv_date DESC, invno"
        )?;
        
        let rows = stmt.query_map([company_id], |row| {
            Ok(SalesReport {
                id: row.get(0)?,
                company_id: row.get(1)?,
                cust_code: row.get(2)?,
                cust_name: row.get(3)?,
                inv_date: row.get(4)?,
                RE: row.get(5)?,
                invno: row.get(6)?,
                part_code: row.get(7)?,
                part_name: row.get(8)?,
                tariff: row.get(9)?,
                qty: row.get(10)?,
                bas_price: row.get(11)?,
                ass_val: row.get(12)?,
                c_gst: row.get(13)?,
                s_gst: row.get(14)?,
                igst: row.get(15)?,
                amot: row.get(16)?,
                inv_val: row.get(17)?,
                igst_yes_no: row.get(18)?,
                percentage: row.get(19)?,
                created_at: row.get(20)?,
            })
        })?;
        
        let mut reports = Vec::new();
        for row in rows {
            reports.push(row?);
        }
        
        Ok(reports)
    }

    pub fn search_sales_reports(&self, company_id: i32, search_term: String) -> Result<Vec<SalesReport>> {
        let search_pattern = format!("%{}%", search_term);
        let mut stmt = self.conn.prepare(
            "SELECT id, company_id, cust_code, cust_name, inv_date, RE, invno, 
                    part_code, part_name, tariff, qty, bas_price, ass_val, 
                    c_gst, s_gst, igst, amot, inv_val, igst_yes_no, percentage, created_at 
             FROM sales_reports 
             WHERE company_id = ? AND (
                 cust_code LIKE ? OR 
                 cust_name LIKE ? OR 
                 invno LIKE ? OR 
                 part_code LIKE ? OR 
                 part_name LIKE ?
             )
             ORDER BY inv_date DESC, invno"
        )?;
        
        let rows = stmt.query_map(rusqlite::params![company_id, search_pattern, search_pattern, search_pattern, search_pattern, search_pattern], |row| {
            Ok(SalesReport {
                id: row.get(0)?,
                company_id: row.get(1)?,
                cust_code: row.get(2)?,
                cust_name: row.get(3)?,
                inv_date: row.get(4)?,
                RE: row.get(5)?,
                invno: row.get(6)?,
                part_code: row.get(7)?,
                part_name: row.get(8)?,
                tariff: row.get(9)?,
                qty: row.get(10)?,
                bas_price: row.get(11)?,
                ass_val: row.get(12)?,
                c_gst: row.get(13)?,
                s_gst: row.get(14)?,
                igst: row.get(15)?,
                amot: row.get(16)?,
                inv_val: row.get(17)?,
                igst_yes_no: row.get(18)?,
                percentage: row.get(19)?,
                created_at: row.get(20)?,
            })
        })?;
        
        let mut reports = Vec::new();
        for row in rows {
            reports.push(row?);
        }
        
        Ok(reports)
    }

    pub fn create_sales_report(&self, report: CreateSalesReportRequest) -> Result<i32> {
        let mut stmt = self.conn.prepare(
            "INSERT INTO sales_reports (
                company_id, cust_code, cust_name, inv_date, RE, invno, 
                part_code, part_name, tariff, qty, bas_price, ass_val, 
                c_gst, s_gst, igst, amot, inv_val, igst_yes_no, percentage
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
        )?;
        
        stmt.execute(rusqlite::params![
            report.company_id,
            report.cust_code,
            report.cust_name,
            report.inv_date,
            report.RE,
            report.invno,
            report.part_code,
            report.part_name,
            report.tariff,
            report.qty,
            report.bas_price,
            report.ass_val,
            report.c_gst,
            report.s_gst,
            report.igst,
            report.amot,
            report.inv_val,
            report.igst_yes_no,
            report.percentage,
        ])?;
        
        Ok(self.conn.last_insert_rowid() as i32)
    }

    pub fn update_sales_report(&self, id: i32, report: UpdateSalesReportRequest) -> Result<bool> {
        let mut fields = Vec::new();
        let mut values: Vec<Box<dyn rusqlite::ToSql>> = Vec::new();
        
        if let Some(cust_code) = report.cust_code {
            fields.push("cust_code = ?");
            values.push(Box::new(cust_code));
        }
        if let Some(cust_name) = report.cust_name {
            fields.push("cust_name = ?");
            values.push(Box::new(cust_name));
        }
        if let Some(inv_date) = report.inv_date {
            fields.push("inv_date = ?");
            values.push(Box::new(inv_date));
        }
        if let Some(RE) = report.RE {
            fields.push("RE = ?");
            values.push(Box::new(RE));
        }
        if let Some(invno) = report.invno {
            fields.push("invno = ?");
            values.push(Box::new(invno));
        }
        if let Some(part_code) = report.part_code {
            fields.push("part_code = ?");
            values.push(Box::new(part_code));
        }
        if let Some(part_name) = report.part_name {
            fields.push("part_name = ?");
            values.push(Box::new(part_name));
        }
        if let Some(tariff) = report.tariff {
            fields.push("tariff = ?");
            values.push(Box::new(tariff));
        }
        if let Some(qty) = report.qty {
            fields.push("qty = ?");
            values.push(Box::new(qty));
        }
        if let Some(bas_price) = report.bas_price {
            fields.push("bas_price = ?");
            values.push(Box::new(bas_price));
        }
        if let Some(ass_val) = report.ass_val {
            fields.push("ass_val = ?");
            values.push(Box::new(ass_val));
        }
        if let Some(c_gst) = report.c_gst {
            fields.push("c_gst = ?");
            values.push(Box::new(c_gst));
        }
        if let Some(s_gst) = report.s_gst {
            fields.push("s_gst = ?");
            values.push(Box::new(s_gst));
        }
        if let Some(igst) = report.igst {
            fields.push("igst = ?");
            values.push(Box::new(igst));
        }
        if let Some(amot) = report.amot {
            fields.push("amot = ?");
            values.push(Box::new(amot));
        }
        if let Some(inv_val) = report.inv_val {
            fields.push("inv_val = ?");
            values.push(Box::new(inv_val));
        }
        if let Some(igst_yes_no) = report.igst_yes_no {
            fields.push("igst_yes_no = ?");
            values.push(Box::new(igst_yes_no));
        }
        if let Some(percentage) = report.percentage {
            fields.push("percentage = ?");
            values.push(Box::new(percentage));
        }
        
        if fields.is_empty() {
            return Ok(false);
        }
        
        values.push(Box::new(id));
        
        let query = format!("UPDATE sales_reports SET {} WHERE id = ?", fields.join(", "));
        let mut stmt = self.conn.prepare(&query)?;
        
        let changes = stmt.execute(rusqlite::params_from_iter(values.iter().map(|v| v.as_ref())))?;
        Ok(changes > 0)
    }

    pub fn delete_sales_report(&self, id: i32) -> Result<bool> {
        let mut stmt = self.conn.prepare("DELETE FROM sales_reports WHERE id = ?")?;
        let changes = stmt.execute([id])?;
        Ok(changes > 0)
    }

    pub fn export_sales_reports_csv(&self, company_id: i32) -> Result<String, Box<dyn std::error::Error>> {
        let reports = self.get_sales_reports_by_company(company_id)?;
        
        let mut wtr = csv::Writer::from_writer(Cursor::new(Vec::new()));
        
        // Write header
        wtr.write_record(&[
            "cust_code", "cust_name", "inv_date", "RE", "invno", "part_code", "part_name", 
            "tariff", "qty", "bas_price", "ass_val", "c_gst", "s_gst", "igst", "amot", 
            "inv_val", "igst_yes_no", "percentage"
        ])?;
        
        // Write data
        for report in reports {
            wtr.write_record(&[
                report.cust_code,
                report.cust_name,
                report.inv_date,
                report.RE,
                report.invno,
                report.part_code.unwrap_or_default(),
                report.part_name.unwrap_or_default(),
                report.tariff.unwrap_or_default(),
                report.qty.to_string(),
                report.bas_price.to_string(),
                report.ass_val.to_string(),
                report.c_gst.to_string(),
                report.s_gst.to_string(),
                report.igst.to_string(),
                report.amot.to_string(),
                report.inv_val.to_string(),
                report.igst_yes_no,
                report.percentage.to_string(),
            ])?;
        }
        
        wtr.flush()?;
        let data = wtr.into_inner()?.into_inner();
        Ok(String::from_utf8(data)?)
    }

    pub fn import_sales_reports_csv(&self, company_id: i32, csv_data: String) -> Result<i32, Box<dyn std::error::Error>> {
        let mut reader = csv::Reader::from_reader(csv_data.as_bytes());
        let mut imported_count = 0;
        let mut skipped_count = 0;
        let mut duplicate_count = 0;
        
        // Read headers first
        let headers: Vec<String> = reader.headers()?.iter().map(|h| h.to_string()).collect();
        println!("CSV Headers: {:?}", headers);
        
        // Create header mapping for flexible column access
        let header_map: std::collections::HashMap<String, usize> = headers.iter()
            .enumerate()
            .map(|(i, h)| (h.to_lowercase().replace(" ", "_"), i))
            .collect();
        
        println!("Header mapping: {:?}", header_map);
        
        for (row_num, result) in reader.records().enumerate() {
            let record = result?;
            let row_index = row_num + 2; // +2 because we're 0-indexed and skipped header row
            
            println!("Processing row {} with {} columns", row_index, record.len());
            
            // Helper function to get field value by header name and clean it
            let get_field = |field_names: &[&str]| -> String {
                for field_name in field_names {
                    if let Some(&col_index) = header_map.get(&field_name.to_lowercase().replace(" ", "_")) {
                        if col_index < record.len() {
                            let value = record.get(col_index).unwrap_or("").to_string();
                            // Remove surrounding quotes and trim whitespace
                            return value.trim_matches('"').trim().to_string();
                        }
                    }
                }
                String::new()
            };
            
            // Helper function to validate and format dates
            let parse_date = |date_str: String| -> String {
                if date_str.is_empty() { return String::new(); }
                
                // Try different date formats
                let formats = [
                    ("YYYY-MM-DD", r"^(\d{4})-(\d{1,2})-(\d{1,2})$"),
                    ("DD/MM/YYYY", r"^(\d{1,2})/(\d{1,2})/(\d{4})$"),
                    ("DD-MM-YYYY", r"^(\d{1,2})-(\d{1,2})-(\d{4})$"),
                ];
                
                for (format_name, pattern) in &formats {
                    if let Some(captures) = regex::Regex::new(pattern).unwrap().captures(&date_str) {
                        let (year, month, day) = if *format_name == "YYYY-MM-DD" {
                            (captures.get(1).unwrap().as_str(), captures.get(2).unwrap().as_str(), captures.get(3).unwrap().as_str())
                        } else {
                            (captures.get(3).unwrap().as_str(), captures.get(2).unwrap().as_str(), captures.get(1).unwrap().as_str())
                        };
                        
                        // Validate date components
                        if let (Ok(y), Ok(m), Ok(d)) = (year.parse::<i32>(), month.parse::<i32>(), day.parse::<i32>()) {
                            if y >= 1900 && y <= 2100 && m >= 1 && m <= 12 && d >= 1 && d <= 31 {
                                return format!("{:04}-{:02}-{:02}", y, m, d);
                            }
                        }
                    }
                }
                
                println!("Warning: Invalid date format '{}' in row {}", date_str, row_index);
                String::new()
            };
            
            // Extract fields using flexible header mapping
            let cust_code = get_field(&["cust_code", "cust_cde", "customer_code"]);
            let cust_name = get_field(&["cust_name", "customer_name"]);
            let inv_date = parse_date(get_field(&["inv_date", "io_date", "invoice_date"]));
            let RE = get_field(&["re", "region"]);
            let invno = get_field(&["invno", "invoice_no", "invoice_number", "invoiceno", "invoice", "inv_no", "inv_number"]);
            let part_code = get_field(&["part_code", "prod_cde", "product_code"]);
            let part_name = get_field(&["part_name", "prod_name_ko", "product_name"]);
            let tariff = get_field(&["tariff", "tariff_code"]);
            
            // Helper function to parse numbers with currency symbol removal
            let parse_number = |value: String| -> f64 {
                if value.is_empty() { return 0.0; }
                
                // Remove currency symbols, commas, and spaces
                let cleaned = value
                    .replace("₹", "")
                    .replace("$", "")
                    .replace("€", "")
                    .replace("£", "")
                    .replace("¥", "")
                    .replace(",", "")
                    .replace(" ", "");
                
                // Handle negative numbers in parentheses (accounting format)
                let final_value = if value.contains('(') && value.contains(')') {
                    format!("-{}", cleaned.replace("(", "").replace(")", ""))
                } else {
                    cleaned
                };
                
                final_value.parse().unwrap_or(0.0)
            };
            
            // Parse numeric fields with currency symbol handling
            let qty: f64 = parse_number(get_field(&["qty", "io_qty", "quantity"]));
            let bas_price: f64 = parse_number(get_field(&["bas_price", "rate_pre_unit", "base_price"]));
            let ass_val: f64 = parse_number(get_field(&["ass_val", "assessable_value"]));
            let c_gst: f64 = parse_number(get_field(&["c_gst", "cgst_amt", "c gst"]));
            let s_gst: f64 = parse_number(get_field(&["s_gst", "sgst_amt", "s gst"]));
            let igst: f64 = parse_number(get_field(&["igst", "igst_amt"]));
            let amot: f64 = parse_number(get_field(&["amot", "amortisation_cost", "total_amorization"]));
            let inv_val: f64 = parse_number(get_field(&["inv_val", "total_inv_value", "invoice_total", "grand_total"]));
            let igst_yes_no = get_field(&["igst_yes_no", "igst_flag"]);
            let percentage: f64 = parse_number(get_field(&["percentage", "cgst_rate", "sgst_rate", "igst_rate"]));
            
            // Validate required fields
            if invno.is_empty() {
                println!("Skipping row {}: Missing invoice number", row_index);
                skipped_count += 1;
                continue;
            }
            
            if cust_code.is_empty() && cust_name.is_empty() {
                println!("Skipping row {}: Missing customer information", row_index);
                skipped_count += 1;
                continue;
            }
            
            if inv_date.is_empty() {
                println!("Skipping row {}: Missing or invalid invoice date", row_index);
                skipped_count += 1;
                continue;
            }
            
            // Check if report already exists
            let existing_count: i32 = self.conn.query_row(
                "SELECT COUNT(*) FROM sales_reports WHERE company_id = ? AND invno = ?",
                rusqlite::params![company_id, invno],
                |row| row.get(0),
            )?;
            
            if existing_count > 0 {
                println!("Skipping row {}: Invoice {} already exists", row_index, invno);
                duplicate_count += 1;
                continue;
            }
            
            // Insert new report
            let report = CreateSalesReportRequest {
                company_id,
                cust_code: if cust_code.is_empty() { cust_name.clone() } else { cust_code.clone() },
                cust_name: if cust_name.is_empty() { cust_code.clone() } else { cust_name },
                inv_date,
                RE,
                invno: invno.clone(),
                part_code: if part_code.is_empty() { None } else { Some(part_code) },
                part_name: if part_name.is_empty() { None } else { Some(part_name) },
                tariff: if tariff.is_empty() { None } else { Some(tariff) },
                qty,
                bas_price,
                ass_val,
                c_gst,
                s_gst,
                igst,
                amot,
                inv_val,
                igst_yes_no: if igst_yes_no.is_empty() { "no".to_string() } else { igst_yes_no },
                percentage,
            };
            
            self.create_sales_report(report)?;
            imported_count += 1;
            println!("Successfully imported invoice {} from row {}", invno, row_index);
        }
        
        println!("Import completed: {} imported, {} skipped, {} duplicates", 
                 imported_count, skipped_count, duplicate_count);
        
        Ok(imported_count)
    }
}
