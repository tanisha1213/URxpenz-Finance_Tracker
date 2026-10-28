import { useState, useEffect, useMemo } from 'react'
import { useLocation } from 'react-router-dom'
import { useLanguage } from '../../context/LanguageContext'
import { FiChevronRight, FiChevronLeft, FiX } from 'react-icons/fi'

const pageTours = {
  '/dashboard': [
    {
      target: null,
      title: {
        en: 'Dashboard Overview',
        hi: 'डैशबोर्ड अवलोकन',
        mr: 'डॅशबोर्ड विहंगावलोकन',
        ta: 'டாஷ்போர்டு கண்ணோட்டம்'
      },
      desc: {
        en: 'Welcome to your financial home! Let\'s walk through how to monitor your savings and log entries.',
        hi: 'आपके वित्तीय गृह में आपका स्वागत है! आइए देखें कि अपनी बचत की निगरानी कैसे करें और लेनदेन कैसे दर्ज करें।',
        mr: 'तुमच्या आर्थिक होमवर आपले स्वागत आहे! तुमची बचत कशी तपासायची आणि व्यवहारांची नोंद कशी करायची ते पाहूया.',
        ta: 'உங்கள் நிதி இல்லத்திற்கு வரவேற்கிறோம்! உங்கள் சேமிப்பை எவ்வாறு கண்காணிப்பது மற்றும் பரிவர்த்தனைகளைப் பதிவு செய்வது என்பதைப் பார்ப்போம்.'
      }
    },
    {
      target: '#total-balance-card-tour',
      title: {
        en: 'Total Balance Card',
        hi: 'कुल शेष कार्ड',
        mr: 'एकूण शिल्लक कार्ड',
        ta: 'மொத்த இருப்பு அட்டை'
      },
      desc: {
        en: 'See your net saving balance combined across cash and all linked bank accounts in real time.',
        hi: 'वास्तविक समय में नकद और सभी जुड़े बैंक खातों में अपनी कुल शुद्ध बचत शेष राशि देखें।',
        mr: 'तुमची एकूण रोकड आणि सर्व बँक खाती मिळून होणारी निव्वळ शिल्लक रिअल-टाइममध्ये येथे पहा.',
        ta: 'ரொக்கம் மற்றும் இணைக்கப்பட்ட அனைத்து வங்கி கணக்குகளின் மொத்த சேமிப்பு இருப்பை நிகழ்நேரத்தில் பார்க்கவும்.'
      }
    },
    {
      target: '#add-transaction-btn-tour',
      title: {
        en: 'Quick Add Transaction',
        hi: 'त्वरित लेनदेन जोड़ें',
        mr: 'व्यवहार जोडा',
        ta: 'பரிவர்த்தனை சேர்க்க'
      },
      desc: {
        en: 'Click here to log a new daily expense or income inflow in 5 seconds.',
        hi: '5 सेकंड में एक नया दैनिक खर्च या आय दर्ज करने के लिए यहां क्लिक करें।',
        mr: 'अवघ्या ५ सेकंदात नवीन दैनिक खर्च किंवा उत्पन्न नोंदवण्यासाठी येथे क्लिक करा.',
        ta: '5 வினாடிகளில் ஒரு புதிய தினசரி செலவு அல்லது வருமானத்தைப் பதிவு செய்ய இங்கே கிளிக் செய்யவும்.'
      }
    },
    {
      target: '#category-distribution-chart-tour',
      title: {
        en: 'Category Share',
        hi: 'श्रेणी हिस्सा',
        mr: 'श्रेणीनुसार विभागणी',
        ta: 'பிரிவு வாரியான செலவு'
      },
      desc: {
        en: 'Understand which categories (like Food, Rent, Travel) are consuming your budget.',
        hi: 'समझें कि कौन सी श्रेणियां (जैसे भोजन, किराया, यात्रा) आपके बजट का उपभोग कर रही हैं।',
        mr: 'तुमच्या बजेटमधील खर्च कोणत्या गोष्टींवर (उदा. अन्न, भाडे, प्रवास) होत आहे ते समजून घ्या.',
        ta: 'உணவு, வாடகை, பயணம் போன்ற எந்தப் பிரிவுகள் உங்கள் பட்ஜெட்டை அதிகம் பயன்படுத்துகின்றன என்பதைப் புரிந்து கொள்ளுங்கள்.'
      }
    },
    {
      target: '#income-expense-chart-tour',
      title: {
        en: 'Income vs Expense Comparison',
        hi: 'आय बनाम खर्च तुलना',
        mr: 'उत्पन्न विरुद्ध खर्च तुलना',
        ta: 'வருமானம் மற்றும் செலவு ஒப்பீடு'
      },
      desc: {
        en: 'View how much money came in versus went out in prior months using this comparison chart.',
        hi: 'इस तुलना चार्ट का उपयोग करके देखें कि पिछले महीनों में कितना पैसा आया और कितना गया।',
        mr: 'या तुलना तक्त्याद्वारे मागील महिन्यांत किती पैसे आले आणि गेले ते पहा.',
        ta: 'கடந்த மாதங்களில் எவ்வளவு பணம் வந்தது மற்றும் எவ்வளவு செலவானது என்பதை இந்த ஒப்பீட்டு விளக்கப்படம் மூலம் பார்க்கவும்.'
      }
    },
    {
      target: '#recent-activity-tour',
      title: {
        en: 'Recent Activity Log',
        hi: 'हाल ही की गतिविधि लॉग',
        mr: 'अलीकडील व्यवहार सूची',
        ta: 'சமீபத்திய பரிவர்த்தனைகள்'
      },
      desc: {
        en: 'Check the chronological history of your most recent transactions instantly.',
        hi: 'अपने सबसे हाल के लेनदेन का कालानुक्रमिक इतिहास तुरंत देखें।',
        mr: 'तुमच्या सर्वात अलीकडील व्यवहारांचा इतिहास त्वरित तपासा.',
        ta: 'உங்கள் மிகச் சமீபத்திய பரிவர்த்தனைகளின் வரலாற்றை உடனடியாக இங்கே சரிபார்க்கவும்.'
      }
    }
  ],
  '/balance': [
    {
      target: null,
      title: {
        en: 'Accounts Management',
        hi: 'खाता प्रबंधन',
        mr: 'खाते व्यवस्थापन',
        ta: 'கணக்குகள் மேலாண்மை'
      },
      desc: {
        en: 'Here you can manage multiple bank accounts and track physical cash balances separately.',
        hi: 'यहाँ आप कई बैंक खातों का प्रबंधन कर सकते हैं और भौतिक नकद शेष राशि को अलग से ट्रैक कर सकते हैं।',
        mr: 'येथे तुम्ही अनेक बँक खाती व्यवस्थापित करू शकता आणि रोख रकमेचा मागोवा स्वतंत्रपणे ठेवू शकता.',
        ta: 'இங்கே நீங்கள் பல வங்கி கணக்குகளை நிர்வகிக்கலாம் மற்றும் ரொக்க இருப்பை தனியாக கண்காணிக்கலாம்.'
      }
    },
    {
      target: '#add-account-btn-tour',
      title: {
        en: 'Add Bank Account',
        hi: 'बैंक खाता जोड़ें',
        mr: 'बँक खाते जोडा',
        ta: 'வங்கி கணக்கு சேர்'
      },
      desc: {
        en: 'Add new bank accounts to link transactions and deduct/credit their balances dynamically.',
        hi: 'लेनदेन को जोड़ने और उनकी शेष राशि को गतिशील रूप से डेबिट/क्रेडिट करने के लिए नए बैंक खाते जोड़ें।',
        mr: 'नवीन बँक खाती जोडून व्यवहार लिंक करा आणि शिल्लक रक्कम थेट व्यवस्थापित करा.',
        ta: 'பரிவர்த்தனைகளை இணைக்கவும் மற்றும் இருப்புகளை மாறும் வகையில் சரிசெய்யவும் புதிய வங்கி கணக்குகளைச் சேர்க்கவும்.'
      }
    },
    {
      target: '#cash-wallet-card-tour',
      title: {
        en: 'Cash Wallet Card',
        hi: 'नकद वॉलेट कार्ड',
        mr: 'रोख पाकीट कार्ड',
        ta: 'ரொக்க வாலட் அட்டை'
      },
      desc: {
        en: 'Track the physical cash money held in hand. You can adjust this balance at any time.',
        hi: 'हाथ में मौजूद भौतिक नकद राशि को ट्रैक करें। आप किसी भी समय इस शेष राशि को समायोजित कर सकते हैं।',
        mr: 'तुमच्याकडे स्वतःजवळ असलेल्या रोख रकमेचा मागोवा घ्या. तुम्ही ही शिल्लक कधीही बदलू शकता.',
        ta: 'கையில் வைத்திருக்கும் ரொக்கப் பணத்தைக் கண்காணிக்கவும். இந்த இருப்பை நீங்கள் எப்போது வேண்டுमानாலும் சரிசெய்யலாம்.'
      }
    },
    {
      target: '#bank-accounts-grid-tour',
      title: {
        en: 'Bank Accounts List',
        hi: 'बैंक खातों की सूची',
        mr: 'बँक खात्यांची यादी',
        ta: 'வங்கி கணக்குகள் பட்டியல்'
      },
      desc: {
        en: 'View all active institution accounts. Click edit to adjust current funds or delete to unlink.',
        hi: 'सभी सक्रिय संस्था खातों को देखें। वर्तमान धन को समायोजित करने के लिए संपादन पर क्लिक करें या हटाने के लिए हटाएं।',
        mr: 'सर्व सक्रिय बँक खाती पहा. शिल्लक रक्कम बदलण्यासाठी बदला क्लिक करा किंवा खाते काढून टाकण्यासाठी डिलीट करा.',
        ta: 'செயலில் உள்ள அனைத்து கணக்குகளையும் பார்க்கவும். திருத்த எடிட் என்பதை கிளிக் செய்யவும், நீக்க டெலிட் என்பதை கிளிக் செய்யவும்.'
      }
    }
  ],
  '/transactions': [
    {
      target: null,
      title: {
        en: 'Transactions & Loan Filters',
        hi: 'लेनदेन और ऋण फ़िल्टर',
        mr: 'व्यवहार आणि कर्ज फिल्टर्स',
        ta: 'பரிவர்த்தனைகள் & கடன் வடிகட்டிகள்'
      },
      desc: {
        en: 'This page shows your full financial ledger. Use filters to search details or isolate specific loans.',
        hi: 'यह पृष्ठ आपका पूरा वित्तीय बहीखाता दिखाता है। विवरण खोजने या विशिष्ट ऋणों को अलग करने के लिए फ़िल्टर का उपयोग करें।',
        mr: 'हे पान तुमचे पूर्ण आर्थिक दप्तर दर्शवते. व्यवहार शोधण्यासाठी किंवा विशिष्ट कर्जाचे फिल्टर लावण्यासाठी हे वापरा.',
        ta: 'இந்தப் பக்கம் உங்கள் முழு நிதிப் பதிவேட்டைக் காட்டுகிறது. விவரங்களைத் தேட அல்லது குறிப்பிட்ட கடன்களைத் தனிமைப்படுத்த வடிகட்டிகளைப் பயன்படுத்தவும்.'
      }
    },
    {
      target: '#transactions-filter-tour',
      title: {
        en: 'Search and Filter Options',
        hi: 'खोज और फ़िल्टर विकल्प',
        mr: 'शोध आणि फिल्टर पर्याय',
        ta: 'தேடல் மற்றும் வடிகட்டி விருப்பங்கள்'
      },
      desc: {
        en: 'Filter by search keywords, category types, income/expense flows, or reset active settings.',
        hi: 'खोज कीवर्ड, श्रेणी प्रकार, आय/व्यय प्रवाह के आधार पर फ़िल्टर करें या सक्रिय सेटिंग्स रीसेट करें।',
        mr: 'कीवर्ड, श्रेणी, उत्पन्न/खर्च यानुसार फिल्टर करा किंवा मूळ स्थितीत आणा.',
        ta: 'தேடல் முக்கிய வார்த்தைகள், பிரிவுகள், வரவு/செலவு ஆகியவற்றின் மூலம் வடிகட்டவும் அல்லது அமைப்புகளை மீட்டமைக்கவும்.'
      }
    },
    {
      target: '#transactions-table-tour',
      title: {
        en: 'Transactions List Table',
        hi: 'लेनदेन सूची तालिका',
        mr: 'व्यवहार यादी तक्ता',
        ta: 'பரிவர்த்தனைகள் பட்டியல் அட்டவணை'
      },
      desc: {
        en: 'Shows details of title, category, type, and options to edit or delete any logged transaction.',
        hi: 'शीर्षक, श्रेणी, प्रकार और किसी भी लॉग किए गए लेनदेन को संपादित करने या हटाने के विकल्पों का विवरण दिखाता है।',
        mr: 'शीर्षक, श्रेणी, प्रकार आणि कोणताही व्यवहार सुधारण्यासाठी किंवा हटवण्यासाठीचे पर्याय दाखवतो.',
        ta: 'தலைப்பு, வகை, பிரிவு மற்றும் பரிவர்த்தனைகளைத் திருத்த அல்லது நீக்குவதற்கான விருப்பங்களைக் காட்டுகிறது.'
      }
    },
    {
      target: '#active-loans-sidebar-tour',
      title: {
        en: 'Active Loans & Debts Panel',
        hi: 'सक्रिय ऋण और उधार पैनल',
        mr: 'सक्रिय कर्ज आणि येणे पॅनेल',
        ta: 'செயலில் உள்ள கடன்கள் பேனல்'
      },
      desc: {
        en: 'View active liabilities (what you owe banks/people) and assets (money lent to friends/family). Click a card to filter transactions by that loan!',
        hi: 'सक्रिय देनदारियां (जो आपको बैंकों/लोगों को देना है) और संपत्ति (मित्रों/परिवार को दिया उधार) देखें। उस ऋण के लेनदेन को फ़िल्टर करने के लिए किसी कार्ड पर क्लिक करें!',
        mr: 'घेतलेली कर्जे आणि इतरांना दिलेले पैसे यांची यादी पहा. या कर्जाचे व्यवहार पाहण्यासाठी कार्डवर क्लिक करा!',
        ta: 'செயலில் உள்ள கடன்கள் மற்றும் வசூலிப்புகளைக் காணவும். அந்த கடனின் பரிவர்த்தனைகளை மட்டும் வடிகட்ட கார்டை கிளிக் செய்யவும்!'
      }
    },
    {
      target: '#due-date-calendar-tour',
      title: {
        en: 'Amortization Calendar',
        hi: 'ऋण भुगतान कैलेंडर',
        mr: 'कर्ज मुदत दिनदर्शिका',
        ta: 'கடன் தவணை காலண்டர்'
      },
      desc: {
        en: 'Days with active loan end dates are highlighted in Red (owed) or Green (collect). Click a date to filter the transactions table.',
        hi: 'सक्रिय ऋण समाप्ति तिथियों वाले दिनों को लाल (देना है) या हरे (लेना है) रंग में हाइलाइट किया जाता है। लेनदेन तालिका को फ़िल्टर करने के लिए एक तारीख पर क्लिक करें।',
        mr: 'कर्ज समाप्तीची तारीख असलेले दिवस लाल (देणे) किंवा हिरव्या (येणे) रंगात दर्शवले आहेत. फिल्टर करण्यासाठी तारखेवर क्लिक करा.',
        ta: 'கடன் முடியும் நாட்கள் சிவப்பு (செலுத்த வேண்டியது) அல்லது பச்சை (வசூலிக்க வேண்டியது) நிறத்தில் குறிக்கப்படும். வடிகட்ட தேதியை கிளிக் செய்யவும்.'
      }
    }
  ],
  '/budget': [
    {
      target: null,
      title: {
        en: 'Budgeting Controls',
        hi: 'बजट नियंत्रण',
        mr: 'बजेट नियंत्रण',
        ta: 'பட்டுக்கட்டுப்பாடு'
      },
      desc: {
        en: 'Plan monthly expenses and configure limits per category to prevent overspending.',
        hi: 'मासिक खर्चों की योजना बनाएं और अधिक खर्च को रोकने के लिए प्रति श्रेणी सीमाएं निर्धारित करें।',
        mr: 'मासिक खर्चाचे नियोजन करा आणि अतिखर्च टाळण्यासाठी प्रत्येक गोष्टीवर मर्यादा सेट करा.',
        ta: 'மாதாந்திர செலவுகளைத் திட்டமிடுங்கள் மற்றும் அதிக செலவு செய்வதைத் தடுக்க ஒவ்வொரு பிரிவிற்கும் வரம்புகளை அமைக்கவும்.'
      }
    },
    {
      target: '#budget-global-limit-tour',
      title: {
        en: 'Global Limit Setting',
        hi: 'वैश्विक सीमा सेटिंग',
        mr: 'एकूण मासिक मर्यादा',
        ta: 'ஒட்டுமொத்த வரம்பு அமைப்பு'
      },
      desc: {
        en: 'Set your maximum monthly spending budget. You will receive warning alerts if outflows exceed this.',
        hi: 'अपना अधिकतम मासिक खर्च बजट निर्धारित करें। यदि खर्च इससे अधिक होता है तो आपको चेतावनी मिलेगी।',
        mr: 'तुमचे कमाल मासिक खर्च बजेट ठरवा. खर्च यापेक्षा जास्त झाल्यास तुम्हाला चेतावणी मिळेल.',
        ta: 'உங்கள் அதிகபட்ச மாதாந்திர பட்ஜெட்டை அமைக்கவும். செலவு இந்த வரம்பை தாண்டினால் உங்களுக்கு எச்சரிக்கைகள் வரும்.'
      }
    },
    {
      target: '#budget-category-budgets-tour',
      title: {
        en: 'Category Budget Limits',
        hi: 'श्रेणी बजट सीमाएं',
        mr: 'श्रेणीनुसार बजेट मर्यादा',
        ta: 'பிரிவு பட்ஜெட் வரம்புகள்'
      },
      desc: {
        en: 'Add limit caps on specific categories like Food or Travel and monitor their usage progress bars.',
        hi: 'भोजन या यात्रा जैसी विशिष्ट श्रेणियों पर सीमाएं जोड़ें और उनकी उपयोग प्रगति पट्टियों की निगरानी करें।',
        mr: 'अन्न किंवा प्रवास यासारख्या विशिष्ट गोष्टींवर मर्यादा घाला आणि खर्च किती झाला ते पहा.',
        ta: 'உணவு அல்லது பயணம் போன்ற குறிப்பிட்ட பிரிவுகளுக்கு வரம்புகளைச் சேர்த்து, செலவு நிலவரத்தைக் கண்காணிக்கவும்.'
      }
    },
    {
      target: '#budget-progress-sidebar-tour',
      title: {
        en: 'Budget Progress Stats',
        hi: 'बजट प्रगति आंकड़े',
        mr: 'बजेट प्रगती आकडेवारी',
        ta: 'பட்ஜெட் முன்னேற்ற புள்ளிவிவரங்கள்'
      },
      desc: {
        en: 'Monitor total month spending, available budget balance, and utilized percentage in real time.',
        hi: 'वास्तविक समय में कुल मासिक खर्च, उपलब्ध बजट शेष और उपयोग किए गए प्रतिशत की निगरानी करें।',
        mr: 'एकूण मासिक खर्च, शिल्लक बजेट आणि वापरलेली टक्केवारी रिअल-टाइममध्ये तपासा.',
        ta: 'மொத்த மாதாந்திர செலவு, மீதமுள்ள பட்ஜெட் இருப்பு மற்றும் பயன்படுத்தப்பட்ட சதவீதத்தை நிகழ்நேரத்தில் கண்காணிக்கவும்.'
      }
    }
  ],
  '/insights': [
    {
      target: null,
      title: {
        en: 'Insights & Statement Reports',
        hi: 'अंतर्दृष्टि और विवरण रिपोर्ट',
        mr: 'विश्लेषण आणि अहवाल',
        ta: 'நுண்ணறிவு & அறிக்கை விவரங்கள்'
      },
      desc: {
        en: 'View AI spending advice forecasts and retrieve PDF statements for tax or accounting purposes.',
        hi: 'एआई खर्च सलाह पूर्वानुमान देखें और कर या लेखांकन उद्देश्यों के लिए पीडीएफ विवरण प्राप्त करें।',
        mr: 'एआय खर्च अंदाज पहा आणि कर किंवा हिशोबासाठी पीडीएफ अहवाल डाउनलोड करा.',
        ta: 'AI செலவு கணிப்புகளைக் கண்டறிந்து, வரி அல்லது கணக்கியல் தேவைகளுக்காக PDF அறிக்கைகளைப் பதிவிறக்கவும்.'
      }
    },
    {
      target: '#analytics-ai-advice-tour',
      title: {
        en: 'AI Financial Advice Card',
        hi: 'एआई वित्तीय सलाह कार्ड',
        mr: 'एआय आर्थिक सल्ला कार्ड',
        ta: 'AI நிதி ஆலோசனை அட்டை'
      },
      desc: {
        en: 'Review tailored budget tips and saving advice computed to help optimize spending habits.',
        hi: 'खर्च करने की आदतों को अनुकूलित करने में मदद के लिए तैयार किए गए बजट सुझावों और बचत सलाह की समीक्षा करें।',
        mr: 'खर्च कमी करण्यासाठी आणि बचत वाढवण्यासाठी तयार केलेल्या सल्ल्यांचे पुनरावलोकन करा.',
        ta: 'செலவுகளைக் குறைக்கவும் சேமிப்பை அதிகரிக்கவும் வடிவமைக்கப்பட்ட பட்ஜெட் ஆலோசனைகளை இங்கே பார்க்கவும்.'
      }
    },
    {
      target: '#analytics-ai-forecast-tour',
      title: {
        en: 'Spending Forecast Panel',
        hi: 'व्यय पूर्वानुमान पैनल',
        mr: 'खर्च अंदाज पॅनेल',
        ta: 'செலவு கணிப்பு பேனல்'
      },
      desc: {
        en: 'View projections of next-month outflows calculated by models based on historical trends.',
        hi: 'ऐतिहासिक प्रवृत्तियों के आधार पर मॉडलों द्वारा गणना की गई अगले महीने के खर्चों के पूर्वानुमान देखें।',
        mr: 'मागील व्यवहारांच्या आधारे तयार केलेला पुढील महिन्याचा खर्चाचा अंदाज येथे पहा.',
        ta: 'கடந்த கால செலவுப் போக்குகளின் அடிப்படையில் கணிக்கப்பட்ட அடுத்த மாத செலவு விவரங்களை இங்கே காணலாம்.'
      }
    }
  ],
  '/subscriptions': [
    {
      target: null,
      title: {
        en: 'Subscriptions & Recurring Plans',
        hi: 'सदस्यता और आवर्ती योजनाएं',
        mr: 'सबस्क्रिप्शन आणि नियमित योजना',
        ta: 'சந்தாக்கள் மற்றும் தொடர் திட்டங்கள்'
      },
      desc: {
        en: 'Welcome to your Subscriptions Manager! Track monthly and annual plans like Netflix, Spotify, Gym, or SaaS with automated money deduction.',
        hi: 'आपके सदस्यता प्रबंधक में आपका स्वागत है! ऑटो-डेबिट के साथ नेटफ्लिक्स, स्पॉटिफ़ाई, जिम जैसी योजनाओं को ट्रैक करें।',
        mr: 'तुमच्या सबस्क्रिप्शन मॅनेजरमध्ये स्वागत आहे! ऑटो-डेबिटसह नेटफ्लिक्स, जिम सारख्या नियमित योजनांचा मागोवा घ्या.',
        ta: 'உங்கள் சந்தாக்கள் மேலாளருக்கு வரவேற்கிறோம்! தானியங்கி பணப் பிடித்தத்துடன் மாதாந்திர/ஆண்டுத் திட்டங்களைக் கண்காணிக்கவும்.'
      }
    },
    {
      target: '#subscriptions-stats-grid-tour',
      title: {
        en: 'Subscription Commitments Overview',
        hi: 'सदस्यता प्रतिबद्धता अवलोकन',
        mr: 'सबस्क्रिप्शन खर्च सारांश',
        ta: 'சந்தா செலவு சுருக்கம்'
      },
      desc: {
        en: 'View your real-time Total Monthly Commitment (₹/mo), active plan counts, and calculated yearly commitments.',
        hi: 'अपनी वास्तविक समय की कुल मासिक प्रतिबद्धता (₹/माह), सक्रिय योजनाओं की संख्या और वार्षिक प्रतिबद्धता देखें।',
        mr: 'तुमचा एकूण मासिक खर्च (₹/महिना), सक्रिय योजना आणि वार्षिक खर्चाचा अंदाज रिअल-टाइममध्ये पहा.',
        ta: 'உங்கள் மொத்த மாதாந்திர செலவு (₹/மாதம்), செயலில் உள்ள திட்டங்கள் மற்றும் ஆண்டு செலவு மதிப்பீட்டைப் பார்க்கவும்.'
      }
    },
    {
      target: '#add-subscription-btn-tour',
      title: {
        en: 'Add Subscription Plan',
        hi: 'सदस्यता योजना जोड़ें',
        mr: 'नवीन सबस्क्रिप्शन जोडा',
        ta: 'புதிய சந்தா சேர்'
      },
      desc: {
        en: 'Add a new monthly or annual subscription. Set the start date/day and select your Bank or Cash account for auto-debit.',
        hi: 'एक नई मासिक या वार्षिक सदस्यता जोड़ें। ऑटो-डेबिट के लिए प्रारंभ तिथि और अपना बैंक या नकद खाता चुनें।',
        mr: 'नवीन मासिक किंवा वार्षिक सबस्क्रिप्शन जोडा. ऑटो-डेबिटसाठी तारीख आणि बँक किंवा रोख खाते निवडा.',
        ta: 'புதிய மாதாந்திர அல்லது ஆண்டு சந்தாவைச் சேர்க்கவும். தானியங்கி பிடித்தத்திற்கு தேதி மற்றும் வங்கி/ரொக்கக் கணக்கைத் தேர்ந்தெடுக்கவும்.'
      }
    },
    {
      target: '#subscriptions-list-tour',
      title: {
        en: 'Active Subscriptions & Auto-Deduct Toggle',
        hi: 'सक्रिय सदस्यता और ऑटो-कटौती टॉगल',
        mr: 'सक्रिय सबस्क्रिप्शन आणि ऑटो-डेबिट पर्याय',
        ta: 'செயலில் உள்ள சந்தாக்கள் & ஆட்டோ-டெபிட்'
      },
      desc: {
        en: 'Toggle Auto-Deduct ON/OFF for any plan, trigger manual "Pay Now", pause status, or edit billing dates.',
        hi: 'किसी भी योजना के लिए ऑटो-कटौती को चालू/बंद करें, "अभी भुगतान करें" ट्रिगर करें या स्थिति बदलें।',
        mr: 'कोणत्याही योजनेसाठी ऑटो-डेबिट ऑन/ऑफ करा, "पे नाऊ" वर क्लिक करा किंवा योजना संपादित करा.',
        ta: 'எந்தத் திட்டத்திற்கும் ஆட்டோ-டெபிட் ஆன்/ஆஃப் செய்யவும், "பே நவ்" கிளிக் செய்யவும் அல்லது திட்டத்தைத் திருத்தவும்.'
      }
    }
  ],
  '/profile': [
    {
      target: null,
      title: {
        en: 'Profile & Account Settings',
        hi: 'प्रोफ़ाइल और खाता सेटिंग्स',
        mr: 'प्रोफाइल आणि खाते सेटिंग्ज',
        ta: 'சுயவிவரம் & கணக்கு அமைப்புகள்'
      },
      desc: {
        en: 'Welcome to your Profile settings! You can access this anytime by clicking your name initial symbol in the top header.',
        hi: 'आपकी प्रोफ़ाइल सेटिंग्स में आपका स्वागत है! आप शीर्ष हेडर में अपने नाम के शुरुआती प्रतीक पर क्लिक करके कभी भी इस तक पहुंच सकते हैं।',
        mr: 'तुमच्या प्रोफाइल सेटिंग्जमध्ये स्वागत आहे! तुम्ही वरच्या हेडरमधील तुमच्या नावाच्या अद्याक्षरावर क्लिक करून येथे येऊ शकता.',
        ta: 'உங்கள் சுயவிவர அமைப்புகளுக்கு வரவேற்கிறோம்! மேல் ஹெடரில் உள்ள உங்கள் பெயரின் முதல் குறியீட்டைக் கிளிக் செய்வதன் மூலம் இதை எப்போதும் அணுகலாம்.'
      }
    },
    {
      target: '#profile-card-tour',
      title: {
        en: 'Personal Details & Security',
        hi: 'व्यक्तिगत विवरण और सुरक्षा',
        mr: 'वैयक्तिक माहिती आणि सुरक्षा',
        ta: 'தனிப்பட்ட விவரங்கள் & பாதுகாப்பு'
      },
      desc: {
        en: 'Update your display name, email, or change your account password securely here.',
        hi: 'अपना नाम, ईमेल अपडेट करें या सुरक्षित रूप से अपना खाता पासवर्ड बदलें।',
        mr: 'तुमचे नाव, ईमेल अपडेट करा किंवा सुरक्षेसाठी पासवर्ड बदला.',
        ta: 'உங்கள் பெயர், மின்னஞ்சல் அல்லது கணக்கு கடவுச்சொல்லை பாதுகாப்பாக இங்கே மாற்றவும்.'
      }
    }
  ]
}

