import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Sparkles, Zap, Check, Home, Moon, Sun, Copy } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

const API_URL = import.meta?.env?.VITE_API_URL || '/api';

const PACKAGES = [
  { amount: 5, label: '5 генераций', price: 50, popular: false },
  { amount: 10, label: '10 генераций', price: 100, popular: false },
  { amount: 50, label: '50 генераций', price: 500, popular: true },
  { amount: 100, label: '100 генераций', price: 1000, popular: false },
];

function PricingPage() {
  const [selected, setSelected] = useState(2);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(false);
  const [ymUrl, setYmUrl] = useState('');
  const [payError, setPayError] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const navigate = useNavigate();

  // Redirect to login if not authenticated
  React.useEffect(() => {
    const token = localStorage.getItem('auth-token');
    if (!token) navigate('/login');
  }, [navigate]);

  if (!localStorage.getItem('auth-token')) {
    return null;
  }

  const handlePayment = async () => {
    const token = localStorage.getItem('auth-token');
    if (!token) { navigate('/login'); return; }

    setLoading(true);
    setPayError('');
    setYmUrl('');
    try {
      const res = await fetch(`${API_URL}/payment/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ amount: PACKAGES[selected].price })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Ошибка создания платежа');
      setYmUrl(data.ym_url);
      setChecking(true);
      // Открываем оплату в новом окне — на случай если QR не работает
      window.open(data.ym_url, 'yoomoney_payment', 'width=500,height=700,scrollbars=yes');
    } catch (err) {
      setPayError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Polling баланса после оплаты
  React.useEffect(() => {
    if (!checking || !ymUrl) return;

    const interval = setInterval(async () => {
      const token = localStorage.getItem('auth-token');
      try {
        const res = await fetch(`${API_URL}/auth/me`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          // Если баланс увеличился (по сравнению с изначальным) — оплата прошла
          const stored = JSON.parse(localStorage.getItem('auth-user') || '{}');
          if (data.balance > (stored.balance || 0)) {
            localStorage.setItem('auth-user', JSON.stringify(data));
            setChecking(false);
            clearInterval(interval);
            navigate('/payment/success');
          }
        }
      } catch (e) { /* ignore */ }
    }, 3000); // проверяем каждые 3 секунды

    return () => clearInterval(interval);
  }, [checking, ymUrl, navigate]);

  React.useEffect(() => {
    document.body.classList.toggle('dark-mode', darkMode);
  }, [darkMode]);

  return (
    <div className="pricing-page">
      {/* Top Bar */}
      <div className="top-bar">
        <div className="top-bar-content">
          <div className="top-bar-left">
            <Link to="/" className="nav-link" title="На главную">
              <Home size={18} />
            </Link>
          </div>
          <div className="top-bar-right">
            <button className="btn-icon" onClick={() => setDarkMode(!darkMode)} title={darkMode ? 'Светлая тема' : 'Тёмная тема'}>
              {darkMode ? <Sun size={18} /> : <Moon size={18} />}
            </button>
          </div>
        </div>
      </div>

      <div className="pricing-header">
        <Sparkles size={40} />
        <h2>Пополнение баланса</h2>
        <p>1 генерация = 10 ₽</p>
      </div>

      <div className="pricing-grid">
        {PACKAGES.map((pkg, i) => (
          <div
            key={pkg.amount}
            className={`pricing-card ${selected === i ? 'active' : ''} ${pkg.popular ? 'popular' : ''}`}
            onClick={() => setSelected(i)}
          >
            {pkg.popular && <div className="popular-badge">Популярный</div>}
            <div className="pricing-amount">{pkg.amount}</div>
            <div className="pricing-label">{pkg.label}</div>
            <div className="pricing-price">{pkg.price} ₽</div>
            {selected === i && <Check size={20} className="pricing-check" />}
          </div>
        ))}
      </div>

      <button className="btn-pay" onClick={handlePayment} disabled={loading || checking}>
        {loading ? 'Создание платежа...' : checking ? 'Ожидание оплаты...' : `Оплатить ${PACKAGES[selected].price} ₽`}
      </button>

      {checking && ymUrl && (
        <div className="qr-payment-section">
          <div className="qr-payment-card">
            <h3>📱 Оплата через СБП</h3>
            <p className="qr-instruction">Отсканируйте QR-код в приложении вашего банка</p>
            <div className="qr-code-wrapper">
              <QRCodeSVG value={ymUrl} size={200} level="M" />
            </div>
            <div className="qr-payment-info">
              <span className="qr-amount">Сумма: {PACKAGES[selected].price}₽</span>
              <span className="qr-method">Система быстрых платежей</span>
            </div>
            <button className="btn-copy-link" onClick={() => {
              navigator.clipboard.writeText(ymUrl);
              setCopiedLink(true);
              setTimeout(() => setCopiedLink(false), 2000);
            }}>
              {copiedLink ? <><Check size={14} /> Скопировано</> : <><Copy size={14} /> Скопировать ссылку</>}
            </button>
          </div>
          <p className="pay-hint">
            ⏳ Ожидание подтверждения оплаты... Проверка баланса каждые 3 секунды.
          </p>
        </div>
      )}

      {payError && (
        <div className="error-message">⚠️ {payError}</div>
      )}

      <div className="pricing-features">
        <div className="feature"><Zap size={16} /> Мгновенное зачисление</div>
        <div className="feature"><Check size={16} /> Любой стиль описания</div>
        <div className="feature"><Sparkles size={16} /> История генераций</div>
      </div>
    </div>
  );
}

export default PricingPage;
