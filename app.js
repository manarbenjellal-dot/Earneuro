/* ===================================================
   EARNEURO – Personal Finance App
   Pure HTML/CSS/JS – No dependencies, works offline
   =================================================== */

// ===== STORAGE =====
const DB = {
  get(key, fallback = null) {
    try { const v = localStorage.getItem('earneuro_' + key); return v ? JSON.parse(v) : fallback; } catch { return fallback; }
  },
  set(key, val) { try { localStorage.setItem('earneuro_' + key, JSON.stringify(val)); } catch {} },
  remove(key) { localStorage.removeItem('earneuro_' + key); }
};

// ===== STATE =====
const State = {
  incomes: DB.get('incomes', []),
  expenses: DB.get('expenses', []),
  budgetCategories: DB.get('budgetCategories', [
    { id: 'essentials', name: 'Essentials', iconFn: 'rent', pct: 50, color: '#22c55e' },
    { id: 'savings', name: 'Savings', iconFn: 'savings', pct: 20, color: '#14b8a6' },
    { id: 'investments', name: 'Investments', iconFn: 'invest', pct: 10, color: '#8b5cf6' },
    { id: 'entertainment', name: 'Entertainment', iconFn: 'entertainment', pct: 10, color: '#f97316' },
    { id: 'emergency', name: 'Emergency Fund', iconFn: 'emergency', pct: 10, color: '#ef4444' }
  ]),
  goals: DB.get('goals', []),
  vaults: DB.get('vaults', [
    { id: 'v1', name: 'Savings', iconFn: 'savings', balance: 0, history: [] },
    { id: 'v2', name: 'Emergency Fund', iconFn: 'shield', balance: 0, history: [] },
    { id: 'v3', name: 'Travel Fund', iconFn: 'travel', balance: 0, history: [] }
  ]),
  piggyBank: DB.get('piggyBank', { total: 0, history: [], streak: 0, lastMonth: null }),
  bills: DB.get('bills', []),
  settings: DB.get('settings', {
    currency: 'MAD',
    pin: null,
    pinEnabled: false,
    darkMode: false,
    language: 'en',
    notifSalary: true,
    notifBill: true,
    notifOverspend: true,
    notifBudget: true,
    salaryDay: 1
  }),
  currentPage: 'dashboard',
  calendarDate: new Date(),

  save() {
    DB.set('incomes', this.incomes);
    DB.set('expenses', this.expenses);
    DB.set('budgetCategories', this.budgetCategories);
    DB.set('goals', this.goals);
    DB.set('vaults', this.vaults);
    DB.set('piggyBank', this.piggyBank);
    DB.set('bills', this.bills);
    DB.set('settings', this.settings);
  },

  totalIncome() {
    return this.incomes.filter(i => i.active !== false).reduce((s, i) => {
      let amt = parseFloat(i.amount) || 0;
      if (i.type === 'hourly') amt = amt * (parseFloat(i.hoursPerWeek) || 40) * 4.33;
      return s + amt;
    }, 0);
  },

  thisMonthExpenses() {
    const now = new Date();
    return this.expenses.filter(e => {
      const d = new Date(e.date);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    });
  },

  lastMonthExpenses() {
    const now = new Date();
    const lm = now.getMonth() === 0 ? 11 : now.getMonth() - 1;
    const ly = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();
    return this.expenses.filter(e => {
      const d = new Date(e.date);
      return d.getMonth() === lm && d.getFullYear() === ly;
    });
  },

  thisMonthTotal() { return this.thisMonthExpenses().reduce((s, e) => s + parseFloat(e.amount), 0); },
  remaining() { return this.totalIncome() - this.thisMonthTotal(); }
};

// ===== MIGRATE OLD DATA =====
// Fix budget categories that stored wrong iconFn ('budget' = TV icon)
(function migrateData() {
  const iconMap = {
    essentials: 'rent', savings: 'savings', investments: 'invest',
    entertainment: 'entertainment', emergency: 'emergency'
  };
  State.budgetCategories.forEach(c => {
    if (!c.iconFn || c.iconFn === 'budget') {
      c.iconFn = iconMap[c.id] || 'coin';
    }
  });
  // Fix vaults
  State.vaults.forEach(v => {
    if (!v.iconFn || v.iconFn === 'budget') {
      if (v.id === 'v1') v.iconFn = 'savings';
      else if (v.id === 'v2') v.iconFn = 'shield';
      else if (v.id === 'v3') v.iconFn = 'travel';
      else v.iconFn = 'vaults';
    }
  });
  DB.set('budgetCategories', State.budgetCategories);
  DB.set('vaults', State.vaults);
})();

// ===== I18N =====
const TRANSLATIONS = {
  en: {
    dashboard: 'Dashboard', income: 'Income', budget: 'Budget', expenses: 'Expenses',
    goals: 'Goals', piggybank: 'Piggy Bank', vaults: 'Vaults', analytics: 'Analytics',
    calendar: 'Calendar', settings: 'Settings',
    monthlyIncome: 'Monthly Income', spentThisMonth: 'Spent This Month',
    remaining: 'Remaining', addExpense: '+ Add Expense', addSource: '+ Add Source',
    newGoal: '+ New Goal', addSavings: 'Add Savings', breakPiggy: 'Break Piggy Bank',
    budgetOverview: 'Budget Overview', smartInsights: 'Smart Insights',
    recentExpenses: 'Recent Expenses', activeGoals: 'Active Goals',
    totalLifetimeSavings: 'Total Lifetime Savings', monthStreak: 'Month Streak',
    savingsHistory: 'Savings History', whereMoneyWent: 'Where Did My Money Go?',
    recurringBills: 'Recurring Bills', spending: 'Spending by Category',
    vsLastMonth: 'This Month vs Last Month', savingsTrend: 'Savings Trend (6 months)',
    piggyGrowth: 'Piggy Bank Growth', general: 'General', security: 'Security',
    notifications: 'Notifications', dataManagement: 'Data Management', about: 'About',
    currency: 'Currency', salaryDay: 'Salary Day', darkMode: 'Dark Mode',
    language: 'Language', pinLock: 'PIN Lock', changePIN: 'Change PIN',
    salaryReminder: 'Salary Reminder', billAlerts: 'Bill Alerts',
    overspendWarnings: 'Overspending Warnings', budgetMilestones: 'Budget Milestones',
    exportData: 'Export Data', importData: 'Import Data', wipeData: 'Wipe All Data',
    cancel: 'Cancel', save: 'Save', edit: 'Edit', delete: 'Delete', close: 'Close',
    allTime: 'All Time', thisWeek: 'This Week', thisMonth: 'This Month',
    noExpenses: 'No expenses yet', noGoals: 'No goals yet', noHistory: 'No history yet',
    target: 'Target', allocated: 'Allocated', spent: 'Spent', overall: 'Overall',
    good_morning: 'Good morning', good_afternoon: 'Good afternoon', good_evening: 'Good evening',
    welcome: 'Welcome back', sources: 'source(s)',
    streak: 'month streak', monthsAdded: 'Months Saved', thisMonthAdd: "This Month's Addition",
    deposit: 'Deposit', withdraw: 'Withdraw', newVault: 'New Vault',
    salaryDay_label: 'Day of month you receive salary',
    all: 'All', note: 'Note (optional)', date: 'Date', amount: 'Amount',
    incomeType: 'Income Type', monthlySalary: 'Monthly Salary', hourlyRate: 'Hourly Rate',
    hoursPerWeek: 'Hours / Week', monthlyEst: 'Monthly estimate',
    recurring: 'Recurring (monthly reminder)', sourceName: 'Source Name',
    budgetSplit: 'Budget Split', basedOn: 'Based on', presets: '50/30/20 Rule',
    equalSplit: 'Equal Split', addCategory: '+ Category', totalAllocated: 'Total Allocated',
    pctError: 'Percentages must sum to 100%', used: 'used', remainingLabel: 'Remaining',
    goalName: 'Goal Name', targetAmount: 'Target Amount', targetDate: 'Target Date (optional)',
    savePerMonth: 'Save', toReachGoal: '/month to reach this goal on time',
    achieved: 'Goal Achieved! Congratulations!', addTo: 'Add to',
    currentProgress: 'Current progress', contribution: 'Contribution Amount',
    breakWarning: 'This will withdraw from your piggy bank. Your streak will reset.',
    amountToWithdraw: 'Amount to Withdraw', addLabel: 'Label (optional)',
    billName: 'Bill Name', dueDay: 'Due Day (1-31)', addBill: '+ Add Bill',
    salaryDayLabel: 'Salary Day', billDue: 'Bill Due', spendingSpike: 'Spending Spike',
    hasExpenses: 'Has Expenses', noBills: 'No bills added',
    pinStep1: 'Enter a 4-digit PIN', pinStep2: 'Confirm your PIN',
    pinDisable: 'Disable PIN lock?', pinSet: 'PIN set', pinNoMatch: 'PINs do not match',
    wrongPin: 'Wrong PIN', exportOk: 'Data exported', importOk: 'Data imported',
    importConfirm: 'This will overwrite all current data. Continue?',
    invalidBackup: 'Invalid backup file', wipeConfirm1: 'This will delete ALL your data permanently. Are you sure?',
    wipeConfirm2: 'Are you ABSOLUTELY sure? This cannot be undone.',
    welcomeMsg: 'Welcome! Start by adding your income source.',
    vaultCreated: 'Vault created', vaultDeleted: 'Vault deleted',
    goalSaved: 'Goal saved', goalDeleted: 'Goal deleted', presetApplied: 'Preset applied',
    incomeUpdated: 'Income updated', incomeAdded: 'Income added', deleted: 'Deleted',
    expenseUpdated: 'Expense updated', expenseAdded: 'Expense added',
    piggyAdded: 'added to your Piggy Bank!', piggyWithdrew: 'Withdrew', piggyFrom: 'from Piggy Bank',
    piggyEmpty: 'Your Piggy Bank is empty', budgetExceeded: 'budget exceeded by',
    enterName: 'Enter a name', enterVaultName: 'Enter a vault name',
    enterValid: 'Enter a valid amount', fillFields: 'Fill in all fields',
    insufficientBalance: 'Insufficient balance', amountExceeds: 'Amount exceeds balance',
    pinDisabled: 'PIN disabled', deposited: 'Deposited', withdrew: 'Withdrew',
    to: 'to', from: 'from', category: 'Category', breakPiggyTitle: 'Break Piggy Bank',
    enterPIN: 'Enter your PIN to continue', forgotPIN: 'Forgot PIN? (Reset App)',
    monthsStreak: '-Month Streak!',
  },
  fr: {
    dashboard: 'Tableau de bord', income: 'Revenus', budget: 'Budget', expenses: 'Dépenses',
    goals: 'Objectifs', piggybank: 'Tirelire', vaults: 'Coffres', analytics: 'Analyses',
    calendar: 'Calendrier', settings: 'Paramètres',
    monthlyIncome: 'Revenu Mensuel', spentThisMonth: 'Dépensé ce Mois',
    remaining: 'Restant', addExpense: '+ Ajouter une Dépense', addSource: '+ Ajouter Source',
    newGoal: '+ Nouvel Objectif', addSavings: 'Ajouter Épargne', breakPiggy: 'Casser la Tirelire',
    budgetOverview: 'Aperçu Budget', smartInsights: 'Analyses Intelligentes',
    recentExpenses: 'Dépenses Récentes', activeGoals: 'Objectifs Actifs',
    totalLifetimeSavings: 'Épargne Totale', monthStreak: 'Mois consécutifs',
    savingsHistory: 'Historique des Épargnes', whereMoneyWent: 'Où est parti mon argent?',
    recurringBills: 'Factures Récurrentes', spending: 'Dépenses par Catégorie',
    vsLastMonth: 'Ce Mois vs Mois Dernier', savingsTrend: 'Tendance Épargne (6 mois)',
    piggyGrowth: 'Croissance Tirelire', general: 'Général', security: 'Sécurité',
    notifications: 'Notifications', dataManagement: 'Gestion des Données', about: 'À propos',
    currency: 'Devise', salaryDay: 'Jour de Salaire', darkMode: 'Mode Sombre',
    language: 'Langue', pinLock: 'Verrouillage PIN', changePIN: 'Changer le PIN',
    salaryReminder: 'Rappel Salaire', billAlerts: 'Alertes Factures',
    overspendWarnings: 'Avertissements Dépassement', budgetMilestones: 'Jalons Budget',
    exportData: 'Exporter les Données', importData: 'Importer les Données', wipeData: 'Effacer Toutes les Données',
    cancel: 'Annuler', save: 'Enregistrer', edit: 'Modifier', delete: 'Supprimer', close: 'Fermer',
    allTime: 'Tout Temps', thisWeek: 'Cette Semaine', thisMonth: 'Ce Mois',
    noExpenses: 'Aucune dépense', noGoals: 'Aucun objectif', noHistory: 'Aucun historique',
    target: 'Objectif', allocated: 'Alloué', spent: 'Dépensé', overall: 'Total',
    good_morning: 'Bonjour', good_afternoon: 'Bon après-midi', good_evening: 'Bonsoir',
    welcome: 'Bienvenue', sources: 'source(s)',
    streak: 'mois consécutifs', monthsAdded: 'Mois Épargnés', thisMonthAdd: 'Ajout ce Mois',
    deposit: 'Déposer', withdraw: 'Retirer', newVault: 'Nouveau Coffre',
    salaryDay_label: 'Jour du mois où vous recevez votre salaire',
    all: 'Tout', note: 'Note (optionnel)', date: 'Date', amount: 'Montant',
    incomeType: 'Type de Revenu', monthlySalary: 'Salaire Mensuel', hourlyRate: 'Taux Horaire',
    hoursPerWeek: 'Heures / Semaine', monthlyEst: 'Estimation mensuelle',
    recurring: 'Récurrent (rappel mensuel)', sourceName: 'Nom de la Source',
    budgetSplit: 'Répartition Budget', basedOn: 'Basé sur', presets: 'Règle 50/30/20',
    equalSplit: 'Répartition Égale', addCategory: '+ Catégorie', totalAllocated: 'Total Alloué',
    pctError: 'Les pourcentages doivent totaliser 100%', used: 'utilisé', remainingLabel: 'Restant',
    goalName: "Nom de l'Objectif", targetAmount: 'Montant Cible', targetDate: 'Date Cible (optionnel)',
    savePerMonth: 'Économisez', toReachGoal: '/mois pour atteindre cet objectif à temps',
    achieved: 'Objectif Atteint! Félicitations!', addTo: 'Ajouter à',
    currentProgress: 'Progression actuelle', contribution: 'Montant à Contribuer',
    breakWarning: 'Ceci retirera de votre tirelire. Votre série sera réinitialisée.',
    amountToWithdraw: 'Montant à Retirer', addLabel: 'Étiquette (optionnel)',
    billName: 'Nom de la Facture', dueDay: 'Jour Limite (1-31)', addBill: '+ Ajouter Facture',
    salaryDayLabel: 'Jour de Salaire', billDue: 'Facture Due', spendingSpike: 'Pic de Dépenses',
    hasExpenses: 'A des Dépenses', noBills: 'Aucune facture ajoutée',
    pinStep1: 'Entrez un PIN à 4 chiffres', pinStep2: 'Confirmez votre PIN',
    pinDisable: 'Désactiver le verrouillage PIN?', pinSet: 'PIN défini', pinNoMatch: 'Les PINs ne correspondent pas',
    wrongPin: 'PIN incorrect', exportOk: 'Données exportées', importOk: 'Données importées',
    importConfirm: 'Cela écrasera toutes les données actuelles. Continuer?',
    invalidBackup: 'Fichier de sauvegarde invalide', wipeConfirm1: 'Cela supprimera TOUTES vos données. Êtes-vous sûr?',
    wipeConfirm2: 'Êtes-vous ABSOLUMENT sûr? Cela ne peut pas être annulé.',
    welcomeMsg: 'Bienvenue! Commencez par ajouter votre source de revenus.',
    vaultCreated: 'Coffre créé', vaultDeleted: 'Coffre supprimé',
    goalSaved: 'Objectif enregistré', goalDeleted: 'Objectif supprimé', presetApplied: 'Préréglage appliqué',
    incomeUpdated: 'Revenu mis à jour', incomeAdded: 'Revenu ajouté', deleted: 'Supprimé',
    expenseUpdated: 'Dépense mise à jour', expenseAdded: 'Dépense ajoutée',
    piggyAdded: 'ajouté à votre Tirelire!', piggyWithdrew: 'Retiré', piggyFrom: 'de la Tirelire',
    piggyEmpty: 'Votre Tirelire est vide', budgetExceeded: 'budget dépassé de',
    enterName: 'Entrez un nom', enterVaultName: 'Entrez un nom de coffre',
    enterValid: 'Entrez un montant valide', fillFields: 'Remplissez tous les champs',
    insufficientBalance: 'Solde insuffisant', amountExceeds: 'Le montant dépasse le solde',
    pinDisabled: 'PIN désactivé', deposited: 'Déposé', withdrew: 'Retiré',
    to: 'vers', from: 'depuis', category: 'Catégorie', breakPiggyTitle: 'Casser la Tirelire',
    enterPIN: 'Entrez votre PIN pour continuer', forgotPIN: 'PIN oublié? (Réinitialiser)',
    monthsStreak: ' mois consécutifs!',
  },
  es: {
    dashboard: 'Panel', income: 'Ingresos', budget: 'Presupuesto', expenses: 'Gastos',
    goals: 'Metas', piggybank: 'Alcancía', vaults: 'Bóvedas', analytics: 'Análisis',
    calendar: 'Calendario', settings: 'Ajustes',
    monthlyIncome: 'Ingreso Mensual', spentThisMonth: 'Gastado este Mes',
    remaining: 'Restante', addExpense: '+ Agregar Gasto', addSource: '+ Agregar Fuente',
    newGoal: '+ Nueva Meta', addSavings: 'Agregar Ahorro', breakPiggy: 'Romper Alcancía',
    budgetOverview: 'Resumen de Presupuesto', smartInsights: 'Análisis Inteligentes',
    recentExpenses: 'Gastos Recientes', activeGoals: 'Metas Activas',
    totalLifetimeSavings: 'Ahorro Total', monthStreak: 'Racha Mensual',
    savingsHistory: 'Historial de Ahorros', whereMoneyWent: '¿A dónde fue mi dinero?',
    recurringBills: 'Facturas Recurrentes', spending: 'Gastos por Categoría',
    vsLastMonth: 'Este Mes vs Mes Anterior', savingsTrend: 'Tendencia Ahorro (6 meses)',
    piggyGrowth: 'Crecimiento Alcancía', general: 'General', security: 'Seguridad',
    notifications: 'Notificaciones', dataManagement: 'Gestión de Datos', about: 'Acerca de',
    currency: 'Moneda', salaryDay: 'Día de Salario', darkMode: 'Modo Oscuro',
    language: 'Idioma', pinLock: 'Bloqueo PIN', changePIN: 'Cambiar PIN',
    salaryReminder: 'Recordatorio Salario', billAlerts: 'Alertas de Facturas',
    overspendWarnings: 'Advertencias de Gastos', budgetMilestones: 'Hitos de Presupuesto',
    exportData: 'Exportar Datos', importData: 'Importar Datos', wipeData: 'Borrar Todos los Datos',
    cancel: 'Cancelar', save: 'Guardar', edit: 'Editar', delete: 'Eliminar', close: 'Cerrar',
    allTime: 'Todo el Tiempo', thisWeek: 'Esta Semana', thisMonth: 'Este Mes',
    noExpenses: 'Sin gastos aún', noGoals: 'Sin metas aún', noHistory: 'Sin historial',
    target: 'Meta', allocated: 'Asignado', spent: 'Gastado', overall: 'Total',
    good_morning: 'Buenos días', good_afternoon: 'Buenas tardes', good_evening: 'Buenas noches',
    welcome: 'Bienvenido', sources: 'fuente(s)',
    streak: 'meses consecutivos', monthsAdded: 'Meses Ahorrados', thisMonthAdd: 'Añadido este Mes',
    deposit: 'Depositar', withdraw: 'Retirar', newVault: 'Nueva Bóveda',
    salaryDay_label: 'Día del mes en que recibes tu salario',
    all: 'Todo', note: 'Nota (opcional)', date: 'Fecha', amount: 'Monto',
    incomeType: 'Tipo de Ingreso', monthlySalary: 'Salario Mensual', hourlyRate: 'Tarifa por Hora',
    hoursPerWeek: 'Horas / Semana', monthlyEst: 'Estimación mensual',
    recurring: 'Recurrente (recordatorio mensual)', sourceName: 'Nombre de la Fuente',
    budgetSplit: 'División de Presupuesto', basedOn: 'Basado en', presets: 'Regla 50/30/20',
    equalSplit: 'División Igual', addCategory: '+ Categoría', totalAllocated: 'Total Asignado',
    pctError: 'Los porcentajes deben sumar 100%', used: 'usado', remainingLabel: 'Restante',
    goalName: 'Nombre de la Meta', targetAmount: 'Monto Objetivo', targetDate: 'Fecha Objetivo (opcional)',
    savePerMonth: 'Ahorra', toReachGoal: '/mes para alcanzar esta meta a tiempo',
    achieved: '¡Meta Lograda! ¡Felicidades!', addTo: 'Añadir a',
    currentProgress: 'Progreso actual', contribution: 'Monto a Contribuir',
    breakWarning: 'Esto retirará de tu alcancía. Tu racha se reiniciará.',
    amountToWithdraw: 'Monto a Retirar', addLabel: 'Etiqueta (opcional)',
    billName: 'Nombre de la Factura', dueDay: 'Día de Vencimiento (1-31)', addBill: '+ Agregar Factura',
    salaryDayLabel: 'Día de Salario', billDue: 'Factura Vence', spendingSpike: 'Pico de Gastos',
    hasExpenses: 'Tiene Gastos', noBills: 'No hay facturas añadidas',
    pinStep1: 'Ingresa un PIN de 4 dígitos', pinStep2: 'Confirma tu PIN',
    pinDisable: '¿Desactivar bloqueo PIN?', pinSet: 'PIN establecido', pinNoMatch: 'Los PINs no coinciden',
    wrongPin: 'PIN incorrecto', exportOk: 'Datos exportados', importOk: 'Datos importados',
    importConfirm: 'Esto sobrescribirá todos los datos actuales. ¿Continuar?',
    invalidBackup: 'Archivo de respaldo inválido', wipeConfirm1: 'Esto eliminará TODOS tus datos permanentemente. ¿Estás seguro?',
    wipeConfirm2: '¿Estás ABSOLUTAMENTE seguro? Esto no se puede deshacer.',
    welcomeMsg: '¡Bienvenido! Comienza añadiendo tu fuente de ingresos.',
    vaultCreated: 'Bóveda creada', vaultDeleted: 'Bóveda eliminada',
    goalSaved: 'Meta guardada', goalDeleted: 'Meta eliminada', presetApplied: 'Preset aplicado',
    incomeUpdated: 'Ingreso actualizado', incomeAdded: 'Ingreso añadido', deleted: 'Eliminado',
    expenseUpdated: 'Gasto actualizado', expenseAdded: 'Gasto añadido',
    piggyAdded: 'añadido a tu Alcancía!', piggyWithdrew: 'Retirado', piggyFrom: 'de la Alcancía',
    piggyEmpty: 'Tu Alcancía está vacía', budgetExceeded: 'presupuesto excedido en',
    enterName: 'Ingresa un nombre', enterVaultName: 'Ingresa nombre de bóveda',
    enterValid: 'Ingresa un monto válido', fillFields: 'Completa todos los campos',
    insufficientBalance: 'Saldo insuficiente', amountExceeds: 'El monto excede el saldo',
    pinDisabled: 'PIN desactivado', deposited: 'Depositado', withdrew: 'Retirado',
    to: 'a', from: 'de', category: 'Categoría', breakPiggyTitle: 'Romper Alcancía',
    enterPIN: 'Ingresa tu PIN para continuar', forgotPIN: '¿Olvidaste el PIN? (Restablecer)',
    monthsStreak: ' meses consecutivos!',
  }
};

