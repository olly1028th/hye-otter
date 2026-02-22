/**
 * 할 일 목록 모듈
 */
const Todo = (() => {
  const STORAGE_KEY = 'hyeotter_todos';
  const MAX_ITEMS = 20;

  let items = [];
  let onChange = null;

  function load() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) items = JSON.parse(saved);
    } catch (e) {
      // 무시
    }
  }

  function save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch (e) {
      // 무시
    }
  }

  function render() {
    const $list = document.getElementById('todo-list');
    const $empty = document.getElementById('todo-empty');
    if (!$list) return;

    $list.innerHTML = '';
    if ($empty) $empty.hidden = items.length > 0;

    items.forEach((item, i) => {
      const li = document.createElement('li');
      li.className = 'todo__item' + (item.done ? ' todo--done' : '');

      li.innerHTML = `
        <div class="todo__check" data-idx="${i}">${item.done ? '✓' : ''}</div>
        <span class="todo__text">${escapeHtml(item.text)}</span>
        <button class="todo__delete" data-idx="${i}" title="삭제">✕</button>
      `;

      $list.appendChild(li);
    });
  }

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  function addItem(text) {
    text = text.trim();
    if (!text || items.length >= MAX_ITEMS) return false;
    items.push({ text, done: false });
    save();
    render();
    if (onChange) onChange(items);
    return true;
  }

  function toggleItem(idx) {
    if (items[idx]) {
      items[idx].done = !items[idx].done;
      save();
      render();
      if (onChange) onChange(items);
    }
  }

  function removeItem(idx) {
    items.splice(idx, 1);
    save();
    render();
    if (onChange) onChange(items);
  }

  function init(callback) {
    onChange = callback;
    load();

    const $input = document.getElementById('todo-input');
    const $addBtn = document.getElementById('todo-add');
    const $list = document.getElementById('todo-list');

    if ($addBtn && $input) {
      $addBtn.addEventListener('click', () => {
        if (addItem($input.value)) $input.value = '';
      });
    }

    if ($input) {
      $input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          if (addItem($input.value)) $input.value = '';
        }
      });
    }

    if ($list) {
      $list.addEventListener('click', (e) => {
        const check = e.target.closest('.todo__check');
        const del = e.target.closest('.todo__delete');
        if (check) toggleItem(Number(check.dataset.idx));
        if (del) removeItem(Number(del.dataset.idx));
      });
    }

    render();
  }

  function getItems() {
    return items;
  }

  return { init, getItems };
})();
