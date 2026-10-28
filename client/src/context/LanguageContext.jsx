import { createContext, useContext, useState, useEffect } from 'react'

const translations = {
  en: {
    // Nav / Sidebar
    dashboard: 'Dashboard',
    accounts: 'Accounts',
    transactions: 'Transactions',
    budget: 'Budget',
    subscriptions: 'Subscriptions',
    analytics: 'Analytics',
    referral: 'Refer & Earn',
    profile: 'Profile',
    loans: 'Loans & EMIs',
    logout: 'Logout',
    
    // Transactions Main
    addTransaction: 'Add Transaction',
    editTransaction: 'Edit Transaction',
    newTransaction: 'New Transaction',
    searchPlaceholder: 'Search details...',
    allTypes: 'All Types',
    allCategories: 'All Categories',
    resetFilters: 'Reset Filters',
    activeLoans: 'Active Loans & EMIs',
    owedTaken: 'Loans Taken (You owe)',
    collectLent: 'Loans Given (Others owe you)',
    dueDateCalendar: 'Due Date Calendar',
    repayDue: 'Owed due',
    collectDue: 'Collect due',
    noLoansFound: 'No active loans found.',
    createInsideTx: 'Create a new loan',
    clearLoanFilter: 'Clear Loan Filter',
    showingOnlyLinked: 'Showing only transactions linked to:',
    
    // Table Headers
    titleDesc: 'Title / Description',
    type: 'Type',
    category: 'Category',
    account: 'Account',
    date: 'Date',
    method: 'Method',
    amount: 'Amount',
    actions: 'Actions',
    
    // Form Labels
    expense: 'Expense (Outflow)',
    income: 'Income (Inflow)',
    typeLabel: 'Type',
    amountLabel: 'Amount (₹)',
    titleLabel: 'Title / Description',
    accountLabel: 'Debited/Credited Account',
    paymentMethod: 'Payment Method',
    transactionDate: 'Transaction Date',
    descriptionLabel: 'Description / Memo',
    cancel: 'Cancel',
    saveChanges: 'Save Changes',
    
    // Loan configuration
    isLoanTx: 'Link to Loan / EMI',
    loanAction: 'Action',
    repayExisting: 'Pay EMI for Existing Loan',
    createNewLedger: 'Create New Loan',
    selectActiveLoan: 'Select Active Loan',
    mainOption: 'Main Option',
    subOption: 'Sub Option',
    bankLoan: 'Bank Loan',
    personalDebt: 'Friend / Family Loan',
    bankName: 'Bank Name',
    personName: 'Person Name',
    interestRate: 'Interest (%)',
    emi: 'Monthly EMI (₹)',
    endDate: 'Loan End Date',
    amortizationNote: 'Loan Note',
    createLoanAndLog: 'Create Loan',
    endsOn: 'Ends on',

    // Dashboard
    welcome: 'Welcome back',
    welcomeSubtitle: 'Here is your financial status overview for today.',
    totalBalance: 'Total Balance',
    totalIncome: 'Total Income',
    totalExpense: 'Total Expense',
    netSavings: 'Net Savings',
    incomeVsExpense: 'Income vs Expense',
    spendingByCat: 'Spending by Category',
    recentTransactions: 'Recent Transactions',
    viewAll: 'View All',

    // Accounts / Balance page
    accountsAndBalances: 'Accounts & Balances',
    accountsSubtitle: 'Manage your cash, bank accounts and active funds.',
    addAccount: 'Add Account',
    editAccount: 'Edit Account',
    cashBalance: 'Cash Balance',
    bankBalance: 'Bank Balance',
    totalFunds: 'Total Funds',
    accountName: 'Account Name',
    accountType: 'Account Type',
    initialBalance: 'Initial Balance',
    saveAccount: 'Save Account',

    // Budget
    budgetSetup: 'Budget Setup',
    budgetSubtitle: 'Configure monthly thresholds and category spending limits.',
    monthlyBudgetLimit: 'Monthly Budget Limit (₹)',
    categoryBudgets: 'Category Budgets',
    saveBudget: 'Save Budget Settings',

    // Analytics / Insights
    spendingInsights: 'Spending Insights & Forecasts',
    insightsSubtitle: 'AI-generated trends, budget analytics, and future expense forecasts.',
    aiForecast: 'AI Forecast',
    monthlyTrend: 'Monthly Trend',
    savingsRate: 'Savings Rate',

    // Profile
    userProfile: 'User Profile',
    profileSubtitle: 'Manage your credentials, login metrics and account information.',
    name: 'Name',
    email: 'Email',
    joined: 'Joined'
  },
  hi: {
    // Nav / Sidebar
    dashboard: 'डैशबोर्ड',
    accounts: 'खाते',
    transactions: 'लेन-देन',
    budget: 'बजट',
    analytics: 'विश्लेषण',
    referral: 'रेफर और कमाएं',
    profile: 'प्रोफ़ाइल',
    loans: 'ऋण और ईएमआई',
    logout: 'लॉगआउट',
    
    // Transactions Main
    addTransaction: 'लेन-देन जोड़ें',
    editTransaction: 'लेन-देन बदलें',
    newTransaction: 'नया लेन-देन',
    searchPlaceholder: 'खोजें...',
    allTypes: 'सभी प्रकार',
    allCategories: 'सभी श्रेणियां',
    resetFilters: 'फ़िल्टर हटाएं',
    activeLoans: 'सक्रिय ऋण और ईएमआई (Active Loans & EMIs)',
    owedTaken: 'लिया हुआ ऋण (आपको देना है)',
    collectLent: 'दिया हुआ ऋण (आपको लेना है)',
    dueDateCalendar: 'देय तिथि कैलेंडर',
    repayDue: 'देना बाकी',
    collectDue: 'लेना बाकी',
    noLoansFound: 'कोई सक्रिय ऋण नहीं मिला।',
    createInsideTx: 'नया ऋण बनाएं',
    clearLoanFilter: 'ऋण फ़िल्टर हटाएं',
    showingOnlyLinked: 'केवल इससे जुड़े लेन-देन दिखा रहे हैं:',
    
    // Table Headers
    titleDesc: 'शीर्षक / विवरण',
    type: 'प्रकार',
    category: 'श्रेणी',
    account: 'खाता',
    date: 'तारीख',
    method: 'भुगतान का तरीका',
    amount: 'राशि',
    actions: 'कार्रवाई',
    
    // Form Labels
    expense: 'खर्च (Outflow)',
    income: 'आय (Inflow)',
    typeLabel: 'प्रकार',
    amountLabel: 'राशि (₹)',
    titleLabel: 'शीर्षक / विवरण',
    accountLabel: 'डेबिट/क्रेडिट खाता',
    paymentMethod: 'भुगतान का तरीका',
    transactionDate: 'तारीख',
    descriptionLabel: 'विवरण / नोट',
    cancel: 'रद्द करें',
    saveChanges: 'परिवर्तन सहेजें',
    
    // Loan configuration
    isLoanTx: 'लोन / ईएमआई से जोड़ें',
    loanAction: 'कार्रवाई',
    repayExisting: 'मौजूदा लोन पर ईएमआई (EMI) भरें',
    createNewLedger: 'नया लोन/ऋण शुरू करें',
    selectActiveLoan: 'लोन चुनें',
    mainOption: 'मुख्य विकल्प',
    subOption: 'उप विकल्प',
    bankLoan: 'बैंक लोन',
    personalDebt: 'मित्र / परिवार से उधार',
    bankName: 'बैंक का नाम',
    personName: 'व्यक्ति का नाम',
    interestRate: 'ब्याज (%)',
    emi: 'मासिक ईएमआई (Monthly EMI) (₹)',
    endDate: 'ऋण समाप्ति तिथि',
    amortizationNote: 'ऋण टिप्पणी',
    createLoanAndLog: 'नया लोन बनाएं',
    endsOn: 'समाप्ति',

    // Dashboard
    welcome: 'स्वागत है',
    welcomeSubtitle: 'यहाँ आज की आपकी वित्तीय स्थिति का विवरण है।',
    totalBalance: 'कुल शेष राशि',
    totalIncome: 'कुल आय',
    totalExpense: 'कुल खर्च',
    netSavings: 'कुल बचत',
    incomeVsExpense: 'आय बनाम खर्च',
    spendingByCat: 'श्रेणी के अनुसार खर्च',
    recentTransactions: 'हाल ही के लेन-देन',
    viewAll: 'सभी देखें',

    // Accounts / Balance page
    accountsAndBalances: 'खाते और शेष राशि',
    accountsSubtitle: 'अपने नकद, बैंक खातों और उपलब्ध धन का प्रबंधन करें।',
    addAccount: 'खाता जोड़ें',
    editAccount: 'खाता बदलें',
    cashBalance: 'नकद शेष',
    bankBalance: 'बैंक शेष',
    totalFunds: 'कुल धन',
    accountName: 'खाते का नाम',
    accountType: 'खाते का प्रकार',
    initialBalance: 'प्रारंभिक शेष',
    saveAccount: 'खाता सहेजें',

    // Budget
    budgetSetup: 'बजट सेटिंग',
    budgetSubtitle: 'मासिक सीमाएं और श्रेणी अनुसार खर्च की सीमाएं निर्धारित करें।',
    monthlyBudgetLimit: 'मासिक बजट सीमा (₹)',
    categoryBudgets: 'श्रेणी बजट',
    saveBudget: 'बजट सहेजें',

    // Analytics / Insights
    spendingInsights: 'व्यय अंतर्दृष्टि और पूर्वानुमान',
    insightsSubtitle: 'एआई द्वारा जनरेट किए गए ट्रेंड, बजट विश्लेषण और भविष्य का पूर्वानुमान।',
    aiForecast: 'एआई पूर्वानुमान',
    monthlyTrend: 'मासिक रुझान',
    savingsRate: 'बचत दर',

    // Profile
    userProfile: 'उपयोगकर्ता प्रोफ़ाइल',
    profileSubtitle: 'अपनी क्रेडेंशियल्स, लॉगिन मेट्रिक्स और खाते की जानकारी प्रबंधित करें।',
    name: 'नाम',
    email: 'ईमेल',
    joined: 'शामिल हुए'
  },
  mr: {
    // Nav / Sidebar
    dashboard: 'डॅशबोर्ड',
    accounts: 'खाते',
    transactions: 'व्यवहार',
    budget: 'बजेट',
    analytics: 'विश्लेषण',
    referral: 'रेफर करा आणि कमवा',
    profile: 'प्रोफाईल',
    loans: 'कर्ज आणि ईएमआय',
    logout: 'लॉगआउट',
    
    // Transactions Main
    addTransaction: 'व्यवहार जोडा',
    editTransaction: 'व्यवहार बदला',
    newTransaction: 'नवीन व्यवहार',
    searchPlaceholder: 'शोधा...',
    allTypes: 'सर्व प्रकार',
    allCategories: 'सर्व श्रेणी',
    resetFilters: 'फिल्टर्स काढा',
    activeLoans: 'सक्रिय कर्ज आणि देणे',
    owedTaken: 'देणे आहे (घेतलेले कर्ज)',
    collectLent: 'येणे आहे (दिलेले कर्ज)',
    dueDateCalendar: 'मुदत तारीख दिनदर्शिका',
    repayDue: 'देणे बाकी',
    collectDue: 'येणे बाकी',
    noLoansFound: 'कोणतेही सक्रिय कर्ज आढळले नाही.',
    createInsideTx: 'व्यवहाराच्या आत नवीन कर्ज तयार करा',
    clearLoanFilter: 'कर्ज फिल्टर काढा',
    showingOnlyLinked: 'फक्त या कर्जाशी संबंधित व्यवहार दर्शवित आहे:',
    
    // Table Headers
    titleDesc: 'शीर्षक / तपशील',
    type: 'प्रकार',
    category: 'श्रेणी',
    account: 'खाते',
    date: 'तारीख',
    method: 'पद्धत',
    amount: 'रक्कम',
    actions: 'कृती',
    
    // Form Labels
    expense: 'खर्च (Outflow)',
    income: 'उत्पन्न (Inflow)',
    typeLabel: 'प्रकार',
    amountLabel: 'रक्कम (₹)',
    titleLabel: 'शीर्षक / तपशील',
    accountLabel: 'डेबिट/क्रेडिट खाते',
    paymentMethod: 'भुगतान पद्धत',
    transactionDate: 'तारीख',
    descriptionLabel: 'तपशील / टीप',
    cancel: 'रद्द करा',
    saveChanges: 'बदल जतन करा',
    
    // Loan configuration
    isLoanTx: 'हा कर्ज / देणे / EMI व्यवहार आहे',
    loanAction: 'कर्ज कृती',
    repayExisting: 'ह्या कर्जावर हप्ता भरा',
    createNewLedger: 'नवीन कर्ज खाते तयार करा',
    selectActiveLoan: 'सक्रिय कर्ज निवडा',
    mainOption: 'मुख्य पर्याय',
    subOption: 'उप पर्याय',
    bankLoan: 'बँक कर्ज (संस्था)',
    personalDebt: 'वैयक्तिक कर्ज (कुटुंब/मित्र)',
    bankName: 'बँकेचे नाव',
    personName: 'व्यक्तीचे नाव',
    interestRate: 'व्याज (%)',
    emi: 'EMI (₹)',
    endDate: 'कर्ज समाप्ती तारीख',
    amortizationNote: 'कर्ज नोंद',
    createLoanAndLog: 'कर्ज तयार करा आणि नोंदवा',
    endsOn: 'समाप्त',

    // Dashboard
    welcome: 'पुन्हा स्वागत आहे',
    welcomeSubtitle: 'आजची तुमची एकूण आर्थिक स्थिती खालीलप्रमाणे आहे.',
    totalBalance: 'एकूण शिल्लक',
    totalIncome: 'एकूण उत्पन्न',
    totalExpense: 'एकूण खर्च',
    netSavings: 'एकूण बचत',
    incomeVsExpense: 'उत्पन्न विरुद्ध खर्च',
    spendingByCat: 'श्रेणीनुसार खर्च',
    recentTransactions: 'अलीकडील व्यवहार',
    viewAll: 'सर्व पहा',

    // Accounts / Balance page
    accountsAndBalances: 'खाती आणि शिल्लक',
    accountsSubtitle: 'तुमची रोख रक्कम, बँक खाती आणि शिल्लक निधी व्यवस्थापित करा.',
    addAccount: 'खाते जोडा',
    editAccount: 'खाते बदला',
    cashBalance: 'रोख शिल्लक',
    bankBalance: 'बँक शिल्लक',
    totalFunds: 'एकूण निधी',
    accountName: 'खात्याचे नाव',
    accountType: 'खात्याचा प्रकार',
    initialBalance: 'प्रारंभिक शिल्लक',
    saveAccount: 'खाते जतन करा',

    // Budget
    budgetSetup: 'बजेट रचना',
    budgetSubtitle: 'मासिक मर्यादा आणि श्रेणीनुसार खर्चाची मर्यादा निर्धारित करा.',
    monthlyBudgetLimit: 'मासिक बजेट मर्यादा (₹)',
    categoryBudgets: 'श्रेणी बजेट',
    saveBudget: 'बजेट जतन करा',

    // Analytics / Insights
    spendingInsights: 'खर्च विश्लेषण आणि अंदाज',
    insightsSubtitle: 'एआय-व्युत्पन्न ट्रेंड, बजेट विश्लेषण आणि भविष्यातील खर्चाचा अंदाज.',
    aiForecast: 'एआय अंदाज',
    monthlyTrend: 'मासिक कल',
    savingsRate: 'बचत दर',

    // Profile
    userProfile: 'वापरकर्ता प्रोफाइल',
    profileSubtitle: 'तुमची क्रेडेन्शियल्स, लॉगइन तपशील आणि खाते माहिती व्यवस्थापित करा.',
    name: 'नाव',
    email: 'ईमेल',
    joined: 'नोंदणी तारीख'
  },
  ta: {
    // Nav / Sidebar
    dashboard: 'டாஷ்போர்டு',
    accounts: 'கணக்குகள்',
    transactions: 'பரிவர்த்தனைகள்',
    budget: 'பட்ஜெட்',
    analytics: 'பகுப்பாய்வு',
    referral: 'பரிந்துரைத்து சம்பாதிக்கவும்',
    profile: 'சுயவிவரம்',
    loans: 'கடன் & இஎம்ஐ',
    logout: 'வெளியேறு',
    
    // Transactions Main
    addTransaction: 'பரிவர்த்தனை சேர்',
    editTransaction: 'பரிவர்த்தனை திருத்து',
    newTransaction: 'புதிய பரிவர்த்தனை',
    searchPlaceholder: 'தேடுக...',
    allTypes: 'அனைத்து வகைகள்',
    allCategories: 'அனைத்து பிரிவுகள்',
    resetFilters: 'வடிகட்டிகளை நீக்கு',
    activeLoans: 'செயலில் உள்ள கடன்கள்',
    owedTaken: 'திரும்ப செலுத்த வேண்டியது',
    collectLent: 'வசூலிக்க வேண்டியது',
    dueDateCalendar: 'பணம் செலுத்தும் நாள் காலண்டர்',
    repayDue: 'செலுத்த வேண்டிய நாள்',
    collectDue: 'வசூலிக்க வேண்டிய நாள்',
    noLoansFound: 'செயலில் உள்ள கடன்கள் எதுவும் இல்லை.',
    createInsideTx: 'பரிவர்த்தனைக்குள் ஒன்றை உருவாக்கவும்',
    clearLoanFilter: 'கடன் வடிகட்டியை நீக்கு',
    showingOnlyLinked: 'தொடர்புடைய பரிவர்த்தனைகள் மட்டும் காட்டப்படுகின்றன:',
    
    // Table Headers
    titleDesc: 'தலைப்பு / விவரம்',
    type: 'வகை',
    category: 'பிரிவு',
    account: 'கணக்கு',
    date: 'தேதி',
    method: 'முறை',
    amount: 'தொகை',
    actions: 'செயல்கள்',
    
    // Form Labels
    expense: 'செலவு (Outflow)',
    income: 'வருமானம் (Inflow)',
    typeLabel: 'வகை',
    amountLabel: 'தொகை (₹)',
    titleLabel: 'தலைப்பு / விவரம்',
    accountLabel: 'கணக்கு தேர்வு',
    paymentMethod: 'பணம் செலுத்தும் முறை',
    transactionDate: 'தேதி',
    descriptionLabel: 'விளக்கம்',
    cancel: 'ரத்துசெய்',
    saveChanges: 'மாற்றங்களை சேமி',
    
    // Loan configuration
    isLoanTx: 'இது ஒரு கடன் / இஎம்ஐ (EMI) பரிவர்த்தனை',
    loanAction: 'கடன் செயல்பாடு',
    repayExisting: 'செயலில் உள்ள கடனுக்கு பணம் செலுத்து',
    createNewLedger: 'புதிய கடன் கணக்கு உருவாக்கு',
    selectActiveLoan: 'கடனைத் தேர்ந்தெடுக்கவும்',
    mainOption: 'முதன்மை விருப்பம்',
    subOption: 'துணை விருப்பம்',
    bankLoan: 'வங்கி கடன்',
    personalDebt: 'தனிநபர் கடன் (நண்பர்கள்/குடும்பம்)',
    bankName: 'வங்கி பெயர்',
    personName: 'நபர் பெயர்',
    interestRate: 'வட்டி (%)',
    emi: 'EMI (₹)',
    endDate: 'கடன் முடியும் தேதி',
    amortizationNote: 'கடன் குறிப்பு',
    createLoanAndLog: 'கடனை உருவாக்கி பதிவுசெய்',
    endsOn: 'முடியும் நாள்',

    // Dashboard
    welcome: 'மீண்டும் வருக',
    welcomeSubtitle: 'இன்று உங்கள் நிதி நிலவரம் குறித்த கண்ணோட்டம்.',
    totalBalance: 'மொத்த இருப்பு',
    totalIncome: 'மொத்த வருமானம்',
    totalExpense: 'மொத்த செலவு',
    netSavings: 'மொத்த சேமிப்பு',
    incomeVsExpense: 'வருமானம் மற்றும் செலவு ஒப்பீடு',
    spendingByCat: 'பிரிவு வாரியாக செலவு',
    recentTransactions: 'சமீபத்திய பரிவர்த்தனைகள்',
    viewAll: 'அனைத்தையும் காட்டு',

    // Accounts / Balance page
    accountsAndBalances: 'கணக்குகள் மற்றும் இருப்பு',
    accountsSubtitle: 'உங்கள் ரொக்கம், வங்கி கணக்குகள் மற்றும் இருப்புகளை நிர்வகிக்கவும்.',
    addAccount: 'கணக்கு சேர்',
    editAccount: 'கணக்கு திருத்து',
    cashBalance: 'ரொக்க இருப்பு',
    bankBalance: 'வங்கி இருப்பு',
    totalFunds: 'மொத்த நிதி',
    accountName: 'கணக்கு பெயர்',
    accountType: 'கணக்கு வகை',
    initialBalance: 'தொடக்க இருப்பு',
    saveAccount: 'கணக்கை சேமி',

    // Budget
    budgetSetup: 'பட்ஜெட் கட்டமைப்பு',
    budgetSubtitle: 'மாதாந்திர வரம்பு மற்றும் பிரிவு வாரியான செலவு வரம்புகளை உள்ளமைக்கவும்.',
    monthlyBudgetLimit: 'மாதாந்திர பட்ஜெட் வரம்பு (₹)',
    categoryBudgets: 'பிரிவு பட்ஜெட்டுகள்',
    saveBudget: 'பட்ஜெட்டை சேமி',

    // Analytics / Insights
    spendingInsights: 'செலவு நுண்ணறிவு & கணிப்பு',
    insightsSubtitle: 'AI மூலம் உருவாக்கப்பட்ட போக்குகள், பட்ஜெட் பகுப்பாய்வு மற்றும் எதிர்கால செலவு கணிப்புகள்.',
    aiForecast: 'AI கணிப்பு',
    monthlyTrend: 'மாதாந்திர போக்கு',
    savingsRate: 'சேமிப்பு விகிதம்',

    // Profile
    userProfile: 'பயனர் சுயவிவரம்',
    profileSubtitle: 'உங்கள் நற்சான்றிதழ்கள், உள்நுழைவு அளவீடுகள் மற்றும் கணக்கு தகவல்களை நிர்வகிக்கவும்.',
    name: 'பெயர்',
    email: 'மின்னஞ்சல்',
    joined: 'இணைந்த தேதி'
  }
}

const LanguageContext = createContext()

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState(() => {
    return localStorage.getItem('xpenz_lang') || 'en'
  })

  useEffect(() => {
    localStorage.setItem('xpenz_lang', language)
  }, [language])

  const t = (key) => {
    return translations[language]?.[key] || translations['en']?.[key] || key
  }

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export const useLanguage = () => useContext(LanguageContext)
