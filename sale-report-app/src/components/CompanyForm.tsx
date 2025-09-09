import React, { useState, useEffect, useRef } from 'react';
import { X, Move, Save, RotateCcw } from 'lucide-react';
import { dbManager } from '../utils/database';
import { showToast } from './Toast';

interface Company {
  id: number;
  name: string;
  key: string;
  created_at: string;
}

interface CompanyFormProps {
  company: Company | null;
  onSave: (company: Company) => void;
  onCancel: () => void;
}

export const CompanyForm: React.FC<CompanyFormProps> = ({
  company,
  onSave,
  onCancel,
}) => {
  const isEditing = !!company;
  const [formData, setFormData] = useState({
    name: company?.name || '',
    key: company?.key || '',
  });
  const [loading, setLoading] = useState(false);

  // Form positioning and resizing state
  const [formPosition, setFormPosition] = useState({
    x: Math.max(0, (window.innerWidth - 500) / 2),
    y: Math.max(0, (window.innerHeight - 400) / 2),
  });
  const [formSize, setFormSize] = useState({ width: 500, height: 400 });
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [resizeStart, setResizeStart] = useState({
    x: 0,
    y: 0,
    width: 0,
    height: 0,
  });
  const formRef = useRef<HTMLDivElement>(null);

  // Handle mouse events for dragging and resizing
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        const newX = e.clientX - dragStart.x;
        const newY = e.clientY - dragStart.y;
        setFormPosition({
          x: Math.max(0, Math.min(window.innerWidth - formSize.width, newX)),
          y: Math.max(0, Math.min(window.innerHeight - formSize.height, newY)),
        });
      } else if (isResizing) {
        const newWidth = Math.max(
          400,
          resizeStart.width + (e.clientX - resizeStart.x)
        );
        const newHeight = Math.max(
          300,
          resizeStart.height + (e.clientY - resizeStart.y)
        );
        setFormSize({
          width: Math.min(800, newWidth),
          height: Math.min(600, newHeight),
        });
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setIsResizing(false);
    };

    if (isDragging || isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, isResizing, dragStart, resizeStart, formSize]);

  const handleDragStart = (e: React.MouseEvent<HTMLDivElement>) => {
    setIsDragging(true);
    setDragStart({
      x: e.clientX - formPosition.x,
      y: e.clientY - formPosition.y,
    });
  };

  const handleResizeStart = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    setIsResizing(true);
    setResizeStart({
      x: e.clientX,
      y: e.clientY,
      width: formSize.width,
      height: formSize.height,
    });
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      showToast.error('Company name is required');
      return;
    }

    if (!formData.key.trim()) {
      showToast.error('Company key is required');
      return;
    }

    try {
      setLoading(true);

      if (isEditing && company) {
        // Update existing company
        console.log('Updating company:', company.id, 'with data:', {
          name: formData.name.trim(),
          key: formData.key.trim(),
        });

        const success = await dbManager.updateCompany(company.id, {
          name: formData.name.trim(),
          key: formData.key.trim(),
        });

        console.log('Update result:', success);

        if (success) {
          showToast.success('Company updated successfully');
          onSave({
            ...company,
            name: formData.name.trim(),
            key: formData.key.trim(),
          });
        } else {
          showToast.error('Failed to update company');
        }
      }
    } catch (error) {
      console.error('Error saving company:', error);
      showToast.error('Failed to save company. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setFormData({
      name: company?.name || '',
      key: company?.key || '',
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50">
      <div
        ref={formRef}
        className="bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg shadow-xl overflow-hidden flex flex-col"
        style={{
          position: 'absolute',
          left: `${formPosition.x}px`,
          top: `${formPosition.y}px`,
          width: `${formSize.width}px`,
          height: `${formSize.height}px`,
          minWidth: '400px',
          minHeight: '300px',
          maxWidth: '800px',
          maxHeight: '600px',
        }}
      >
        {/* Header with drag handle */}
        <div
          className="flex items-center justify-between p-6 border-b border-gray-300 dark:border-gray-700 cursor-move bg-gray-50 dark:bg-gray-800"
          onMouseDown={handleDragStart}
          role="button"
          tabIndex={0}
          onKeyDown={e => {
            if (e.key === 'Enter' || e.key === ' ') {
              const syntheticEvent = {
                clientX: 0,
                clientY: 0,
                preventDefault: () => {},
              } as React.MouseEvent<HTMLDivElement>;
              handleDragStart(syntheticEvent);
            }
          }}
        >
          <div className="flex items-center gap-2">
            <Move size={16} className="text-muted-foreground" />
            <div>
              <h2 className="text-xl font-semibold text-foreground">
                {isEditing ? 'Edit Company' : 'Add Company'}
              </h2>
              <p className="text-sm text-muted-foreground">
                {isEditing
                  ? `Editing: ${company?.name}`
                  : 'Create a new company'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onCancel}
              className="p-1 text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Close form"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Form content */}
        <div className="flex-1 p-6 overflow-y-auto">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-foreground mb-2"
              >
                Company Name *
              </label>
              <input
                id="name"
                type="text"
                value={formData.name}
                onChange={e => handleInputChange('name', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="Enter company name"
                required
              />
            </div>

            <div>
              <label
                htmlFor="key"
                className="block text-sm font-medium text-foreground mb-2"
              >
                Company Key *
              </label>
              <input
                id="key"
                type="text"
                value={formData.key}
                onChange={e => handleInputChange('key', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="Enter company key (e.g., company_a)"
                required
              />
              <p className="text-xs text-muted-foreground mt-1">
                Company key is used internally and should be unique (lowercase,
                no spaces)
              </p>
            </div>

            {isEditing && (
              <div className="text-sm text-muted-foreground">
                <p>
                  <strong>Created:</strong>{' '}
                  {new Date(company.created_at).toLocaleDateString()}
                </p>
                <p>
                  <strong>ID:</strong> {company.id}
                </p>
              </div>
            )}
          </form>
        </div>

        {/* Footer with buttons */}
        <div className="flex items-center justify-between p-6 border-t border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
          <button
            type="button"
            onClick={handleReset}
            className="flex items-center gap-2 px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            disabled={loading}
          >
            <RotateCcw size={16} />
            Reset
          </button>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              onClick={handleSubmit}
              disabled={
                loading || !formData.name.trim() || !formData.key.trim()
              }
              className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save size={16} />
              {loading
                ? 'Saving...'
                : isEditing
                  ? 'Update Company'
                  : 'Create Company'}
            </button>
          </div>
        </div>

        {/* Resize handle */}
        <div
          className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize"
          onMouseDown={handleResizeStart}
          role="button"
          tabIndex={0}
          aria-label="Resize dialog"
          onKeyDown={e => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              // For keyboard activation, we'll just trigger a simple resize
              // Create a minimal mouse event for the handler
              const syntheticEvent = {
                ...e,
                button: 0,
                buttons: 1,
                clientX: 0,
                clientY: 0,
                screenX: 0,
                screenY: 0,
                pageX: 0,
                pageY: 0,
                movementX: 0,
                movementY: 0,
                relatedTarget: null,
                nativeEvent: e.nativeEvent,
              } as unknown as React.MouseEvent<HTMLDivElement>;
              handleResizeStart(syntheticEvent);
            }
          }}
        >
          <div className="absolute bottom-1 right-1 w-2 h-2 border-r-2 border-b-2 border-gray-400"></div>
        </div>
      </div>
    </div>
  );
};
