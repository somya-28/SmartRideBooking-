import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';  // Your main component
import reportWebVitals from './reportWebVitals';

ReactDOM.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
  document.getElementById('root')  // This links to the <div id="root"> in index.html
);

reportWebVitals();
