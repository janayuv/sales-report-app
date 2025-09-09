import { describe, it, expect, vi } from 'vitest';
import {
  downloadFile,
  downloadCSVFile,
  readFileAsText,
  selectFile,
} from './fileUtils';

// Mock DOM methods
const mockCreateElement = vi.fn(() => ({
  href: '',
  download: '',
  click: vi.fn(),
}));

Object.defineProperty(document, 'createElement', {
  value: mockCreateElement,
});

Object.defineProperty(document.body, 'appendChild', {
  value: vi.fn(),
});

Object.defineProperty(document.body, 'removeChild', {
  value: vi.fn(),
});

Object.defineProperty(window, 'URL', {
  value: {
    createObjectURL: vi.fn(() => 'mock-url'),
    revokeObjectURL: vi.fn(),
  },
});

describe('fileUtils', () => {
  describe('downloadFile', () => {
    it('should create blob and download file', () => {
      const content = 'test content';
      const filename = 'test.txt';
      const mimeType = 'text/plain';

      downloadFile(content, filename, mimeType);

      expect(document.createElement).toHaveBeenCalledWith('a');
    });
  });

  describe('downloadCSVFile', () => {
    it('should download CSV file with data', () => {
      const data = [
        { name: 'John', email: 'john@example.com' },
        { name: 'Jane', email: 'jane@example.com' },
      ];
      const filename = 'test.csv';

      downloadCSVFile(data, filename);

      expect(document.createElement).toHaveBeenCalledWith('a');
    });

    it('should throw error for empty data', () => {
      const data: Record<string, unknown>[] = [];
      const filename = 'test.csv';

      expect(() => downloadCSVFile(data, filename)).toThrow(
        'No data to export'
      );
    });
  });

  describe('readFileAsText', () => {
    it('should read file as text', async () => {
      const mockFile = new File(['test content'], 'test.txt', {
        type: 'text/plain',
      });

      // Mock FileReader
      const mockFileReader = {
        readAsText: vi.fn(),
        onload: null as
          | ((event: globalThis.ProgressEvent<FileReader>) => void)
          | null,
        onerror: null as
          | ((event: globalThis.ProgressEvent<FileReader>) => void)
          | null,
        result: 'test content',
        error: null,
        onabort: null,
        readyState: 0,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
        abort: vi.fn(),
        readAsArrayBuffer: vi.fn(),
        readAsBinaryString: vi.fn(),
        readAsDataURL: vi.fn(),
      } as unknown as FileReader;

      Object.defineProperty(window, 'FileReader', {
        value: vi.fn(() => mockFileReader),
      });

      const promise = readFileAsText(mockFile);

      // Simulate successful read
      setTimeout(() => {
        if (mockFileReader.onload) {
          mockFileReader.onload({
            target: { result: 'test content' },
          } as globalThis.ProgressEvent<FileReader>);
        }
      }, 0);

      const result = await promise;
      expect(result).toBe('test content');
    });
  });

  describe('selectFile', () => {
    it('should create file input element', () => {
      const mockInput = {
        type: '',
        accept: '',
        click: vi.fn(),
        href: '',
        download: '',
        onchange: null as ((event: globalThis.Event) => void) | null,
        oncancel: null as ((event: globalThis.Event) => void) | null,
        onerror: null as ((event: globalThis.Event) => void) | null,
      };

      // Mock createElement to return our mock input
      mockCreateElement.mockReturnValueOnce(mockInput);

      selectFile('.csv');

      expect(mockCreateElement).toHaveBeenCalledWith('input');
      expect(mockInput.type).toBe('file');
      expect(mockInput.accept).toBe('.csv');
    });
  });
});
