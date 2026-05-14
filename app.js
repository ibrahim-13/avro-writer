'use strict';

// Base URL for all assets.
// For local development served at root, change this to ''.
var BASE_URL = '/avro-writer';
var COMLINK_URL = BASE_URL + '/avro.worker.202301052101.js';
var SERVICEWORKER_URL = BASE_URL + '/service-worker.js';

var KEY_LANG = 'avrowriter/lang';
var KEY_PREV_INPUT = 'avrowriter/prevInput';

var LocalStorageAccess = {
  get LangSelection() {
    return window.localStorage.getItem(KEY_LANG);
  },
  set LangSelection(value) {
    if (value === null) {
      window.localStorage.removeItem(KEY_LANG);
    } else {
      window.localStorage.setItem(KEY_LANG, value);
    }
  },
  get PrevInput() {
    return window.localStorage.getItem(KEY_PREV_INPUT);
  },
  set PrevInput(value) {
    if (value === null) {
      window.localStorage.removeItem(KEY_PREV_INPUT);
    } else {
      window.localStorage.setItem(KEY_PREV_INPUT, value);
    }
  },
};

var lang = LocalStorageAccess.LangSelection || 'bn';

// suggestions: null | { words: string[], prevSelection: number }
var suggestions = null;

var avroWorker = Comlink.wrap(
  new Worker(COMLINK_URL)
);

// Creates a Proxy over a named set of element references.
// schema maps property names to { get(elements), set(elements, value) } handlers.
// The same factory can be reused for any functional unit of DOM elements.
function makeProxy(elements, schema) {
  return new Proxy(elements, {
    get(target, prop) {
      if (prop in schema && schema[prop].get) {
        return schema[prop].get(target);
      }
    },
    set(target, prop, value) {
      if (prop in schema && schema[prop].set) {
        schema[prop].set(target, value);
      }
      return true;
    },
  });
}

// Proxy instances — initialised in DOMContentLoaded once elements exist.
var header;
var langForm;
var textArea;
var suggestionList;
var installBtn;

// Saved beforeinstallprompt event. Cleared after prompt() is called (one-use per event).
var deferredInstallPrompt = null;

function renderSuggestions() {
  suggestionList.suggestions = suggestions;
}

function onSuggestSelect(word) {
  var value = textArea.value;
  var selectionStart = textArea.selectionStart;
  var caretPosition;

  if (selectionStart === value.length) {
    var parts = value.split(' ');
    parts[parts.length - 1] = word;
    value = parts.join(' ') + ' ';
    caretPosition = value.length;
  } else {
    var partsBeforeCaret = value.slice(0, selectionStart).split(' ');
    partsBeforeCaret[partsBeforeCaret.length - 1] = word;
    var updatedValue = partsBeforeCaret.join(' ');
    caretPosition = updatedValue.length;
    value = updatedValue + value.slice(selectionStart);
  }

  textArea.value = value;
  textArea.caret = caretPosition;
  LocalStorageAccess.PrevInput = value;
}

function setLang(newLang) {
  lang = newLang;
  LocalStorageAccess.LangSelection = newLang;
  langForm.lang = newLang;
}

function onTextAreaKeyDown(ev) {
  var key = ev.key.toLowerCase();

  if (key === 'arrowright') {
    if (!suggestions) return;
    ev.preventDefault();
    ev.stopPropagation();
    var next = suggestions.prevSelection + 1;
    if (next === suggestions.words.length) next = 0;
    suggestions = { words: suggestions.words, prevSelection: next };
    renderSuggestions();

  } else if (key === 'arrowleft') {
    if (!suggestions) return;
    ev.preventDefault();
    ev.stopPropagation();
    var prev = suggestions.prevSelection - 1;
    if (prev === -1) prev = suggestions.words.length - 1;
    suggestions = { words: suggestions.words, prevSelection: prev };
    renderSuggestions();

  } else if (key === 'escape') {
    suggestions = null;
    renderSuggestions();
  }
}

async function onTextAreaInput() {
  var value = textArea.value;
  var selectionStart = textArea.selectionStart;

  LocalStorageAccess.PrevInput = value;

  if (lang !== 'bn') return;

  if (!value) {
    suggestions = null;
    renderSuggestions();
    return;
  }

  if (value.slice(0, selectionStart).endsWith('\n') && suggestions) {
    onSuggestSelect(suggestions.words[suggestions.prevSelection]);
    suggestions = null;
    renderSuggestions();
    return;
  }

  var parts = value.slice(0, selectionStart).split(' ');
  var lastWord = parts[parts.length - 1];

  suggestions = await avroWorker.getSuggestion(lastWord);
  renderSuggestions();
}

