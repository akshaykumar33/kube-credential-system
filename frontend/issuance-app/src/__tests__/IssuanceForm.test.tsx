import { vi, describe, it, expect, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import IssuanceForm from '../components/IssuanceForm';
import { apiService } from '../services/api';

vi.mock('../services/api');

const mockApi = apiService as any;

describe('IssuanceForm', () => {
  const defaultProps = {
    onCredentialIssued: vi.fn(),
    onError: vi.fn(),
    onLoading: vi.fn(),
  };

  const fillForm = async (user: any) => {
    await user.type(screen.getByLabelText(/holder name/i), 'Test User');
    await user.selectOptions(
      screen.getByRole('combobox', { name: /credential type/i }),
      'University Degree'
    );
    await user.type(screen.getByLabelText(/issuer name/i), 'Test Issuer');
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('handles form submission', async () => {
  const user = userEvent.setup();
  const mockResponse = { 
    success: true, 
    credential: { 
      id: '123',
      holderName: 'Test User',
      credentialType: 'University Degree',
      issuerName: 'Test Issuer'
    } 
  };

  mockApi.issueCredential.mockResolvedValue(mockResponse);

  render(<IssuanceForm {...defaultProps} />);

  // Fill out the form
  await fillForm(user);

  // Submit the form
  const submitButton = screen.getByRole('button', { name: /issue credential/i });
  await user.click(submitButton);

  // Check if loading was called
  expect(defaultProps.onLoading).toHaveBeenCalledWith(true);

  // Wait for API call and check results
  await waitFor(() => {
    expect(mockApi.issueCredential).toHaveBeenCalledWith({
      holderName: 'Test User',
      credentialType: 'University Degree',
      issuerName: 'Test Issuer',
      expiryDate: '',
      metadata: {}
    });
    expect(defaultProps.onCredentialIssued).toHaveBeenCalledWith(mockResponse.credential);
    expect(defaultProps.onLoading).toHaveBeenCalledWith(false);
  });
});

  it('handles API errors', async () => {
    const user = userEvent.setup();
    const errorMessage = 'API Error';
    mockApi.issueCredential.mockRejectedValue(new Error(errorMessage));

    render(<IssuanceForm {...defaultProps} />);

    // Fill out the form
    await fillForm(user);

    // Submit the form
    const submitButton = screen.getByRole('button', { name: /issue credential/i });
    await user.click(submitButton);

    // Wait for error handling
    await waitFor(() => {
      expect(mockApi.issueCredential).toHaveBeenCalled();
      expect(defaultProps.onError).toHaveBeenCalled();
      expect(defaultProps.onLoading).toHaveBeenCalledWith(false);
    });
  });
});