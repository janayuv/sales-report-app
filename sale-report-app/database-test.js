/**
 * Database State Verification Script
 * Run this in the browser console to check database state
 */

// Function to check database state
async function checkDatabaseState() {
  console.log('🔍 Checking Database State...');
  console.log('============================');
  
  try {
    // Check if we're in Tauri mode
    if (window.__TAURI__) {
      console.log('✅ Running in Tauri mode - database operations available');
      
      // Import the database manager
      const { dbManager } = await import('./src/utils/database.ts');
      
      // Check companies
      try {
        const companies = await dbManager.getCompanies();
        console.log(`📊 Companies: ${companies.length}`);
        companies.forEach(company => {
          console.log(`   - ${company.name} (ID: ${company.id})`);
        });
      } catch (error) {
        console.log('❌ Error getting companies:', error);
      }
      
      // Check customers (if companies exist)
      try {
        const companies = await dbManager.getCompanies();
        if (companies.length > 0) {
          const customers = await dbManager.getCustomersByCompany(companies[0].id);
          console.log(`👥 Customers: ${customers.length}`);
          customers.forEach(customer => {
            console.log(`   - ${customer.customer_name} (ID: ${customer.id})`);
          });
        } else {
          console.log('👥 Customers: 0 (no companies to check)');
        }
      } catch (error) {
        console.log('❌ Error getting customers:', error);
      }
      
      // Check sales reports
      try {
        const companies = await dbManager.getCompanies();
        if (companies.length > 0) {
          const reports = await dbManager.getSalesReportsByCompany(companies[0].id);
          console.log(`📈 Sales Reports: ${reports.length}`);
        } else {
          console.log('📈 Sales Reports: 0 (no companies to check)');
        }
      } catch (error) {
        console.log('❌ Error getting sales reports:', error);
      }
      
    } else {
      console.log('⚠️ Running in web mode - checking localStorage only');
      
      // Check localStorage
      const companies = localStorage.getItem('companies');
      const customers = localStorage.getItem('customers');
      const salesReports = localStorage.getItem('salesReports');
      
      console.log(`📊 Companies in localStorage: ${companies ? JSON.parse(companies).length : 0}`);
      console.log(`👥 Customers in localStorage: ${customers ? JSON.parse(customers).length : 0}`);
      console.log(`📈 Sales Reports in localStorage: ${salesReports ? JSON.parse(salesReports).length : 0}`);
    }
    
    // Check localStorage cache
    console.log('\n💾 LocalStorage Cache:');
    console.log(`   selectedCompanyKey: ${localStorage.getItem('selectedCompanyKey') || 'null'}`);
    console.log(`   companies: ${localStorage.getItem('companies') ? 'exists' : 'null'}`);
    console.log(`   customers: ${localStorage.getItem('customers') ? 'exists' : 'null'}`);
    console.log(`   salesReports: ${localStorage.getItem('salesReports') ? 'exists' : 'null'}`);
    
  } catch (error) {
    console.error('❌ Error checking database state:', error);
  }
}

// Function to test database clear
async function testDatabaseClear() {
  console.log('🗑️ Testing Database Clear...');
  console.log('============================');
  
  try {
    if (window.__TAURI__) {
      const { dbManager } = await import('./src/utils/database.ts');
      
      console.log('Starting database clear...');
      await dbManager.clearAllData();
      console.log('✅ Database clear completed');
      
      // Check state after clear
      setTimeout(() => {
        checkDatabaseState();
      }, 1000);
      
    } else {
      console.log('⚠️ Database clear not available in web mode');
      localStorage.clear();
      console.log('✅ LocalStorage cleared');
    }
  } catch (error) {
    console.error('❌ Error during database clear:', error);
  }
}

// Export functions for use
window.checkDatabaseState = checkDatabaseState;
window.testDatabaseClear = testDatabaseClear;

console.log('🔧 Database verification functions loaded!');
console.log('Usage:');
console.log('  checkDatabaseState() - Check current database state');
console.log('  testDatabaseClear() - Test database clear functionality');
