import { Component } from 'react';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({
      error: error,
      errorInfo: errorInfo
    });
    
    // 에러 로깅 (프로덕션에서는 실제 로깅 서비스 사용)
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
          <div className="bg-section rounded-lg p-8 max-w-md w-full text-center">
            <div className="mb-6">
              <div className="w-16 h-16 bg-danger/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-danger text-2xl">⚠️</span>
              </div>
              <h1 className="text-2xl font-bold text-text mb-2">문제가 발생했습니다</h1>
              <p className="text-textSecondary">
                예상치 못한 오류가 발생했습니다. 페이지를 새로고침하거나 홈으로 돌아가주세요.
              </p>
            </div>

            {/* 개발 환경에서만 에러 상세 정보 표시 */}
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <div className="bg-card p-4 rounded-lg mb-6 text-left">
                <h3 className="text-sm font-bold text-danger mb-2">에러 상세:</h3>
                <pre className="text-xs text-textSecondary overflow-auto max-h-32">
                  {this.state.error.toString()}
                  {this.state.errorInfo.componentStack}
                </pre>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={this.handleReload}
                className="flex-1 bg-primary hover:bg-primary/80 text-background px-4 py-2 rounded-lg font-medium transition-colors"
              >
                페이지 새로고침
              </button>
              <button
                onClick={this.handleGoHome}
                className="flex-1 bg-transparent hover:bg-primary/10 text-primary border border-primary px-4 py-2 rounded-lg font-medium transition-colors"
              >
                홈으로 이동
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;