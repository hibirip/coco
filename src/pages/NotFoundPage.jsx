export default function NotFoundPage() {
  return (
    <div className="min-h-screen bg-background text-text flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-primary mb-4">404</h1>
        <h2 className="text-2xl font-semibold mb-4">페이지를 찾을 수 없습니다</h2>
        <p className="text-textSecondary mb-8">요청하신 페이지가 존재하지 않습니다.</p>
        <a 
          href="/" 
          className="bg-primary hover:bg-primary/80 text-background px-6 py-3 rounded-lg transition-colors"
        >
          홈으로 돌아가기
        </a>
      </div>
    </div>
  );
}