const commonTranslations = {
  en: { next: 'Next', back: 'Back', skip: 'Skip Tour', finish: 'Finish', restartTour: 'Page Tour' },
  hi: { next: 'अगला', back: 'पीछे', skip: 'छोड़ें', finish: 'समाप्त', restartTour: 'पेज गाइड' },
  mr: { next: 'पुढे', back: 'मागे', skip: 'वगळा', finish: 'पूर्ण', restartTour: 'सफर सुरू करा' },
  ta: { next: 'அடுத்து', back: 'முந்தைய', skip: 'தவிர்', finish: 'முடி', restartTour: 'பக்க வழிகாட்டி' }
}

const loansTourSteps = [
  {
    target: null,
    title: {
      en: 'Loans & EMI Dashboard',
      hi: 'ऋण और ईएमआई डैशबोर्ड',
      mr: 'कर्ज आणि ईएमआय व्यवस्थापन',
      ta: 'கடன் மற்றும் ஈஎம்ஐ மேலாண்மை'
    },
    desc: {
      en: 'Welcome to your Loans & EMI system. Here you can track active loans, see debt progress, and schedule notifications.',
      hi: 'आपके ऋण और ईएमआई सिस्टम में आपका स्वागत है। यहां आप सक्रिय ऋणों को ट्रैक कर सकते हैं, प्रगति देख सकते हैं और सूचनाएं शेड्यूल कर सकते हैं।',
      mr: 'तुमच्या कर्ज आणि ईएमआय प्रणालीमध्ये आपले स्वागत आहे. येथे तुम्ही कर्जे, त्याची प्रगती आणि सूचना पाहू शकता.',
      ta: 'உங்கள் கடன் மற்றும் ஈஎம்ஐ முறைக்கு வரவேற்கிறோம். தவணைகள், முன்னேற்றம் ஆகியவற்றைக் கண்காணிக்கலாம்.'
    }
  },
  {
    target: '#loans-stats-grid-tour',
    title: {
      en: 'Loan Statistics Summary',
      hi: 'ऋण सांख्यिकी सारांश',
      mr: 'कर्ज आकडेवारी सारांश',
      ta: 'கடன் புள்ளிவிவரங்கள்'
    },
    desc: {
      en: 'Quick overview of left to pay balance, monthly EMI amounts, active/completed counts, and overdue reminders.',
      hi: 'बचे हुए भुगतान शेष, मासिक ईएमआई राशियों, सक्रिय/पूर्ण गणनाओं और अतिदेय अनुस्मारकों का त्वरित अवलोकन।',
      mr: 'येणे शिल्लक रक्कम, मासिक ईएमआय रक्कम, सक्रिय/पूर्ण कर्जे आणि थकबाकी यांचा सारांश पहा.',
      ta: 'செலுத்த வேண்டிய தொகை, மாத தவணை, செயலில் உள்ள/முடிந்த கடன்கள் ஆகியவற்றின் சுருக்கம்.'
    }
  },
  {
    target: '#loans-payoff-date-tour',
    title: {
      en: 'Debt Free Forecast',
      hi: 'ऋण मुक्ति पूर्वानुमान',
      mr: 'कर्जमुक्ती अंदाज',
      ta: 'கடன் இல்லாத கணிப்பு'
    },
    desc: {
      en: 'Shows expected date when you will be completely debt free based on current installments paid.',
      hi: 'वर्तमान भुगतान की गई किश्तों के आधार पर वह संभावित तारीख दिखाता है जब आप पूरी तरह से ऋण मुक्त हो जाएंगे।',
      mr: 'सध्या भरलेल्या हप्त्यांच्या आधारे तुम्ही पूर्णपणे कर्जमुक्त होण्याच्या अपेक्षित तारखेचा अंदाज दर्शवतो.',
      ta: 'தற்போதைய தவணைகளின் அடிப்படையில் நீங்கள் கடன் இல்லாதவராக माறும் எதிர்பார்க்கப்படும் தேதி.'
    }
  },
  {
    target: '#loans-filter-tour',
    title: {
      en: 'Status Filter Tabs',
      hi: 'स्थिति फ़िल्टर टैब',
      mr: 'स्थितीनुसार फिल्टर',
      ta: 'நிலை வடிகட்டி தாவல்கள்'
    },
    desc: {
      en: 'Filter your loans by Active, Overdue, Completed, or due this month.',
      hi: 'सक्रिय, अतिदेय, पूर्ण या इस महीने देय के आधार पर अपने ऋणों को फ़िल्टर करें।',
      mr: 'सक्रिय, थकबाकी, पूर्ण किंवा चालू महिन्यात देय असलेली कर्जे फिल्टर करा.',
      ta: 'செயலில் உள்ளவை, காலாவதியானவை, முடிந்தவை அல்லது இந்த மாத தவணைகளின் அடிப்படையில் வடிகட்டவும்.'
    }
  },
  {
    target: '#loans-add-btn-tour',
    title: {
      en: 'Add New Loan',
      hi: 'नया ऋण जोड़ें',
      mr: 'नवीन कर्ज जोडा',
      ta: 'புதிய கடன் சேர்க்கவும்'
    },
    desc: {
      en: 'Create a new loan or personal debt ledger. It will automatically pre-generate all installment schedules.',
      hi: 'नया ऋण या व्यक्तिगत ऋण बहीखाता बनाएं। यह स्वचालित रूप से सभी किश्त अनुसूचियों को उत्पन्न करेगा।',
      mr: 'नवीन कर्ज किंवा येणे रक्कम नोंदवा. यामुळे आपोआप हप्त्यांचे वेळापत्रक तयार होईल.',
      ta: 'புதிய கடன் கணக்கை உருவாக்கவும். இது தானாகவே தவணை அட்டவணையை உருவாக்கும்.'
    }
  }
]

