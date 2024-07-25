import React from 'react';
import UploadComponent from './components/UploadComponent';
import BalanceComponent from './components/BalanceComponent';
import './App.css';

const App = () => {
  return (
    <div className="app-container">
      <header className="app-header">
        <div className="logo">
          <img src="account-statement\public\OIP.png" alt="Logo" />
        </div>
        <nav>
          <ul>
            <li>Accounts and Cards</li>
            <li>Loans and Mortgages</li>
            <li>Consulting</li>
            <li>Trading</li>
          </ul>
        </nav>
        <button className="login-button">Login</button>
      </header>
      <main>
        <section className="upload-section">
          <h2>Import your transaction file with a few clicks</h2>
          <p>Upload is made easy for you.</p>
          <UploadComponent />
        </section>
        <section className="balance-section">
          <BalanceComponent />
        </section>
      </main>
    </div>
  );
};

export default App;
