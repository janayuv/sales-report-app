import React, { useMemo, useCallback } from 'react';
// @ts-expect-error - react-window types issue
import { FixedSizeList as List } from 'react-window';
import type { SalesReport } from '../utils/database';

interface VirtualizedTableProps {
  reports: SalesReport[];
  onDeleteReport: (id: number) => void;
  onSort: (key: keyof SalesReport) => void;
  sortConfig: {
    key: keyof SalesReport | null;
    direction: 'asc' | 'desc';
  };
}

interface RowProps {
  index: number;
  style: React.CSSProperties;
  data: {
    reports: SalesReport[];
    onDeleteReport: (id: number) => void;
  };
}

const Row: React.FC<RowProps> = ({ index, style, data }) => {
  const { reports, onDeleteReport } = data;
  const report = reports[index];

  return (
    <div
      style={style}
      className="flex items-center border-b border-border hover:bg-muted/30 px-4"
    >
      <div className="flex-1 min-w-0 grid grid-cols-12 gap-4 py-3">
        {/* Date */}
        <div className="col-span-1 text-sm text-foreground">
          {new Date(report.inv_date).toLocaleDateString()}
        </div>

        {/* Invoice */}
        <div className="col-span-1 text-sm font-medium text-foreground truncate">
          {report.invno}
        </div>

        {/* Customer */}
        <div className="col-span-2 min-w-0">
          <div className="text-sm text-foreground truncate">
            {report.cust_name}
          </div>
          <div className="text-xs text-muted-foreground truncate">
            {report.cust_code}
          </div>
        </div>

        {/* Part Code */}
        <div className="col-span-1 text-sm text-foreground truncate">
          {report.part_code || '-'}
        </div>

        {/* Part Name */}
        <div className="col-span-2 text-sm text-foreground truncate">
          {report.part_name || '-'}
        </div>

        {/* Qty */}
        <div className="col-span-1 text-sm text-foreground text-right">
          {(report.qty || 0).toLocaleString()}
        </div>

        {/* Rate */}
        <div className="col-span-1 text-sm text-foreground text-right">
          ₹{(report.bas_price || 0).toLocaleString()}
        </div>

        {/* CGST */}
        <div className="col-span-1 text-sm text-foreground text-right">
          ₹{(report.c_gst || 0).toLocaleString()}
        </div>

        {/* Total */}
        <div className="col-span-1 text-sm font-medium text-foreground text-right">
          ₹{(report.inv_val || 0).toLocaleString()}
        </div>

        {/* Actions */}
        <div className="col-span-1 flex items-center justify-center">
          <button
            onClick={() => onDeleteReport(report.id)}
            className="p-1 text-muted-foreground hover:text-destructive transition-colors"
            aria-label="Delete report"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <polyline points="3,6 5,6 21,6"></polyline>
              <path d="m19,6v14a2,2 0 0,1 -2,2H7a2,2 0 0,1 -2,-2V6m3,0V4a2,2 0 0,1 2,-2h4a2,2 0 0,1 2,2v2"></path>
              <line x1="10" y1="11" x2="10" y2="17"></line>
              <line x1="14" y1="11" x2="14" y2="17"></line>
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export const VirtualizedTable: React.FC<VirtualizedTableProps> = ({
  reports,
  onDeleteReport,
  onSort,
  sortConfig,
}) => {
  const itemData = useMemo(
    () => ({
      reports,
      onDeleteReport,
    }),
    [reports, onDeleteReport]
  );

  const handleSort = useCallback(
    (key: keyof SalesReport) => {
      onSort(key);
    },
    [onSort]
  );

  if (reports.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center text-muted-foreground">
          No reports found
        </div>
      </div>
    );
  }

  return (
    <div className="border border-border rounded-md overflow-hidden">
      {/* Header */}
      <div className="bg-muted/50 px-4 py-3 border-b border-border">
        <div className="flex items-center gap-4">
          <div className="col-span-1 text-sm font-medium text-foreground">
            <button
              onClick={() => handleSort('inv_date')}
              className="flex items-center gap-2 hover:text-foreground"
            >
              Date
              {sortConfig.key === 'inv_date' &&
                (sortConfig.direction === 'asc' ? '↑' : '↓')}
            </button>
          </div>

          <div className="col-span-1 text-sm font-medium text-foreground">
            <button
              onClick={() => handleSort('invno')}
              className="flex items-center gap-2 hover:text-foreground"
            >
              Invoice
              {sortConfig.key === 'invno' &&
                (sortConfig.direction === 'asc' ? '↑' : '↓')}
            </button>
          </div>

          <div className="col-span-2 text-sm font-medium text-foreground">
            <button
              onClick={() => handleSort('cust_name')}
              className="flex items-center gap-2 hover:text-foreground"
            >
              Customer
              {sortConfig.key === 'cust_name' &&
                (sortConfig.direction === 'asc' ? '↑' : '↓')}
            </button>
          </div>

          <div className="col-span-1 text-sm font-medium text-foreground">
            Part Code
          </div>

          <div className="col-span-2 text-sm font-medium text-foreground">
            Part Name
          </div>

          <div className="col-span-1 text-sm font-medium text-foreground text-right">
            <button
              onClick={() => handleSort('qty')}
              className="flex items-center gap-2 hover:text-foreground ml-auto"
            >
              Qty
              {sortConfig.key === 'qty' &&
                (sortConfig.direction === 'asc' ? '↑' : '↓')}
            </button>
          </div>

          <div className="col-span-1 text-sm font-medium text-foreground text-right">
            <button
              onClick={() => handleSort('bas_price')}
              className="flex items-center gap-2 hover:text-foreground ml-auto"
            >
              Rate
              {sortConfig.key === 'bas_price' &&
                (sortConfig.direction === 'asc' ? '↑' : '↓')}
            </button>
          </div>

          <div className="col-span-1 text-sm font-medium text-foreground text-right">
            <button
              onClick={() => handleSort('c_gst')}
              className="flex items-center gap-2 hover:text-foreground ml-auto"
            >
              CGST
              {sortConfig.key === 'c_gst' &&
                (sortConfig.direction === 'asc' ? '↑' : '↓')}
            </button>
          </div>

          <div className="col-span-1 text-sm font-medium text-foreground text-right">
            <button
              onClick={() => handleSort('inv_val')}
              className="flex items-center gap-2 hover:text-foreground ml-auto"
            >
              Total
              {sortConfig.key === 'inv_val' &&
                (sortConfig.direction === 'asc' ? '↑' : '↓')}
            </button>
          </div>

          <div className="col-span-1 text-sm font-medium text-foreground text-center">
            Actions
          </div>
        </div>
      </div>

      {/* Virtualized List */}
      <List
        height={Math.min(600, reports.length * 60 + 20)} // Max height of 600px
        itemCount={reports.length}
        itemSize={60}
        itemData={itemData}
        overscanCount={5} // Render 5 extra items above and below viewport
      >
        {Row}
      </List>
    </div>
  );
};