// T() = translate
function T(key) {
  const lang = State.settings.language || 'en';
  return TRANSLATIONS[lang]?.[key] || TRANSLATIONS.en[key] || key;
}

// ===== CURRENCIES =====
const CURRENCIES = ['MAD','USD','EUR','GBP','CAD','AUD','JPY','CNY','AED','SAR','TND','DZD','EGP','NGN','ZAR','INR','BRL','MXN'];

// ===== EXPENSE CATEGORIES =====
const EXP_CATS = [
  { id: 'food', name: 'Food', iconFn: 'food' },
  { id: 'transport', name: 'Transport', iconFn: 'transport' },
  { id: 'shopping', name: 'Shopping', iconFn: 'shopping' },
  { id: 'utilities', name: 'Utilities', iconFn: 'utilities' },
  { id: 'rent', name: 'Rent', iconFn: 'rent' },
  { id: 'entertainment', name: 'Entertainment', iconFn: 'entertainment' },
  { id: 'health', name: 'Health', iconFn: 'health' },
  { id: 'education', name: 'Education', iconFn: 'education' },
  { id: 'travel', name: 'Travel', iconFn: 'travel' },
  { id: 'subscriptions', name: 'Subscriptions', iconFn: 'subscriptions' },
  { id: 'other', name: 'Other', iconFn: 'other' }
];

// ===== NAVIGATION =====
const PAGES = [
  { id: 'dashboard', iconFn: 'home', labelKey: 'dashboard' },
  { id: 'income', iconFn: 'income', labelKey: 'income' },
  { id: 'budget', iconFn: 'budget', labelKey: 'budget' },
  { id: 'expenses', iconFn: 'expenses', labelKey: 'expenses' },
  { id: 'goals', iconFn: 'goals', labelKey: 'goals' },
  { id: 'piggybank', iconFn: 'piggybank', labelKey: 'piggybank' },
  { id: 'vaults', iconFn: 'vaults', labelKey: 'vaults' },
  { id: 'analytics', iconFn: 'analytics', labelKey: 'analytics' },
  { id: 'calendar', iconFn: 'calendar', labelKey: 'calendar' },
  { id: 'settings', iconFn: 'settings', labelKey: 'settings' }
];
const BOTTOM_PAGES = ['dashboard','income','expenses','goals','piggybank'];

// ===== FORMAT =====
const fmt = (n, currency) => {
  const c = currency || State.settings.currency;
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: c.length === 3 ? c : 'USD', maximumFractionDigits: 0 }).format(n);
};
const fmtDate = d => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

// ===== MODAL =====
const Modal = {
  show(html, onClose) {
    const overlay = document.getElementById('modalOverlay');
    const box = document.getElementById('modalBox');
    box.innerHTML = html;
    overlay.classList.remove('hidden');
    box.querySelector('.modal-close')?.addEventListener('click', () => Modal.hide(onClose));
    overlay.addEventListener('click', e => { if (e.target === overlay) Modal.hide(onClose); }, { once: true });
  },
  hide(cb) {
    document.getElementById('modalOverlay').classList.add('hidden');
    document.getElementById('modalBox').innerHTML = '';
    if (cb) cb();
  }
};

const Toast = {
  show(msg, duration = 2500) {
    const t = document.getElementById('toast');
    t.textContent = msg;
    t.classList.remove('hidden');
    setTimeout(() => t.classList.add('hidden'), duration);
  }
};

// ===== THEME =====
function applyTheme() {
  document.body.classList.toggle('dark', State.settings.darkMode);
  const isDark = State.settings.darkMode;
  document.querySelectorAll('.theme-toggle').forEach(b => { b.innerHTML = isDark ? Icons.sun(20) : Icons.moon(20); });
  document.querySelectorAll('.hamburger').forEach(b => { b.innerHTML = Icons.menu(22); });
  const fab = document.getElementById('fab');
  if (fab) fab.innerHTML = Icons.plus(26);
}

function toggleTheme() {
  State.settings.darkMode = !State.settings.darkMode;
  State.save();
  applyTheme();
}

