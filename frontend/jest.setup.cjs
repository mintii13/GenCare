// jest.setup.cjs
require('@testing-library/jest-dom');
Object.defineProperty(global, 'import', {
  value: {
    meta: {
      env: {
        VITE_API_URL: 'http://localhost:3000', // hoặc giá trị phù hợp với môi trường test
        // Thêm các biến môi trường khác nếu cần
      }
    }
  }
});

if (!window.matchMedia) {
  window.matchMedia = function () {
    return {
      matches: false,
      addListener: function () {},
      removeListener: function () {},
      addEventListener: function () {},
      removeEventListener: function () {},
      dispatchEvent: function () {},
    };
  };
}

// Mock ResizeObserver cho jsdom
if (typeof global.ResizeObserver === 'undefined') {
  global.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
}
