const SAVE_KEY = 'rain_daily_save_v1';
const audioState = { enabled: true };

const screens = {
  title: document.getElementById('title-screen'),
  story: document.getElementById('story-screen')
};

const titlePanel = {
  startBtn: document.getElementById('start-btn'),
  continueBtn: document.getElementById('continue-btn')
};

const storyPanel = {
  speaker: document.getElementById('speaker'),
  dialogue: document.getElementById('dialogue'),
  choices: document.getElementById('choices'),
  nextBtn: document.getElementById('next-btn'),
  saveBtn: document.getElementById('save-btn'),
  loadBtn: document.getElementById('load-btn'),
  audioBtn: document.getElementById('audio-btn'),
  affection: document.getElementById('affection')
};

const state = {
  currentId: 'start',
  affection: 0,
  dialogueMap: {},
  isStory: false
};

let bgmAudio = null;

async function loadDialogue() {
  const response = await fetch('data/dialogue.json');
  const data = await response.json();
  data.forEach((line) => {
    state.dialogueMap[line.id] = line;
  });
}

function showTitle() {
  screens.title.classList.add('active');
  screens.story.classList.remove('active');
  state.isStory = false;
  titlePanel.continueBtn.disabled = !localStorage.getItem(SAVE_KEY);
}

function showStory() {
  screens.title.classList.remove('active');
  screens.story.classList.add('active');
  state.isStory = true;
  ensureAudio();
}

function setAffectionText() {
  storyPanel.affection.textContent = `好感度：${state.affection}`;
}

function renderLine(id) {
  const line = state.dialogueMap[id];
  if (!line) return;

  state.currentId = id;
  storyPanel.speaker.textContent = line.speaker || '雨姐';
  storyPanel.dialogue.textContent = line.text || '';
  setAffectionText();

  storyPanel.choices.innerHTML = '';

  if (line.choices && line.choices.length > 0) {
    storyPanel.nextBtn.style.display = 'none';
    line.choices.forEach((choice) => {
      const btn = document.createElement('button');
      btn.className = 'choice-btn';
      btn.textContent = choice.text;
      btn.addEventListener('click', () => {
        state.affection += Number(choice.affection || 0);
        const nextId = choice.next || 'start';
        renderLine(nextId);
      });
      storyPanel.choices.appendChild(btn);
    });
  } else {
    storyPanel.nextBtn.style.display = 'inline-flex';
    storyPanel.nextBtn.textContent = line.next ? '继续' : '返回标题';
  }

  if (line.voice) {
    playVoice(line.voice);
  }
}

function nextDialogue() {
  const line = state.dialogueMap[state.currentId];
  if (!line) return;

  if (line.next) {
    renderLine(line.next);
  } else {
    showTitle();
  }
}

function startNewGame() {
  state.affection = 0;
  state.currentId = 'start';
  showStory();
  renderLine('start');
}

function saveGame() {
  const data = {
    currentId: state.currentId,
    affection: state.affection
  };
  localStorage.setItem(SAVE_KEY, JSON.stringify(data));
  alert('保存成功');
}

function loadGame() {
  const raw = localStorage.getItem(SAVE_KEY);
  if (!raw) {
    alert('没有已保存的进度');
    return;
  }

  try {
    const data = JSON.parse(raw);
    state.currentId = data.currentId || 'start';
    state.affection = Number(data.affection || 0);
    showStory();
    renderLine(state.currentId);
  } catch (error) {
    alert('存档异常');
  }
}

function toggleAudio() {
  audioState.enabled = !audioState.enabled;
  storyPanel.audioBtn.textContent = audioState.enabled ? '音乐：开' : '音乐：关';

  if (bgmAudio) {
    bgmAudio.muted = !audioState.enabled;
  }
}

function ensureAudio() {
  if (!bgmAudio) {
    bgmAudio = new Audio('audio/bgm/morning.ogg');
    bgmAudio.loop = true;
    bgmAudio.volume = 0.4;
    bgmAudio.muted = !audioState.enabled;
  }

  if (audioState.enabled) {
    bgmAudio.play().catch(() => {});
  }
}

function playVoice(url) {
  const voice = new Audio(url);
  voice.volume = 0.75;
  voice.play().catch(() => {});
}

async function init() {
  await loadDialogue();
  showTitle();

  titlePanel.startBtn.addEventListener('click', startNewGame);
  titlePanel.continueBtn.addEventListener('click', loadGame);
  storyPanel.nextBtn.addEventListener('click', nextDialogue);
  storyPanel.saveBtn.addEventListener('click', saveGame);
  storyPanel.loadBtn.addEventListener('click', loadGame);
  storyPanel.audioBtn.addEventListener('click', toggleAudio);

  document.addEventListener('keydown', (event) => {
    if (event.code === 'Space' || event.code === 'Enter') {
      if (state.isStory) {
        const hasChoices = storyPanel.choices.children.length > 0;
        if (!hasChoices) {
          nextDialogue();
        }
      }
    }
  });
}

init();
