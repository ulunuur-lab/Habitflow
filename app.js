/**
 * HabitFlow - Main Application Controller
 */

class HabitFlowApp {
  constructor() {
    this.habitManager = new HabitManager();
    this.analytics = new AnalyticsEngine(this.habitManager);
    this.settings = StorageManager.getSettings();

    // Active state
    this.currentDate = new Date();
    this.currentView = this.settings.currentView || 'today';
    this.selectedCategory = 'all';
    this.searchQuery = '';
    this.editingHabitId = null;

    this.audioCtx = null;
  }

  init() {
    StorageManager.initDefaultDataIfNeeded();
    this.habitManager.refreshState();

    this.applyTheme(this.settings.theme);
    this.setupEventListeners();
    this.setupViewNavigation();
    this.render();
  }

  // Web Audio chime synthesizer
  playCompletionSound() {
    if (!this.settings.soundEnabled) return;
    try {
      if (!this.audioCtx) {
        this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      }
      if (this.audioCtx.state === 'suspended') {
        this.audioCtx.resume();
      }

      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, this.audioCtx.currentTime); // D5
      osc.frequency.exponentialRampToValueAtTime(880, this.audioCtx.currentTime + 0.12); // A5

      gain.gain.setValueAtTime(0.15, this.audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.audioCtx.currentTime + 0.35);

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);

