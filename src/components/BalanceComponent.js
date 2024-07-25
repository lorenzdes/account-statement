import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './BalanceComponent.css';

const BalanceComponent = () => {
  const [balances, setBalances] = useState([]);

  useEffect(() => {
    axios.get('http://localhost:3005/balances')
      .then(response => setBalances(response.data))
      .catch(error => console.error('Error fetching balances:', error));
  }, []);

  return (
    <div className="balance-container">
      <h2>Account Balances</h2>
      <table>
        <thead>
          <tr>
            <th>Account</th>
            <th>Currency</th>
            <th>Balance</th>
          </tr>
        </thead>
        <tbody>
          {balances.map((balance, index) => (
            <tr key={index}>
              <td>{balance._id.Account}</td>
              <td>{balance._id.Currency}</td>
              <td>{balance.Balance.toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default BalanceComponent;