// ===== NAVIGATION =====
function buildNav() {
  const sidebarNav = document.getElementById('sidebarNav');
  sidebarNav.innerHTML = PAGES.map(p => `
    <li><a class="${p.id === State.currentPage ? 'active' : ''}" data-page="${p.id}">
      <span class="nav-icon">${Icons[p.iconFn](22)}</span> ${T(p.labelKey)}
    </a></li>`).join('');
  sidebarNav.querySelectorAll('a').forEach(a => a.addEventListener('click', () => navigate(a.dataset.page)));

  const bn = document.getElementById('bottomNav');
  bn.innerHTML = `<div class="bottom-nav-items">${BOTTOM_PAGES.map(id => {
    const p = PAGES.find(x => x.id === id);
    return `<button class="bottom-nav-item ${id === State.currentPage ? 'active' : ''}" data-page="${id}">
      <span class="bn-icon">${Icons[p.iconFn](22)}</span><span>${T(p.labelKey)}</span>
    </button>`;
  }).join('')}</div>`;
  bn.querySelectorAll('.bottom-nav-item').forEach(b => b.addEventListener('click', () => navigate(b.dataset.page)));

  const isDark = State.settings.darkMode;
  document.querySelectorAll('.theme-toggle').forEach(b => { b.innerHTML = isDark ? Icons.sun(20) : Icons.moon(20); });
  document.querySelectorAll('.hamburger').forEach(b => { b.innerHTML = Icons.menu(22); });
  const fab = document.getElementById('fab');
  if (fab) fab.innerHTML = Icons.plus(26);
}

function navigate(page) {
  State.currentPage = page;
  const pageObj = PAGES.find(p => p.id === page);
  document.getElementById('topTitle').textContent = pageObj ? T(pageObj.labelKey) : '';
  buildNav();
  renderPage(page);
  document.getElementById('sidebar').classList.remove('open');
}

function renderPage(page) {
  const area = document.getElementById('contentArea');
  area.innerHTML = '';
  const renderers = {
    dashboard: renderDashboard,
    income: renderIncome,
    budget: renderBudget,
    expenses: renderExpenses,
    goals: renderGoals,
    piggybank: renderPiggyBank,
    vaults: renderVaults,
    analytics: renderAnalytics,
    calendar: renderCalendar,
    settings: renderSettings
  };
  (renderers[page] || (() => { area.innerHTML = '<p>Coming soon</p>'; }))();
}

// ===== LOCK / PIN =====
function setupLock() {
  const lock = document.getElementById('lockScreen');
  const app = document.getElementById('app');
  if (!State.settings.pinEnabled || !State.settings.pin) {
    lock.classList.add('hidden');
    app.classList.remove('hidden');
    return;
  }
  lock.classList.remove('hidden');
  app.classList.add('hidden');
  buildPinPad(lock, () => { lock.classList.add('hidden'); app.classList.remove('hidden'); });
}

function buildPinPad(container, onSuccess) {
  let entered = '';
  const dotsEl = document.getElementById('pinDots');
  const pad = document.getElementById('pinPad');
  const lockSub = document.querySelector('.lock-sub');
  if (lockSub) lockSub.textContent = T('enterPIN');
  const forgotBtn = document.getElementById('forgotPin');
  if (forgotBtn) forgotBtn.textContent = T('forgotPIN');
  const keys = ['1','2','3','4','5','6','7','8','9','','0','⌫'];
  pad.innerHTML = keys.map(k => `<button class="pin-btn" data-key="${k}">${k}</button>`).join('');
  pad.querySelectorAll('.pin-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const k = btn.dataset.key;
      if (k === '⌫') { entered = entered.slice(0, -1); }
      else if (k && entered.length < 4) { entered += k; }
      updateDots(entered);
      if (entered.length === 4) {
        if (entered === State.settings.pin) { onSuccess(); }
        else { entered = ''; updateDots(''); Toast.show('Wrong PIN'); }
      }
    });
  });
  document.getElementById('forgotPin')?.addEventListener('click', () => {
    if (confirm('This will WIPE all app data. Are you sure?')) { wipeData(); }
  });

  function updateDots(val) {
    dotsEl.querySelectorAll('span').forEach((s, i) => s.classList.toggle('filled', i < val.length));
  }
}

// ===== DASHBOARD =====
function renderDashboard() {
  const area = document.getElementById('contentArea');
  const income = State.totalIncome();
  const spent = State.thisMonthTotal();
  const remaining = income - spent;
  const savings = income * (State.budgetCategories.find(c => c.id === 'savings')?.pct || 20) / 100;
  const spentPct = income > 0 ? Math.min(100, (spent / income) * 100) : 0;
  const now = new Date();
  const monthName = now.toLocaleString('default', { month: 'long' });

  // Last month comparison
  const lastSpent = State.lastMonthExpenses().reduce((s, e) => s + parseFloat(e.amount), 0);
  const spentChange = lastSpent > 0 ? ((spent - lastSpent) / lastSpent * 100).toFixed(0) : 0;

  // Top category
  const catTotals = {};
  State.thisMonthExpenses().forEach(e => { catTotals[e.category] = (catTotals[e.category] || 0) + parseFloat(e.amount); });
  const topCat = Object.entries(catTotals).sort((a,b) => b[1]-a[1])[0];
  const topCatInfo = EXP_CATS.find(c => c.id === topCat?.[0]);

  area.innerHTML = `
    <div class="dashboard-header">
      <div class="greeting">Good ${getGreeting()}, <span>Welcome back</span></div>
      <div style="font-size:14px;color:var(--text3)">${monthName} ${now.getFullYear()}</div>
    </div>

    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-icon" style="color:var(--green)">${Icons.wallet(28)}</div>
        <div class="stat-label">${T('monthlyIncome')}</div>
        <div class="stat-value">${fmt(income)}</div>
        <div class="stat-change">${State.incomes.filter(i=>i.active!==false).length} ${T('sources')}</div>
      </div>
      <div class="stat-card">
        <div class="stat-icon" style="color:var(--red)">${Icons.trending_down(28)}</div>
        <div class="stat-label">${T('spentThisMonth')}</div>
        <div class="stat-value">${fmt(spent)}</div>
        <div class="stat-change ${parseFloat(spentChange) > 0 ? 'up' : 'down'}">${spentChange > 0 ? '▲' : '▼'} ${Math.abs(spentChange)}% vs last month</div>
      </div>
      <div class="stat-card">
        <div class="stat-icon" style="color:var(--green)">${Icons.trending_up(28)}</div>
        <div class="stat-label">${T('remaining')}</div>
        <div class="stat-value" style="color:${remaining >= 0 ? 'var(--green)' : 'var(--red)'}">${fmt(remaining)}</div>
        <div class="stat-change">${spentPct.toFixed(0)}% of budget used</div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">${Icons.piggybank(28)}</div>
        <div class="stat-label">${T('piggybank')}</div>
        <div class="stat-value" style="color:var(--green)">${fmt(State.piggyBank.total)}</div>
        <div class="stat-change" style="display:flex;align-items:center;gap:4px">${Icons.fire(14)} ${State.piggyBank.streak} ${T('streak')}</div>
      </div>
    </div>

    <!-- Budget Overview -->
    <div class="dashboard-row">
      <div class="card">
        <div class="section-header">
          <span class="section-title">${T('budgetOverview')}</span>
          <button class="see-all" onclick="navigate('budget')">${T('edit')} →</button>
        </div>
        <div style="margin-bottom:12px;">
          <div style="display:flex;justify-content:space-between;font-size:13px;color:var(--text3);margin-bottom:6px;">
            <span>Overall: ${fmt(spent)} of ${fmt(income)}</span>
            <span>${spentPct.toFixed(0)}%</span>
          </div>
          <div class="progress-wrap"><div class="progress-bar ${spentPct > 80 ? 'danger' : spentPct > 60 ? 'warning' : ''}" style="width:${spentPct}%"></div></div>
        </div>
        ${State.budgetCategories.slice(0,4).map(cat => {
          const allocated = income * cat.pct / 100;
          const usedAmt = catTotals[cat.id] || 0;
          const usedPct = allocated > 0 ? Math.min(100, usedAmt / allocated * 100) : 0;
          return `<div class="budget-item">
            <div class="budget-item-header">
              <span class="budget-cat-name">${Icons[cat.iconFn] ? Icons[cat.iconFn](28) : Icons.budget(28)} ${cat.name}</span>
              <span class="budget-amounts">${fmt(usedAmt)} / ${fmt(allocated)}</span>
            </div>
            <div class="progress-wrap"><div class="progress-bar ${usedPct > 100 ? 'danger' : usedPct > 80 ? 'warning' : ''}" style="width:${Math.min(100,usedPct)}%;background:${cat.color}"></div></div>
          </div>`;
        }).join('')}
      </div>

      <!-- Insights -->
      <div class="card">
        <div class="section-header">
          <span class="section-title">${T('smartInsights')}</span>
        </div>
        ${generateInsights(income, spent, catTotals, savings)}
      </div>
    </div>

    <!-- Recent Expenses + Goals -->
    <div class="dashboard-row">
      <div class="card">
        <div class="section-header">
          <span class="section-title">${T('recentExpenses')}</span>
          <button class="see-all" onclick="navigate('expenses')">${T('all')} →</button>
        </div>
        ${renderRecentExpenses()}
      </div>
      <div class="card">
        <div class="section-header">
          <span class="section-title">${T('activeGoals')}</span>
          <button class="see-all" onclick="navigate('goals')">${T('all')} →</button>
        </div>
        ${renderGoalsMini()}
      </div>
    </div>
  `;
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'morning';
  if (h < 18) return 'afternoon';
  return 'evening';
}

function generateInsights(income, spent, catTotals, savingsAlloc) {
  const insights = [];
  const lastCatTotals = {};
  State.lastMonthExpenses().forEach(e => { lastCatTotals[e.category] = (lastCatTotals[e.category] || 0) + parseFloat(e.amount); });

  State.budgetCategories.forEach(cat => {
    const allocated = income * cat.pct / 100;
    const used = catTotals[cat.id] || 0;
    if (used > allocated && allocated > 0) {
      insights.push({ type: 'warning', icon: Icons.alertTriangle(20), text: `You've <strong>exceeded your ${cat.name} budget</strong> by ${fmt(used - allocated)}.` });
    }
  });

  EXP_CATS.forEach(cat => {
    const cur = catTotals[cat.id] || 0;
    const last = lastCatTotals[cat.id] || 0;
    if (last > 0 && cur > last * 1.3 && cur > 100) {
      const pct = Math.round((cur - last) / last * 100);
      insights.push({ type: 'warning', icon: Icons.analytics(20), text: `You spent <strong>${pct}% more on ${cat.name}</strong> this month vs last month.` });
    }
  });

  const subSpend = catTotals['subscriptions'] || 0;
  if (subSpend > 100) {
    insights.push({ type: 'info', icon: Icons.info(20), text: `You could save <strong>${fmt(subSpend * 0.3)}</strong> by reviewing your subscriptions.` });
  }

  const actualSavings = income - spent;
  if (actualSavings >= savingsAlloc && savingsAlloc > 0) {
    insights.push({ type: 'success', icon: Icons.check(20), text: `Great job! You're on track with savings this month.` });
  } else if (income > 0 && spent > income * 0.9) {
    insights.push({ type: 'warning', icon: Icons.alertTriangle(20), text: `You've spent <strong>${((spent/income)*100).toFixed(0)}%</strong> of your income. Watch your spending!` });
  }

  const activeGoals = State.goals.filter(g => !g.completed);
  if (activeGoals.length > 0) {
    const g = activeGoals[0];
    const left = g.target - (g.saved || 0);
    if (g.targetDate) {
      const months = Math.max(1, Math.ceil((new Date(g.targetDate) - new Date()) / (1000 * 60 * 60 * 24 * 30)));
      insights.push({ type: 'info', icon: Icons.goals(20), text: `Save <strong>${fmt(left / months)}/month</strong> to reach your "${g.name}" goal on time.` });
    }
  }

  if (insights.length === 0) {
    insights.push({ type: 'success', icon: Icons.check(20), text: `Everything looks good! Keep tracking your expenses.` });
  }

  return insights.slice(0, 4).map(i => `
    <div class="insight-card ${i.type}">
      <span class="insight-icon">${i.icon}</span>
      <span class="insight-text">${i.text}</span>
    </div>`).join('');
}

function renderRecentExpenses() {
  const recent = [...State.expenses].sort((a,b) => new Date(b.date) - new Date(a.date)).slice(0, 5);
  if (!recent.length) return `<div class="empty-state"><div class="empty-icon" style="color:var(--text3)">${Icons.expenses(48)}</div><div class="empty-title">No expenses yet</div></div>`;
  return recent.map(e => {
    const cat = EXP_CATS.find(c => c.id === e.category) || { iconFn: 'other', name: 'Other' };
    return `<div class="expense-item">
      <div class="expense-icon-wrap" style="color:var(--green-dark)">${Icons[cat.iconFn](22)}</div>
      <div class="expense-info">
        <div class="expense-name">${e.note || cat.name}</div>
        <div class="expense-cat">${cat.name} · ${fmtDate(e.date)}</div>
      </div>
      <div>
        <div class="expense-amount">-${fmt(e.amount)}</div>
      </div>
    </div>`;
  }).join('');
}

function renderGoalsMini() {
  const goals = State.goals.filter(g => !g.completed).slice(0, 3);
  if (!goals.length) return `<div class="empty-state"><div style="color:var(--text3);display:flex;justify-content:center">${Icons.goals(48)}</div><div class="empty-title">No goals yet</div><button class="btn btn-primary btn-sm" onclick="navigate('goals')" style="margin-top:12px">Add Goal</button></div>`;
  return goals.map(g => {
    const pct = g.target > 0 ? Math.min(100, (g.saved || 0) / g.target * 100) : 0;
    return `<div style="margin-bottom:16px">
      <div class="budget-item-header">
        <span class="budget-cat-name"><span style="display:inline-flex;align-items:center;justify-content:center;width:24px;height:24px;border-radius:50%;background:var(--green-muted);color:var(--green-dark);font-size:13px;font-weight:700">${g.name.charAt(0).toUpperCase()}</span> ${g.name}</span>
        <span class="goal-pct">${pct.toFixed(0)}%</span>
      </div>
      <div class="progress-wrap"><div class="progress-bar" style="width:${pct}%"></div></div>
      <div style="font-size:12px;color:var(--text3);margin-top:4px">${fmt(g.saved||0)} / ${fmt(g.target)}</div>
    </div>`;
  }).join('');
}

// ===== INCOME PAGE =====
function renderIncome() {
  const area = document.getElementById('contentArea');
  const total = State.totalIncome();
  area.innerHTML = `
    <div class="income-total-card">
      <div class="total-label">Total Monthly Income</div>
      <div class="total-amount">${fmt(total)}</div>
      <div class="total-currency">${State.settings.currency}</div>
    </div>
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">
      <h2 style="font-size:18px;font-weight:700">Income Sources</h2>
      <button class="btn btn-primary" onclick="openAddIncomeModal()">+ Add Source</button>
    </div>
    <div id="incomeList"></div>
  `;
  renderIncomeList();
}

