import { Link } from 'react-router-dom';

const Footer = () => {
  const footerSections = {
    service: {
      title: '서비스',
      links: [
        { name: '암호화폐 시세', href: '/prices' },
        { name: 'AI 분석', href: '/analysis' },
        { name: '뉴스', href: '/news' },
        { name: '이벤트', href: '/events' },
      ]
    },
    company: {
      title: '회사',
      links: [
        { name: '회사소개', href: '/about' },
        { name: '채용정보', href: '/careers' },
        { name: '보도자료', href: '/press' },
        { name: '블로그', href: '/blog' },
      ]
    },
    support: {
      title: '지원',
      links: [
        { name: '고객센터', href: '/support' },
        { name: 'FAQ', href: '/faq' },
        { name: '공지사항', href: '/notice' },
        { name: '개발자 API', href: '/api' },
      ]
    },
    legal: {
      title: '법적고지',
      links: [
        { name: '이용약관', href: '/terms' },
        { name: '개인정보처리방침', href: '/privacy' },
        { name: '쿠키정책', href: '/cookies' },
        { name: '면책조항', href: '/disclaimer' },
      ]
    }
  };

  return (
    <footer className="bg-section border-t border-border">
      <div className="container mx-auto px-3 py-6 md:px-4 md:py-12">
        {/* 메인 푸터 콘텐츠 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8 mb-6 md:mb-8">
          {Object.entries(footerSections).map(([key, section]) => (
            <div key={key}>
              <h3 className="text-text font-semibold mb-3 md:mb-4">{section.title}</h3>
              <ul className="space-y-2 md:space-y-3">
                {section.links.map((link) => (
                  <li key={link.name}>
                    <Link
                      to={link.href}
                      className="text-textSecondary text-sm hover:text-primary transition-colors"
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* 투자 유의사항 */}
        <div className="border-t border-border pt-6 md:pt-8 mb-6 md:mb-8">
          <div className="bg-card p-4 md:p-6 rounded-lg">
            <h4 className="text-text font-semibold mb-3 md:mb-4 flex items-center">
              <span className="text-danger mr-2">⚠️</span>
              투자 유의사항
            </h4>
            <div className="text-textSecondary text-sm space-y-2">
              <p>
                • 암호화폐는 가격 변동성이 매우 높은 고위험 투자상품입니다.
              </p>
              <p>
                • 투자 전 충분한 정보 수집과 신중한 검토가 필요하며, 본인의 투자 성향과 위험 감수 능력을 고려하여 투자하시기 바랍니다.
              </p>
              <p>
                • 본 서비스에서 제공하는 정보는 투자 권유나 조언이 아니며, 투자 결정에 대한 모든 책임은 투자자 본인에게 있습니다.
              </p>
              <p>
                • 과거 수익률이 미래 수익률을 보장하지 않으며, 원금 손실의 가능성이 있습니다.
              </p>
            </div>
          </div>
        </div>

        {/* 하단 카피라이트 */}
        <div className="border-t border-border pt-6 md:pt-8 flex flex-col md:flex-row justify-between items-center">
          <div className="text-textSecondary text-sm mb-4 md:mb-0">
            © 2024 Coindex. All rights reserved.
          </div>
          <div className="flex space-x-4 md:space-x-6">
            <Link to="/terms" className="text-textSecondary text-sm hover:text-primary transition-colors">
              이용약관
            </Link>
            <Link to="/privacy" className="text-textSecondary text-sm hover:text-primary transition-colors">
              개인정보처리방침
            </Link>
            <Link to="/support" className="text-textSecondary text-sm hover:text-primary transition-colors">
              고객센터
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;