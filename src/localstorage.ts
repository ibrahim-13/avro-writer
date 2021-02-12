const KeyLangSelection = 'avrowriter/lang';

export const LocalStorageAccess = {
  get LangSelection(): string | null {
    return window.localStorage.getItem(KeyLangSelection);
  },
  set LangSelection(selection: string | null) {
    (selection === null ? window.localStorage.removeItem(KeyLangSelection)
      : window.localStorage.setItem(KeyLangSelection, selection));
  },
}