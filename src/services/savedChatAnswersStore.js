const SAVED_ANSWERS_KEY = 'bsv.savedChatAnswers';

export function loadSavedChatAnswers() {
  try {
    const raw = localStorage.getItem(SAVED_ANSWERS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveChatAnswer({ id, messageId, text, plates = [], relatedPosts = [], prompt = '', sessionId = null }) {
  if (!text) return null;
  try {
    const list = loadSavedChatAnswers();
    const itemKey = id || messageId || text.trim().slice(0, 100);
    const existingIdx = list.findIndex((x) => x.id === itemKey || (x.text && x.text === text));
    
    const newItem = {
      id: itemKey,
      messageId: messageId || null,
      text,
      plates: plates || [],
      relatedPosts: relatedPosts || [],
      prompt: prompt || '',
      sessionId: sessionId || null,
      savedAt: new Date().toISOString(),
    };

    if (existingIdx >= 0) {
      list[existingIdx] = newItem;
    } else {
      list.unshift(newItem);
    }

    localStorage.setItem(SAVED_ANSWERS_KEY, JSON.stringify(list.slice(0, 100)));
    window.dispatchEvent(new CustomEvent('bsv_saved_chat_answers_updated', { detail: list }));
    return newItem;
  } catch (err) {
    console.error('Error saving chat answer:', err);
    return null;
  }
}

export function removeSavedChatAnswer(idOrText) {
  try {
    const list = loadSavedChatAnswers();
    const filtered = list.filter((x) => x.id !== idOrText && x.text !== idOrText);
    localStorage.setItem(SAVED_ANSWERS_KEY, JSON.stringify(filtered));
    window.dispatchEvent(new CustomEvent('bsv_saved_chat_answers_updated', { detail: filtered }));
    return true;
  } catch {
    return false;
  }
}

export function isChatAnswerSaved(idOrText) {
  if (!idOrText) return false;
  try {
    const list = loadSavedChatAnswers();
    return list.some((x) => x.id === idOrText || x.text === idOrText);
  } catch {
    return false;
  }
}

export function clearAllSavedChatAnswers() {
  try {
    localStorage.removeItem(SAVED_ANSWERS_KEY);
    window.dispatchEvent(new CustomEvent('bsv_saved_chat_answers_updated', { detail: [] }));
    return true;
  } catch {
    return false;
  }
}