function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) return;

  window.addEventListener('load', function () {
    navigator.serviceWorker
      .register(SERVICEWORKER_URL)
      .then(function (registration) {
        registration.onupdatefound = function () {
          var installing = registration.installing;
          if (!installing) return;
          installing.onstatechange = function () {
            if (installing.state === 'installed') {
              if (navigator.serviceWorker.controller) {
                console.log('New content available; will be used when tabs are closed.');
              } else {
                console.log('Content cached for offline use.');
              }
            }
          };
        };
      })
      .catch(function (err) {
        console.error('Service worker registration failed:', err);
      });
  });
}

document.addEventListener('DOMContentLoaded', function () {
  var elHeaderFull  = document.getElementById('header-full');
  var elHeaderBtn   = document.getElementById('header-btn');
  var elLangForm    = document.getElementById('lang-form');
  var elSuggestion  = document.getElementById('suggestion-list');
  var elTextArea    = document.getElementById('text-area');
  var elHeaderHide  = document.getElementById('header-hide-btn');
  var elInstallBtn  = document.getElementById('install-btn');

  header = makeProxy(
    { full: elHeaderFull, btn: elHeaderBtn },
    {
      visible: {
        get(els) { return els.full.style.display !== 'none'; },
        set(els, show) {
          els.full.style.display = show ? '' : 'none';
          els.btn.style.display  = show ? 'none' : '';
        },
      },
    }
  );

  langForm = makeProxy(
    { form: elLangForm },
    {
      lang: {
        get(els) {
          var checked = els.form.querySelector('input[type="radio"]:checked');
          return checked ? checked.value : null;
        },
        set(els, value) {
          els.form.querySelectorAll('input[type="radio"]').forEach(function (r) {
            r.checked = r.value === value;
          });
        },
      },
    }
  );

  textArea = makeProxy(
    { el: elTextArea },
    {
      value: {
        get(els)        { return els.el.value; },
        set(els, v)     { els.el.value = v; },
      },
      selectionStart: {
        get(els)        { return els.el.selectionStart; },
      },
      // Sets focus and collapses the selection to a single caret position.
      caret: {
        set(els, pos) {
          els.el.focus();
          els.el.selectionStart = pos;
          els.el.selectionEnd   = pos;
        },
      },
    }
  );

  suggestionList = makeProxy(
    { list: elSuggestion },
    {
      suggestions: {
        set(els, data) {
          els.list.innerHTML = '';

          if (!data || data.words.length === 0) {
            var placeholder = document.createElement('div');
            placeholder.className = 'suggest';
            placeholder.textContent = 'No suggestion';
            els.list.appendChild(placeholder);
            return;
          }

          data.words.forEach(function (word, i) {
            var chip = document.createElement('div');
            chip.className = 'suggest' + (data.prevSelection === i ? ' selected' : '');
            chip.style.cursor = 'pointer';
            chip.textContent = word;
            chip.addEventListener('click', function () { onSuggestSelect(word); });
            els.list.appendChild(chip);
          });
        },
      },
    }
  );

  installBtn = makeProxy(
    { btn: elInstallBtn },
    {
      visible: {
        get(els)       { return els.btn.style.display !== 'none'; },
        set(els, show) { els.btn.style.display = show ? '' : 'none'; },
      },
    }
  );

  var savedInput = LocalStorageAccess.PrevInput;
  if (savedInput) {
    textArea.value = savedInput;
  }

  setLang(lang);

  elHeaderHide.addEventListener('click', function () { header.visible = false; });
  elHeaderBtn.addEventListener('click',  function () { header.visible = true; });

  elLangForm.addEventListener('change', function (ev) {
    if (ev.target.name === 'lang') {
      setLang(ev.target.value);
      suggestions = null;
      renderSuggestions();
    }
  });

  elTextArea.addEventListener('keydown', onTextAreaKeyDown);
  elTextArea.addEventListener('input',   onTextAreaInput);

  window.addEventListener('keyup', function (ev) {
    if (ev.key === '.' && ev.ctrlKey) {
      setLang(LocalStorageAccess.LangSelection === 'en' ? 'bn' : 'en');
    }
  });

  // beforeinstallprompt fires when the browser decides the app is installable.
  // Prevent the default mini-infobar and surface our own button instead.
  window.addEventListener('beforeinstallprompt', function (ev) {
    ev.preventDefault();
    deferredInstallPrompt = ev;
    installBtn.visible = true;
  });

  elInstallBtn.addEventListener('click', function () {
    if (!deferredInstallPrompt) return;
    deferredInstallPrompt.prompt();
    deferredInstallPrompt.userChoice.then(function () {
      deferredInstallPrompt = null;
      installBtn.visible = false;
    });
  });

  // appinstalled fires after the app is successfully installed (by any means).
  window.addEventListener('appinstalled', function () {
    deferredInstallPrompt = null;
    installBtn.visible = false;
  });

  registerServiceWorker();
});
