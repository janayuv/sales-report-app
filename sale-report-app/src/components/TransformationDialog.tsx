/**
 * Transformation Dialog Component
 * Provides UI for mapping and transforming imported data
 */

import React, { useState, useEffect, useCallback } from 'react';
import { X, Check, AlertTriangle, Eye, Download, Save } from 'lucide-react';
import { TransformationEngine } from '../utils/transformationEngine';
import type {
  TransformationResult,
  ColumnMapping,
  YearMapConfig,
} from '../utils/transformation';
import { createPresetConfig } from '../utils/transformation';
import { showToast } from './Toast';
import { downloadExcelFile } from '../utils/fileUtils';

interface TransformationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  inputData: Record<string, unknown>[];
  sourceHeaders: string[];
  onTransformComplete: (result: TransformationResult) => void;
}

interface ColumnMappingRow {
  targetColumn: string;
  sourceColumn: string | null;
  availableSources: string[];
  required: boolean;
}

export const TransformationDialog: React.FC<TransformationDialogProps> = ({
  isOpen,
  onClose,
  inputData,
  sourceHeaders,
  onTransformComplete,
}) => {
  const [engine] = useState(() => new TransformationEngine());
  const [columnMappings, setColumnMappings] = useState<ColumnMappingRow[]>([]);
  const [yearMap, setYearMap] = useState<YearMapConfig>({});
  const [transformationResult, setTransformationResult] =
    useState<TransformationResult | null>(null);
  const [, setShowPreview] = useState(false);
  const [isTransforming, setIsTransforming] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState<string>('indian_export');

  const initializeColumnMappings = useCallback(() => {
    if (!sourceHeaders || sourceHeaders.length === 0) {
      console.warn(
        'No source headers available for column mapping initialization'
      );
      return;
    }

    const config = engine.getConfig();
    const mappings: ColumnMappingRow[] = [];

    config.columnMappings.forEach(mapping => {
      const bestMatch = findBestMatch(
        mapping.targetColumn,
        sourceHeaders,
        mapping
      );
      mappings.push({
        targetColumn: mapping.targetColumn,
        sourceColumn: bestMatch,
        availableSources: sourceHeaders,
        required: mapping.required || false,
      });
    });

    setColumnMappings(mappings);
  }, [sourceHeaders, engine]);

  // Initialize column mappings
  useEffect(() => {
    if (isOpen && sourceHeaders && sourceHeaders.length > 0) {
      initializeColumnMappings();
      setYearMap(engine.getConfig().yearMap);
    }
  }, [isOpen, sourceHeaders, engine, initializeColumnMappings]);

  const findBestMatch = (
    _targetColumn: string,
    sourceHeaders: string[],
    mapping: ColumnMapping
  ): string | null => {
    const normalizedHeaders = sourceHeaders.map(h =>
      h.trim().toLowerCase().replace(/\s+/g, '_')
    );

    for (const sourceCol of mapping.sourceColumns) {
      const normalizedSource = sourceCol
        .trim()
        .toLowerCase()
        .replace(/\s+/g, '_');
      const index = normalizedHeaders.indexOf(normalizedSource);
      if (index !== -1) {
        return sourceHeaders[index];
      }
    }

    return null;
  };

  const handleColumnMappingChange = (
    targetColumn: string,
    sourceColumn: string | null
  ) => {
    setColumnMappings(prev =>
      prev.map(mapping =>
        mapping.targetColumn === targetColumn
          ? { ...mapping, sourceColumn }
          : mapping
      )
    );
  };

  const handleYearMapChange = (year: number, code: string) => {
    setYearMap(prev => ({
      ...prev,
      [year]: code,
    }));
  };

  const addYearMapping = () => {
    const currentYear = new Date().getFullYear();
    const years = Object.keys(yearMap)
      .map(Number)
      .sort((a, b) => b - a);
    const nextYear = years.length > 0 ? years[0] + 1 : currentYear;

    setYearMap(prev => ({
      ...prev,
      [nextYear]: '',
    }));
  };

  const removeYearMapping = (year: number) => {
    setYearMap(prev => {
      const newMap = { ...prev };
      delete newMap[year];
      return newMap;
    });
  };

  const performTransformation = async () => {
    setIsTransforming(true);

    try {
      // Update engine configuration
      engine.updateYearMap(yearMap);

      // Update column mappings
      const updatedMappings: ColumnMapping[] = columnMappings.map(mapping => ({
        targetColumn: mapping.targetColumn,
        sourceColumns: mapping.sourceColumn ? [mapping.sourceColumn] : [],
        required: mapping.required,
      }));

      engine.updateColumnMappings(updatedMappings);

      // Perform transformation
      if (!sourceHeaders || sourceHeaders.length === 0) {
        showToast.error('No source headers available for transformation');
        return;
      }

      const result = engine.transformData(inputData, sourceHeaders);
      setTransformationResult(result);
      setShowPreview(true);

      if (result.success) {
        showToast.success(
          `Transformation completed successfully! ${result.data.length} rows processed.`
        );
      } else {
        showToast.warning(
          `Transformation completed with ${result.errors.length} errors. Please review.`
        );
      }
    } catch (error) {
      console.error('Transformation error:', error);
      showToast.error(
        'Failed to perform transformation. Please check your data.'
      );
    } finally {
      setIsTransforming(false);
    }
  };

  const handleApplyTransformation = () => {
    if (transformationResult) {
      onTransformComplete(transformationResult);
      onClose();
    }
  };

  const exportTransformedData = () => {
    if (!transformationResult) return;

    // Export as Excel file
    const excelData = engine.exportToExcel(transformationResult.data);
    const filename = `transformed_data_${new Date().toISOString().split('T')[0]}.xlsx`;

    downloadExcelFile(excelData, filename, 'Transformed Data');
    showToast.success('Transformed data exported successfully!');
  };

  const loadPreset = (presetName: string) => {
    const presetConfig = createPresetConfig(presetName);
    if (presetConfig.yearMap) {
      setYearMap(presetConfig.yearMap);
      engine.updateYearMap(presetConfig.yearMap);
    }
    if (presetConfig.columnMappings) {
      engine.updateColumnMappings(presetConfig.columnMappings);
      initializeColumnMappings();
    }
    setSelectedPreset(presetName);
    showToast.success(`Loaded preset: ${presetName}`);
  };

  const savePreset = () => {
    const presetName = `custom_${Date.now()}`;
    const config = {
      yearMap,
      columnMappings: columnMappings.map(m => ({
        targetColumn: m.targetColumn,
        sourceColumns: m.sourceColumn ? [m.sourceColumn] : [],
        required: m.required,
      })),
    };

    // Save to localStorage for persistence
    localStorage.setItem(
      `transformation_preset_${presetName}`,
      JSON.stringify(config)
    );
    showToast.success('Preset saved successfully!');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Data Transformation
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Map your data columns to the standard format
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors"
          >
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        <div className="flex h-[calc(90vh-120px)]">
          {/* Left Panel - Configuration */}
          <div className="w-1/2 border-r border-gray-200 dark:border-gray-700 overflow-y-auto">
            <div className="p-6">
              {/* Preset Selection */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                    Configuration Presets
                  </h3>
                  <div className="flex gap-2">
                    <button
                      onClick={savePreset}
                      className="flex items-center gap-1 px-2 py-1 text-xs bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
                    >
                      <Save size={12} />
                      Save
                    </button>
                  </div>
                </div>
                <div className="flex gap-2">
                  <select
                    value={selectedPreset}
                    onChange={e => {
                      setSelectedPreset(e.target.value);
                      loadPreset(e.target.value);
                    }}
                    className="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="indian_export">Indian Export Format</option>
                    <option value="basic">Basic Format</option>
                  </select>
                </div>
              </div>

              {/* Column Mappings */}
              <div className="mb-8">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                  Column Mappings
                </h3>
                <div className="space-y-3">
                  {columnMappings.map(mapping => (
                    <div
                      key={mapping.targetColumn}
                      className="flex items-center gap-3"
                    >
                      <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          {mapping.targetColumn}
                          {mapping.required && (
                            <span className="text-red-500 ml-1">*</span>
                          )}
                        </label>
                        <select
                          value={mapping.sourceColumn || ''}
                          onChange={e =>
                            handleColumnMappingChange(
                              mapping.targetColumn,
                              e.target.value || null
                            )
                          }
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="">Select source column...</option>
                          {mapping.availableSources.map(source => (
                            <option key={source} value={source}>
                              {source}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Mapping Summary */}
              {transformationResult && (
                <div className="mb-6">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">
                    Detected Mappings
                  </h3>
                  <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-md text-sm">
                    <div className="grid grid-cols-2 gap-2">
                      {Object.entries(transformationResult.mapping).map(
                        ([target, source]) => (
                          <div key={target} className="flex items-center">
                            <span className="text-gray-600 dark:text-gray-400">
                              {target}:
                            </span>
                            <span className="ml-2 font-medium text-gray-900 dark:text-white">
                              {source || 'Not mapped'}
                            </span>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Year Map Configuration */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                    Year Code Mapping
                  </h3>
                  <button
                    onClick={addYearMapping}
                    className="px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                  >
                    Add Year
                  </button>
                </div>
                <div className="space-y-2">
                  {Object.entries(yearMap)
                    .sort(([a], [b]) => Number(b) - Number(a))
                    .map(([year, code]) => (
                      <div key={year} className="flex items-center gap-2">
                        <input
                          type="number"
                          value={year}
                          readOnly
                          className="w-20 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
                        />
                        <span className="text-gray-500">→</span>
                        <input
                          type="text"
                          value={code}
                          onChange={e =>
                            handleYearMapChange(Number(year), e.target.value)
                          }
                          className="w-16 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                          maxLength={1}
                        />
                        <button
                          onClick={() => removeYearMapping(Number(year))}
                          className="p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={performTransformation}
                  disabled={isTransforming}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isTransforming ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Transforming...
                    </>
                  ) : (
                    <>
                      <Check size={16} />
                      Transform Data
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Right Panel - Preview */}
          <div className="w-1/2 overflow-y-auto">
            <div className="p-6">
              {transformationResult ? (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                      Transformation Results
                    </h3>
                    <div className="flex gap-2">
                      <button
                        onClick={exportTransformedData}
                        className="flex items-center gap-2 px-3 py-1 text-sm bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                      >
                        <Download size={14} />
                        Export
                      </button>
                      <button
                        onClick={handleApplyTransformation}
                        className="flex items-center gap-2 px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                      >
                        <Check size={14} />
                        Apply
                      </button>
                    </div>
                  </div>

                  {/* Summary */}
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-md">
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        Total Rows
                      </div>
                      <div className="text-lg font-semibold text-gray-900 dark:text-white">
                        {transformationResult.data.length}
                      </div>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-md">
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        Errors
                      </div>
                      <div className="text-lg font-semibold text-red-600">
                        {transformationResult.errors.length}
                      </div>
                    </div>
                  </div>

                  {/* Errors */}
                  {transformationResult.errors.length > 0 && (
                    <div className="mb-6">
                      <h4 className="text-md font-medium text-red-600 mb-2 flex items-center gap-2">
                        <AlertTriangle size={16} />
                        Errors ({transformationResult.errors.length})
                      </h4>
                      <div className="max-h-32 overflow-y-auto space-y-1">
                        {transformationResult.errors
                          .slice(0, 10)
                          .map((error, index) => (
                            <div
                              key={index}
                              className="text-sm text-red-600 bg-red-50 dark:bg-red-900/20 p-2 rounded"
                            >
                              Row {error.row}: {error.message}
                            </div>
                          ))}
                        {transformationResult.errors.length > 10 && (
                          <div className="text-sm text-gray-500">
                            ... and {transformationResult.errors.length - 10}{' '}
                            more errors
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Preview Table */}
                  <div className="border border-gray-200 dark:border-gray-700 rounded-md overflow-hidden">
                    <div className="bg-gray-50 dark:bg-gray-800 px-4 py-2 border-b border-gray-200 dark:border-gray-700">
                      <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                        Preview (First 10 rows)
                      </h4>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-50 dark:bg-gray-800">
                          <tr>
                            {Object.keys(
                              transformationResult.preview[0] || {}
                            ).map(header => (
                              <th
                                key={header}
                                className="px-3 py-2 text-left text-gray-700 dark:text-gray-300 border-r border-gray-200 dark:border-gray-700"
                              >
                                {header}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {transformationResult.preview.map((row, index) => (
                            <tr
                              key={index}
                              className="border-b border-gray-200 dark:border-gray-700"
                            >
                              {Object.values(row).map((value, cellIndex) => (
                                <td
                                  key={cellIndex}
                                  className="px-3 py-2 text-gray-900 dark:text-white border-r border-gray-200 dark:border-gray-700"
                                >
                                  {value === null || value === undefined ? (
                                    <span className="text-gray-400">-</span>
                                  ) : (
                                    String(value)
                                  )}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center h-64 text-gray-500 dark:text-gray-400">
                  <div className="text-center">
                    <Eye size={48} className="mx-auto mb-4 opacity-50" />
                    <p>
                      Configure mappings and click &quot;Transform Data&quot; to
                      see preview
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