export default function OnboardingTour() {
  const { language } = useLanguage()
  const location = useLocation()
  const currentPath = location.pathname.replace(/\/$/, '') || '/'
  
  const [active, setActive] = useState(false)
  const [stepIndex, setStepIndex] = useState(0)
  const [coords, setCoords] = useState(null)
  
  const isLoansTab = location.pathname === '/transactions' && location.search.includes('tab=loans')
  const steps = useMemo(() => isLoansTab ? loansTourSteps : (pageTours[currentPath] || []), [isLoansTab, currentPath])
  const labels = commonTranslations[language] || commonTranslations['en']
  const tourKey = currentPath + (isLoansTab ? '_loans' : '')

  // Auto start tour if not completed for this page
  useEffect(() => {
    if (steps.length === 0) {
      setActive(false)
      return
    }

    const completed = localStorage.getItem('xpenz_tour_completed_' + tourKey)
    if (!completed) {
      const timer = setTimeout(() => {
        setStepIndex(0)
        setActive(true)
      }, 1200)
      return () => clearTimeout(timer)
    } else {
      setActive(false)
    }
  }, [currentPath, steps.length, tourKey])

  // Track position recalculation for active step element
  useEffect(() => {
    if (!active || steps.length === 0) return
    
    const calculatePosition = () => {
      const step = steps[stepIndex]
      if (!step || !step.target) {
        setCoords(null)
        return
      }
      
      let el = document.querySelector(step.target)
      
      // Fallback redirection for mobile view navigation
      if (!el && step.target === '#sidebar-navigation-tour') {
        el = document.querySelector('#bottom-navigation-tour')
      }
      
      if (el) {
        const rect = el.getBoundingClientRect()
        setCoords({
          top: rect.top,
          left: rect.left,
          width: rect.width,
          height: rect.height,
          bottom: rect.bottom,
          right: rect.right
        })
        
        // Auto scroll if not in visible area
        if (rect.top < 60 || rect.bottom > window.innerHeight - 80) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' })
        }
      } else {
        setCoords(null)
      }
    }

    calculatePosition()
    
    // Add scroll event listener to main element (since window doesn't scroll)
    const mainEl = document.querySelector('main')
    
    window.addEventListener('resize', calculatePosition)
    if (mainEl) {
      mainEl.addEventListener('scroll', calculatePosition)
    }
    
    return () => {
      window.removeEventListener('resize', calculatePosition)
      if (mainEl) {
        mainEl.removeEventListener('scroll', calculatePosition)
      }
    }
  }, [stepIndex, active, currentPath, steps])

  const handleNext = () => {
    if (stepIndex < steps.length - 1) {
      setStepIndex(stepIndex + 1)
    } else {
      handleComplete()
    }
  }

  const handleBack = () => {
    if (stepIndex > 0) {
      setStepIndex(stepIndex - 1)
    }
  }

  const handleComplete = () => {
    localStorage.setItem('xpenz_tour_completed_' + tourKey, 'true')
    setActive(false)
    setStepIndex(0)
  }

  // Listen for manual tour restart event from Navbar
  useEffect(() => {
    const handleTrigger = () => {
      setStepIndex(0)
      setActive(true)
    }
    window.addEventListener('xpenz_trigger_tour', handleTrigger)
    return () => window.removeEventListener('xpenz_trigger_tour', handleTrigger)
  }, [])

  if (steps.length === 0 || !active) return null

  const currentStep = steps[stepIndex]
  if (!currentStep) return null

  const stepTitle = currentStep.title[language] || currentStep.title['en']
  const stepDesc = currentStep.desc[language] || currentStep.desc['en']

  // Unified high-end control console floating at bottom center of the viewport
  const cardStyle = {
    position: 'fixed',
    bottom: '24px',
    left: '50%',
    transform: 'translateX(-50%)',
    width: '380px',
    maxWidth: 'calc(100% - 32px)',
    zIndex: 1000
  }

  return (
    <>
      {/* Dark overlay with SVG cutout hole spotlight */}
      <svg
        className="fixed inset-0 pointer-events-auto z-[990] transition-all duration-300"
        style={{ width: '100%', height: '100%' }}
      >
        <mask id="spotlight-mask">
          <rect width="100%" height="100%" fill="white" />
          {coords && (
            <rect
              x={coords.left - 6}
              y={coords.top - 6}
              width={coords.width + 12}
              height={coords.height + 12}
              rx="12"
              ry="12"
              fill="black"
            />
          )}
        </mask>
        <rect
          width="100%"
          height="100%"
          fill="rgba(15, 23, 42, 0.75)"
          mask="url(#spotlight-mask)"
        />
      </svg>

      {/* Tour Dialog Pop-up (Fixed Bottom Center console layout) */}
      <div
        style={cardStyle}
        className="bg-white dark:bg-[#131522] border border-slate-100 dark:border-slate-800 rounded-3xl p-5 shadow-2xl space-y-4 z-[1000] text-slate-800 dark:text-slate-100 transition-all duration-300"
      >
        <div className="flex justify-between items-start">
          <span className="text-[10px] font-bold text-indigo-500 dark:text-purple-400 bg-indigo-50 dark:bg-purple-950/20 px-2 py-0.5 rounded-full uppercase tracking-wider">
            {stepIndex + 1} / {steps.length}
          </span>
          <button
            onClick={handleComplete}
            className="text-slate-400 hover:text-slate-650 dark:hover:text-white p-1 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <FiX className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-1">
          <h4 className="font-extrabold text-base text-slate-800 dark:text-white">
            {stepTitle}
          </h4>
          <p className="text-slate-500 dark:text-dark-text-muted text-xs leading-relaxed">
            {stepDesc}
          </p>
        </div>

        <div className="flex justify-between items-center pt-2 border-t border-slate-100 dark:border-dark-border">
          <button
            onClick={handleComplete}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-350 text-xs font-bold hover:underline cursor-pointer"
          >
            {labels.skip}
          </button>
          
          <div className="flex gap-2">
            {stepIndex > 0 && (
              <button
                onClick={handleBack}
                className="flex items-center gap-1 px-3 py-1.5 border border-slate-200 dark:border-dark-border text-slate-600 dark:text-slate-350 rounded-xl text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <FiChevronLeft className="w-3.5 h-3.5" />
                {labels.back}
              </button>
            )}
            <button
              onClick={handleNext}
              className="flex items-center gap-1 px-4 py-1.5 bg-secondary dark:bg-purple-650 hover:bg-indigo-700 dark:hover:bg-purple-750 text-white rounded-xl text-xs font-bold shadow-md shadow-secondary/15 transition-colors cursor-pointer"
            >
              {stepIndex === steps.length - 1 ? labels.finish : labels.next}
              <FiChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
