/**
 * Performance Monitor - Utility for tracking React component performance
 * Helps identify re-renders and measure performance improvements
 */

class PerformanceMonitor {
  constructor() {
    this.renderCounts = new Map();
    this.renderTimes = new Map();
    this.isEnabled = process.env.NODE_ENV === 'development';
  }

  /**
   * Track component render
   * @param {string} componentName - Name of the component
   * @param {Function} renderFn - Render function to measure
   * @returns {*} Result of render function
   */
  trackRender(componentName, renderFn) {
    if (!this.isEnabled) {
      return renderFn();
    }

    const startTime = performance.now();
    
    // Increment render count
    const currentCount = this.renderCounts.get(componentName) || 0;
    this.renderCounts.set(componentName, currentCount + 1);

    // Execute render function
    const result = renderFn();

    // Track render time
    const endTime = performance.now();
    const renderTime = endTime - startTime;
    
    const times = this.renderTimes.get(componentName) || [];
    times.push(renderTime);
    this.renderTimes.set(componentName, times);

    // Log if render took too long (> 16ms for 60fps)
    if (renderTime > 16) {
      console.warn(`🐌 Slow render: ${componentName} took ${renderTime.toFixed(2)}ms`);
    }

    return result;
  }

  /**
   * Log component that re-rendered
   * @param {string} componentName - Name of component
   * @param {Object} props - Component props (for debugging)
   */
  logRerender(componentName, props) {
    if (!this.isEnabled) return;
    
    const count = this.renderCounts.get(componentName) || 0;
    console.log(`🔄 ${componentName} re-rendered (${count} times)`, props);
  }

  /**
   * Get performance statistics
   * @returns {Object} Performance stats
   */
  getStats() {
    const stats = {};
    
    for (const [component, times] of this.renderTimes.entries()) {
      const totalTime = times.reduce((sum, time) => sum + time, 0);
      const avgTime = totalTime / times.length;
      const maxTime = Math.max(...times);
      const renderCount = this.renderCounts.get(component) || 0;

      stats[component] = {
        renderCount,
        averageTime: Math.round(avgTime * 100) / 100,
        maxTime: Math.round(maxTime * 100) / 100,
        totalTime: Math.round(totalTime * 100) / 100
      };
    }

    return stats;
  }

  /**
   * Print performance report to console
   */
  printReport() {
    if (!this.isEnabled) return;
    
    console.group('📊 Performance Report');
    const stats = this.getStats();
    
    const sortedComponents = Object.entries(stats)
      .sort(([,a], [,b]) => b.renderCount - a.renderCount);

    console.table(sortedComponents.reduce((acc, [name, stat]) => {
      acc[name] = stat;
      return acc;
    }, {}));

    console.groupEnd();
  }

  /**
   * Reset all performance tracking
   */
  reset() {
    this.renderCounts.clear();
    this.renderTimes.clear();
  }
}

// Create singleton instance
export const performanceMonitor = new PerformanceMonitor();

// Expose to window for debugging in development
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  window.performanceMonitor = performanceMonitor;
}

/**
 * HOC to wrap component with performance monitoring
 * @param {React.Component} Component - Component to monitor
 * @param {string} componentName - Name for tracking
 * @returns {React.Component} Wrapped component
 */
export const withPerformanceMonitoring = (Component, componentName) => {
  if (process.env.NODE_ENV !== 'development') {
    return Component;
  }

  return React.memo((props) => {
    return performanceMonitor.trackRender(componentName, () => {
      performanceMonitor.logRerender(componentName, Object.keys(props));
      return <Component {...props} />;
    });
  });
};

/**
 * Hook to measure expensive calculations
 * @param {Function} calculationFn - Function to measure
 * @param {Array} dependencies - Dependencies for useMemo
 * @param {string} name - Name for tracking
 * @returns {*} Memoized result
 */
export const useMemoWithPerformance = (calculationFn, dependencies, name) => {
  return React.useMemo(() => {
    if (process.env.NODE_ENV === 'development') {
      const startTime = performance.now();
      const result = calculationFn();
      const endTime = performance.now();
      const time = endTime - startTime;
      
      if (time > 5) {
        console.warn(`🐌 Slow calculation: ${name} took ${time.toFixed(2)}ms`);
      }
      
      return result;
    }
    
    return calculationFn();
  }, dependencies);
}; 