import  { useState } from 'react';
import IssuanceForm from './components/IssuanceForm';
import { Credential } from './types/credential';
import './styles/App.css';

function App() {
  const [issuedCredential, setIssuedCredential] = useState<Credential | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCredentialIssued = (credential: Credential) => {
    setIssuedCredential(credential);
    setError(null);
  };

  const handleError = (errorMessage: string) => {
    setError(errorMessage);
    setIssuedCredential(null);
  };

  const handleLoading = (loading: boolean) => {
    setIsLoading(loading);
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>🎓 Kube Credential - Issuance Portal</h1>
        <p>Issue new credentials securely with Vite ⚡</p>
      </header>

      <main className="App-main">
        <div className="container">
          <IssuanceForm
            onCredentialIssued={handleCredentialIssued}
            onError={handleError}
            onLoading={handleLoading}
          />

          {isLoading && (
            <div className="loading">
              <div className="spinner"></div>
              <p>Issuing credential...</p>
            </div>
          )}

          {error && (
            <div className="error-card">
              <h3>❌ Error</h3>
              <p>{error}</p>
              <button onClick={() => setError(null)} className="retry-btn">
                Try Again
              </button>
            </div>
          )}

          {issuedCredential && (
            <div className="success-card">
              <h3>✅ Credential Issued Successfully!</h3>
              <div className="credential-details">
                <div className="detail-item">
                  <strong>ID:</strong> <span className="credential-id">{issuedCredential.id}</span>
                </div>
                <div className="detail-item">
                  <strong>Holder:</strong> {issuedCredential.holderName}
                </div>
                <div className="detail-item">
                  <strong>Type:</strong> {issuedCredential.credentialType}
                </div>
                <div className="detail-item">
                  <strong>Issuer:</strong> {issuedCredential.issuerName}
                </div>
                <div className="detail-item">
                  <strong>Issue Date:</strong> {issuedCredential.issueDate}
                </div>
                <div className="detail-item">
                  <strong>Worker ID:</strong> {issuedCredential.workerId}
                </div>
                <div className="detail-item">
                  <strong>Timestamp:</strong> {new Date(issuedCredential.timestamp).toLocaleString()}
                </div>
                {issuedCredential.expiryDate && (
                  <div className="detail-item">
                    <strong>Expiry:</strong> {issuedCredential.expiryDate}
                  </div>
                )}
              </div>
              <button 
                onClick={() => setIssuedCredential(null)} 
                className="new-credential-btn"
              >
                Issue Another Credential
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default App;