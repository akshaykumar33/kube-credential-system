import { useState } from 'react';
import { VerificationRequest, VerificationResponse } from '../types/credential';
import { apiService } from '../services/api';

interface VerificationFormProps {
  onVerificationResult: (result: VerificationResponse) => void;
  onError: (error: string) => void;
  onLoading: (loading: boolean) => void;
}

const VerificationForm: React.FC<VerificationFormProps> = ({
  onVerificationResult,
  onError,
  onLoading,
}) => {
  const [credentialId, setCredentialId] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!credentialId.trim()) {
      onError('Please enter a credential ID');
      return;
    }

    onLoading(true);

    try {
      const verificationRequest: VerificationRequest = {
        id: credentialId.trim()
      };

      const response = await apiService.verifyCredential(verificationRequest);
      onVerificationResult(response);

    } catch (error: any) {
      onError(error.message);
    } finally {
      onLoading(false);
    }
  };

  return (
    <div className="form-container">
      <h2>Verify Credential</h2>
      <form onSubmit={handleSubmit} className="verification-form">
        <div className="form-group">
          <label htmlFor="credentialId">Credential ID *</label>
          <input
            type="text"
            id="credentialId"
            value={credentialId}
            onChange={(e) => setCredentialId(e.target.value)}
            required
            placeholder="Enter the credential ID to verify"
            className="credential-input"
          />
        </div>

        <button type="submit" className="submit-btn">
          ⚡ Verify Credential
        </button>
      </form>

      <div className="info-section">
        <h3>How to Verify</h3>
        <ol>
          <li>Enter the credential ID in the field above</li>
          <li>Click "Verify Credential" button</li>
          <li>View the verification result and credential details</li>
        </ol>
      </div>
    </div>
  );
};

export default VerificationForm;