function renderIncomeList() {
  const list = document.getElementById('incomeList');
  if (!list) return;
  if (!State.incomes.length) {
    list.innerHTML = `<div class="empty-state"><div class="empty-icon" style="color:var(--text3)">${Icons.income(48)}</div><div class="empty-title">No income sources</div><div class="empty-sub">Add your salary or other income</div></div>`;
    return;
  }
  list.innerHTML = State.incomes.map(inc => {
    let display = parseFloat(inc.amount) || 0;
    let typeLabel = inc.type === 'hourly' ? `${fmt(inc.amount)} /hr × ${inc.hoursPerWeek}h/wk` : 'Monthly salary';
    if (inc.type === 'hourly') display = display * (parseFloat(inc.hoursPerWeek) || 40) * 4.33;
    return `<div class="income-source-card" style="${inc.active === false ? 'opacity:0.5' : ''}">
      <div style="color:var(--green)">${Icons.income(28)}</div>
      <div class="income-source-info">
        <div class="income-source-name">${inc.name}</div>
        <div class="income-source-type">${typeLabel} ${inc.recurring ? '· Recurring' : ''}</div>
      </div>
      <div style="text-align:right">
        <div class="income-source-amount">${fmt(display)} /mo</div>
        <div style="font-size:12px;color:var(--text3)">${inc.currency || State.settings.currency}</div>
      </div>
      <div style="display:flex;gap:6px">
        <button class="btn-icon" onclick="editIncome('${inc.id}')" title="Edit">${Icons.edit(18)}</button>
        <button class="btn-icon" onclick="toggleIncome('${inc.id}')" title="${inc.active === false ? 'Enable' : 'Pause'}">${inc.active === false ? Icons.play(18) : Icons.pause(18)}</button>
        <button class="btn-icon" onclick="deleteIncome('${inc.id}')" title="Delete">${Icons.trash(18)}</button>
      </div>
    </div>`;
  }).join('');
}

function openAddIncomeModal(editId = null) {
  const inc = editId ? State.incomes.find(i => i.id === editId) : null;
  Modal.show(`
    <div class="modal-header">
      <span class="modal-title">${inc ? 'Edit' : 'Add'} Income Source</span>
      <button class="modal-close" aria-label="Close">${Icons.close(20)}</button>
    </div>
    <div class="form-group">
      <label class="form-label">Source Name</label>
      <input class="form-input" id="inc_name" placeholder="e.g. Main Job, Freelancing" value="${inc?.name||''}">
    </div>
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">Currency</label>
        <select class="form-select" id="inc_currency">
          ${CURRENCIES.map(c => `<option ${(inc?.currency||State.settings.currency)===c?'selected':''}>${c}</option>`).join('')}
        </select>
      </div>
    </div>
    <div class="form-group">
      <label class="form-label">Income Type</label>
      <select class="form-select" id="inc_type" onchange="toggleHours(this.value)">
        <option value="monthly" ${inc?.type==='monthly'?'selected':''}>Monthly Salary</option>
        <option value="hourly" ${inc?.type==='hourly'?'selected':''}>Hourly Rate</option>
      </select>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">Amount</label>
        <input class="form-input" id="inc_amount" type="number" placeholder="0.00" value="${inc?.amount||''}">
      </div>
      <div class="form-group" id="hoursGroup" style="${inc?.type==='hourly'?'':'display:none'}">
        <label class="form-label">Hours / Week</label>
        <input class="form-input" id="inc_hours" type="number" placeholder="40" value="${inc?.hoursPerWeek||40}">
      </div>
    </div>
    <div class="form-group" id="monthlyPreview" style="background:var(--green-muted);border-radius:10px;padding:12px;display:${inc?.type==='hourly'?'block':'none'}">
      <span style="color:var(--green-dark);font-weight:600">Monthly estimate: <span id="monthlyEst">0</span></span>
    </div>
    <div class="form-group">
      <label style="display:flex;align-items:center;gap:10px;cursor:pointer">
        <input type="checkbox" id="inc_recurring" ${inc?.recurring?'checked':''}>
        <span class="form-label" style="margin:0">Recurring (monthly reminder)</span>
      </label>
    </div>
    <div class="modal-footer">
      <button class="btn btn-secondary" onclick="Modal.hide()">Cancel</button>
      <button class="btn btn-primary" onclick="saveIncome('${editId||''}')">Save</button>
    </div>
  `);

  // Live hourly estimate
  const updateEst = () => {
    const amt = parseFloat(document.getElementById('inc_amount')?.value) || 0;
    const hrs = parseFloat(document.getElementById('inc_hours')?.value) || 40;
    const est = document.getElementById('monthlyEst');
    if (est) est.textContent = fmt(amt * hrs * 4.33);
  };
  document.getElementById('inc_amount')?.addEventListener('input', updateEst);
  document.getElementById('inc_hours')?.addEventListener('input', updateEst);
  if (inc?.type === 'hourly') updateEst();
}

window.toggleHours = function(type) {
  document.getElementById('hoursGroup').style.display = type === 'hourly' ? '' : 'none';
  document.getElementById('monthlyPreview').style.display = type === 'hourly' ? 'block' : 'none';
};

window.saveIncome = function(editId) {
  const name = document.getElementById('inc_name').value.trim();
  const amount = document.getElementById('inc_amount').value;
  if (!name || !amount) { Toast.show('Please fill in all fields'); return; }
  const data = {
    id: editId || uid(), name,
    type: document.getElementById('inc_type').value,
    amount: parseFloat(amount),
    hoursPerWeek: parseFloat(document.getElementById('inc_hours')?.value) || 40,
    currency: document.getElementById('inc_currency').value,
    recurring: document.getElementById('inc_recurring').checked,
    active: true
  };
  if (editId) { const i = State.incomes.findIndex(x => x.id === editId); State.incomes[i] = data; }
  else { State.incomes.push(data); }
  State.save();
  Modal.hide();
  renderIncome();
  Toast.show(editId ? 'Income updated' : 'Income added');
};

window.editIncome = id => openAddIncomeModal(id);
window.toggleIncome = id => {
  const i = State.incomes.find(x => x.id === id);
  if (i) { i.active = i.active === false ? true : false; State.save(); renderIncome(); }
};
window.deleteIncome = id => {
  if (!confirm('Delete this income source?')) return;
  State.incomes = State.incomes.filter(i => i.id !== id);
  State.save(); renderIncome(); Toast.show('Deleted');
};

// ===== BUDGET PAGE =====
function renderBudget() {
  const area = document.getElementById('contentArea');
  const income = State.totalIncome();
  const totalPct = State.budgetCategories.reduce((s, c) => s + c.pct, 0);
  const catTotals = {};
  State.thisMonthExpenses().forEach(e => { catTotals[e.category] = (catTotals[e.category] || 0) + parseFloat(e.amount); });

  area.innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;flex-wrap:wrap;gap:12px">
      <div>
        <h2 style="font-size:22px;font-weight:700">${T('budgetSplit')}</h2>
        <p style="color:var(--text3);font-size:14px">${T('basedOn')} ${fmt(income)} monthly income</p>
      </div>
      <div style="display:flex;gap:10px;flex-wrap:wrap">
        <button class="btn btn-secondary btn-sm" onclick="applyPreset('503020')">50/30/20 Rule</button>
        <button class="btn btn-secondary btn-sm" onclick="applyPreset('equal')">Equal Split</button>
        <button class="btn btn-primary btn-sm" onclick="openAddBudgetCatModal()">+ Category</button>
      </div>
    </div>

    <div class="card" style="margin-bottom:20px">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
        <span style="font-weight:600">Total Allocated</span>
        <span id="pctTotal" style="font-weight:700;color:${totalPct===100?'var(--green)':'var(--red)'}">${totalPct}%</span>
      </div>
      <div class="progress-wrap"><div class="progress-bar ${totalPct>100?'danger':''}" style="width:${Math.min(100,totalPct)}%"></div></div>
      ${totalPct !== 100 ? `<p style="color:var(--red);font-size:13px;margin-top:8px">⚠️ Percentages must sum to 100% (currently ${totalPct}%)</p>` : ''}
    </div>

    <div id="budgetCatList">
      ${State.budgetCategories.map(cat => {
        const allocated = income * cat.pct / 100;
        const used = catTotals[cat.id] || 0;
        const usedPct = allocated > 0 ? Math.min(100, used / allocated * 100) : 0;
        return `<div class="card" style="margin-bottom:14px">
          <div style="display:flex;align-items:center;gap:12px">
            <div style="font-size:32px;display:flex;align-items:center;justify-content:center;width:48px;height:48px;border-radius:12px;background:var(--green-muted)">${Icons[cat.iconFn] ? Icons[cat.iconFn](28) : Icons.budget(28)}</div>
            <div style="flex:1">
              <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px">
                <span style="font-weight:700;font-size:16px">${cat.name}</span>
                <div style="display:flex;align-items:center;gap:8px">
                  <button class="btn-icon" onclick="editBudgetCat('${cat.id}')" title="Edit">${Icons.edit(18)}</button>
                  <button class="btn-icon" onclick="deleteBudgetCat('${cat.id}')" title="Delete">${Icons.trash(18)}</button>
                </div>
              </div>
              <div style="display:flex;justify-content:space-between;font-size:13px;color:var(--text2);margin-bottom:6px">
                <span>Allocated: <strong>${fmt(allocated)}</strong> (${cat.pct}%)</span>
                <span>Spent: <strong style="color:${usedPct>100?'var(--red)':'var(--text)'}">${fmt(used)}</strong></span>
              </div>
              <div class="progress-wrap">
                <div class="progress-bar ${usedPct>100?'danger':usedPct>80?'warning':''}" style="width:${Math.min(100,usedPct)}%;background:${cat.color}"></div>
              </div>
              <div style="display:flex;justify-content:space-between;font-size:12px;color:var(--text3);margin-top:4px">
                <span>${usedPct.toFixed(0)}% used</span>
                <span>Remaining: ${fmt(Math.max(0, allocated - used))}</span>
              </div>
            </div>
          </div>
        </div>`;
      }).join('')}
    </div>

    <div class="card" style="margin-top:8px">
      <div class="section-title" style="margin-bottom:16px">Where Did My Money Go?</div>
      ${renderWhereMoneyWent(catTotals, income)}
    </div>
  `;
}

function renderWhereMoneyWent(catTotals, income) {
  const entries = Object.entries(catTotals).sort((a,b) => b[1]-a[1]);
  if (!entries.length) return `<div class="empty-state"><div class="empty-icon" style="color:var(--text3);display:flex;justify-content:center">${Icons.expenses(48)}</div><div class="empty-title">No expenses this month</div></div>`;
  return entries.map(([catId, amt]) => {
    const cat = EXP_CATS.find(c => c.id === catId) || { iconFn: 'other', name: catId };
    const pct = income > 0 ? (amt / income * 100).toFixed(1) : 0;
    return `<div class="budget-item">
      <div class="budget-item-header">
        <span class="budget-cat-name">${Icons[cat.iconFn] ? Icons[cat.iconFn](22) : Icons.other(22)} ${cat.name}</span>
        <span class="budget-amounts">${fmt(amt)} · ${pct}%</span>
      </div>
      <div class="progress-wrap"><div class="progress-bar" style="width:${Math.min(100,parseFloat(pct)*2)}%"></div></div>
    </div>`;
  }).join('');
}

window.applyPreset = function(preset) {
  if (preset === '503020') {
    const presets = { essentials: 50, savings: 20, investments: 10, entertainment: 10, emergency: 10 };
    State.budgetCategories.forEach(c => { if (presets[c.id] !== undefined) c.pct = presets[c.id]; });
  } else if (preset === 'equal') {
    const p = Math.floor(100 / State.budgetCategories.length);
    State.budgetCategories.forEach((c, i) => c.pct = i === 0 ? 100 - p * (State.budgetCategories.length - 1) : p);
  }
  State.save(); renderBudget(); Toast.show('Preset applied');
};

function openAddBudgetCatModal(editId = null) {
  const cat = editId ? State.budgetCategories.find(c => c.id === editId) : null;
  Modal.show(`
    <div class="modal-header">
      <span class="modal-title">${cat ? 'Edit' : 'Add'} Budget Category</span>
      <button class="modal-close" aria-label="Close">${Icons.close(20)}</button>
    </div>
    <div class="form-group"><label class="form-label">Name</label>
      <input class="form-input" id="bc_name" value="${cat?.name||''}"></div>
    <div class="form-row">
      <div class="form-group"><label class="form-label">Percentage %</label>
        <input class="form-input" id="bc_pct" type="number" min="0" max="100" value="${cat?.pct||10}"></div>
    </div>
    <div class="form-group"><label class="form-label">Color</label>
      <input class="form-input" id="bc_color" type="color" value="${cat?.color||'#22c55e'}" style="height:44px"></div>
    <div class="modal-footer">
      <button class="btn btn-secondary" onclick="Modal.hide()">Cancel</button>
      <button class="btn btn-primary" onclick="saveBudgetCat('${editId||''}')">Save</button>
    </div>
  `);
}

window.saveBudgetCat = function(editId) {
  const name = document.getElementById('bc_name').value.trim();
  if (!name) { Toast.show('Enter a name'); return; }
  const existingCat = editId ? State.budgetCategories.find(c => c.id === editId) : null;
  const data = {
    id: editId || uid(), name,
    iconFn: existingCat?.iconFn || 'budget',
    pct: parseFloat(document.getElementById('bc_pct').value) || 10,
    color: document.getElementById('bc_color').value
  };
  if (editId) { const i = State.budgetCategories.findIndex(c => c.id === editId); State.budgetCategories[i] = data; }
  else { State.budgetCategories.push(data); }
  State.save(); Modal.hide(); renderBudget();
};
window.editBudgetCat = id => openAddBudgetCatModal(id);
window.deleteBudgetCat = id => {
  if (!confirm('Delete this category?')) return;
  State.budgetCategories = State.budgetCategories.filter(c => c.id !== id);
  State.save(); renderBudget();
};

// ===== EXPENSES PAGE =====
function renderExpenses() {
  const area = document.getElementById('contentArea');
  const thisMonth = State.thisMonthExpenses();
  const total = thisMonth.reduce((s, e) => s + parseFloat(e.amount), 0);

  // Filter state
  let filterCat = area.dataset?.filterCat || 'all';
  let filterPeriod = area.dataset?.filterPeriod || 'month';

  let filtered = filterPeriod === 'month' ? State.thisMonthExpenses() :
    filterPeriod === 'week' ? getThisWeekExpenses() : State.expenses;
  if (filterCat !== 'all') filtered = filtered.filter(e => e.category === filterCat);
  filtered = [...filtered].sort((a,b) => new Date(b.date) - new Date(a.date));

  area.innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;flex-wrap:wrap;gap:12px">
      <div>
        <h2 style="font-size:22px;font-weight:700">Expenses</h2>
        <p style="color:var(--text3);font-size:14px">This month: <strong style="color:var(--red)">${fmt(total)}</strong></p>
      </div>
      <button class="btn btn-primary" onclick="openAddExpenseModal()">+ Add Expense</button>
    </div>

    <!-- Period Filter -->
    <div style="display:flex;gap:8px;margin-bottom:16px;flex-wrap:wrap">
      ${['month','week','all'].map(p => `<button class="btn btn-sm ${filterPeriod===p?'btn-primary':'btn-secondary'}" onclick="setExpFilter('${p}','${filterCat}')">${p==='month'?'This Month':p==='week'?'This Week':'All Time'}</button>`).join('')}
    </div>

    <!-- Category Chips -->
    <div class="cat-chips" style="margin-bottom:16px">
      <div class="cat-chip ${filterCat==='all'?'selected':''}" onclick="setExpFilter('${filterPeriod}','all')">All</div>
      ${EXP_CATS.map(c => `<div class="cat-chip ${filterCat===c.id?'selected':''}" onclick="setExpFilter('${filterPeriod}','${c.id}')">${Icons[c.iconFn](18)} ${c.name}</div>`).join('')}
    </div>

    <!-- Expense list -->
    <div class="card">
      ${filtered.length === 0 ? `<div class="empty-state"><div class="empty-icon" style="color:var(--text3);display:flex;justify-content:center">${Icons.expenses(48)}</div><div class="empty-title">No expenses found</div></div>` :
        filtered.map(e => {
          const cat = EXP_CATS.find(c => c.id === e.category) || { iconFn: 'other', name: 'Other' };
          return `<div class="expense-item">
            <div class="expense-icon-wrap">${Icons[cat.iconFn](22)}</div>
            <div class="expense-info">
              <div class="expense-name">${e.note || cat.name}</div>
              <div class="expense-cat">${cat.name} · ${fmtDate(e.date)}</div>
            </div>
            <div style="text-align:right">
              <div class="expense-amount">-${fmt(e.amount)}</div>
            </div>
            <div style="display:flex;gap:4px">
              <button class="btn-icon" onclick="editExpense('${e.id}')" title="Edit">${Icons.edit(18)}</button>
              <button class="btn-icon" onclick="deleteExpense('${e.id}')" title="Delete">${Icons.trash(18)}</button>
            </div>
          </div>`;
        }).join('')}
    </div>
  `;

  area.dataset.filterCat = filterCat;
  area.dataset.filterPeriod = filterPeriod;
}

