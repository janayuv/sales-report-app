mod database;

use database::{
    Category, Company, CreateCategoryRequest, CreateCustomerRequest, CreateSalesReportRequest,
    Customer, DatabaseManager, SalesReport, SalesReportFilters, UpdateCategoryRequest,
    UpdateCompanyRequest, UpdateCustomerRequest, UpdateSalesReportRequest,
};
use std::sync::Mutex;
use tauri::{Manager, State};

type DbState = Mutex<DatabaseManager>;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .setup(|app| {
            // Initialize database
            let db_manager = DatabaseManager::new(app.handle())?;
            app.manage(Mutex::new(db_manager));

            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            get_companies,
            update_company,
            get_customers_by_company,
            search_customers,
            create_customer,
            update_customer,
            delete_customer,
            export_customers_csv,
            import_customers_csv,
            get_categories_by_company,
            create_category,
            update_category,
            delete_category,
            get_sales_reports_by_company,
            get_sales_reports_paginated,
            search_sales_reports,
            create_sales_report,
            update_sales_report,
            delete_sales_report,
            export_sales_reports_csv,
            import_sales_reports_csv,
            clear_all_data,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

#[tauri::command]
fn get_companies(db: State<DbState>) -> Result<Vec<Company>, String> {
    let db_manager = db.lock().map_err(|e| e.to_string())?;
    db_manager.get_companies().map_err(|e| e.to_string())
}

#[tauri::command]
fn update_company(
    id: i32,
    company: UpdateCompanyRequest,
    db: State<DbState>,
) -> Result<bool, String> {
    let db_manager = db.lock().map_err(|e| e.to_string())?;
    db_manager
        .update_company(id, company)
        .map_err(|e| e.to_string())
}

#[tauri::command]
fn get_customers_by_company(company_id: i32, db: State<DbState>) -> Result<Vec<Customer>, String> {
    let db_manager = db.lock().map_err(|e| e.to_string())?;
    db_manager
        .get_customers_by_company(company_id)
        .map_err(|e| e.to_string())
}

#[tauri::command]
fn search_customers(
    company_id: i32,
    search_term: String,
    db: State<DbState>,
) -> Result<Vec<Customer>, String> {
    let db_manager = db.lock().map_err(|e| e.to_string())?;
    db_manager
        .search_customers(company_id, search_term)
        .map_err(|e| e.to_string())
}

#[tauri::command]
fn create_customer(customer: CreateCustomerRequest, db: State<DbState>) -> Result<i32, String> {
    let db_manager = db.lock().map_err(|e| e.to_string())?;
    db_manager
        .create_customer(customer)
        .map_err(|e| e.to_string())
}

#[tauri::command]
fn update_customer(
    id: i32,
    customer: UpdateCustomerRequest,
    db: State<DbState>,
) -> Result<bool, String> {
    let db_manager = db.lock().map_err(|e| e.to_string())?;
    db_manager
        .update_customer(id, customer)
        .map_err(|e| e.to_string())
}

#[tauri::command]
fn delete_customer(id: i32, db: State<DbState>) -> Result<bool, String> {
    let db_manager = db.lock().map_err(|e| e.to_string())?;
    db_manager.delete_customer(id).map_err(|e| e.to_string())
}

#[tauri::command]
fn export_customers_csv(company_id: i32, db: State<DbState>) -> Result<String, String> {
    let db_manager = db.lock().map_err(|e| e.to_string())?;
    db_manager
        .export_customers_csv(company_id)
        .map_err(|e| e.to_string())
}

#[tauri::command]
fn import_customers_csv(
    company_id: i32,
    csv_data: String,
    db: State<DbState>,
) -> Result<i32, String> {
    let db_manager = db.lock().map_err(|e| e.to_string())?;
    db_manager
        .import_customers_csv(company_id, csv_data)
        .map_err(|e| e.to_string())
}

#[tauri::command]
fn get_categories_by_company(company_id: i32, db: State<DbState>) -> Result<Vec<Category>, String> {
    let db_manager = db.lock().map_err(|e| e.to_string())?;
    db_manager
        .get_categories_by_company(company_id)
        .map_err(|e| e.to_string())
}

#[tauri::command]
fn create_category(category: CreateCategoryRequest, db: State<DbState>) -> Result<i32, String> {
    let db_manager = db.lock().map_err(|e| e.to_string())?;
    db_manager
        .create_category(category)
        .map_err(|e| e.to_string())
}

#[tauri::command]
fn update_category(
    id: i32,
    category: UpdateCategoryRequest,
    db: State<DbState>,
) -> Result<bool, String> {
    let db_manager = db.lock().map_err(|e| e.to_string())?;
    db_manager
        .update_category(id, category)
        .map_err(|e| e.to_string())
}

#[tauri::command]
fn delete_category(id: i32, db: State<DbState>) -> Result<bool, String> {
    let db_manager = db.lock().map_err(|e| e.to_string())?;
    db_manager.delete_category(id).map_err(|e| e.to_string())
}

// Sales Report commands
#[tauri::command]
fn get_sales_reports_by_company(
    company_id: i32,
    db: State<DbState>,
) -> Result<Vec<SalesReport>, String> {
    let db_manager = db.lock().map_err(|e| e.to_string())?;
    db_manager
        .get_sales_reports_by_company(company_id)
        .map_err(|e| e.to_string())
}

#[tauri::command]
fn get_sales_reports_paginated(
    company_id: i32,
    page: i32,
    page_size: i32,
    filters: Option<SalesReportFilters>,
    db: State<DbState>,
) -> Result<(Vec<SalesReport>, i32), String> {
    let db_manager = db.lock().map_err(|e| e.to_string())?;
    db_manager
        .get_sales_reports_paginated(company_id, page, page_size, filters)
        .map_err(|e| e.to_string())
}

#[tauri::command]
fn search_sales_reports(
    company_id: i32,
    search_term: String,
    db: State<DbState>,
) -> Result<Vec<SalesReport>, String> {
    let db_manager = db.lock().map_err(|e| e.to_string())?;
    db_manager
        .search_sales_reports(company_id, search_term)
        .map_err(|e| e.to_string())
}

#[tauri::command]
fn create_sales_report(
    report: CreateSalesReportRequest,
    db: State<DbState>,
) -> Result<i32, String> {
    let db_manager = db.lock().map_err(|e| e.to_string())?;
    db_manager
        .create_sales_report(report)
        .map_err(|e| e.to_string())
}

#[tauri::command]
fn update_sales_report(
    id: i32,
    report: UpdateSalesReportRequest,
    db: State<DbState>,
) -> Result<bool, String> {
    let db_manager = db.lock().map_err(|e| e.to_string())?;
    db_manager
        .update_sales_report(id, report)
        .map_err(|e| e.to_string())
}

#[tauri::command]
fn delete_sales_report(id: i32, db: State<DbState>) -> Result<bool, String> {
    let db_manager = db.lock().map_err(|e| e.to_string())?;
    db_manager
        .delete_sales_report(id)
        .map_err(|e| e.to_string())
}

#[tauri::command]
fn export_sales_reports_csv(company_id: i32, db: State<DbState>) -> Result<String, String> {
    let db_manager = db.lock().map_err(|e| e.to_string())?;
    db_manager
        .export_sales_reports_csv(company_id)
        .map_err(|e| e.to_string())
}

#[tauri::command]
fn import_sales_reports_csv(
    company_id: i32,
    csv_data: String,
    db: State<DbState>,
) -> Result<i32, String> {
    let db_manager = db.lock().map_err(|e| e.to_string())?;
    db_manager
        .import_sales_reports_csv(company_id, csv_data)
        .map_err(|e| e.to_string())
}

#[tauri::command]
fn clear_all_data(db: State<DbState>) -> Result<(), String> {
    let db_manager = db.lock().map_err(|e| e.to_string())?;
    db_manager.clear_all_data().map_err(|e| e.to_string())
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::fs;
    use tempfile::TempDir;

    fn is_valid_filename(filename: &str) -> bool {
        !filename.is_empty()
            && !filename.contains("..")
            && !filename.contains("/")
            && !filename.contains("\\")
    }

    #[test]
    fn test_filename_validation() {
        // Test valid filenames
        assert!(is_valid_filename("test-file"));
        assert!(is_valid_filename("data123"));
        assert!(is_valid_filename("sales_report_2024"));

        // Test invalid filenames
        assert!(!is_valid_filename("../etc/passwd"));
        assert!(!is_valid_filename("test/file"));
        assert!(!is_valid_filename("test\\file"));
        assert!(!is_valid_filename(""));
    }

    #[tokio::test]
    async fn test_file_operations() {
        let temp_dir = TempDir::new().unwrap();
        let file_path = temp_dir.path().join("test.json");

        let test_data = serde_json::json!({
            "company": "Test Company",
            "customers": [
                {"name": "John Doe", "email": "john@example.com"},
                {"name": "Jane Smith", "email": "jane@example.com"}
            ]
        });

        // Test write operation
        let content = serde_json::to_string_pretty(&test_data).unwrap();
        fs::write(&file_path, content).unwrap();

        // Test read operation
        let read_content = fs::read_to_string(&file_path).unwrap();
        let parsed_data: serde_json::Value = serde_json::from_str(&read_content).unwrap();

        assert_eq!(parsed_data, test_data);
    }

    #[test]
    fn test_json_serialization() {
        let test_company = serde_json::json!({
            "id": 1,
            "name": "Test Company",
            "gst_number": "GST123456789",
            "address": "Test Address",
            "phone": "1234567890",
            "email": "test@company.com"
        });

        // Test serialization
        let serialized = serde_json::to_string(&test_company).unwrap();
        assert!(!serialized.is_empty());

        // Test deserialization
        let deserialized: serde_json::Value = serde_json::from_str(&serialized).unwrap();
        assert_eq!(deserialized, test_company);
    }
}
