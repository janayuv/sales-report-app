import React from 'react';
import { selectFile, readExcelFile } from '../utils/fileUtils';
import { showToast } from './Toast';

export const ImportTest: React.FC = () => {
  const testFileSelection = async () => {
    console.log('Testing Excel file selection...');
    try {
      const file = await selectFile('.xlsx,.xls');
      console.log('Selected file:', file);

      if (file) {
        console.log('File details:', {
          name: file.name,
          size: file.size,
          type: file.type,
        });

        const excelData = await readExcelFile(file);
        console.log('Excel data:', excelData.length, 'rows');
        console.log('First row:', excelData[0]);

        showToast.success(
          `Successfully read Excel file: ${file.name} (${excelData.length} rows)`
        );
      } else {
        console.log('No file selected');
        showToast.info('No file selected');
      }
    } catch (error) {
      console.error('Error testing Excel file selection:', error);
      showToast.error('Error testing Excel file selection');
    }
  };

  return (
    <div className="p-4 border border-gray-300 rounded-md">
      <h3 className="text-lg font-semibold mb-2">Import Test</h3>
      <button
        onClick={testFileSelection}
        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
      >
        Test Excel File Selection
      </button>
    </div>
  );
};
