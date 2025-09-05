import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { customerSchema, type CustomerFormData } from '../utils/validation';
import type { Customer, Category } from '../utils/database';
import { dbManager } from '../utils/database';
import { useCompanyContext } from '../contexts/CompanyContext';
import { X, ChevronDown, Plus, Move, Maximize2 } from 'lucide-react';
import { showToast } from './Toast';

interface CustomerFormProps {
  customer?: Customer;
  onSave: (data: CustomerFormData) => void;
  onCancel: () => void;
}

export const CustomerForm: React.FC<CustomerFormProps> = ({
  customer,
  onSave,
  onCancel,
}) => {
  const { selectedCompany } = useCompanyContext();
  const isEditing = !!customer;

  // Category dropdown state
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [availableCategories, setAvailableCategories] = useState<Category[]>(
    []
  );
  const [loadingCategories, setLoadingCategories] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Form positioning and resizing state
  const [formPosition, setFormPosition] = useState({
    x: Math.max(0, (window.innerWidth - 500) / 2),
    y: Math.max(0, (window.innerHeight - 600) / 2),
  });
  const [formSize, setFormSize] = useState({ width: 500, height: 600 });
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

  // Handle clicking outside dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
        setSearchTerm('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Handle mouse events for dragging and resizing
  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      if (isDragging) {
        const deltaX = event.clientX - dragStart.x;
        const deltaY = event.clientY - dragStart.y;
        setFormPosition({
          x: Math.max(
            0,
            Math.min(
              window.innerWidth - formSize.width,
              formPosition.x + deltaX
            )
          ),
          y: Math.max(
            0,
            Math.min(
              window.innerHeight - formSize.height,
              formPosition.y + deltaY
            )
          ),
        });
        setDragStart({ x: event.clientX, y: event.clientY });
      }

      if (isResizing) {
        const deltaX = event.clientX - resizeStart.x;
        const deltaY = event.clientY - resizeStart.y;
        const newWidth = Math.max(
          400,
          Math.min(800, resizeStart.width + deltaX)
        );
        const newHeight = Math.max(
          300,
          Math.min(900, resizeStart.height + deltaY)
        );
        setFormSize({ width: newWidth, height: newHeight });
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
  }, [isDragging, isResizing, dragStart, resizeStart, formPosition, formSize]);

  // Load categories from database
  const loadCategories = useCallback(async () => {
    if (!selectedCompany) return;

    try {
      setLoadingCategories(true);
      const categories = await dbManager.getCategoriesByCompany(
        selectedCompany.id
      );
      setAvailableCategories(categories);
    } catch (error) {
      console.error('Failed to load categories:', error);
      showToast.error('Failed to load categories');
    } finally {
      setLoadingCategories(false);
    }
  }, [selectedCompany]);

  // Filter categories based on search term
  const filteredCategories = availableCategories.filter(category =>
    category.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Create new category
  const createNewCategory = async (categoryName: string) => {
    if (!selectedCompany || !categoryName.trim()) return;

    try {
      const newCategoryId = await dbManager.createCategory({
        company_id: selectedCompany.id,
        name: categoryName.trim(),
        description: undefined,
      });

      // Reload categories to get the new one
      await loadCategories();

      // Set the new category as selected
      setValue('category_id', newCategoryId);
      setIsDropdownOpen(false);
      setSearchTerm('');

      showToast.success(
        `Category "${categoryName.trim()}" created successfully`
      );
    } catch (error) {
      console.error('Failed to create category:', error);
      showToast.error('Failed to create category');
    }
  };

  // Handle category selection
  const handleCategorySelect = (category: Category) => {
    setValue('category_id', category.id);
    setIsDropdownOpen(false);
    setSearchTerm('');
  };

  // Handle drag start
  const handleDragStart = (event: React.MouseEvent<HTMLDivElement>) => {
    setIsDragging(true);
    setDragStart({ x: event.clientX, y: event.clientY });
    event.preventDefault();
  };

  // Handle resize start
  const handleResizeStart = (event: React.MouseEvent<HTMLDivElement>) => {
    setIsResizing(true);
    setResizeStart({
      x: event.clientX,
      y: event.clientY,
      width: formSize.width,
      height: formSize.height,
    });
    event.preventDefault();
  };

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    setValue,
    watch,
  } = useForm<CustomerFormData>({
    resolver: zodResolver(customerSchema),
    defaultValues: customer
      ? {
          customer_name: customer.customer_name,
          tally_name: customer.tally_name,
          gst_no: customer.gst_no || '',
          category_id: customer.category_id || null,
        }
      : {
          customer_name: '',
          tally_name: '',
          gst_no: '',
          category_id: null,
        },
  });

  const selectedCategoryId = watch('category_id');
  const selectedCategory = availableCategories.find(
    cat => cat.id === selectedCategoryId
  );

  // Load categories when component mounts or company changes
  useEffect(() => {
    if (selectedCompany) {
      loadCategories();
    }
  }, [selectedCompany, loadCategories]);

  const onSubmit = async (data: CustomerFormData) => {
    try {
      await onSave(data);
      reset();
    } catch (error) {
      console.error('Failed to save customer:', error);
      showToast.error('Failed to save customer. Please try again.');
    }
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
          maxHeight: '900px',
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
              // Create a synthetic mouse event for keyboard activation
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
                {isEditing ? 'Edit Customer' : 'Add Customer'}
              </h2>
              <p className="text-sm text-muted-foreground">
                {selectedCompany?.name}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setFormSize({ width: 600, height: 700 })}
              className="p-2 text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Reset size"
            >
              <Maximize2 size={16} />
            </button>
            <button
              onClick={onCancel}
              className="p-2 text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Close form"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Form */}
        <div className="flex-1 overflow-y-auto">
          <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
            {/* Customer Name */}
            <div>
              <label
                htmlFor="customer_name"
                className="block text-sm font-medium text-foreground mb-2"
              >
                Customer Name *
              </label>
              <input
                {...register('customer_name')}
                type="text"
                id="customer_name"
                className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="Enter customer name"
              />
              {errors.customer_name && (
                <p className="mt-1 text-sm text-destructive">
                  {errors.customer_name.message}
                </p>
              )}
            </div>

            {/* Tally Name */}
            <div>
              <label
                htmlFor="tally_name"
                className="block text-sm font-medium text-foreground mb-2"
              >
                Tally Name *
              </label>
              <input
                {...register('tally_name')}
                type="text"
                id="tally_name"
                className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="Enter Tally name"
              />
              {errors.tally_name && (
                <p className="mt-1 text-sm text-destructive">
                  {errors.tally_name.message}
                </p>
              )}
            </div>

            {/* GST Number */}
            <div>
              <label
                htmlFor="gst_no"
                className="block text-sm font-medium text-foreground mb-2"
              >
                GST Number
              </label>
              <input
                {...register('gst_no')}
                type="text"
                id="gst_no"
                className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="22AAAAA0000A1Z5"
              />
              {errors.gst_no && (
                <p className="mt-1 text-sm text-destructive">
                  {errors.gst_no.message}
                </p>
              )}
            </div>

            {/* Category */}
            <div>
              <label
                htmlFor="category"
                className="block text-sm font-medium text-foreground mb-2"
              >
                Category
              </label>
              <div className="relative" ref={dropdownRef}>
                <div
                  className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent cursor-pointer flex items-center justify-between"
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      setIsDropdownOpen(!isDropdownOpen);
                    }
                  }}
                  role="button"
                  tabIndex={0}
                >
                  <span
                    className={
                      selectedCategory
                        ? 'text-foreground'
                        : 'text-muted-foreground'
                    }
                  >
                    {selectedCategory?.name || 'Select or create category'}
                  </span>
                  <ChevronDown size={16} className="text-muted-foreground" />
                </div>

                {isDropdownOpen && (
                  <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-md shadow-lg max-h-60 overflow-y-auto">
                    {/* Search input */}
                    <div className="p-2 border-b border-gray-300 dark:border-gray-700">
                      <input
                        type="text"
                        placeholder="Search or type new category..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="w-full px-2 py-1 text-sm border border-border rounded bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                    </div>

                    {/* Category list */}
                    <div className="py-1">
                      {loadingCategories ? (
                        <div className="px-3 py-2 text-sm text-muted-foreground">
                          Loading categories...
                        </div>
                      ) : filteredCategories.length > 0 ? (
                        filteredCategories.map(category => (
                          <div
                            key={category.id}
                            className="px-3 py-2 text-sm text-foreground hover:bg-accent cursor-pointer"
                            onClick={() => handleCategorySelect(category)}
                            onKeyDown={e => {
                              if (e.key === 'Enter' || e.key === ' ') {
                                handleCategorySelect(category);
                              }
                            }}
                            role="button"
                            tabIndex={0}
                          >
                            {category.name}
                            {category.description && (
                              <div className="text-xs text-muted-foreground">
                                {category.description}
                              </div>
                            )}
                          </div>
                        ))
                      ) : searchTerm.trim() ? (
                        <div
                          className="px-3 py-2 text-sm text-primary hover:bg-accent cursor-pointer flex items-center gap-2"
                          onClick={() => createNewCategory(searchTerm)}
                          onKeyDown={e => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              createNewCategory(searchTerm);
                            }
                          }}
                          role="button"
                          tabIndex={0}
                        >
                          <Plus size={14} />
                          Create &quot;{searchTerm}&quot;
                        </div>
                      ) : (
                        <div className="px-3 py-2 text-sm text-muted-foreground">
                          No categories available. Type to create a new one.
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
              {errors.category_id && (
                <p className="mt-1 text-sm text-destructive">
                  {errors.category_id.message}
                </p>
              )}
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting
                  ? 'Saving...'
                  : isEditing
                    ? 'Update Customer'
                    : 'Add Customer'}
              </button>
              <button
                type="button"
                onClick={onCancel}
                className="flex-1 px-4 py-2 border border-border rounded-md hover:bg-accent transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>

        {/* Resize handle */}
        <div
          className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize bg-border hover:bg-primary"
          onMouseDown={handleResizeStart}
          role="button"
          tabIndex={0}
          aria-label="Resize form"
          onKeyDown={e => {
            if (e.key === 'Enter' || e.key === ' ') {
              // Create a synthetic mouse event for keyboard activation
              const syntheticEvent = {
                clientX: 0,
                clientY: 0,
                preventDefault: () => {},
              } as React.MouseEvent<HTMLDivElement>;
              handleResizeStart(syntheticEvent);
            }
          }}
          style={{
            clipPath: 'polygon(100% 0%, 0% 100%, 100% 100%)',
          }}
        />
      </div>
    </div>
  );
};
