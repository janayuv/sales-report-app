/**
 * Import Transform Page Component
 * Dedicated page for import with transformation functionality
 */

import React from 'react';
import { ImportTransformTable } from '../components/ImportTransformTable';

export const ImportTransformPage: React.FC = () => {
  return (
    <div className="container mx-auto px-4 py-6">
      <ImportTransformTable />
    </div>
  );
};