window.setExpFilter = function(period, cat) {
  const area = document.getElementById('contentArea');
  area.dataset.filterPeriod = period;
  area.dataset.filterCat = cat;
  renderExpenses();
};

function getThisWeekExpenses() {
  const now = new Date();
  const startOfWeek = new Date(now); startOfWeek.setDate(now.getDate() - now.getDay());
  return State.expenses.filter(e => new Date(e.date) >= startOfWeek);
}

function openAddExpenseModal(editId = null) {
  const exp = editId ? State.expenses.find(e => e.id === editId) : null;
  Modal.show(`
    <div class="modal-header">
      <span class="modal-title">${exp ? 'Edit' : 'Add'} Expense</span>
      <button class="modal-close" aria-label="Close">${Icons.close(20)}</button>
    </div>
    <div class="form-group">
      <label class="form-label">Amount</label>
      <div class="input-prefix">
        <span class="input-prefix-label">${State.settings.currency}</span>
        <input class="form-input" id="exp_amount" type="number" placeholder="0.00" value="${exp?.amount||''}" style="padding-left:56px" autofocus>
      </div>
    </div>
    <div class="form-group">
      <label class="form-label">Category</label>
      <div class="cat-chips" id="expCatChips">
        ${EXP_CATS.map(c => `<div class="cat-chip ${(exp?.category||'food')===c.id?'selected':''}" onclick="selectExpCat('${c.id}')" data-cat="${c.id}">${Icons[c.iconFn](18)} ${c.name}</div>`).join('')}
      </div>
      <input type="hidden" id="exp_category" value="${exp?.category||'food'}">
    </div>
    <div class="form-group">
      <label class="form-label">Note (optional)</label>
      <input class="form-input" id="exp_note" placeholder="What was this for?" value="${exp?.note||''}">
    </div>
    <div class="form-group">
      <label class="form-label">Date</label>
      <input class="form-input" id="exp_date" type="date" value="${exp?.date || new Date().toISOString().split('T')[0]}">
    </div>
    <div class="modal-footer">
      <button class="btn btn-secondary" onclick="Modal.hide()">Cancel</button>
      <button class="btn btn-primary" onclick="saveExpense('${editId||''}')">Save</button>
    </div>
  `);
}

window.selectExpCat = function(id) {
  document.getElementById('exp_category').value = id;
  document.querySelectorAll('#expCatChips .cat-chip').forEach(c => c.classList.toggle('selected', c.dataset.cat === id));
};

window.saveExpense = function(editId) {
  const amount = parseFloat(document.getElementById('exp_amount').value);
  if (!amount || amount <= 0) { Toast.show('Enter a valid amount'); return; }
  const data = {
    id: editId || uid(),
    amount,
    category: document.getElementById('exp_category').value,
    note: document.getElementById('exp_note').value.trim(),
    date: document.getElementById('exp_date').value
  };
  if (editId) { const i = State.expenses.findIndex(e => e.id === editId); State.expenses[i] = data; }
  else { State.expenses.push(data); }
  State.save();
  Modal.hide();
  if (State.currentPage === 'expenses') renderExpenses();
  else if (State.currentPage === 'dashboard') renderDashboard();
  Toast.show(editId ? 'Expense updated' : 'Expense added');
  checkOverspendWarning(data);
};

window.editExpense = id => openAddExpenseModal(id);
window.deleteExpense = id => {
  if (!confirm('Delete this expense?')) return;
  State.expenses = State.expenses.filter(e => e.id !== id);
  State.save(); renderExpenses(); Toast.show('Deleted');
};

function checkOverspendWarning(newExpense) {
  if (!State.settings.notifOverspend) return;
  const income = State.totalIncome();
  if (income === 0) return;
  const catTotals = {};
  State.thisMonthExpenses().forEach(e => { catTotals[e.category] = (catTotals[e.category] || 0) + parseFloat(e.amount); });
  State.budgetCategories.forEach(cat => {
    const allocated = income * cat.pct / 100;
    const used = catTotals[cat.id] || 0;
    if (used > allocated && allocated > 0) {
      Toast.show(`${cat.name} budget exceeded by ${fmt(used - allocated)}!`, 4000);
    }
  });
}

