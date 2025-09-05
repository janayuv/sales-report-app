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
pub struct Category {
    pub id: i32,
    pub company_id: i32,
    pub name: String,
    pub description: Option<String>,
    pub created_at: String,
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
        
        for result in rdr.records() {
            let record = result.map_err(|e| rusqlite::Error::SqliteFailure(
                rusqlite::ffi::Error::new(rusqlite::ffi::SQLITE_MISUSE),
                Some(format!("CSV read error: {}", e))
            ))?;
            
            if record.len() < 2 {
                continue; // Skip invalid records
            }
            
            let customer_name = record.get(0).unwrap_or("").to_string();
            let tally_name = record.get(1).unwrap_or("").to_string();
            let gst_no = record.get(2).filter(|s| !s.is_empty()).map(|s| s.to_string());
            let category_name = record.get(3).filter(|s| !s.is_empty()).map(|s| s.to_string());
            
            if customer_name.is_empty() || tally_name.is_empty() {
                continue; // Skip records with missing required fields
            }
            
            // Check if customer already exists
            let existing_count: i32 = self.conn.query_row(
                "SELECT COUNT(*) FROM customers WHERE company_id = ? AND customer_name = ?",
                rusqlite::params![company_id, customer_name],
                |row| row.get(0),
            )?;
            
            if existing_count > 0 {
                continue; // Skip existing customers
            }
            
            // Handle category - create if it doesn't exist
            let mut category_id: Option<i32> = None;
            if let Some(cat_name) = &category_name {
                // Check if category exists
                if let Some(existing_category) = self.get_category_by_name(company_id, cat_name)? {
                    category_id = Some(existing_category.id);
                } else {
                    // Create new category
                    let new_category = CreateCategoryRequest {
                        company_id,
                        name: cat_name.clone(),
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
                gst_no,
                category_id,
            ])?;
            
            imported_count += 1;
        }
        
        Ok(imported_count)
    }
}
