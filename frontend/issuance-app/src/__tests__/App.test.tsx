import { vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import App from '../App';

vi.mock('../components/IssuanceForm', () => ({
  default: ({ onCredentialIssued, onError, onLoading }: any) => {
    onLoading(false);
    return (
      <div>
        <button onClick={() => onCredentialIssued({ id: '1', holderName: 'Jane', credentialType: 'Degree', issuerName: 'Uni', issueDate: '2024-01-01', workerId: 'worker-1', timestamp: new Date().toISOString() })}>
          Mock Issue
        </button>
        <button onClick={() => onError('error!')}>Mock Error</button>
        <form aria-label="mock-form" role="form"></form>
      </div>
    );
  }
}));

describe('App', () => {
  it('renders title and status sections', () => {
    render(<App />);

    expect(screen.getByText(/Kube Credential - Issuance Portal/i)).toBeInTheDocument();
    expect(screen.getByText(/Issue new credentials securely/i)).toBeInTheDocument();
  });
});