// ===== GOALS PAGE =====
function renderGoals() {
  const area = document.getElementById('contentArea');
  area.innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;flex-wrap:wrap;gap:12px">
      <h2 style="font-size:22px;font-weight:700">Savings Goals</h2>
      <button class="btn btn-primary" onclick="openAddGoalModal()">+ New Goal</button>
    </div>
    <div id="goalsList"></div>
  `;
  renderGoalsList();
}

function renderGoalsList() {
  const list = document.getElementById('goalsList');
  if (!list) return;
  if (!State.goals.length) {
    list.innerHTML = `<div class="empty-state"><div class="empty-icon" style="color:var(--text3);display:flex;justify-content:center">${Icons.goals(48)}</div><div class="empty-title">No goals yet</div><div class="empty-sub">Create a savings goal to start tracking</div></div>`;
    return;
  }
  list.innerHTML = State.goals.map(g => {
    const pct = g.target > 0 ? Math.min(100, (g.saved || 0) / g.target * 100) : 0;
    const left = Math.max(0, g.target - (g.saved || 0));
    let monthlyNeeded = null;
    if (g.targetDate && left > 0) {
      const months = Math.max(1, Math.ceil((new Date(g.targetDate) - new Date()) / (1000 * 60 * 60 * 24 * 30)));
      monthlyNeeded = left / months;
    }
    return `<div class="goal-card ${g.completed ? 'goal-complete' : ''}">
      <div class="goal-header">
        <div style="display:flex;align-items:center;gap:12px">
          <div class="goal-icon" style="display:flex;align-items:center;justify-content:center;width:48px;height:48px;border-radius:50%;background:var(--green-muted);color:var(--green-dark);font-size:20px;font-weight:700">${g.name.charAt(0).toUpperCase()}</div>
          <div>
            <div class="goal-name">${g.name}${g.completed ? ' — Achieved!' : ''}</div>
            <div class="goal-target">Target: ${fmt(g.target)} ${g.targetDate ? '· by ' + fmtDate(g.targetDate) : ''}</div>
          </div>
        </div>
        <div style="display:flex;gap:6px">
          <button class="btn-icon" onclick="openContributeModal('${g.id}')" title="Add">${Icons.plus(18)}</button>
          <button class="btn-icon" onclick="openAddGoalModal('${g.id}')" title="Edit">${Icons.edit(18)}</button>
          <button class="btn-icon" onclick="deleteGoal('${g.id}')" title="Delete">${Icons.trash(18)}</button>
        </div>
      </div>
      <div class="progress-wrap" style="height:14px">
        <div class="progress-bar" style="width:${pct}%"></div>
      </div>
      <div class="goal-footer">
        <div>
          <span style="font-size:15px;font-weight:700;color:var(--green)">${fmt(g.saved||0)}</span>
          <span style="font-size:13px;color:var(--text3)"> / ${fmt(g.target)}</span>
        </div>
        <div class="goal-pct">${pct.toFixed(0)}%</div>
      </div>
      ${monthlyNeeded ? `<div style="font-size:13px;color:var(--text2);margin-top:8px">Save <strong>${fmt(monthlyNeeded)}/month</strong> to reach this goal on time</div>` : ''}
      ${g.completed ? `<div style="text-align:center;font-size:18px;font-weight:700;color:var(--green);margin-top:10px;animation:goalPop 0.5s">Goal Achieved! Congratulations!</div>` : ''}
    </div>`;
  }).join('');
}

function openAddGoalModal(editId = null) {
  const g = editId ? State.goals.find(x => x.id === editId) : null;
  Modal.show(`
    <div class="modal-header">
      <span class="modal-title">${g ? 'Edit' : 'New'} Goal</span>
      <button class="modal-close" aria-label="Close">${Icons.close(20)}</button>
    </div>
    <div class="form-group">
      <label class="form-label">Goal Name</label>
      <input class="form-input" id="g_name" placeholder="e.g. New Phone" value="${g?.name||''}">
    </div>
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">Target Amount</label>
        <input class="form-input" id="g_target" type="number" placeholder="0.00" value="${g?.target||''}">
      </div>
      <div class="form-group">
        <label class="form-label">Target Date (optional)</label>
        <input class="form-input" id="g_date" type="date" value="${g?.targetDate||''}">
      </div>
    </div>
    <div class="modal-footer">
      <button class="btn btn-secondary" onclick="Modal.hide()">Cancel</button>
      <button class="btn btn-primary" onclick="saveGoal('${editId||''}')">Save</button>
    </div>
  `);
}

window.selectGoalIcon = function(icon) {
  document.getElementById('g_icon').value = icon;
  document.querySelectorAll('#goalIconPicker .cat-chip').forEach(c => c.classList.toggle('selected', c.dataset.icon === icon));
};

window.saveGoal = function(editId) {
  const name = document.getElementById('g_name').value.trim();
  const target = parseFloat(document.getElementById('g_target').value);
  if (!name || !target) { Toast.show('Fill in all fields'); return; }
  const data = {
    id: editId || uid(), name, target,
    targetDate: document.getElementById('g_date').value,
    saved: editId ? State.goals.find(g => g.id === editId)?.saved || 0 : 0,
    completed: false
  };
  if (editId) { const i = State.goals.findIndex(g => g.id === editId); State.goals[i] = data; }
  else { State.goals.push(data); }
  State.save(); Modal.hide(); renderGoals(); Toast.show('Goal saved');
};

window.openContributeModal = function(id) {
  const g = State.goals.find(x => x.id === id);
  if (!g) return;
  Modal.show(`
    <div class="modal-header">
      <span class="modal-title">Add to ${g.name}</span>
      <button class="modal-close" aria-label="Close">${Icons.close(20)}</button>
    </div>
    <div style="text-align:center;margin-bottom:16px">
      <div style="font-size:14px;color:var(--text3)">Current progress</div>
      <div style="font-size:28px;font-weight:800;color:var(--green)">${fmt(g.saved||0)} / ${fmt(g.target)}</div>
    </div>
    <div class="form-group">
      <label class="form-label">Contribution Amount</label>
      <input class="form-input" id="contrib_amount" type="number" placeholder="0.00" autofocus>
    </div>
    <div class="modal-footer">
      <button class="btn btn-secondary" onclick="Modal.hide()">Cancel</button>
      <button class="btn btn-primary" onclick="saveContribution('${id}')">Add</button>
    </div>
  `);
};

window.saveContribution = function(id) {
  const g = State.goals.find(x => x.id === id);
  const amt = parseFloat(document.getElementById('contrib_amount').value);
  if (!amt || amt <= 0) { Toast.show('Enter a valid amount'); return; }
  g.saved = (g.saved || 0) + amt;
  if (g.saved >= g.target) { g.completed = true; }
  State.save(); Modal.hide(); renderGoals();
  if (g.completed) Toast.show('Goal achieved! Congratulations!', 4000);
  else Toast.show(`+${fmt(amt)} added to ${g.name}`);
};

window.deleteGoal = id => {
  if (!confirm('Delete this goal?')) return;
  State.goals = State.goals.filter(g => g.id !== id);
  State.save(); renderGoals(); Toast.show('Deleted');
};

// ===== PIGGY BANK PAGE =====
function renderPiggyBank() {
  const area = document.getElementById('contentArea');
  const pb = State.piggyBank;
  area.innerHTML = `
    <div class="piggy-hero">
      <div class="piggy-anim-wrap" id="piggyAnimWrap">
        <div class="piggy-anim" id="piggyAnim" onclick="piggyTap()" title="Tap me!">
          <img src="assets/piggy.svg" alt="Piggy Bank" draggable="false"/>
        </div>
      </div>
      <div class="piggy-total">${fmt(pb.total)}</div>
      <div class="piggy-label">${T('totalLifetimeSavings')}</div>
      ${pb.streak > 0 ? `<div style="margin-top:14px">
        <span class="streak-badge">${Icons.fire(16)} ${pb.streak}${T('monthsStreak')}</span>
      </div>` : ''}
    </div>

    <div class="grid-2" style="margin-bottom:20px;gap:14px">
      <div class="card" style="text-align:center">
        <div style="color:var(--green);display:flex;justify-content:center;margin-bottom:8px">${Icons.calendar(28)}</div>
        <div style="font-size:13px;color:var(--text3)">${T('thisMonthAdd')}</div>
        <div style="font-size:22px;font-weight:700;color:var(--green);margin-top:4px">${fmt(calcThisMonthSavings())}</div>
      </div>
      <div class="card" style="text-align:center">
        <div style="color:var(--green);display:flex;justify-content:center;margin-bottom:8px">${Icons.star(28)}</div>
        <div style="font-size:13px;color:var(--text3)">${T('monthsAdded')}</div>
        <div style="font-size:22px;font-weight:700;color:var(--green);margin-top:4px">${pb.history.filter(h=>h.amount>0).length}</div>
      </div>
    </div>

    <div style="display:flex;gap:10px;margin-bottom:20px;flex-wrap:wrap">
      <button class="btn btn-primary" style="display:flex;align-items:center;gap:8px" onclick="addToPiggy()">
        ${Icons.plus(18)} ${T('addSavings')}
      </button>
      <button class="btn btn-danger" style="display:flex;align-items:center;gap:8px" onclick="breakPiggyBank()">
        ${Icons.trash(18)} ${T('breakPiggy')}
      </button>
    </div>

    <div class="card">
      <div class="section-header">
        <span class="section-title">${T('savingsHistory')}</span>
      </div>
      ${pb.history.length === 0 ? `<div class="empty-state">
        <div style="color:var(--text3);display:flex;justify-content:center">${Icons.piggybank(56)}</div>
        <div class="empty-title">No history yet</div>
        <div class="empty-sub">Add savings to get started</div>
      </div>` :
        [...pb.history].reverse().map(h => `
          <div class="history-item">
            <div>
              <div style="font-size:14px;font-weight:600">${h.label || (h.amount > 0 ? 'Savings Added' : 'Withdrawal')}</div>
              <div class="history-date">${fmtDate(h.date)}</div>
            </div>
            <div class="history-amount ${h.amount > 0 ? 'positive' : 'negative'}">${h.amount > 0 ? '+' : ''}${fmt(h.amount)}</div>
          </div>`).join('')}
    </div>
  `;
}

function calcThisMonthSavings() {
  const income = State.totalIncome();
  const spent = State.thisMonthTotal();
  const savingsPct = State.budgetCategories.find(c => c.id === 'savings')?.pct || 20;
  return Math.max(0, income * savingsPct / 100 - Math.max(0, spent - income * (1 - savingsPct / 100)));
}

window.piggyTap = function() {
  const pig = document.getElementById('piggyAnim');
  pig.classList.remove('shake');
  void pig.offsetWidth;
  pig.classList.add('shake');
  spawnDollarBurst();
};

function spawnDollarBurst() {
  const wrap = document.getElementById('piggyAnimWrap');
  if (!wrap) return;
  const rect = wrap.getBoundingClientRect();
  const cx = rect.left + rect.width / 2;
  const cy = rect.top + rect.height / 2;
  const count = 8;
  for (let i = 0; i < count; i++) {
    setTimeout(() => {
      const el = document.createElement('div');
      el.className = 'dollar-burst';
      const angle = (360 / count) * i + (Math.random() * 20 - 10);
      const dist = 60 + Math.random() * 50;
      const rad = (angle * Math.PI) / 180;
      const tx = Math.cos(rad) * dist;
      const ty = Math.sin(rad) * dist - 30;
      el.style.cssText = `left:${cx}px;top:${cy}px;--tx:${tx}px;--ty:${ty}px;font-size:${18 + Math.random() * 14}px;`;
      el.textContent = '$';
      document.body.appendChild(el);
      setTimeout(() => el.remove(), 900);
    }, i * 60);
  }
}

window.addToPiggy = function() {
  Modal.show(`
    <div class="modal-header">
      <span class="modal-title">Add to Piggy Bank</span>
      <button class="modal-close" aria-label="Close">${Icons.close(20)}</button>
    </div>
    <div class="form-group">
      <label class="form-label">Amount to Add</label>
      <input class="form-input" id="pb_amount" type="number" placeholder="0.00" autofocus>
    </div>
    <div class="form-group">
      <label class="form-label">Label (optional)</label>
      <input class="form-input" id="pb_label" placeholder="e.g. Monthly savings">
    </div>
    <div class="modal-footer">
      <button class="btn btn-secondary" onclick="Modal.hide()">Cancel</button>
      <button class="btn btn-primary" onclick="confirmAddPiggy()">Add</button>
    </div>
  `);
};

window.confirmAddPiggy = function() {
  const amt = parseFloat(document.getElementById('pb_amount').value);
  if (!amt || amt <= 0) { Toast.show('Enter a valid amount'); return; }
  const label = document.getElementById('pb_label').value.trim() || 'Savings Added';
  const pb = State.piggyBank;
  pb.total += amt;
  pb.history.push({ date: new Date().toISOString(), amount: amt, label });
  // Streak logic
  const now = new Date();
  const thisMonthKey = `${now.getFullYear()}-${now.getMonth()}`;
  if (pb.lastMonth !== thisMonthKey) {
    const prevMonthKey = `${now.getMonth() === 0 ? now.getFullYear()-1 : now.getFullYear()}-${now.getMonth() === 0 ? 11 : now.getMonth()-1}`;
    pb.streak = pb.lastMonth === prevMonthKey ? pb.streak + 1 : 1;
    pb.lastMonth = thisMonthKey;
  }
  State.save(); Modal.hide();
  renderPiggyBank();
  spawnDollarBurst();
  Toast.show(`+${fmt(amt)} added to your Piggy Bank!`, 3000);
};

window.breakPiggyBank = function() {
  const pb = State.piggyBank;
  if (pb.total <= 0) { Toast.show('Your Piggy Bank is empty'); return; }
  Modal.show(`
    <div class="modal-header">
      <span class="modal-title">Break Piggy Bank</span>
      <button class="modal-close" aria-label="Close">${Icons.close(20)}</button>
    </div>
    <div style="text-align:center;padding:20px;background:var(--bg3);border-radius:12px;margin-bottom:20px">
      <div style="color:var(--red);display:flex;justify-content:center;margin-bottom:8px">${Icons.piggybank(56)}</div>
      <div style="font-size:24px;font-weight:800;color:var(--red);margin-top:8px">${fmt(pb.total)}</div>
      <p style="color:var(--text3);font-size:14px;margin-top:8px">This will withdraw from your piggy bank. Your streak will reset.</p>
    </div>
    <div class="form-group">
      <label class="form-label">Amount to Withdraw</label>
      <input class="form-input" id="pb_withdraw" type="number" placeholder="0.00" max="${pb.total}">
    </div>
    <div class="modal-footer">
      <button class="btn btn-secondary" onclick="Modal.hide()">Cancel</button>
      <button class="btn btn-danger" onclick="confirmWithdraw()">Withdraw</button>
    </div>
  `);
};

window.confirmWithdraw = function() {
  const amt = parseFloat(document.getElementById('pb_withdraw').value);
  const pb = State.piggyBank;
  if (!amt || amt <= 0) { Toast.show('Enter a valid amount'); return; }
  if (amt > pb.total) { Toast.show('Amount exceeds balance'); return; }
  pb.total -= amt;
  pb.history.push({ date: new Date().toISOString(), amount: -amt, label: 'Withdrawal' });
  pb.streak = 0;
  State.save(); Modal.hide(); renderPiggyBank();
  Toast.show(`Withdrew ${fmt(amt)} from Piggy Bank`);
};

// ===== VAULTS PAGE =====
function renderVaults() {
  const area = document.getElementById('contentArea');
  const totalVaults = State.vaults.reduce((s, v) => s + v.balance, 0);
  area.innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;flex-wrap:wrap;gap:12px">
      <div>
        <h2 style="font-size:22px;font-weight:700">Savings Vaults</h2>
        <p style="color:var(--text3);font-size:14px">Total across vaults: <strong style="color:var(--green)">${fmt(totalVaults)}</strong></p>
      </div>
      <button class="btn btn-primary" onclick="openAddVaultModal()">+ New Vault</button>
    </div>
    <div id="vaultsList"></div>
  `;
  renderVaultsList();
}

function renderVaultsList() {
  const list = document.getElementById('vaultsList');
  if (!list) return;
  if (!State.vaults.length) {
    list.innerHTML = `<div class="empty-state"><div class="empty-icon" style="color:var(--text3);display:flex;justify-content:center">${Icons.vaults(48)}</div><div class="empty-title">No vaults yet</div></div>`;
    return;
  }
  list.innerHTML = State.vaults.map(v => `
    <div class="vault-card">
      <div class="vault-header">
        <div class="vault-name">${Icons[v.iconFn] ? Icons[v.iconFn](24) : Icons.vaults(24)} ${v.name}</div>
        <div style="display:flex;gap:6px">
          <button class="btn-icon" onclick="vaultDeposit('${v.id}')" title="Deposit">${Icons.plus(18)}</button>
          <button class="btn-icon" onclick="vaultWithdraw('${v.id}')" title="Withdraw">${Icons.trending_down(18)}</button>
          <button class="btn-icon" onclick="deleteVault('${v.id}')" title="Delete">${Icons.trash(18)}</button>
        </div>
      </div>
      <div class="vault-balance">${fmt(v.balance)}</div>
      ${v.history && v.history.length ? `
        <div style="margin-top:12px;border-top:1px solid var(--border);padding-top:12px">
          ${v.history.slice(-3).reverse().map(h => `
            <div style="display:flex;justify-content:space-between;font-size:13px;padding:4px 0">
              <span style="color:var(--text3)">${fmtDate(h.date)} · ${h.label||'Transaction'}</span>
              <span style="color:${h.amount>0?'var(--green)':'var(--red)'}; font-weight:600">${h.amount>0?'+':''}${fmt(h.amount)}</span>
            </div>`).join('')}
        </div>` : ''}
    </div>`).join('');
}

function openAddVaultModal() {
  Modal.show(`
    <div class="modal-header">
      <span class="modal-title">New Vault</span>
      <button class="modal-close" aria-label="Close">${Icons.close(20)}</button>
    </div>
    <div class="form-group"><label class="form-label">Vault Name</label>
      <input class="form-input" id="v_name" placeholder="e.g. Travel Fund"></div>
    <div class="modal-footer">
      <button class="btn btn-secondary" onclick="Modal.hide()">Cancel</button>
      <button class="btn btn-primary" onclick="saveVault()">Create Vault</button>
    </div>
  `);
}

window.selectVaultIcon = function(ic) {
  document.getElementById('v_icon').value = ic;
  document.querySelectorAll('#vaultIconPicker .cat-chip').forEach(c => c.classList.toggle('selected', c.dataset.icon === ic));
};

window.saveVault = function() {
  const name = document.getElementById('v_name').value.trim();
  if (!name) { Toast.show('Enter a vault name'); return; }
  State.vaults.push({ id: uid(), name, iconFn: 'vaults', balance: 0, history: [] });
  State.save(); Modal.hide(); renderVaults(); Toast.show('Vault created');
};

window.vaultDeposit = function(id) {
  openVaultTxModal(id, 'deposit');
};
window.vaultWithdraw = function(id) {
  openVaultTxModal(id, 'withdraw');
};

function openVaultTxModal(id, type) {
  const v = State.vaults.find(x => x.id === id);
  Modal.show(`
    <div class="modal-header">
      <span class="modal-title">${type==='deposit'?'Deposit to':'Withdraw from'} ${v.name}</span>
      <button class="modal-close" aria-label="Close">${Icons.close(20)}</button>
    </div>
    <div style="text-align:center;margin-bottom:16px">
      <div style="font-size:13px;color:var(--text3)">Current balance</div>
      <div style="font-size:28px;font-weight:800;color:var(--green)">${fmt(v.balance)}</div>
    </div>
    <div class="form-group"><label class="form-label">Amount</label>
      <input class="form-input" id="vt_amount" type="number" placeholder="0.00" autofocus></div>
    <div class="form-group"><label class="form-label">Label (optional)</label>
      <input class="form-input" id="vt_label" placeholder="${type==='deposit'?'e.g. Monthly deposit':'e.g. Emergency withdrawal'}"></div>
    <div class="modal-footer">
      <button class="btn btn-secondary" onclick="Modal.hide()">Cancel</button>
      <button class="btn ${type==='deposit'?'btn-primary':'btn-danger'}" onclick="saveVaultTx('${id}','${type}')">${type==='deposit'?'Deposit':'Withdraw'}</button>
    </div>
  `);
}

window.saveVaultTx = function(id, type) {
  const v = State.vaults.find(x => x.id === id);
  const amt = parseFloat(document.getElementById('vt_amount').value);
  if (!amt || amt <= 0) { Toast.show('Enter a valid amount'); return; }
  if (type === 'withdraw' && amt > v.balance) { Toast.show('Insufficient balance'); return; }
  const delta = type === 'deposit' ? amt : -amt;
  v.balance += delta;
  if (!v.history) v.history = [];
  v.history.push({ date: new Date().toISOString(), amount: delta, label: document.getElementById('vt_label').value.trim() || (type==='deposit'?'Deposit':'Withdrawal') });
  State.save(); Modal.hide(); renderVaults();
  Toast.show(`${type==='deposit'?'Deposited':'Withdrew'} ${fmt(amt)} ${type==='deposit'?'to':'from'} ${v.name}`);
};

window.deleteVault = id => {
  if (!confirm('Delete this vault? Balance will be lost.')) return;
  State.vaults = State.vaults.filter(v => v.id !== id);
  State.save(); renderVaults(); Toast.show('Vault deleted');
};