      osc.start();
      osc.stop(this.audioCtx.currentTime + 0.35);
    } catch (e) {
      // Audio not permitted or supported
    }
  }

  // Trigger celebration confetti
  triggerConfetti() {
    if (!this.settings.confettiEnabled || typeof confetti !== 'function') return;
    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.8 },
      colors: ['#6366f1', '#8b5cf6', '#ec4899', '#10b981', '#f59e0b']
    });
  }

  applyTheme(theme) {
    this.settings.theme = theme;
    StorageManager.saveSettings(this.settings);
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    const themeToggleBtn = document.getElementById('theme-toggle-btn');
    if (themeToggleBtn) {
      themeToggleBtn.innerHTML = theme === 'dark' 
        ? `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"></path></svg>`
        : `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"></path></svg>`;
    }
  }

  toggleTheme() {
    this.applyTheme(this.settings.theme === 'dark' ? 'light' : 'dark');
  }

  formatDate(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  getTodayDateStr() {
    return this.formatDate(new Date());
  }

  getCurrentDateStr() {
    return this.formatDate(this.currentDate);
  }

  setupEventListeners() {
    // Theme toggle
    document.getElementById('theme-toggle-btn')?.addEventListener('click', () => this.toggleTheme());

    // Navigation View switching
    document.querySelectorAll('[data-view-target]').forEach(el => {
      el.addEventListener('click', (e) => {
        const targetView = el.getAttribute('data-view-target');
        this.switchView(targetView);
      });
    });

    // Date Navigation controls
    document.getElementById('prev-date-btn')?.addEventListener('click', () => this.changeDate(-1));
    document.getElementById('next-date-btn')?.addEventListener('click', () => this.changeDate(1));
    document.getElementById('today-date-btn')?.addEventListener('click', () => {
      this.currentDate = new Date();
      this.render();
    });

    // Category filter pills
    document.querySelectorAll('.category-filter-pill').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.category-filter-pill').forEach(b => b.classList.remove('bg-indigo-600', 'text-white'));
        btn.classList.add('bg-indigo-600', 'text-white');
        this.selectedCategory = btn.getAttribute('data-category') || 'all';
        this.renderHabitLists();
      });
    });

    // Search bar
    document.getElementById('habit-search-input')?.addEventListener('input', (e) => {
      this.searchQuery = e.target.value.toLowerCase().trim();
      this.renderHabitLists();
    });

    // Modal controllers
    this.setupModalControls();
  }

  setupViewNavigation() {
    // Set initial view state
    this.switchView(this.currentView);
  }

  switchView(viewName) {
    this.currentView = viewName;
    this.settings.currentView = viewName;
    StorageManager.saveSettings(this.settings);

    // Update nav links styling
    document.querySelectorAll('[data-view-target]').forEach(link => {
      const isTarget = link.getAttribute('data-view-target') === viewName;
      if (isTarget) {
        link.classList.add('bg-indigo-50', 'text-indigo-600', 'dark:bg-indigo-900/40', 'dark:text-indigo-400');
        link.classList.remove('text-gray-600', 'dark:text-gray-400');
      } else {
        link.classList.remove('bg-indigo-50', 'text-indigo-600', 'dark:bg-indigo-900/40', 'dark:text-indigo-400');
        link.classList.add('text-gray-600', 'dark:text-gray-400');
      }
    });

    // Hide all view sections, show target
    document.querySelectorAll('.view-container').forEach(view => {
      view.classList.add('hidden');
    });

    const targetSection = document.getElementById(`view-${viewName}`);
    if (targetSection) {
      targetSection.classList.remove('hidden');
    }

    this.render();
  }

  changeDate(direction) {
    if (this.currentView === 'today') {
      this.currentDate.setDate(this.currentDate.getDate() + direction);
    } else if (this.currentView === 'week') {
      this.currentDate.setDate(this.currentDate.getDate() + direction * 7);
    } else if (this.currentView === 'month') {
      this.currentDate.setMonth(this.currentDate.getMonth() + direction);
    }
    this.render();
  }

  setupModalControls() {
    const modal = document.getElementById('habit-modal');
    const form = document.getElementById('habit-form');

    // Open Add Modal
    document.querySelectorAll('.btn-add-habit').forEach(btn => {
      btn.addEventListener('click', () => {
        this.openHabitModal();
      });
    });

    // Close Modal
    document.querySelectorAll('.btn-close-modal').forEach(btn => {
      btn.addEventListener('click', () => {
        modal.classList.add('hidden');
      });
    });

    // Form Frequency selector logic
    const freqSelect = document.getElementById('habit-frequency-type');
    const weekdaysContainer = document.getElementById('weekdays-selector-container');
    const specificDateContainer = document.getElementById('specific-date-container');

    freqSelect?.addEventListener('change', (e) => {
      const val = e.target.value;
      if (val === 'weekdays') {
        weekdaysContainer.classList.remove('hidden');
        specificDateContainer.classList.add('hidden');
      } else if (val === 'specific_date') {
        weekdaysContainer.classList.add('hidden');
        specificDateContainer.classList.remove('hidden');
      } else {
        weekdaysContainer.classList.add('hidden');
        specificDateContainer.classList.add('hidden');
      }
    });

    // Weekday toggle buttons in modal
    document.querySelectorAll('.modal-weekday-pill').forEach(pill => {
      pill.addEventListener('click', () => {
        pill.classList.toggle('active');
        pill.classList.toggle('bg-indigo-600');
        pill.classList.toggle('text-white');
      });
    });

    // Target Type selector (boolean vs numeric)
    const targetTypeSelect = document.getElementById('habit-target-type');
    const numericFieldsContainer = document.getElementById('numeric-target-fields');
    targetTypeSelect?.addEventListener('change', (e) => {
      if (e.target.value === 'numeric') {
        numericFieldsContainer.classList.remove('hidden');
      } else {
        numericFieldsContainer.classList.add('hidden');
      }
    });

    // Save Habit Form submission
    form?.addEventListener('submit', (e) => {
      e.preventDefault();
      this.saveHabitFromModal();
    });

    // Starter Pack / Template Modal
    document.getElementById('btn-open-templates')?.addEventListener('click', () => {
      this.openTemplatesModal();
    });
    document.getElementById('btn-close-templates')?.addEventListener('click', () => {
      document.getElementById('templates-modal').classList.add('hidden');
    });

    // Backup & Restore
    document.getElementById('btn-export-data')?.addEventListener('click', () => {
      const dataStr = StorageManager.exportDataJSON();
      const blob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `habitflow-backup-${this.getTodayDateStr()}.json`;
      a.click();
    });

    const fileInput = document.getElementById('import-file-input');
    document.getElementById('btn-import-trigger')?.addEventListener('click', () => {
      fileInput?.click();
    });

    fileInput?.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (ev) => {
          const res = StorageManager.importDataJSON(ev.target.result);
          if (res.success) {
            alert(`Successfully restored ${res.count} habits!`);
            this.habitManager.refreshState();
            this.render();
          } else {
            alert('Failed to import data: ' + res.error);
          }
        };
        reader.readAsText(file);
      }
    });

    document.getElementById('btn-reset-demo')?.addEventListener('click', () => {
      if (confirm('Are you sure you want to reset demo data? This will restore sample habits.')) {
        StorageManager.resetAllData();
        this.habitManager.refreshState();
        this.render();
      }
    });
  }

  openHabitModal(habitId = null) {
    this.editingHabitId = habitId;
    const modal = document.getElementById('habit-modal');
    const modalTitle = document.getElementById('modal-title');
    const form = document.getElementById('habit-form');
    form.reset();

    if (habitId) {
      modalTitle.textContent = 'Edit Habit / Routine Task';
      const habit = this.habitManager.getHabitById(habitId);
      if (habit) {
        document.getElementById('habit-name').value = habit.name;
        document.getElementById('habit-desc').value = habit.description || '';
        document.getElementById('habit-category').value = habit.category;
        document.getElementById('habit-icon').value = habit.icon || '✨';
        document.getElementById('habit-color').value = habit.color || '#6366f1';
        document.getElementById('habit-time-of-day').value = habit.timeOfDay || 'anytime';
        document.getElementById('habit-frequency-type').value = habit.frequencyType || 'daily';
        document.getElementById('habit-target-type').value = habit.targetType || 'boolean';
        document.getElementById('habit-target-value').value = habit.targetValue || 1;
        document.getElementById('habit-unit').value = habit.unit || 'times';

        if (habit.specificDate) {
          document.getElementById('habit-specific-date').value = habit.specificDate;
        }

        // Set active weekday pills
        document.querySelectorAll('.modal-weekday-pill').forEach(pill => {
          const day = parseInt(pill.getAttribute('data-day'), 10);
          const isActive = habit.targetDays && habit.targetDays.includes(day);
          pill.classList.toggle('active', isActive);
          pill.classList.toggle('bg-indigo-600', isActive);
          pill.classList.toggle('text-white', isActive);
        });

        // Trigger change handlers
        document.getElementById('habit-frequency-type').dispatchEvent(new Event('change'));
        document.getElementById('habit-target-type').dispatchEvent(new Event('change'));
      }
    } else {
      modalTitle.textContent = 'Create New Habit / Routine Task';
      // Default all weekdays active
      document.querySelectorAll('.modal-weekday-pill').forEach(pill => {
        pill.classList.add('active', 'bg-indigo-600', 'text-white');
      });
      document.getElementById('habit-frequency-type').dispatchEvent(new Event('change'));
      document.getElementById('habit-target-type').dispatchEvent(new Event('change'));
    }

    modal.classList.remove('hidden');
  }

  saveHabitFromModal() {
    const name = document.getElementById('habit-name').value.trim();
    if (!name) return;

    const description = document.getElementById('habit-desc').value.trim();
    const category = document.getElementById('habit-category').value;
    const icon = document.getElementById('habit-icon').value.trim() || '✨';
    const color = document.getElementById('habit-color').value;
    const timeOfDay = document.getElementById('habit-time-of-day').value;
    const frequencyType = document.getElementById('habit-frequency-type').value;
    const specificDate = document.getElementById('habit-specific-date').value || null;
    const targetType = document.getElementById('habit-target-type').value;
    const targetValue = parseFloat(document.getElementById('habit-target-value').value) || 1;
    const unit = document.getElementById('habit-unit').value.trim() || 'times';

    // Collect selected weekdays
    const targetDays = [];
    document.querySelectorAll('.modal-weekday-pill.active').forEach(pill => {
      targetDays.push(parseInt(pill.getAttribute('data-day'), 10));
    });

    const habitData = {
      name,
      description,
      category,
      icon,
      color,
      timeOfDay,
      frequencyType,
      targetDays: frequencyType === 'weekdays' ? targetDays : [0, 1, 2, 3, 4, 5, 6],
      specificDate: frequencyType === 'specific_date' ? specificDate : null,
      targetType,
      targetValue,
      unit
    };

    if (this.editingHabitId) {
      this.habitManager.updateHabit(this.editingHabitId, habitData);
    } else {
      this.habitManager.createHabit(habitData);
    }

    document.getElementById('habit-modal').classList.add('hidden');
    this.render();
  }

  openTemplatesModal() {
    const modal = document.getElementById('templates-modal');
    const container = document.getElementById('templates-container');
    if (!container) return;

    container.innerHTML = HABIT_TEMPLATES.map(pack => `
      <div class="border border-gray-200 dark:border-gray-700 rounded-xl p-5 hover:border-indigo-500 dark:hover:border-indigo-500 transition-all bg-white/50 dark:bg-gray-800/50">
        <div class="flex items-start justify-between">
          <div>
            <h3 class="text-lg font-bold text-gray-900 dark:text-white">${pack.name}</h3>
            <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">${pack.description}</p>
          </div>
          <button 
            class="btn-load-template px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-all flex items-center gap-1.5"
            data-template-id="${pack.id}"
          >
            <span>Add Pack (${pack.habits.length})</span>
          </button>
        </div>
        <div class="mt-4 flex flex-wrap gap-2">
          ${pack.habits.map(h => `
            <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
              <span>${h.icon}</span>
              <span>${h.name}</span>
            </span>
          `).join('')}
        </div>
      </div>
    `).join('');

    container.querySelectorAll('.btn-load-template').forEach(btn => {
      btn.addEventListener('click', () => {
        const packId = btn.getAttribute('data-template-id');
        const pack = HABIT_TEMPLATES.find(p => p.id === packId);
        if (pack) {
          pack.habits.forEach(h => this.habitManager.createHabit(h));
          modal.classList.add('hidden');
          this.triggerConfetti();
          this.render();
        }
      });
    });

    modal.classList.remove('hidden');
  }

  render() {
    this.habitManager.refreshState();

    // Render top header date and stats
    this.renderHeaderStats();

    // Render current active view
    if (this.currentView === 'today') {
      this.renderTodayView();
    } else if (this.currentView === 'week') {
      this.renderWeekView();
    } else if (this.currentView === 'month') {
      this.renderMonthView();
    } else if (this.currentView === 'planner') {
      this.renderPlannerView();
    } else if (this.currentView === 'analytics') {
      this.renderAnalyticsView();
    }
  }

  renderHeaderStats() {
    const dateDisplay = document.getElementById('current-date-display');
    const dayStats = this.analytics.getDayStats(this.getCurrentDateStr());
    const milestones = this.analytics.getMilestones();

    if (dateDisplay) {
      const options = { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' };
      dateDisplay.textContent = this.currentDate.toLocaleDateString(undefined, options);
    }

    // Top counters
    const topStreak = document.getElementById('header-best-streak');
    if (topStreak) topStreak.textContent = `${milestones.maxStreak} Days`;

    const topRate = document.getElementById('header-day-rate');
    if (topRate) topRate.textContent = `${dayStats.percentage}% (${dayStats.completed}/${dayStats.total})`;
  }

  renderHabitLists() {
    if (this.currentView === 'today') this.renderTodayView();
    else if (this.currentView === 'week') this.renderWeekView();
    else if (this.currentView === 'planner') this.renderPlannerView();
  }

  // ==================== TODAY VIEW ====================
  renderTodayView() {
    const dateStr = this.getCurrentDateStr();
    const habits = this.habitManager.getHabitsForDate(dateStr);
    const dayStats = this.analytics.getDayStats(dateStr);

    // Filter by category and search
    const filteredHabits = habits.filter(h => {
      const matchesCategory = this.selectedCategory === 'all' || h.category === this.selectedCategory;
      const matchesSearch = !this.searchQuery || h.name.toLowerCase().includes(this.searchQuery) || (h.description && h.description.toLowerCase().includes(this.searchQuery));
      return matchesCategory && matchesSearch;
    });

    // Render Progress Ring
    ChartRenderer.renderProgressRing('today-progress-ring', dayStats.percentage, 110, 9, '#6366f1');

    const completedCountEl = document.getElementById('today-completed-count');
    if (completedCountEl) {
      completedCountEl.textContent = `${dayStats.completed} of ${dayStats.total} completed`;
    }

    // Group habits by timeOfDay
    const groups = {
      morning: { title: '🌅 Morning Routine', items: [] },
      afternoon: { title: '☀️ Afternoon Routine', items: [] },
      evening: { title: '🌙 Evening & Night Routine', items: [] },
      anytime: { title: '✨ Anytime Habits & Tasks', items: [] }
    };

    filteredHabits.forEach(h => {
      const groupKey = groups[h.timeOfDay] ? h.timeOfDay : 'anytime';
      groups[groupKey].items.push(h);
    });

    const listContainer = document.getElementById('today-habits-list');
    if (!listContainer) return;

    if (filteredHabits.length === 0) {
      listContainer.innerHTML = `
        <div class="text-center py-12 bg-white/60 dark:bg-gray-800/60 rounded-2xl border border-dashed border-gray-300 dark:border-gray-700">
          <div class="text-4xl mb-3">🌱</div>
          <h4 class="text-base font-semibold text-gray-800 dark:text-gray-200">No habits scheduled for this day</h4>
          <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">Create a new routine task or load a starter template.</p>
          <div class="mt-4 flex items-center justify-center gap-3">
            <button class="btn-add-habit px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-all">
              + Add Habit
            </button>
            <button id="btn-open-templates-empty" class="px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 text-xs font-semibold rounded-lg transition-all">
              Explore Templates
            </button>
          </div>
        </div>
      `;
      document.getElementById('btn-open-templates-empty')?.addEventListener('click', () => this.openTemplatesModal());
      listContainer.querySelectorAll('.btn-add-habit').forEach(b => b.addEventListener('click', () => this.openHabitModal()));
      return;
    }

    let html = '';
    for (const key in groups) {
      const group = groups[key];
      if (group.items.length === 0) continue;

      html += `
        <div class="mb-6">
          <div class="flex items-center justify-between mb-3 px-1">
            <h3 class="text-sm font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">${group.title}</h3>
            <span class="text-xs font-semibold text-gray-400">${group.items.length} tasks</span>
          </div>
          <div class="space-y-2.5">
            ${group.items.map(h => this.renderHabitCard(h, dateStr)).join('')}
          </div>
        </div>
      `;
    }

    listContainer.innerHTML = html;
    this.attachHabitCardListeners(listContainer, dateStr);
  }

  renderHabitCard(habit, dateStr) {
    const log = this.habitManager.getLog(habit.id, dateStr);
    const streak = this.analytics.calculateHabitStreak(habit.id);
    const isCompleted = log.completed;

    let targetControls = '';
    if (habit.targetType === 'numeric') {
      const currentVal = log.value || 0;
      const targetVal = habit.targetValue || 1;
      const percent = Math.min(100, Math.round((currentVal / targetVal) * 100));

      targetControls = `
        <div class="flex items-center gap-2 mt-2">
          <div class="flex-1 bg-gray-100 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
            <div class="bg-indigo-600 h-2 rounded-full transition-all duration-300" style="width: ${percent}%"></div>
          </div>
          <span class="text-xs font-mono font-medium text-gray-600 dark:text-gray-300 min-w-[65px] text-right">
            ${currentVal}/${targetVal} ${habit.unit}
          </span>
          <div class="flex items-center gap-1">
            <button class="btn-increment p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs font-bold" data-habit-id="${habit.id}" data-delta="1" title="Add 1">
              +1
            </button>
            ${habit.unit === 'ml' ? `
              <button class="btn-increment px-1.5 py-0.5 rounded bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 text-xs font-semibold" data-habit-id="${habit.id}" data-delta="250" title="Add 250ml">
                +250ml
              </button>
            ` : ''}
          </div>
        </div>
      `;
    }

    return `
      <div class="glass-card glass-card-hover rounded-xl p-4 transition-all ${isCompleted ? 'border-emerald-200 dark:border-emerald-900/50 bg-emerald-50/20 dark:bg-emerald-950/10' : ''}">
        <div class="flex items-start justify-between gap-3">
          <div class="flex items-center gap-3.5 flex-1 min-w-0">
            <input 
              type="checkbox" 
              class="habit-checkbox habit-toggle-cb flex-shrink-0" 
              data-habit-id="${habit.id}"
              ${isCompleted ? 'checked' : ''}
            />
            <div class="flex-1 min-w-0 cursor-pointer btn-edit-habit" data-habit-id="${habit.id}">
              <div class="flex items-center gap-2 flex-wrap">
                <span class="text-lg flex-shrink-0">${habit.icon || '✨'}</span>
                <span class="font-semibold text-gray-900 dark:text-white truncate text-sm sm:text-base ${isCompleted ? 'line-through text-gray-400 dark:text-gray-500' : ''}">
                  ${habit.name}
                </span>
                <span class="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border badge-${habit.category}">
                  ${habit.category}
                </span>
              </div>
              ${habit.description ? `<p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate">${habit.description}</p>` : ''}
            </div>
          </div>

          <div class="flex items-center gap-2 flex-shrink-0">
            ${streak.current > 0 ? `
              <div class="flex items-center gap-1 px-2 py-1 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 fire-glow">
                <span class="text-xs">🔥</span>
                <span class="text-xs font-bold font-mono text-amber-600 dark:text-amber-400">${streak.current}d</span>
              </div>
            ` : ''}
            
            <button class="btn-edit-habit p-1 text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors" data-habit-id="${habit.id}" title="Edit">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
            </button>
            <button class="btn-delete-habit p-1 text-gray-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors" data-habit-id="${habit.id}" title="Delete">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
            </button>
          </div>
        </div>

        ${targetControls}
      </div>
    `;
  }

  attachHabitCardListeners(container, dateStr) {
    // Checkbox toggle
    container.querySelectorAll('.habit-toggle-cb').forEach(cb => {
      cb.addEventListener('change', () => {
        const habitId = cb.getAttribute('data-habit-id');
        const res = this.habitManager.toggleCompletion(habitId, dateStr);
        if (res && res.completed) {
          this.playCompletionSound();
          this.triggerConfetti();
        }
        this.render();
      });
    });

    // Increments (+1, +250ml)
    container.querySelectorAll('.btn-increment').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const habitId = btn.getAttribute('data-habit-id');
        const delta = parseFloat(btn.getAttribute('data-delta')) || 1;
        const res = this.habitManager.incrementValue(habitId, dateStr, delta);
        if (res && res.completed) {
          this.playCompletionSound();
          this.triggerConfetti();
        }
        this.render();
      });
    });

    // Edit habit
    container.querySelectorAll('.btn-edit-habit').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const habitId = btn.getAttribute('data-habit-id');
        if (habitId) this.openHabitModal(habitId);
      });
    });

    // Delete habit
    container.querySelectorAll('.btn-delete-habit').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const habitId = btn.getAttribute('data-habit-id');
        if (habitId && confirm('Delete this habit and all its logged history?')) {
          this.habitManager.deleteHabit(habitId);
          this.render();
        }
      });
    });
  }

  // ==================== WEEK MATRIX VIEW ====================
  renderWeekView() {
    const container = document.getElementById('week-matrix-container');
    if (!container) return;

    // Calculate start of current week (Monday)
    const cur = new Date(this.currentDate);
    const day = cur.getDay(); // 0 is Sun, 1 is Mon
    const diff = cur.getDate() - day + (day === 0 ? -6 : 1); // adjust to Monday
    const monday = new Date(cur.setDate(diff));

    const weekDays = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      const dateStr = this.formatDate(d);
      const dayStats = this.analytics.getDayStats(dateStr);
      weekDays.push({
        date: dateStr,
        dayName: d.toLocaleDateString(undefined, { weekday: 'short' }),
        dayNum: d.getDate(),
        monthName: d.toLocaleDateString(undefined, { month: 'short' }),
        isToday: dateStr === this.getTodayDateStr(),
        ...dayStats
      });
    }

    const weekStartStr = weekDays[0].date;
    const weekEndStr = weekDays[6].date;
    const weekStats = this.analytics.getWeekStats(weekStartStr);

    document.getElementById('week-range-label').textContent = `${weekDays[0].monthName} ${weekDays[0].dayNum} - ${weekDays[6].monthName} ${weekDays[6].dayNum}`;
    document.getElementById('week-completion-rate').textContent = `${weekStats.percentage}% Completed (${weekStats.completed}/${weekStats.total})`;

    // Render Weekly Bar Chart
    ChartRenderer.renderWeeklyBarChart('week-bar-chart', weekDays);

    // Habits Table Matrix
    const habits = this.habitManager.getAllHabits(false);

    let rowsHtml = habits.map(h => {
      const streak = this.analytics.calculateHabitStreak(h.id);

      const dayCells = weekDays.map(d => {
        const isScheduled = this.habitManager.isScheduledForDate(h, d.date);
        const log = this.habitManager.getLog(h.id, d.date);

        if (!isScheduled) {
          return `
            <td class="p-2.5 text-center bg-gray-50/50 dark:bg-gray-800/30">
              <span class="text-xs text-gray-300 dark:text-gray-600">-</span>
            </td>
          `;
        }

        return `
          <td class="p-2.5 text-center ${d.isToday ? 'bg-indigo-50/30 dark:bg-indigo-950/20' : ''}">
            <input 
              type="checkbox" 
              class="habit-checkbox week-toggle-cb mx-auto" 
              data-habit-id="${h.id}" 
              data-date="${d.date}" 
              ${log.completed ? 'checked' : ''}
            />
          </td>
        `;
      }).join('');

      return `
        <tr class="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-colors">
          <td class="p-3.5">
            <div class="flex items-center gap-2.5">
              <span class="text-base">${h.icon || '✨'}</span>
              <div>
                <span class="font-semibold text-gray-900 dark:text-white text-sm block">${h.name}</span>
                <span class="text-[10px] uppercase font-bold px-1.5 py-0.2 rounded border badge-${h.category}">
                  ${h.category}
                </span>
              </div>
            </div>
          </td>
          ${dayCells}
          <td class="p-3 text-center">
            <span class="font-bold text-xs text-amber-600 dark:text-amber-400 font-mono">🔥 ${streak.current}d</span>
          </td>
        </tr>
      `;
    }).join('');

    container.innerHTML = `
      <div class="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-gray-800/80">
        <table class="w-full text-left border-collapse min-w-[650px]">
          <thead>
            <tr class="border-b border-gray-200 dark:border-gray-700 bg-gray-50/80 dark:bg-gray-800/80 text-xs font-semibold text-gray-600 dark:text-gray-300">
              <th class="p-3.5">Habit / Routine</th>
              ${weekDays.map(d => `
                <th class="p-3 text-center ${d.isToday ? 'text-indigo-600 dark:text-indigo-400 font-bold bg-indigo-50/50 dark:bg-indigo-950/30' : ''}">
                  <div>${d.dayName}</div>
                  <div class="text-[11px] font-normal text-gray-400">${d.dayNum}</div>
                </th>
              `).join('')}
              <th class="p-3 text-center">Streak</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
        </table>
      </div>
    `;

    // Attach week table check listeners
    container.querySelectorAll('.week-toggle-cb').forEach(cb => {
      cb.addEventListener('change', () => {
        const habitId = cb.getAttribute('data-habit-id');
        const dateStr = cb.getAttribute('data-date');
        const res = this.habitManager.toggleCompletion(habitId, dateStr);
        if (res && res.completed) {
          this.playCompletionSound();
          this.triggerConfetti();
        }
        this.render();
      });
    });
  }

  // ==================== MONTH CALENDAR VIEW ====================
  renderMonthView() {
    const year = this.currentDate.getFullYear();
    const month = this.currentDate.getMonth();

    const monthLabel = document.getElementById('month-year-label');
    if (monthLabel) {
      monthLabel.textContent = this.currentDate.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
    }

    const monthStats = this.analytics.getMonthStats(year, month);
    document.getElementById('month-completion-rate').textContent = `${monthStats.percentage}% Completed`;
    document.getElementById('month-perfect-days').textContent = `${monthStats.perfectDays} Perfect Days`;

    const firstDayIndex = new Date(year, month, 1).getDay(); // 0 is Sun
    const adjustedFirstDay = firstDayIndex === 0 ? 6 : firstDayIndex - 1; // Mon = 0
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const gridContainer = document.getElementById('month-calendar-grid');
    if (!gridContainer) return;

    let calendarCells = '';

    // Empty cells before start of month
    for (let i = 0; i < adjustedFirstDay; i++) {
      calendarCells += `<div class="h-24 p-2 bg-gray-50/40 dark:bg-gray-900/20 border border-gray-100 dark:border-gray-800 rounded-lg opacity-40"></div>`;
    }

    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const dateStr = this.formatDate(date);
      const stats = this.analytics.getDayStats(dateStr);
      const isToday = dateStr === this.getTodayDateStr();

      let badgeColor = 'bg-gray-100 dark:bg-gray-800 text-gray-500';
      if (stats.total > 0) {
        if (stats.percentage === 100) badgeColor = 'bg-emerald-500 text-white font-bold';
        else if (stats.percentage >= 50) badgeColor = 'bg-indigo-500 text-white font-semibold';
        else if (stats.completed > 0) badgeColor = 'bg-amber-500 text-white';
      }

      calendarCells += `
        <div class="h-24 p-2.5 glass-card rounded-xl border border-gray-200 dark:border-gray-700 flex flex-col justify-between cursor-pointer hover:border-indigo-500 transition-all ${isToday ? 'ring-2 ring-indigo-500' : ''}" data-calendar-date="${dateStr}">
          <div class="flex items-center justify-between">
            <span class="text-xs font-bold ${isToday ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-700 dark:text-gray-300'}">${day}</span>
            ${stats.total > 0 ? `
              <span class="text-[10px] px-1.5 py-0.5 rounded-full ${badgeColor}">
                ${stats.completed}/${stats.total}
              </span>
            ` : ''}
          </div>
          <div class="w-full bg-gray-100 dark:bg-gray-700 h-1.5 rounded-full overflow-hidden mt-2">
            <div class="bg-indigo-600 h-full rounded-full" style="width: ${stats.percentage}%"></div>
          </div>
          <div class="text-[10px] text-right text-gray-400 font-mono">${stats.percentage}%</div>
        </div>
      `;
    }

    gridContainer.innerHTML = calendarCells;

    // Clicking a date navigates to that date in Today view
    gridContainer.querySelectorAll('[data-calendar-date]').forEach(cell => {
      cell.addEventListener('click', () => {
        const dateStr = cell.getAttribute('data-calendar-date');
        if (dateStr) {
          this.currentDate = new Date(dateStr + 'T00:00:00');
          this.switchView('today');
        }
      });
    });
  }

  // ==================== FUTURE / PLANNER VIEW ====================
  renderPlannerView() {
    const habits = this.habitManager.getAllHabits(false);
    const container = document.getElementById('planner-habits-container');
    if (!container) return;

    const weekdayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    container.innerHTML = habits.map(h => {
      let freqDescription = 'Every day';
      if (h.frequencyType === 'weekdays') {
        freqDescription = h.targetDays.map(d => weekdayNames[d]).join(', ');
      } else if (h.frequencyType === 'specific_date') {
        freqDescription = `Scheduled on: ${h.specificDate}`;
      } else if (h.frequencyType === 'weekly_target') {
        freqDescription = `Target: ${h.weeklyTargetCount} times/week`;
      }

      return `
        <div class="glass-card rounded-xl p-4 flex items-center justify-between gap-4">
          <div class="flex items-center gap-3">
            <span class="text-2xl">${h.icon || '✨'}</span>
            <div>
              <h4 class="font-bold text-gray-900 dark:text-white text-sm sm:text-base">${h.name}</h4>
              <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">${freqDescription} • Time: <span class="capitalize font-medium">${h.timeOfDay}</span></p>
            </div>
          </div>
          <div class="flex items-center gap-2">
            <button class="btn-edit-habit px-3 py-1.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 rounded-lg hover:bg-indigo-100 transition-colors" data-habit-id="${h.id}">
              Edit Schedule
            </button>
          </div>
        </div>
      `;
    }).join('');

    container.querySelectorAll('.btn-edit-habit').forEach(btn => {
      btn.addEventListener('click', () => {
        const habitId = btn.getAttribute('data-habit-id');
        if (habitId) this.openHabitModal(habitId);
      });
    });
  }

  // ==================== ANALYTICS VIEW ====================
  renderAnalyticsView() {
    const milestones = this.analytics.getMilestones();
    const categories = this.analytics.getCategoryBreakdown(30);
    const heatmapData = this.analytics.getHeatmapData(16);

    // Milestones & Badges
    const badgesContainer = document.getElementById('milestones-badges-container');
    if (badgesContainer) {
      badgesContainer.innerHTML = milestones.badges.map(b => `
        <div class="p-4 rounded-xl border ${b.unlocked ? 'border-amber-200 dark:border-amber-900/50 bg-amber-50/20 dark:bg-amber-950/20' : 'border-gray-200 dark:border-gray-800 opacity-60'} flex items-start gap-3.5">
          <span class="text-2xl">${b.title.split(' ')[0]}</span>
          <div>
            <h4 class="text-sm font-bold text-gray-900 dark:text-white">${b.title.substring(2)}</h4>
            <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">${b.desc}</p>
            <div class="flex items-center gap-2 mt-2">
              <span class="text-[11px] font-bold ${b.unlocked ? 'text-amber-600 dark:text-amber-400' : 'text-gray-400'}">
                ${b.unlocked ? '✓ Unlocked' : `Progress: ${b.progress}`}
              </span>
            </div>
          </div>
        </div>
      `).join('');
    }

    // Category Performance
    const catContainer = document.getElementById('category-breakdown-container');
    if (catContainer) {
      catContainer.innerHTML = categories.map(c => `
        <div>
          <div class="flex items-center justify-between text-xs font-semibold mb-1">
            <span class="text-gray-700 dark:text-gray-300">${c.label}</span>
            <span class="text-gray-500 dark:text-gray-400">${c.rate}% (${c.completed}/${c.scheduled})</span>
          </div>
          <div class="w-full bg-gray-100 dark:bg-gray-700 h-2.5 rounded-full overflow-hidden">
            <div class="h-full rounded-full transition-all duration-500" style="width: ${c.rate}%; background-color: ${c.color}"></div>
          </div>
        </div>
      `).join('');
    }

    // Render Heatmap Matrix
    ChartRenderer.renderHeatmap('analytics-heatmap-container', heatmapData, (date) => {
      this.currentDate = new Date(date + 'T00:00:00');
      this.switchView('today');
    });
  }
}

// Instantiate and initialize on DOM Ready
document.addEventListener('DOMContentLoaded', () => {
  window.app = new HabitFlowApp();
  window.app.init();
});
