const KeyLangSelection = 'avrowriter/lang';
const KeyPrevInput = 'avrowriter/prevInput';

export const LocalStorageAccess = {
  get LangSelection(): string | null {
    return window.localStorage.getItem(KeyLangSelection);
  },
  set LangSelection(selection: string | null) {
    (selection === null ? window.localStorage.removeItem(KeyLangSelection)
      : window.localStorage.setItem(KeyLangSelection, selection));
  },
  get PrevInput(): string | null {
    return window.localStorage.getItem(KeyPrevInput);
  },
  set PrevInput(input: string | null) {
    (input === null ? window.localStorage.removeItem(KeyPrevInput)
      : window.localStorage.setItem(KeyPrevInput, input));
  },
}