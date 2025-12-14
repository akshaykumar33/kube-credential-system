import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import VerificationForm from '../components/VerificationForm';
import { apiService } from '../services/api';

jest.mock('../services/api');
const mockApi = apiService as jest.Mocked<typeof apiService>;

describe('VerificationForm', () => {
  const defaultProps = {
    onVerificationResult: jest.fn(),
    onError: jest.fn(),
    onLoading: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('requires credential id', async () => {
    render(<VerificationForm {...defaultProps} />);

    fireEvent.submit(screen.getByRole('form'));

    expect(defaultProps.onError).toHaveBeenCalledWith('Please enter a credential ID');
    expect(defaultProps.onLoading).not.toHaveBeenCalled();
  });

  it('submits and handles success', async () => {
    mockApi.verifyCredential.mockResolvedValue({ success: true } as any);

    render(<VerificationForm {...defaultProps} />);

    fireEvent.change(screen.getByLabelText(/Credential ID/i), { target: { value: 'cred-1' } });
    fireEvent.submit(screen.getByRole('form'));

    await waitFor(() => expect(defaultProps.onVerificationResult).toHaveBeenCalled());
    expect(defaultProps.onLoading).toHaveBeenCalledWith(true);
    expect(defaultProps.onLoading).toHaveBeenCalledWith(false);
  });

  it('handles API error', async () => {
    mockApi.verifyCredential.mockRejectedValue(new Error('boom'));

    render(<VerificationForm {...defaultProps} />);
    fireEvent.change(screen.getByLabelText(/Credential ID/i), { target: { value: 'cred-1' } });
    fireEvent.submit(screen.getByRole('form'));

    await waitFor(() => expect(defaultProps.onError).toHaveBeenCalledWith('boom'));
  });
});
