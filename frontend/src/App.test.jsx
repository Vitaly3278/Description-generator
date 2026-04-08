import { render, screen } from '@testing-library/react';
import App from './App';

test('renders main heading', () => {
  render(<App />);
  const heading = screen.getByText(/Генератор описания/i);
  expect(heading).toBeInTheDocument();
});

test('renders upload section', () => {
  render(<App />);
  const uploadText = screen.getByText(/Загрузите фото товара/i);
  expect(uploadText).toBeInTheDocument();
});

test('renders style selector with 3 options', () => {
  render(<App />);
  const shortBtn = screen.getByText('Краткое');
  const standardBtn = screen.getByText('Стандартное');
  const seoBtn = screen.getByText('SEO');
  expect(shortBtn).toBeInTheDocument();
  expect(standardBtn).toBeInTheDocument();
  expect(seoBtn).toBeInTheDocument();
});
