import React from 'react';
import './App.css';
import { Header } from './Header';
import { InfoKeyBinding } from './InfoKeyBinding';
import { LocalStorageAccess } from './localstorage';
import { Suggestion } from './suggestion';

function App(): JSX.Element {
  const [lang, setLang] = React.useState<string | null>(LocalStorageAccess.LangSelection || 'bn');
  const onLangChange = React.useCallback((ev: React.ChangeEvent<HTMLInputElement>): void => {
    const newLang = ev.target.id === 'lang_en' ? 'en' : 'bn';
    LocalStorageAccess.LangSelection = newLang;
    setLang(newLang);
  }, []);

  React.useEffect(() => {
    const onKeyUp = (ev: KeyboardEvent): void => {
      if (ev.key === '.' && ev.ctrlKey) {
        const currentLang = LocalStorageAccess.LangSelection;
        const newLang = currentLang === 'en' ? 'bn' : 'en';
        LocalStorageAccess.LangSelection = newLang;
        setLang(newLang);
      }
    }
    window.addEventListener("keyup", onKeyUp);
    return (): void => {
      window.removeEventListener('keyup', onKeyUp);
    };
  }, [])

  return (
    <div className="writer">
      <Header />
      <form className="lang-form">
        <input type="radio" id="lang_en" name="lang" value="en" onChange={onLangChange} checked={lang === 'en'} />
        <label htmlFor="lang_en">English</label>
        <input type="radio" id="lang_bn" name="lang" value="bn" onChange={onLangChange} checked={lang === 'bn'} />
        <label htmlFor="lang_bn">বাংলা</label>
      </form>
      <InfoKeyBinding />
      <Suggestion />
      <textarea className="text-area" wrap="hard" />
    </div>
  );
}

export default App;
