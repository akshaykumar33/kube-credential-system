import { useState } from 'react';
import { CredentialRequest, Credential } from '../types/credential';
import { apiService } from '../services/api';

interface IssuanceFormProps {
  onCredentialIssued: (credential: Credential) => void;
  onError: (error: string) => void;
  onLoading: (loading: boolean) => void;
}

const IssuanceForm: React.FC<IssuanceFormProps> = ({
  onCredentialIssued,
  onError,
  onLoading,
}) => {
  const [formData, setFormData] = useState<CredentialRequest>({
    holderName: '',
    credentialType: '',
    issuerName: '',
    expiryDate: '',
    metadata: {}
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    onLoading(true);

    try {
      const response = await apiService.issueCredential(formData);

      if (response.success && response.credential) {
        onCredentialIssued(response.credential);
        // Reset form
        setFormData({
          holderName: '',
          credentialType: '',
          issuerName: '',
          expiryDate: '',
          metadata: {}
        });
      } else {
        onError(response.message);
      }
    } catch (error: any) {
      onError(error.message);
    } finally {
      onLoading(false);
    }
  };

  return (
    <div className="form-container">
      <h2>Issue New Credential</h2>
      <form onSubmit={handleSubmit} className="credential-form">
        <div className="form-group">
          <label htmlFor="holderName">Holder Name *</label>
          <input
            type="text"
            id="holderName"
            name="holderName"
            value={formData.holderName}
            onChange={handleInputChange}
            required
            placeholder="Enter holder's full name"
          />
        </div>

        <div className="form-group">
          <label htmlFor="credentialType">Credential Type *</label>
          <select
            id="credentialType"
            name="credentialType"
            value={formData.credentialType}
            onChange={handleInputChange}
            required
          >
            <option value="">Select credential type</option>
            <option value="University Degree">University Degree</option>
            <option value="Professional Certificate">Professional Certificate</option>
            <option value="Training Certificate">Training Certificate</option>
            <option value="License">License</option>
            <option value="Achievement Award">Achievement Award</option>
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="issuerName">Issuer Name *</label>
          <input
            type="text"
            id="issuerName"
            name="issuerName"
            value={formData.issuerName}
            onChange={handleInputChange}
            required
            placeholder="Enter issuing organization name"
          />
        </div>

        <div className="form-group">
          <label htmlFor="expiryDate">Expiry Date (Optional)</label>
          <input
            type="date"
            id="expiryDate"
            name="expiryDate"
            value={formData.expiryDate}
            onChange={handleInputChange}
            min={new Date().toISOString().split('T')[0]}
          />
        </div>

        <button type="submit" className="submit-btn">
          ⚡ Issue Credential
        </button>
      </form>
    </div>
  );
};

export default IssuanceForm;