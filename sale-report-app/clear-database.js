#!/usr/bin/env node

/**
 * Database Clear Utility
 * Command-line tool to clear all data from the database
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🗑️  Database Clear Utility');
console.log('========================');

// Check if we're in the correct directory
const dbPath = path.join(__dirname, 'src-tauri', 'sales_report.db');

if (!fs.existsSync(dbPath)) {
  console.log('❌ Database file not found at:', dbPath);
  console.log('   Make sure you\'re running this from the sale-report-app directory');
  process.exit(1);
}

console.log('📁 Database location:', dbPath);
console.log('⚠️  WARNING: This will permanently delete ALL data!');
console.log('');

// Ask for confirmation
const readline = require('readline');
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

rl.question('Are you sure you want to clear all database data? (yes/no): ', (answer) => {
  if (answer.toLowerCase() === 'yes' || answer.toLowerCase() === 'y') {
    try {
      console.log('🔄 Clearing database...');
      
      // Use sqlite3 command to clear all tables
      const sqlite3Path = 'sqlite3'; // Assumes sqlite3 is in PATH
      
      const clearCommands = [
        'DELETE FROM invoice_mappings;',
        'DELETE FROM audit_logs;',
        'DELETE FROM tally_exports;',
        'DELETE FROM report_rows;',
        'DELETE FROM uploaded_reports;',
        'DELETE FROM sales_reports;',
        'DELETE FROM customers;',
        'DELETE FROM categories;',
        'DELETE FROM companies;',
        'DELETE FROM sqlite_sequence;'
      ].join(' ');

      execSync(`${sqlite3Path} "${dbPath}" "${clearCommands}"`, { stdio: 'inherit' });
      
      console.log('✅ Database cleared successfully!');
      console.log('📊 All tables have been emptied and auto-increment counters reset.');
      
    } catch (error) {
      console.error('❌ Error clearing database:', error.message);
      console.log('');
      console.log('💡 Alternative method:');
      console.log('   1. Delete the database file:', dbPath);
      console.log('   2. Restart the application to recreate it');
    }
  } else {
    console.log('❌ Operation cancelled.');
  }
  
  rl.close();
});
