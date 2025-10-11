import { useState } from 'react';
import VerificationForm from './components/VerificationForm';
import { VerificationResponse } from './types/credential';
import './styles/App.css';

function App() {
  const [verificationResult, setVerificationResult] = useState<VerificationResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleVerificationResult = (result: VerificationResponse) => {
    setVerificationResult(result);
    setError(null);
  };

  const handleError = (errorMessage: string) => {
    setError(errorMessage);
    setVerificationResult(null);
  };

  const handleLoading = (loading: boolean) => {
    setIsLoading(loading);
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>🔍 Kube Credential - Verification Portal</h1>
        <p>Verify credentials instantly with Vite ⚡</p>
      </header>

      <main className="App-main">
        <div className="container">
          <VerificationForm
            onVerificationResult={handleVerificationResult}
            onError={handleError}
            onLoading={handleLoading}
          />

          {isLoading && (
            <div className="loading">
              <div className="spinner"></div>
              <p>Verifying credential...</p>
            </div>
          )}

          {error && (
            <div className="error-card">
              <h3>❌ Error</h3>
              <p>{error}</p>
            </div>
          )}

          {verificationResult && (
            <div className={verificationResult.isValid ? 'success-card' : 'invalid-card'}>
              <h3>{verificationResult.isValid ? '✅ Valid Credential' : '❌ Invalid Credential'}</h3>
              <p>{verificationResult.message}</p>

              {verificationResult.credential && verificationResult.isValid && (
                <div className="credential-details">
                  <div className="detail-item">
                    <strong>ID:</strong> <span className="credential-id">{verificationResult.credential.id}</span>
                  </div>
                  <div className="detail-item">
                    <strong>Holder:</strong> {verificationResult.credential.holderName}
                  </div>
                  <div className="detail-item">
                    <strong>Type:</strong> {verificationResult.credential.credentialType}
                  </div>
                  <div className="detail-item">
                    <strong>Issuer:</strong> {verificationResult.credential.issuerName}
                  </div>
                  <div className="detail-item">
                    <strong>Issue Date:</strong> {verificationResult.credential.issueDate}
                  </div>
                  <div className="detail-item">
                    <strong>Issued By:</strong> {verificationResult.credential.workerId}
                  </div>
                </div>
              )}

              <div className="verification-meta">
                <p><strong>Verified by:</strong> {verificationResult.workerId}</p>
                <p><strong>Verification time:</strong> {new Date(verificationResult.timestamp).toLocaleString()}</p>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default App;