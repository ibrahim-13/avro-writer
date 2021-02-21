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
      }
    }
    window.addEventListener("keyup", onKeyUp);
    return (): void => {
      window.removeEventListener('keyup', onKeyUp);
    };
  }, []);

  const arrowKeyListener = React.useCallback((ev: React.KeyboardEvent<HTMLTextAreaElement>) => {
    ev.persist();
    const evKey = ev.key.toLowerCase();
    if (evKey === 'arrowright') {
      setSuggestions(s => {
        if (s) {
          ev.preventDefault();
          ev.stopPropagation();
          let currentSelection = s.prevSelection + 1;
          currentSelection = currentSelection === s.words.length ? 0 : currentSelection;
          return { ...s, prevSelection: currentSelection };
        }
        return s;
      });
    } else if (evKey === 'arrowleft') {
      setSuggestions(s => {
        if (s) {
          ev.preventDefault();
          ev.stopPropagation();
          let currentSelection = s.prevSelection - 1;
          currentSelection = currentSelection === -1 ? (s.words.length - 1) : currentSelection;
          return { ...s, prevSelection: currentSelection };
        }
        return s;
      });
    }
  }, []);

  async function textChange({ target: { value: inputText } }: React.ChangeEvent<HTMLTextAreaElement>): Promise<void> {
    if (lang !== 'bn') return;
    if (!inputText) {
      setSuggestions(undefined);
      return;
    }
    if (inputText.endsWith('\n') && suggestions) {
      onSuggestSelect(suggestions.words[suggestions.prevSelection]);
      setSuggestions(undefined);
      return;
    }
    const parts = inputText.split(' ');
    const last = parts[parts.length - 1];
    setSuggestions(await AvroWorker.getSuggestion(last));
  }

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
        onKeyDown={arrowKeyListener}
        onChange={textChange}
      />
    </div>
  );
}

export default App;
