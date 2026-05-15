'use strict';

// Returns the pixel coordinates {top, left, height} of the caret inside a
// textarea, relative to the textarea's top-left corner (before scroll offset).
// Adapted from the UMD module described in Research.md.
function getCaretCoordinates(element, position) {
  var properties = [
    'direction', 'boxSizing', 'width', 'height', 'overflowX', 'overflowY',
    'borderTopWidth', 'borderRightWidth', 'borderBottomWidth', 'borderLeftWidth', 'borderStyle',
    'paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft',
    'fontStyle', 'fontVariant', 'fontWeight', 'fontStretch', 'fontSize',
    'fontSizeAdjust', 'lineHeight', 'fontFamily',
    'textAlign', 'textTransform', 'textIndent', 'textDecoration',
    'letterSpacing', 'wordSpacing', 'tabSize', 'MozTabSize',
  ];

  var div = document.createElement('div');
  document.body.appendChild(div);

  var style = div.style;
  var computed = window.getComputedStyle(element);

  style.whiteSpace = 'pre-wrap';
  style.wordWrap = 'break-word';
  style.position = 'absolute';
  style.visibility = 'hidden';

  properties.forEach(function (prop) {
    style[prop] = computed[prop];
  });

  var isFirefox = (window.mozInnerScreenX != null);
  if (isFirefox) {
    if (element.scrollHeight > parseInt(computed.height)) style.overflowY = 'scroll';
  } else {
    style.overflow = 'hidden';
  }

  div.textContent = element.value.substring(0, position);

  var span = document.createElement('span');
  span.textContent = element.value.substring(position) || '.';
  div.appendChild(span);

  var lineHeight = parseInt(computed.lineHeight);
  var coordinates = {
    top: span.offsetTop + parseInt(computed.borderTopWidth),
    left: span.offsetLeft + parseInt(computed.borderLeftWidth),
    height: isNaN(lineHeight) ? 20 : lineHeight,
  };

  document.body.removeChild(div);
  return coordinates;
}

// Base URL for all assets.
// For local development served at root, change this to ''.
var BASE_URL = '/avro-writer';
var COMLINK_URL = BASE_URL + '/lib/avro.worker.202301052101.js';
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

var avroWorker = Comlink.wrap(
  new Worker(COMLINK_URL)
);

// Component factories — each creates its own element refs, wires its own events,
// and returns a single Proxy as the only public interface.

function CreateHeader() {
  var elFull = document.getElementById('header-full');
  var elBtn  = document.getElementById('header-btn');
  var elHide = document.getElementById('header-hide-btn');

  var state = { visible: true };

  var proxy = new Proxy(state, {
    get(target, prop) {
      if (prop === 'visible') return elFull.style.display !== 'none';
      return target[prop];
    },
    set(target, prop, value) {
      if (prop === 'visible') {
        elFull.style.display = value ? '' : 'none';
        elBtn.style.display  = value ? 'none' : '';
      }
      return Reflect.set(target, prop, value);
    },
  });

  elHide.addEventListener('click', function () { proxy.visible = false; });
  elBtn.addEventListener('click',  function () { proxy.visible = true; });

  return proxy;
}

function CreateLangForm() {
  var elForm = document.getElementById('lang-form');

  var state = { lang: null, onchange: null };

  var proxy = new Proxy(state, {
    get(target, prop) {
      if (prop === 'lang') {
        var checked = elForm.querySelector('input[type="radio"]:checked');
        return checked ? checked.value : null;
      }
      return target[prop];
    },
    set(target, prop, value) {
      if (prop === 'lang') {
        elForm.querySelectorAll('input[type="radio"]').forEach(function (r) {
          r.checked = r.value === value;
        });
      }
      return Reflect.set(target, prop, value);
    },
  });

  elForm.addEventListener('change', function (ev) {
    if (ev.target.name === 'lang' && typeof state.onchange === 'function') {
      state.onchange(ev.target.value);
    }
  });

  return proxy;
}

function CreateTextArea() {
  var el = document.getElementById('text-area');

  var state = { onkeydown: null, oninput: null };

  var proxy = new Proxy(state, {
    get(target, prop) {
      if (prop === 'value')          return el.value;
      if (prop === 'selectionStart') return el.selectionStart;
      return target[prop];
    },
    set(target, prop, value) {
      if (prop === 'value') {
        el.value = value;
        return true;
      }
      if (prop === 'caret') {
        el.focus();
        el.selectionStart = value;
        el.selectionEnd   = value;
        return true;
      }
      return Reflect.set(target, prop, value);
    },
  });

  el.addEventListener('keydown', function (ev) {
    if (typeof state.onkeydown === 'function') state.onkeydown(ev);
  });
  el.addEventListener('input', function () {
    if (typeof state.oninput === 'function') state.oninput();
  });

  return proxy;
}

