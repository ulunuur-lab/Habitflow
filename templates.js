/**
 * HabitFlow - Predefined Routine & Habit Starter Templates
 */

const HABIT_TEMPLATES = [
  {
    id: 'starter_morning',
    name: '🌅 Miracle Morning Routine',
    description: 'A powerful 5-step morning routine to start your day energized and focused.',
    habits: [
      {
        name: 'Make the Bed',
        description: 'First small win of the day',
        category: 'routine',
        color: '#8b5cf6',
        icon: '🛏️',
        frequencyType: 'daily',
        targetDays: [0, 1, 2, 3, 4, 5, 6],
        timeOfDay: 'morning',
        targetType: 'boolean',
        targetValue: 1,
        unit: 'times'
      },
      {
        name: 'Hydrate (500ml Water)',
        description: 'Rehydrate your body right after waking up',
        category: 'health',
        color: '#06b6d4',
        icon: '💧',
        frequencyType: 'daily',
        targetDays: [0, 1, 2, 3, 4, 5, 6],
        timeOfDay: 'morning',
        targetType: 'numeric',
        targetValue: 500,
        unit: 'ml'
      },
      {
        name: '10-Minute Morning Stretch / Yoga',
        description: 'Awaken muscles and improve posture',
        category: 'fitness',
        color: '#f97316',
        icon: '🧘',
        frequencyType: 'daily',
        targetDays: [0, 1, 2, 3, 4, 5, 6],
        timeOfDay: 'morning',
        targetType: 'boolean',
        targetValue: 1,
        unit: 'session'
      },
      {
        name: '5-Minute Mindfulness Meditation',
        description: 'Clear mind and center your thoughts',
        category: 'mindfulness',
        color: '#ec4899',
        icon: '🧠',
        frequencyType: 'daily',
        targetDays: [0, 1, 2, 3, 4, 5, 6],
        timeOfDay: 'morning',
        targetType: 'boolean',
        targetValue: 1,
        unit: 'session'
      },
      {
        name: 'Healthy High-Protein Breakfast',
        description: 'Nutrient-rich fuel for mental clarity',
        category: 'health',
        color: '#10b981',
        icon: '🍳',
        frequencyType: 'daily',
        targetDays: [0, 1, 2, 3, 4, 5, 6],
        timeOfDay: 'morning',
        targetType: 'boolean',
        targetValue: 1,
        unit: 'meal'
      }
    ]
  },
  {
    id: 'starter_productivity',
    name: '⚡ High Performance & Deep Work',
    description: 'Designed for professionals, builders, and students to master time and focus.',
    habits: [
      {
        name: 'Define Top 3 Priorities',
        description: 'Identify the 3 needle-moving tasks before checking messages',
        category: 'productivity',
        color: '#3b82f6',
        icon: '🎯',
        frequencyType: 'weekdays',
        targetDays: [1, 2, 3, 4, 5],
        timeOfDay: 'morning',
        targetType: 'boolean',
        targetValue: 1,
        unit: 'plan'
      },
      {
        name: '90-Min Deep Work Block',
        description: 'Zero distractions, phone on DND, deep focus',
        category: 'productivity',
        color: '#6366f1',
        icon: '💻',
        frequencyType: 'weekdays',
        targetDays: [1, 2, 3, 4, 5],
        timeOfDay: 'morning',
        targetType: 'numeric',
        targetValue: 90,
        unit: 'mins'
      },
      {
        name: 'Inbox Zero & Message Clearing',
        description: 'Batch process email & communications once a day',
        category: 'productivity',
        color: '#0ea5e9',
        icon: '📬',
        frequencyType: 'weekdays',
        targetDays: [1, 2, 3, 4, 5],
        timeOfDay: 'afternoon',
        targetType: 'boolean',
        targetValue: 1,
        unit: 'session'
      },
      {
        name: 'Daily Shutdown & Tomorrow Prep',
        description: 'Review achievements, close tabs, outline tomorrow',
        category: 'routine',
        color: '#a855f7',
        icon: '🏁',
        frequencyType: 'weekdays',
        targetDays: [1, 2, 3, 4, 5],
        timeOfDay: 'evening',
        targetType: 'boolean',
        targetValue: 1,
        unit: 'session'
      }
    ]
  },
  {
    id: 'starter_fitness',
    name: '💪 Health, Fitness & Vitality',
    description: 'Consistent physical workouts, daily step count, and proper hydration.',
    habits: [
      {
        name: 'Gym / Strength Workout',
        description: 'Scheduled on Mon, Wed, Fri',
        category: 'fitness',
        color: '#ef4444',
        icon: '🏋️',
        frequencyType: 'weekdays',
        targetDays: [1, 3, 5], // Mon, Wed, Fri
        timeOfDay: 'afternoon',
        targetType: 'boolean',
        targetValue: 1,
        unit: 'workout'
      },
      {
        name: '8,000+ Daily Steps',
        description: 'Maintain active physical movement throughout the day',
        category: 'fitness',
        color: '#f59e0b',
        icon: '👟',
        frequencyType: 'daily',
        targetDays: [0, 1, 2, 3, 4, 5, 6],
        timeOfDay: 'anytime',
        targetType: 'numeric',
        targetValue: 8000,
        unit: 'steps'
      },
      {
        name: 'Drink 2.5 Liters of Water',
        description: 'Stay hydrated all day long',
        category: 'health',
        color: '#06b6d4',
        icon: '💧',
        frequencyType: 'daily',
        targetDays: [0, 1, 2, 3, 4, 5, 6],
        timeOfDay: 'anytime',
        targetType: 'numeric',
        targetValue: 2500,
        unit: 'ml'
      },
      {
        name: '7.5+ Hours Quality Sleep',
        description: 'Consistent sleep schedule and proper recovery',
        category: 'health',
        color: '#6366f1',
        icon: '😴',
        frequencyType: 'daily',
        targetDays: [0, 1, 2, 3, 4, 5, 6],
        timeOfDay: 'evening',
        targetType: 'numeric',
        targetValue: 8,
        unit: 'hours'
      }
    ]
  },
  {
    id: 'starter_learning',
    name: '📚 Continuous Learning & Mind',
    description: 'Daily reading, skill practice, and evening reflection.',
    habits: [
      {
        name: 'Read 20 Pages of a Book',
        description: 'Non-fiction or inspiring literature',
        category: 'learning',
        color: '#eab308',
        icon: '📖',
        frequencyType: 'daily',
        targetDays: [0, 1, 2, 3, 4, 5, 6],
        timeOfDay: 'evening',
        targetType: 'numeric',
        targetValue: 20,
        unit: 'pages'
      },
      {
        name: 'Learn / Code / Practice Skill',
        description: 'Dedicate 30 mins to building projects or studying',
        category: 'learning',
        color: '#10b981',
        icon: '💻',
        frequencyType: 'weekdays',
        targetDays: [1, 2, 3, 4, 5],
        timeOfDay: 'evening',
        targetType: 'numeric',
        targetValue: 30,
        unit: 'mins'
      },
      {
        name: 'Evening Gratitude Journal',
        description: 'Write down 3 positive things from today',
        category: 'mindfulness',
        color: '#ec4899',
        icon: '✍️',
        frequencyType: 'daily',
        targetDays: [0, 1, 2, 3, 4, 5, 6],
        timeOfDay: 'evening',
        targetType: 'boolean',
        targetValue: 1,
        unit: 'entry'
      }
    ]
  }
];
