import "@testing-library/jest-dom";
import { vi } from "vitest";

// Los dobles del navegador solo existen donde hay navegador: las pruebas del servidor
// (`// @vitest-environment node`, p. ej. src/test/billing.test.ts) corren sin `window`.
if (typeof window !== "undefined") {
  // Mock matchMedia
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });

  // Mock IntersectionObserver
  class MockIntersectionObserver {
    observe = vi.fn();
    disconnect = vi.fn();
    unobserve = vi.fn();
  }

  Object.defineProperty(window, "IntersectionObserver", {
    writable: true,
    value: MockIntersectionObserver,
  });

  // Mock ResizeObserver
  class MockResizeObserver {
    observe = vi.fn();
    disconnect = vi.fn();
    unobserve = vi.fn();
  }

  Object.defineProperty(window, "ResizeObserver", {
    writable: true,
    value: MockResizeObserver,
  });

  // Mock Performance API
  Object.defineProperty(window, "performance", {
    writable: true,
    value: {
      getEntriesByType: vi.fn(() => []),
      mark: vi.fn(),
      measure: vi.fn(),
      now: vi.fn(() => Date.now()),
    },
  });

  // Mock localStorage
  const localStorageMock = {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
  };

  Object.defineProperty(window, "localStorage", {
    value: localStorageMock,
  });
}

// Mock console methods to reduce noise
const originalConsoleError = console.error;
console.error = (...args: unknown[]) => {
  if (
    typeof args[0] === "string" &&
    (/Warning.*React/.test(args[0]) || /act\(\)/.test(args[0]))
  ) {
    return;
  }
  originalConsoleError(...args);
};

// Clean up after each test
afterEach(() => {
  vi.clearAllMocks();
});