// ===== ANALYTICS PAGE =====
function renderAnalytics() {
  const area = document.getElementById('contentArea');
  area.innerHTML = `
    <h2 style="font-size:22px;font-weight:700;margin-bottom:20px">Analytics</h2>
    <div class="grid-2" style="gap:20px;margin-bottom:20px">
      <div class="card">
        <div class="section-title" style="margin-bottom:16px">Spending by Category</div>
        <div class="pie-chart-container"><canvas id="pieChart"></canvas></div>
        <div id="pieLegend"></div>
      </div>
      <div class="card">
        <div class="section-title" style="margin-bottom:16px">This Month vs Last Month</div>
        <div class="bar-chart-container"><canvas id="barChart"></canvas></div>
      </div>
    </div>
    <div class="grid-2" style="gap:20px">
      <div class="card">
        <div class="section-title" style="margin-bottom:16px">Savings Trend (6 months)</div>
        <div class="line-chart-container"><canvas id="lineChart"></canvas></div>
      </div>
      <div class="card">
        <div class="section-title" style="margin-bottom:16px">Piggy Bank Growth</div>
        <div class="line-chart-container"><canvas id="piggyChart"></canvas></div>
      </div>
    </div>
  `;
  drawCharts();
}

function drawCharts() {
  const isDark = State.settings.darkMode;
  const textColor = isDark ? '#e2f8e2' : '#1a2e1a';
  const gridColor = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)';

  // PIE CHART
  const catTotals = {};
  State.thisMonthExpenses().forEach(e => { catTotals[e.category] = (catTotals[e.category] || 0) + parseFloat(e.amount); });
  const pieLabels = Object.keys(catTotals).map(k => EXP_CATS.find(c => c.id === k)?.name || k);
  const pieData = Object.values(catTotals);
  const pieColors = ['#22c55e','#14b8a6','#8b5cf6','#f97316','#ef4444','#eab308','#3b82f6','#ec4899','#06b6d4','#84cc16','#a78bfa'];

  if (pieData.length) {
    drawPieChart('pieChart', pieLabels, pieData, pieColors);
    const legend = document.getElementById('pieLegend');
    if (legend) {
      legend.innerHTML = `<div style="display:flex;flex-wrap:wrap;gap:8px;margin-top:8px">` +
        pieLabels.map((l, i) => `<div style="display:flex;align-items:center;gap:4px;font-size:12px">
          <div style="width:10px;height:10px;border-radius:50%;background:${pieColors[i%pieColors.length]}"></div>${l}
        </div>`).join('') + `</div>`;
    }
  } else {
    const c = document.getElementById('pieChart'); if (c) { const ctx = c.getContext('2d'); ctx.font = '14px sans-serif'; ctx.fillStyle = textColor; ctx.textAlign = 'center'; ctx.fillText('No expenses this month', c.width/2, c.height/2); }
  }

  // BAR CHART
  const thisCats = {}; State.thisMonthExpenses().forEach(e => { thisCats[e.category] = (thisCats[e.category] || 0) + parseFloat(e.amount); });
  const lastCats = {}; State.lastMonthExpenses().forEach(e => { lastCats[e.category] = (lastCats[e.category] || 0) + parseFloat(e.amount); });
  const allCats = [...new Set([...Object.keys(thisCats), ...Object.keys(lastCats)])];
  const barLabels = allCats.map(k => EXP_CATS.find(c => c.id === k)?.name || k);
  drawBarChart('barChart', barLabels, allCats.map(k => thisCats[k]||0), allCats.map(k => lastCats[k]||0), isDark);

  // LINE CHART – savings trend
  const months = getLast6Months();
  const savingsTrend = months.map(m => {
    const mExpenses = State.expenses.filter(e => { const d = new Date(e.date); return d.getMonth() === m.month && d.getFullYear() === m.year; });
    const income = State.totalIncome();
    const spent = mExpenses.reduce((s, e) => s + parseFloat(e.amount), 0);
    return Math.max(0, income - spent);
  });
  drawLineChart('lineChart', months.map(m => m.label), savingsTrend, '#22c55e', 'Remaining', isDark);

  // PIGGY BANK CHART
  const piggyByMonth = {};
  State.piggyBank.history.forEach(h => {
    const d = new Date(h.date);
    const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
    piggyByMonth[key] = (piggyByMonth[key] || 0) + h.amount;
  });
  let runningTotal = 0;
  const piggyTrend = months.map(m => {
    const key = `${m.year}-${String(m.month+1).padStart(2,'0')}`;
    runningTotal += piggyByMonth[key] || 0;
    return runningTotal;
  });
  drawLineChart('piggyChart', months.map(m => m.label), piggyTrend, '#f97316', 'Piggy Bank', isDark);
}

function getLast6Months() {
  const result = [];
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    result.push({ year: d.getFullYear(), month: d.getMonth(), label: d.toLocaleString('default', { month: 'short' }) });
  }
  return result;
}

function drawPieChart(id, labels, data, colors) {
  const canvas = document.getElementById(id);
  if (!canvas) return;
  canvas.width = 200; canvas.height = 200;
  const ctx = canvas.getContext('2d');
  const total = data.reduce((s, v) => s + v, 0);
  if (!total) return;
  let startAngle = -Math.PI / 2;
  const cx = 100, cy = 100, r = 80;
  data.forEach((v, i) => {
    const slice = (v / total) * Math.PI * 2;
    ctx.beginPath(); ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, r, startAngle, startAngle + slice);
    ctx.closePath(); ctx.fillStyle = colors[i % colors.length]; ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.4)'; ctx.lineWidth = 2; ctx.stroke();
    startAngle += slice;
  });
  // Donut hole
  ctx.beginPath(); ctx.arc(cx, cy, 40, 0, Math.PI * 2);
  ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--bg2').trim() || '#fff';
  ctx.fill();
}

function drawBarChart(id, labels, thisData, lastData, isDark) {
  const canvas = document.getElementById(id);
  if (!canvas) return;
  const container = canvas.parentElement;
  canvas.width = container.clientWidth || 300;
  canvas.height = 200;
  const ctx = canvas.getContext('2d');
  const textColor = isDark ? '#e2f8e2' : '#1a2e1a';
  const gridColor = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)';
  const max = Math.max(...thisData, ...lastData, 1);
  const pad = { top: 20, right: 16, bottom: 40, left: 50 };
  const W = canvas.width - pad.left - pad.right;
  const H = canvas.height - pad.top - pad.bottom;
  const n = labels.length || 1;
  const groupW = W / n;
  const barW = Math.min(20, groupW * 0.35);

  // Grid
  for (let i = 0; i <= 4; i++) {
    const y = pad.top + H - (H * i / 4);
    ctx.strokeStyle = gridColor; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(pad.left, y); ctx.lineTo(pad.left + W, y); ctx.stroke();
    ctx.fillStyle = textColor; ctx.font = '10px sans-serif'; ctx.textAlign = 'right';
    ctx.fillText(Math.round(max * i / 4), pad.left - 4, y + 4);
  }

  labels.forEach((l, i) => {
    const x = pad.left + i * groupW + groupW / 2;
    const h1 = (thisData[i] / max) * H;
    const h2 = (lastData[i] / max) * H;
    ctx.fillStyle = '#22c55e';
    ctx.fillRect(x - barW - 2, pad.top + H - h1, barW, h1);
    ctx.fillStyle = '#bbf7d0';
    ctx.fillRect(x + 2, pad.top + H - h2, barW, h2);
    ctx.fillStyle = textColor; ctx.font = '10px sans-serif'; ctx.textAlign = 'center';
    ctx.fillText(l.slice(0,5), x, pad.top + H + 16);
  });

  // Legend
  ctx.fillStyle = '#22c55e'; ctx.fillRect(pad.left, pad.top - 16, 12, 10);
  ctx.fillStyle = textColor; ctx.font = '11px sans-serif'; ctx.textAlign = 'left';
  ctx.fillText('This month', pad.left + 16, pad.top - 7);
  ctx.fillStyle = '#bbf7d0'; ctx.fillRect(pad.left + 100, pad.top - 16, 12, 10);
  ctx.fillStyle = textColor; ctx.fillText('Last month', pad.left + 116, pad.top - 7);
}

function drawLineChart(id, labels, data, color, label, isDark) {
  const canvas = document.getElementById(id);
  if (!canvas) return;
  const container = canvas.parentElement;
  canvas.width = container.clientWidth || 300;
  canvas.height = 180;
  const ctx = canvas.getContext('2d');
  const textColor = isDark ? '#e2f8e2' : '#1a2e1a';
  const gridColor = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)';
  const max = Math.max(...data, 1);
  const pad = { top: 20, right: 16, bottom: 30, left: 50 };
  const W = canvas.width - pad.left - pad.right;
  const H = canvas.height - pad.top - pad.bottom;

  // Grid
  for (let i = 0; i <= 4; i++) {
    const y = pad.top + H - (H * i / 4);
    ctx.strokeStyle = gridColor; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(pad.left, y); ctx.lineTo(pad.left + W, y); ctx.stroke();
    ctx.fillStyle = textColor; ctx.font = '10px sans-serif'; ctx.textAlign = 'right';
    ctx.fillText(Math.round(max * i / 4 / 100) * 100, pad.left - 4, y + 4);
  }

  // Area fill
  const pts = data.map((v, i) => [pad.left + (i / Math.max(data.length - 1, 1)) * W, pad.top + H - (v / max) * H]);
  ctx.beginPath(); ctx.moveTo(pts[0][0], pad.top + H);
  pts.forEach(([x, y]) => ctx.lineTo(x, y));
  ctx.lineTo(pts[pts.length-1][0], pad.top + H); ctx.closePath();
  const grad = ctx.createLinearGradient(0, pad.top, 0, pad.top + H);
  grad.addColorStop(0, color + '44'); grad.addColorStop(1, color + '00');
  ctx.fillStyle = grad; ctx.fill();

  // Line
  ctx.beginPath(); ctx.strokeStyle = color; ctx.lineWidth = 2.5; ctx.lineJoin = 'round';
  pts.forEach(([x, y], i) => i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y));
  ctx.stroke();

  // Dots
  pts.forEach(([x, y]) => {
    ctx.beginPath(); ctx.arc(x, y, 4, 0, Math.PI*2);
    ctx.fillStyle = color; ctx.fill();
    ctx.strokeStyle = isDark ? '#1a2e1a' : '#fff'; ctx.lineWidth = 2; ctx.stroke();
  });

  // Labels
  labels.forEach((l, i) => {
    const [x] = pts[i];
    ctx.fillStyle = textColor; ctx.font = '11px sans-serif'; ctx.textAlign = 'center';
    ctx.fillText(l, x, pad.top + H + 16);
  });
}

