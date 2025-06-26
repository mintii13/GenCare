import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { log } from '@/utils/logger';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  errorInfo: string | null;
  errorId: string | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    errorInfo: null,
    errorId: null
  };

  public static getDerivedStateFromError(error: Error): State {
    // Generate unique error ID for tracking
    const errorId = `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    return {
      hasError: true,
      errorInfo: error.message,
      errorId
    };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error for debugging
    log.error('ErrorBoundary', 'React Error Caught', {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      errorId: this.state.errorId
    });

    // In production, you might want to send this to an error tracking service
    if (import.meta.env.PROD) {
      // Example: Send to error tracking service
      // errorTrackingService.captureException(error, {
      //   extra: errorInfo,
      //   tags: { errorId: this.state.errorId }
      // });
    }
  }

  private handleRefresh = () => {
    window.location.reload();
  };

  private handleGoHome = () => {
    window.location.href = '/';
  };

  private handleRetry = () => {
    this.setState({
      hasError: false,
      errorInfo: null,
      errorId: null
    });
  };

  public render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center px-4">
          <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6 text-center">
            {/* Error Icon */}
            <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <AlertTriangle className="w-8 h-8 text-red-600" />
            </div>
            
            {/* Error Title */}
            <h1 className="text-xl font-semibold text-gray-900 mb-2">
              Oops! Có lỗi xảy ra
            </h1>
            
            {/* Error Description */}
            <p className="text-gray-600 mb-6">
              Ứng dụng gặp lỗi không mong muốn. Vui lòng thử lại hoặc quay về trang chủ.
            </p>

            {/* Error ID for support */}
            {this.state.errorId && (
              <div className="bg-gray-100 rounded p-3 mb-6">
                <p className="text-xs text-gray-500 mb-1">Mã lỗi để báo cáo:</p>
                <code className="text-xs text-gray-700 font-mono">
                  {this.state.errorId}
                </code>
              </div>
            )}

            {/* Development mode: Show error details */}
            {import.meta.env.DEV && this.state.errorInfo && (
              <div className="bg-red-50 border border-red-200 rounded p-3 mb-6 text-left">
                <p className="text-xs text-red-600 mb-2 font-semibold">
                  Chi tiết lỗi (chỉ hiển thị trong development):
                </p>
                <code className="text-xs text-red-700 font-mono break-all">
                  {this.state.errorInfo}
                </code>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={this.handleRetry}
                className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors duration-200 flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Thử lại
              </button>
              
              <button
                onClick={this.handleGoHome}
                className="flex-1 bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors duration-200 flex items-center justify-center gap-2"
              >
                <Home className="w-4 h-4" />
                Về trang chủ
              </button>
            </div>

            {/* Support Contact */}
            <div className="mt-6 pt-4 border-t border-gray-200">
              <p className="text-xs text-gray-500">
                Nếu lỗi vẫn tiếp tục, vui lòng liên hệ hỗ trợ kỹ thuật
              </p>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;