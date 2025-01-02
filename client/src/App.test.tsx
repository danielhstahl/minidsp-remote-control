import React from 'react';
import { render, screen } from '@testing-library/react';
import App from './App';

test('renders MiniDSP Remote', () => {
  render(<App />);
  const linkElement = screen.getByText(/MiniDSP Remote/i);
  expect(linkElement).toBeInTheDocument();
});