function CreateCaretPopover() {
  var elPopover  = document.getElementById('caret-popover');
  var elTextArea = document.getElementById('text-area');

  var state = { suggestions: null, caretPosition: 0, onselect: null };

  var proxy = new Proxy(state, {
    set(target, prop, value) {
      if (prop === 'suggestions') {
        elPopover.innerHTML = '';

        if (!value || value.words.length === 0) {
          if (elPopover.matches(':popover-open')) elPopover.hidePopover();
          return Reflect.set(target, prop, value);
        }

        var coords = getCaretCoordinates(elTextArea, target.caretPosition);
        var rect   = elTextArea.getBoundingClientRect();
        elPopover.style.top  = (rect.top  + coords.top  - elTextArea.scrollTop  + coords.height) + 'px';
        elPopover.style.left = (rect.left + coords.left - elTextArea.scrollLeft) + 'px';

        value.words.forEach(function (word, i) {
          var item = document.createElement('div');
          item.className = 'caret-suggest' + (value.prevSelection === i ? ' selected' : '');
          item.textContent = word;
          item.addEventListener('click', function () {
            if (typeof state.onselect === 'function') state.onselect(word);
          });
          elPopover.appendChild(item);
        });

        if (!elPopover.matches(':popover-open')) elPopover.showPopover();
      }
      return Reflect.set(target, prop, value);
    },
  });

  return proxy;
}

function CreateInstallBtn() {
  var el = document.getElementById('install-btn');

  var state = { visible: false, onclick: null };

  var proxy = new Proxy(state, {
    get(target, prop) {
      if (prop === 'visible') return el.style.display !== 'none';
      return target[prop];
    },
    set(target, prop, value) {
      if (prop === 'visible') {
        el.style.display = value ? '' : 'none';
      }
      return Reflect.set(target, prop, value);
    },
  });

  el.addEventListener('click', function () {
    if (typeof state.onclick === 'function') state.onclick();
  });

  return proxy;
}

function CreateActionBar() {
  var elCopy  = document.getElementById('copy-btn');
  var elClear = document.getElementById('clear-btn');

  var state = { visible: false, oncopy: null, onclear: null };

  var proxy = new Proxy(state, {
    get(target, prop) {
      if (prop === 'visible') return elCopy.style.display !== 'none';
      return target[prop];
    },
    set(target, prop, value) {
      if (prop === 'visible') {
        elCopy.style.display  = value ? '' : 'none';
        elClear.style.display = value ? '' : 'none';
      }
      return Reflect.set(target, prop, value);
    },
  });

  elCopy.addEventListener('click', function () {
    if (typeof state.oncopy === 'function') state.oncopy();
  });
  elClear.addEventListener('click', function () {
    if (typeof state.onclear === 'function') state.onclear();
  });

  return proxy;
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
  var header     = CreateHeader();
  var langForm   = CreateLangForm();
  var textArea   = CreateTextArea();
  var caretPop   = CreateCaretPopover();
  var actionBar  = CreateActionBar();
  var installBtn = CreateInstallBtn();

  // suggestions: null | { words: string[], prevSelection: number }
  var suggestions = null;

  // Saved beforeinstallprompt event. Cleared after prompt() is called (one-use per event).
  var deferredInstallPrompt = null;

  function renderSuggestions() {
    caretPop.suggestions = suggestions;
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

  caretPop.onselect = onSuggestSelect;

  langForm.onchange = function (newLang) {
    setLang(newLang);
    suggestions = null;
    renderSuggestions();
  };

  textArea.onkeydown = function (ev) {
    var key = ev.key.toLowerCase();

    if (key === 'arrowdown') {
      if (!suggestions) return;
      ev.preventDefault();
      ev.stopPropagation();
      var nextDown = suggestions.prevSelection + 1;
      if (nextDown === suggestions.words.length) nextDown = 0;
      suggestions = { words: suggestions.words, prevSelection: nextDown };
      renderSuggestions();

    } else if (key === 'arrowup') {
      if (!suggestions) return;
      ev.preventDefault();
      ev.stopPropagation();
      var prevUp = suggestions.prevSelection - 1;
      if (prevUp === -1) prevUp = suggestions.words.length - 1;
      suggestions = { words: suggestions.words, prevSelection: prevUp };
      renderSuggestions();

    } else if (key === 'enter') {
      if (!suggestions) return;
      ev.preventDefault();
      ev.stopPropagation();
      onSuggestSelect(suggestions.words[suggestions.prevSelection]);
      suggestions = null;
      renderSuggestions();

    } else if (key === 'escape') {
      suggestions = null;
      renderSuggestions();
    }
  };

  textArea.oninput = async function () {
    var value = textArea.value;
    var selectionStart = textArea.selectionStart;

    // Capture caret position before the async fetch so the popover is placed
    // at the correct location even if the user moves the caret while waiting.
    caretPop.caretPosition = selectionStart;
    LocalStorageAccess.PrevInput = value;

    if (lang !== 'bn') return;

    if (!value) {
      suggestions = null;
      renderSuggestions();
      return;
    }

    var parts = value.slice(0, selectionStart).split(' ');
    var lastWord = parts[parts.length - 1];

    suggestions = await avroWorker.getSuggestion(lastWord);
    renderSuggestions();
  };

  actionBar.oncopy = function () {
    navigator.clipboard.writeText(textArea.value);
  };

  actionBar.onclear = function () {
    textArea.value = '';
    LocalStorageAccess.PrevInput = null;
    suggestions = null;
    renderSuggestions();
    textArea.caret = 0;
  };

  installBtn.onclick = function () {
    if (!deferredInstallPrompt) return;
    deferredInstallPrompt.prompt();
    deferredInstallPrompt.userChoice.then(function () {
      deferredInstallPrompt = null;
      installBtn.visible = false;
    });
  };

  var savedInput = LocalStorageAccess.PrevInput;
  if (savedInput) textArea.value = savedInput;

  setLang(lang);

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

  // appinstalled fires after the app is successfully installed (by any means).
  window.addEventListener('appinstalled', function () {
    deferredInstallPrompt = null;
    installBtn.visible = false;
  });

  registerServiceWorker();
});
