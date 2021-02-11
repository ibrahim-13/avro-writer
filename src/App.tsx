import React from 'react';
import './App.css';

function App(): JSX.Element {
  return (
    <div className="writer">
      <h1 className="heading">Avro Writer</h1>
      <form className="lang-form">
        <input type="radio" id="lang_en" name="lang" value="en" />
        <label htmlFor="lang_en">English</label>
        <input type="radio" id="lang_bn" name="lang" value="bn" defaultChecked={true} />
        <label htmlFor="lang_bn">বাংলা</label>
      </form>
      <textarea className="text-area" />
    </div>
  );
}

export default App;
