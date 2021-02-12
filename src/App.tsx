import React from 'react';
import './App.css';
import { LocalStorageAccess } from './localstorage';

function App(): JSX.Element {
  const [lang] = React.useState<string | null>(LocalStorageAccess.LangSelection);
  const onLangChange = React.useCallback((ev: React.ChangeEvent<HTMLInputElement>) => {
    LocalStorageAccess.LangSelection = (ev.target.id === 'lang_en' ? 'en' : 'bn');
  }, []);
  return (
    <div className="writer">
      <h1 className="heading">Avro Writer</h1>
      <form className="lang-form">
        <input type="radio" id="lang_en" name="lang" value="en" onChange={onLangChange} defaultChecked={lang === 'en'} />
        <label htmlFor="lang_en">English</label>
        <input type="radio" id="lang_bn" name="lang" value="bn" onChange={onLangChange} defaultChecked={lang === 'bn'} />
        <label htmlFor="lang_bn">বাংলা</label>
      </form>
      <textarea className="text-area" />
    </div>
  );
}

export default App;
