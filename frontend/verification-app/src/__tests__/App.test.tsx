import { render, screen } from '@testing-library/react';
import App from '../App';

vi.mock('../components/VerificationForm', () => ({
  default: ({ onVerificationResult, onError, onLoading }: any) => {
    onLoading(false);
    return (
      <div>
        <button onClick={() => onVerificationResult({ success: true, isValid: true, workerId: 'worker-1', timestamp: new Date().toISOString(), message: 'ok' })}>
          Mock Verify
        </button>
        <button onClick={() => onError('error!')}>Mock Error</button>
        <form role="form" aria-label="mock-form" />
      </div>
    );
  }
}));

describe('Verification App', () => {
  it('renders header and instructions', () => {
    render(<App />);

    expect(screen.getByText(/Verification Portal/i)).toBeInTheDocument();
    expect(screen.getByText(/Verify credentials instantly/i)).toBeInTheDocument();
  });
});
