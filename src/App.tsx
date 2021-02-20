import React from 'react';
import './App.css';
import { Header } from './Header';
import { InfoKeyBinding } from './InfoKeyBinding';
import { LocalStorageAccess } from './localstorage';
import { Suggestion } from './suggestion';
import AvroWorker, { TAvroSuggestion } from './avroLib';

function App(): JSX.Element {
  const ref = React.useRef<HTMLTextAreaElement>(null);
  const [lang, setLang] = React.useState<string | null>(LocalStorageAccess.LangSelection || 'bn');
  const [suggestions, setSuggestions] = React.useState<TAvroSuggestion>();
  const onLangChange = React.useCallback((ev: React.ChangeEvent<HTMLInputElement>): void => {
    const newLang = ev.target.id === 'lang_en' ? 'en' : 'bn';
    LocalStorageAccess.LangSelection = newLang;
    setLang(newLang);
    setSuggestions(undefined);
  }, []);

  const textChange = React.useCallback(
    async ({ target: { value: inputText } }: React.ChangeEvent<HTMLTextAreaElement>): Promise<void> => {
      if (lang !== 'bn') return;
      const parts = inputText.split(' ');
      const last = parts[parts.length - 1];
      setSuggestions(await AvroWorker.getSuggestion(last));
    },
    [lang]
  );

  const onSuggestSelect = React.useCallback((word: string) => {
    if (ref.current) {
      const parts = ref.current.value.split(' ');
      parts[parts.length - 1] = word;
      ref.current.value = parts.join(' ') + ' ';
    }
  }, []);

  React.useEffect(() => {
    const onKeyUp = (ev: KeyboardEvent): void => {
      if (ev.key === '.' && ev.ctrlKey) {
        const currentLang = LocalStorageAccess.LangSelection;
        const newLang = currentLang === 'en' ? 'bn' : 'en';
        LocalStorageAccess.LangSelection = newLang;
        setLang(newLang);
      } else {
        const evKey = ev.key.toLowerCase();
        if (evKey === 'arrowright') {
          //
        } else if (evKey === 'arrowleft') {
          //
        } else if (evKey === 'arrowleft') {
          //
        }
      }
    }
    window.addEventListener("keyup", onKeyUp);
    return (): void => {
      window.removeEventListener('keyup', onKeyUp);
    };
  }, []);

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
      <Suggestion suggestions={suggestions} onSelect={onSuggestSelect} />
      <textarea
        ref={ref}
        className="text-area"
        wrap="hard"
        defaultValue=""
        onChange={textChange}
      />
    </div>
  );
}

export default App;