// ===== CALENDAR PAGE =====
function renderCalendar() {
  const area = document.getElementById('contentArea');
  const d = State.calendarDate;
  const year = d.getFullYear(), month = d.getMonth();
  const monthName = d.toLocaleString('default', { month: 'long', year: 'numeric' });
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = new Date();

  // Build expense map
  const expMap = {};
  State.expenses.forEach(e => { const k = e.date?.slice(0,10); if (k) expMap[k] = (expMap[k] || 0) + parseFloat(e.amount); });

  // Bills map
  const billDays = State.bills.filter(b => b.active !== false).map(b => b.day);

  // Avg daily spend for spike detection
  const monthExp = Object.entries(expMap).filter(([k]) => { const dd = new Date(k); return dd.getMonth() === month && dd.getFullYear() === year; });
  const avg = monthExp.length ? monthExp.reduce((s,[,v]) => s+v, 0) / monthExp.length : 0;

  let cells = '';
  // Empty cells before first day
  for (let i = 0; i < firstDay; i++) cells += `<div class="cal-day other-month"></div>`;

  for (let day = 1; day <= daysInMonth; day++) {
    const dateKey = `${year}-${String(month+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
    const daySpend = expMap[dateKey] || 0;
    const isToday = day === today.getDate() && month === today.getMonth() && year === today.getFullYear();
    const isSalaryDay = day === State.settings.salaryDay;
    const isBillDay = billDays.includes(day);
    const isSpike = daySpend > avg * 2 && daySpend > 0;
    let cls = 'cal-day';
    if (isToday) cls += ' today';
    if (isSalaryDay) cls += ' has-salary';
    else if (isBillDay) cls += ' has-bill';
    if (isSpike) cls += ' spike';
    cells += `<div class="${cls}" onclick="showDayDetail('${dateKey}')">
      <div class="cal-day-num">${day}</div>
      <div class="cal-dots">
        ${isSalaryDay ? '<span class="cal-dot salary" title="Salary Day"></span>' : ''}
        ${isBillDay ? '<span class="cal-dot bill" title="Bill Due"></span>' : ''}
        ${daySpend > 0 ? '<span class="cal-dot expense" title="Expenses"></span>' : ''}
      </div>
      ${daySpend > 0 ? `<div style="font-size:10px;color:var(--text3);margin-top:2px">${fmt(daySpend)}</div>` : ''}
    </div>`;
  }

  area.innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;flex-wrap:wrap;gap:12px">
      <h2 style="font-size:22px;font-weight:700">Calendar</h2>
      <button class="btn btn-primary btn-sm" onclick="openAddBillModal()">+ Add Bill</button>
    </div>

    <div class="card" style="margin-bottom:20px">
      <div class="cal-header">
        <button class="btn btn-secondary btn-sm" onclick="calPrev()">◀</button>
        <span class="cal-month">${monthName}</span>
        <button class="btn btn-secondary btn-sm" onclick="calNext()">▶</button>
      </div>
      <div class="cal-grid">
        ${['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d => `<div class="cal-day-label">${d}</div>`).join('')}
        ${cells}
      </div>
    </div>

    <!-- Legend -->
    <div style="display:flex;gap:16px;flex-wrap:wrap;margin-bottom:20px;font-size:13px;color:var(--text2)">
      <span><span style="display:inline-block;width:12px;height:12px;border-radius:50%;background:var(--green);vertical-align:middle;margin-right:4px"></span>Salary Day</span>
      <span><span style="display:inline-block;width:12px;height:12px;border-radius:50%;background:var(--red);vertical-align:middle;margin-right:4px"></span>Bill Due</span>
      <span><span style="display:inline-block;width:12px;height:12px;border-radius:50%;background:#eab308;vertical-align:middle;margin-right:4px"></span>Spending Spike</span>
      <span><span style="display:inline-block;width:12px;height:12px;border-radius:50%;background:#3b82f6;vertical-align:middle;margin-right:4px"></span>Has Expenses</span>
    </div>

    <!-- Bills List -->
    <div class="card">
      <div class="section-header"><span class="section-title">Recurring Bills</span></div>
      ${State.bills.length === 0 ? `<div class="empty-state" style="padding:30px"><div class="empty-icon" style="color:var(--text3);display:flex;justify-content:center">${Icons.calendar(40)}</div><div class="empty-title">No bills added</div></div>` :
        State.bills.map(b => `<div class="expense-item">
          <div class="expense-icon-wrap" style="color:var(--text2)">${Icons.calendar(22)}</div>
          <div class="expense-info"><div class="expense-name">${b.name}</div>
            <div class="expense-cat">Due day ${b.day} ${b.recurring?'· Recurring':''}</div></div>
          <div><div class="expense-amount">${fmt(b.amount)}</div></div>
          <div style="display:flex;gap:4px">
            <button class="btn-icon" onclick="deleteBill('${b.id}')" title="Delete">${Icons.trash(18)}</button>
          </div>
        </div>`).join('')}
    </div>
  `;
}

window.calPrev = function() { const d = State.calendarDate; State.calendarDate = new Date(d.getFullYear(), d.getMonth()-1, 1); renderCalendar(); };
window.calNext = function() { const d = State.calendarDate; State.calendarDate = new Date(d.getFullYear(), d.getMonth()+1, 1); renderCalendar(); };

window.showDayDetail = function(dateKey) {
  const dayExpenses = State.expenses.filter(e => e.date?.slice(0,10) === dateKey);
  const total = dayExpenses.reduce((s,e) => s+parseFloat(e.amount), 0);
  Modal.show(`
    <div class="modal-header">
      <span class="modal-title">${fmtDate(dateKey)}</span>
      <button class="modal-close" aria-label="Close">${Icons.close(20)}</button>
    </div>
    ${dayExpenses.length === 0 ? `<div style="text-align:center;padding:20px;color:var(--text3)">No expenses on this day</div>` :
      `<div style="margin-bottom:12px;font-size:14px;color:var(--text3)">Total spent: <strong style="color:var(--red)">${fmt(total)}</strong></div>` +
      dayExpenses.map(e => {
        const cat = EXP_CATS.find(c => c.id === e.category) || { iconFn: 'other', name: 'Other' };
        return `<div class="expense-item">${Icons[cat.iconFn](22)} <div class="expense-info"><div class="expense-name">${e.note||cat.name}</div></div><div class="expense-amount">-${fmt(e.amount)}</div></div>`;
      }).join('')}
    <div class="modal-footer"><button class="btn btn-primary" onclick="Modal.hide()">Close</button></div>
  `);
};

function openAddBillModal() {
  Modal.show(`
    <div class="modal-header">
      <span class="modal-title">Add Recurring Bill</span>
      <button class="modal-close" aria-label="Close">${Icons.close(20)}</button>
    </div>
    <div class="form-group"><label class="form-label">Bill Name</label>
      <input class="form-input" id="bill_name" placeholder="e.g. Netflix, Electricity"></div>
    <div class="form-row">
      <div class="form-group"><label class="form-label">Amount</label>
        <input class="form-input" id="bill_amount" type="number" placeholder="0.00"></div>
      <div class="form-group"><label class="form-label">Due Day (1-31)</label>
        <input class="form-input" id="bill_day" type="number" min="1" max="31" placeholder="1"></div>
    </div>
    <div class="form-group"><label class="form-label">Recurring</label>
      <select class="form-select" id="bill_recurring"><option value="true">Yes</option><option value="false">No</option></select>
    </div>
    <div class="modal-footer">
      <button class="btn btn-secondary" onclick="Modal.hide()">Cancel</button>
      <button class="btn btn-primary" onclick="saveBill()">Save Bill</button>
    </div>
  `);
}

window.saveBill = function() {
  const name = document.getElementById('bill_name').value.trim();
  const day = parseInt(document.getElementById('bill_day').value);
  if (!name || !day) { Toast.show('Fill in all fields'); return; }
  State.bills.push({
    id: uid(), name, day,
    amount: parseFloat(document.getElementById('bill_amount').value) || 0,
    recurring: document.getElementById('bill_recurring').value === 'true'
  });
  State.save(); Modal.hide(); renderCalendar(); Toast.show('Bill added');
};

window.deleteBill = id => {
  if (!confirm('Delete this bill?')) return;
  State.bills = State.bills.filter(b => b.id !== id);
  State.save(); renderCalendar(); Toast.show('Deleted');
};

// ===== SETTINGS PAGE =====
function renderSettings() {
  const area = document.getElementById('contentArea');
  const s = State.settings;
  area.innerHTML = `
    <h2 style="font-size:22px;font-weight:700;margin-bottom:24px">Settings</h2>

    <!-- General -->
    <div class="settings-section">
      <div class="settings-section-title">${T('general')}</div>
      <div class="settings-item">
        <div><div class="settings-item-label">${T('currency')}</div><div class="settings-item-sub">${T('currency')}</div></div>
        <select class="form-select" style="width:120px" onchange="updateSetting('currency',this.value)">
          ${CURRENCIES.map(c => `<option ${s.currency===c?'selected':''}>${c}</option>`).join('')}
        </select>
      </div>
      <div class="settings-item">
        <div><div class="settings-item-label">${T('salaryDay')}</div><div class="settings-item-sub">${T('salaryDay_label')}</div></div>
        <input type="number" class="form-input" style="width:80px" min="1" max="31" value="${s.salaryDay||1}" onchange="updateSetting('salaryDay',parseInt(this.value))">
      </div>
      <div class="settings-item">
        <div><div class="settings-item-label">${T('darkMode')}</div><div class="settings-item-sub">Toggle dark/light theme</div></div>
        <button class="toggle ${s.darkMode?'on':''}" onclick="toggleTheme()" id="darkModeToggle"></button>
      </div>
      <div class="settings-item">
        <div><div class="settings-item-label">${T('language')}</div><div class="settings-item-sub">App display language</div></div>
        <div style="display:flex;gap:6px">
          ${['en','fr','es'].map(lang => `
            <button onclick="changeLanguage('${lang}')" style="padding:6px 14px;border-radius:8px;border:2px solid ${(s.language||'en')===lang?'var(--green)':'var(--border)'};background:${(s.language||'en')===lang?'var(--green)':'var(--bg3)'};color:${(s.language||'en')===lang?'white':'var(--text)'};font-weight:700;font-size:13px;cursor:pointer">
              ${lang==='en'?'EN':lang==='fr'?'FR':'ES'}
            </button>`).join('')}
        </div>
      </div>
    </div>

    <!-- Security -->
    <div class="settings-section">
      <div class="settings-section-title">${T('security')}</div>
      <div class="settings-item">
        <div><div class="settings-item-label">${T('pinLock')}</div><div class="settings-item-sub">${s.pinEnabled ? T('pinLock') + ' enabled' : 'App is unlocked'}</div></div>
        <button class="toggle ${s.pinEnabled?'on':''}" onclick="togglePin()" id="pinToggle"></button>
      </div>
      ${s.pinEnabled ? `<div class="settings-item">
        <div><div class="settings-item-label">${T('changePIN')}</div></div>
        <button class="btn btn-secondary btn-sm" onclick="openChangePinModal()">${T('edit')}</button>
      </div>` : ''}
    </div>

    <!-- Notifications -->
    <div class="settings-section">
      <div class="settings-section-title">${T('notifications')}</div>
      ${[
        { key: 'notifSalary', labelKey: 'salaryReminder', subKey: 'salaryReminder' },
        { key: 'notifBill', labelKey: 'billAlerts', subKey: 'billAlerts' },
        { key: 'notifOverspend', labelKey: 'overspendWarnings', subKey: 'overspendWarnings' },
        { key: 'notifBudget', labelKey: 'budgetMilestones', subKey: 'budgetMilestones' }
      ].map(n => `<div class="settings-item">
        <div><div class="settings-item-label">${T(n.labelKey)}</div></div>
        <button class="toggle ${s[n.key]?'on':''}" onclick="updateSetting('${n.key}',${!s[n.key]});renderSettings()"></button>
      </div>`).join('')}
    </div>

    <!-- Data -->
    <div class="settings-section">
      <div class="settings-section-title">${T('dataManagement')}</div>
      <div class="settings-item">
        <div><div class="settings-item-label">${T('exportData')}</div></div>
        <button class="btn btn-secondary btn-sm" onclick="exportData()">${T('exportData').split(' ')[0]}</button>
      </div>
      <div class="settings-item">
        <div><div class="settings-item-label">${T('importData')}</div></div>
        <button class="btn btn-secondary btn-sm" onclick="importData()">${T('importData').split(' ')[0]}</button>
      </div>
      <div class="settings-item">
        <div><div class="settings-item-label" style="color:var(--red)">${T('wipeData')}</div></div>
        <button class="btn btn-danger btn-sm" onclick="wipeData()">Wipe</button>
      </div>
    </div>

    <!-- About -->
    <div class="settings-section">
      <div class="settings-section-title">${T('about')}</div>
      <div class="settings-item">
        <div><div class="settings-item-label">Earneuro</div><div class="settings-item-sub">Personal Finance Web App · v1.0.0</div></div>
        <span style="display:flex;color:var(--green)">${Icons.piggybank(32)}</span>
      </div>
    </div>
  `;
}

window.updateSetting = function(key, val) {
  State.settings[key] = val;
  State.save();
  if (key === 'darkMode') applyTheme();
};

window.changeLanguage = function(lang) {
  State.settings.language = lang;
  State.save();
  navigate(State.currentPage); // re-render current page with new language
};

window.togglePin = function() {
  if (State.settings.pinEnabled) {
    if (!confirm('Disable PIN lock?')) return;
    State.settings.pinEnabled = false; State.settings.pin = null;
    State.save(); renderSettings(); Toast.show('PIN disabled');
  } else {
    openSetPinModal(false);
  }
};

function openSetPinModal(isChange) {
  let newPin = '';
  let confirmPin = '';
  let step = 1;
  Modal.show(`
    <div class="modal-header">
      <span class="modal-title">${isChange ? 'Change' : 'Set'} PIN</span>
      <button class="modal-close" aria-label="Close">${Icons.close(20)}</button>
    </div>
    <p id="pinStepLabel" style="text-align:center;margin-bottom:16px;color:var(--text2)">Enter a 4-digit PIN</p>
    <div class="pin-dots" id="setPinDots" style="justify-content:center;margin-bottom:20px">
      <span></span><span></span><span></span><span></span>
    </div>
    <div class="pin-pad" id="setPinPad" style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px"></div>
  `);

  const pad = document.getElementById('setPinPad');
  const dots = document.getElementById('setPinDots');
  const label = document.getElementById('pinStepLabel');
  const keys = ['1','2','3','4','5','6','7','8','9','','0','⌫'];
  pad.innerHTML = keys.map(k => `<button class="pin-btn" data-key="${k}">${k}</button>`).join('');
  pad.querySelectorAll('.pin-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const k = btn.dataset.key;
      if (step === 1) {
        if (k === '⌫') newPin = newPin.slice(0,-1);
        else if (k && newPin.length < 4) newPin += k;
        updateDots(dots, newPin);
        if (newPin.length === 4) { step = 2; label.textContent = 'Confirm your PIN'; newPin = newPin; updateDots(dots, ''); confirmPin = ''; }
      } else {
        if (k === '⌫') confirmPin = confirmPin.slice(0,-1);
        else if (k && confirmPin.length < 4) confirmPin += k;
        updateDots(dots, confirmPin);
        if (confirmPin.length === 4) {
          if (confirmPin === newPin) {
            State.settings.pin = newPin; State.settings.pinEnabled = true;
            State.save(); Modal.hide(); renderSettings(); Toast.show('PIN set');
          } else { confirmPin = ''; Toast.show('PINs do not match'); updateDots(dots, ''); }
        }
      }
    });
  });
  function updateDots(el, val) { el.querySelectorAll('span').forEach((s,i) => s.classList.toggle('filled', i < val.length)); }
}

window.openChangePinModal = () => openSetPinModal(true);

window.exportData = function() {
  const data = {
    incomes: State.incomes, expenses: State.expenses,
    budgetCategories: State.budgetCategories, goals: State.goals,
    vaults: State.vaults, piggyBank: State.piggyBank,
    bills: State.bills, settings: State.settings,
    exportedAt: new Date().toISOString()
  };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url;
  a.download = `earneuro-backup-${new Date().toISOString().slice(0,10)}.json`;
  a.click(); URL.revokeObjectURL(url);
  Toast.show('Data exported');
};

window.importData = function() {
  const input = document.createElement('input'); input.type = 'file'; input.accept = '.json';
  input.onchange = e => {
    const file = e.target.files[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      try {
        const data = JSON.parse(ev.target.result);
        if (!confirm('This will overwrite all current data. Continue?')) return;
        if (data.incomes) State.incomes = data.incomes;
        if (data.expenses) State.expenses = data.expenses;
        if (data.budgetCategories) State.budgetCategories = data.budgetCategories;
        if (data.goals) State.goals = data.goals;
        if (data.vaults) State.vaults = data.vaults;
        if (data.piggyBank) State.piggyBank = data.piggyBank;
        if (data.bills) State.bills = data.bills;
        if (data.settings) State.settings = { ...State.settings, ...data.settings };
        State.save(); navigate('dashboard'); Toast.show('Data imported');
      } catch { Toast.show('Invalid backup file'); }
    };
    reader.readAsText(file);
  };
  input.click();
};

window.wipeData = function() {
  if (!confirm('This will delete ALL your data permanently. Are you sure?')) return;
  if (!confirm('Are you ABSOLUTELY sure? This cannot be undone.')) return;
  Object.keys(localStorage).filter(k => k.startsWith('earneuro_')).forEach(k => localStorage.removeItem(k));
  location.reload();
};

// ===== INIT =====
function init() {
  applyTheme();
  setupLock();

  // Build nav
  buildNav();

  // Theme toggles
  document.getElementById('themeToggleDesk').addEventListener('click', toggleTheme);
  document.getElementById('themeToggleMob').addEventListener('click', toggleTheme);

  // Hamburger
  document.getElementById('hamburger').addEventListener('click', () => {
    document.getElementById('sidebar').classList.toggle('open');
  });

  // FAB – quick add expense
  document.getElementById('fab').addEventListener('click', () => openAddExpenseModal());

  // Initial page
  navigate('dashboard');

  // Onboarding: if no income, prompt
  if (State.incomes.length === 0) {
    setTimeout(() => {
      Toast.show('Welcome! Start by adding your income source.', 4000);
    }, 800);
  }
}

// Wait for DOM
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

