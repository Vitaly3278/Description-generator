import React from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Check, ArrowRight, Home, Moon, Sun } from 'lucide-react';

function PaymentSuccessPage() {
  const [searchParams] = useSearchParams();
  const amount = searchParams.get('amount');
  const [darkMode, setDarkMode] = React.useState(false);

  React.useEffect(() => {
    document.body.classList.toggle('dark-mode', darkMode);
  }, [darkMode]);

  return (
    <div>
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

      <div className="payment-success-page">
        <div className="success-circle">
          <Check size={48} />
        </div>
        <h2>Оплата прошла успешно!</h2>
        <p className="success-amount">
          {amount ? `+${amount} генераций` : 'Генерации зачислены на ваш баланс'}
        </p>
        <Link to="/" className="btn-primary">
          К генератору <ArrowRight size={16} />
        </Link>
      </div>
    </div>
  );
}

export default PaymentSuccessPage;
