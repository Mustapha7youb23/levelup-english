// Study resources by CEFR level.
// skill: grammar | vocabulary | reading | listening | writing | all
// A resource without a url is a book or method (shown without a link).
window.LEVEL_INFO = {
  A1: { name: "Beginner", exam: "Pre-A2 / Cambridge Movers–Flyers", minutes: 25,
        can: "You can understand and use everyday expressions and very basic phrases, introduce yourself and ask simple questions." },
  A2: { name: "Elementary", exam: "Cambridge A2 Key (KET)", minutes: 30,
        can: "You can understand frequently used expressions, describe your background and handle simple, routine tasks." },
  B1: { name: "Intermediate", exam: "Cambridge B1 Preliminary (PET)", minutes: 35,
        can: "You can deal with most travel situations, describe experiences and plans, and give short reasons for opinions." },
  B2: { name: "Upper-intermediate", exam: "Cambridge B2 First (FCE) / IELTS 5.5–6.5", minutes: 40,
        can: "You can understand the main ideas of complex texts and talk fluently and spontaneously with native speakers." },
  C1: { name: "Advanced", exam: "Cambridge C1 Advanced (CAE) / IELTS 7.0–8.0", minutes: 45,
        can: "You can understand demanding, longer texts, recognise implicit meaning and use English flexibly for work and study." },
  C2: { name: "Proficiency", exam: "Cambridge C2 Proficiency (CPE) / IELTS 8.5+", minutes: 50,
        can: "You can understand virtually everything you hear or read and express yourself precisely, with fine shades of meaning." }
};

window.RESOURCES = {
  A1: [
    { skill: "grammar", name: "British Council – A1–A2 grammar", url: "https://learnenglish.britishcouncil.org/grammar/a1-a2-grammar", desc: "Short explanations and exercises: to be, present simple, articles, plurals." },
    { skill: "grammar", name: "Essential Grammar in Use (Raymond Murphy)", desc: "Book. The classic A1–A2 grammar book: one page explanation, one page practice." },
    { skill: "vocabulary", name: "British Council – A1–A2 vocabulary", url: "https://learnenglish.britishcouncil.org/vocabulary/a1-a2-vocabulary", desc: "Everyday words: family, food, numbers, time, places." },
    { skill: "vocabulary", name: "Oxford 3000 word list", url: "https://www.oxfordlearnersdictionaries.com/wordlists/oxford3000-5000", desc: "Filter by A1 and learn the most important words first." },
    { skill: "reading", name: "British Council – A1 reading", url: "https://learnenglish.britishcouncil.org/skills/reading/a1-reading", desc: "Short notes, signs and messages with questions." },
    { skill: "listening", name: "British Council – A1 listening", url: "https://learnenglish.britishcouncil.org/skills/listening/a1-listening", desc: "Slow, clear audio with transcripts." },
    { skill: "listening", name: "ELLLO", url: "https://www.elllo.org/", desc: "Thousands of short real conversations with transcripts, sorted by level." },
    { skill: "writing", name: "British Council – A1 writing", url: "https://learnenglish.britishcouncil.org/skills/writing/a1-writing", desc: "Model texts: emails, forms, short messages." },
    { skill: "all", name: "Daily habit: 15 minutes + flashcards", url: "https://apps.ankiweb.net/", desc: "Anki (free) – review 10 new words a day with spaced repetition." }
  ],
  A2: [
    { skill: "grammar", name: "British Council – A1–A2 grammar", url: "https://learnenglish.britishcouncil.org/grammar/a1-a2-grammar", desc: "Past simple, comparatives, going to, present perfect basics." },
    { skill: "grammar", name: "Perfect English Grammar", url: "https://www.perfect-english-grammar.com/", desc: "Clear explanations and free exercises for every tense." },
    { skill: "vocabulary", name: "British Council – A1–A2 vocabulary", url: "https://learnenglish.britishcouncil.org/vocabulary/a1-a2-vocabulary", desc: "Topic vocabulary with exercises." },
    { skill: "vocabulary", name: "Oxford 3000 word list (A2)", url: "https://www.oxfordlearnersdictionaries.com/wordlists/oxford3000-5000", desc: "Filter by A2 and add the words you don't know to flashcards." },
    { skill: "reading", name: "British Council – A2 reading", url: "https://learnenglish.britishcouncil.org/skills/reading/a2-reading", desc: "Emails, adverts and short articles with questions." },
    { skill: "reading", name: "News in Levels", url: "https://www.newsinlevels.com/", desc: "Real news rewritten at 3 levels. Start with level 1–2." },
    { skill: "listening", name: "British Council – A2 listening", url: "https://learnenglish.britishcouncil.org/skills/listening/a2-listening", desc: "Announcements, phone calls and conversations." },
    { skill: "listening", name: "VOA Learning English", url: "https://learningenglish.voanews.com/", desc: "News read slowly with full text – perfect for A2–B1." },
    { skill: "writing", name: "British Council – A2 writing", url: "https://learnenglish.britishcouncil.org/skills/writing/a2-writing", desc: "Model emails and messages." },
    { skill: "writing", name: "Write & Improve (Cambridge)", url: "https://writeandimprove.com/", desc: "Free: write a text and get an automatic CEFR level and corrections." },
    { skill: "all", name: "Official A2 Key exam info + sample papers", url: "https://www.cambridgeenglish.org/exams-and-tests/key/", desc: "See the real exam format and free sample tests." }
  ],
  B1: [
    { skill: "grammar", name: "British Council – B1–B2 grammar", url: "https://learnenglish.britishcouncil.org/grammar/b1-b2-grammar", desc: "Conditionals, passive, reported speech, relative clauses." },
    { skill: "grammar", name: "English Grammar in Use (Raymond Murphy)", desc: "Book. The best-selling intermediate grammar book (B1–B2)." },
    { skill: "grammar", name: "BBC 6 Minute Grammar", url: "https://www.bbc.co.uk/learningenglish/english/features/6-minute-grammar", desc: "Short audio lessons on one grammar point each." },
    { skill: "vocabulary", name: "British Council – B1–B2 vocabulary", url: "https://learnenglish.britishcouncil.org/vocabulary/b1-b2-vocabulary", desc: "Phrasal verbs, collocations, topic words." },
    { skill: "vocabulary", name: "English Vocabulary Profile", url: "https://www.englishprofile.org/wordlists/evp", desc: "Check which level any word is. Learn B1 words and their meanings." },
    { skill: "reading", name: "British Council – B1 reading", url: "https://learnenglish.britishcouncil.org/skills/reading/b1-reading", desc: "Articles, reviews and emails with exam-style questions." },
    { skill: "reading", name: "Breaking News English", url: "https://breakingnewsenglish.com/", desc: "Real news lessons at 7 levels with activities." },
    { skill: "listening", name: "BBC 6 Minute English", url: "https://www.bbc.co.uk/learningenglish/english/features/6-minute-english", desc: "Two presenters discuss a topic in 6 minutes. Transcript included." },
    { skill: "listening", name: "British Council – B1 listening", url: "https://learnenglish.britishcouncil.org/skills/listening/b1-listening", desc: "Interviews, talks and conversations." },
    { skill: "writing", name: "British Council – B1 writing", url: "https://learnenglish.britishcouncil.org/skills/writing/b1-writing", desc: "Model emails, stories and articles." },
    { skill: "writing", name: "Write & Improve (Cambridge)", url: "https://writeandimprove.com/", desc: "Free automatic feedback and CEFR level for your writing." },
    { skill: "all", name: "Official B1 Preliminary exam info + sample papers", url: "https://www.cambridgeenglish.org/exams-and-tests/preliminary/", desc: "The real exam format and free sample tests." }
  ],
  B2: [
    { skill: "grammar", name: "British Council – B1–B2 grammar", url: "https://learnenglish.britishcouncil.org/grammar/b1-b2-grammar", desc: "Mixed conditionals, modals of deduction, wishes, passive forms." },
    { skill: "grammar", name: "English Grammar in Use (Raymond Murphy)", desc: "Book. Do the units for the mistakes you made in this test." },
    { skill: "vocabulary", name: "British Council – B1–B2 vocabulary", url: "https://learnenglish.britishcouncil.org/vocabulary/b1-b2-vocabulary", desc: "Collocations, word formation and phrasal verbs." },
    { skill: "vocabulary", name: "Oxford 5000 word list (B2)", url: "https://www.oxfordlearnersdictionaries.com/wordlists/oxford3000-5000", desc: "The 2,000 extra words for upper-intermediate learners." },
    { skill: "vocabulary", name: "BBC – The English We Speak", url: "https://www.bbc.co.uk/learningenglish/english/features/the-english-we-speak", desc: "Everyday idioms and expressions in 3 minutes." },
    { skill: "reading", name: "British Council – B2 reading", url: "https://learnenglish.britishcouncil.org/skills/reading/b2-reading", desc: "Longer articles with inference questions." },
    { skill: "reading", name: "The Guardian", url: "https://www.theguardian.com/international", desc: "Read one real article a day and note 5 new expressions." },
    { skill: "listening", name: "British Council – B2 listening", url: "https://learnenglish.britishcouncil.org/skills/listening/b2-listening", desc: "Talks, discussions and interviews." },
    { skill: "listening", name: "TED Talks", url: "https://www.ted.com/talks", desc: "Watch with English subtitles, then without." },
    { skill: "writing", name: "British Council – B2 writing", url: "https://learnenglish.britishcouncil.org/skills/writing/b2-writing", desc: "Essays, reports, reviews and formal emails." },
    { skill: "writing", name: "Write & Improve (Cambridge)", url: "https://writeandimprove.com/", desc: "Practise B2 First essays and get instant feedback." },
    { skill: "all", name: "Official B2 First exam info + sample papers", url: "https://www.cambridgeenglish.org/exams-and-tests/first/", desc: "The real exam format and free sample tests." }
  ],
  C1: [
    { skill: "grammar", name: "British Council – C1 grammar", url: "https://learnenglish.britishcouncil.org/grammar/c1-grammar", desc: "Inversion, cleft sentences, advanced modals, ellipsis." },
    { skill: "grammar", name: "Advanced Grammar in Use (Martin Hewings)", desc: "Book. The standard C1–C2 grammar reference with exercises." },
    { skill: "vocabulary", name: "Oxford 5000 word list (C1)", url: "https://www.oxfordlearnersdictionaries.com/wordlists/oxford3000-5000", desc: "Filter by C1 and learn the words in collocations, not alone." },
    { skill: "vocabulary", name: "English Vocabulary Profile", url: "https://www.englishprofile.org/wordlists/evp", desc: "See C1/C2 meanings, idioms and phrases for any word." },
    { skill: "reading", name: "British Council – C1 reading", url: "https://learnenglish.britishcouncil.org/skills/reading/c1-reading", desc: "Demanding texts with questions on tone and implication." },
    { skill: "reading", name: "The Guardian – The Long Read", url: "https://www.theguardian.com/news/series/the-long-read", desc: "Long, high-quality articles. Summarise each one in 5 sentences." },
    { skill: "listening", name: "British Council – C1 listening", url: "https://learnenglish.britishcouncil.org/skills/listening/c1-listening", desc: "Lectures, debates and radio programmes." },
    { skill: "listening", name: "BBC Learning English – Towards Advanced", url: "https://www.bbc.co.uk/learningenglish/english/course/towards-advanced", desc: "Free advanced course with audio and video." },
    { skill: "writing", name: "British Council – C1 writing", url: "https://learnenglish.britishcouncil.org/skills/writing/c1-writing", desc: "Essays, proposals and reports at advanced level." },
    { skill: "writing", name: "Purdue OWL", url: "https://owl.purdue.edu/owl/purdue_owl.html", desc: "Academic writing: structure, argument, style, punctuation." },
    { skill: "all", name: "Official C1 Advanced exam info + sample papers", url: "https://www.cambridgeenglish.org/exams-and-tests/advanced/", desc: "The real exam format and free sample tests." }
  ],
  C2: [
    { skill: "grammar", name: "Advanced Grammar in Use (Martin Hewings)", desc: "Book. Use it as a reference to polish fine grammar points." },
    { skill: "vocabulary", name: "Oxford Learner's Dictionaries", url: "https://www.oxfordlearnersdictionaries.com/", desc: "Study idioms, register labels and collocations for every new word." },
    { skill: "vocabulary", name: "English Vocabulary Profile (C2)", url: "https://www.englishprofile.org/wordlists/evp", desc: "Learn C2 phrases and figurative meanings." },
    { skill: "reading", name: "Aeon essays", url: "https://aeon.co/essays", desc: "Dense essays on philosophy, science and culture – true C2 reading." },
    { skill: "reading", name: "The Economist", url: "https://www.economist.com/", desc: "Precise, idiomatic writing on world affairs." },
    { skill: "reading", name: "Project Gutenberg", url: "https://www.gutenberg.org/", desc: "Free classic literature – read the authors native speakers study." },
    { skill: "listening", name: "TED Talks (no subtitles)", url: "https://www.ted.com/talks", desc: "Listen without subtitles and summarise the speaker's argument." },
    { skill: "listening", name: "Luke's English Podcast", url: "https://teacherluke.co.uk/", desc: "Long, natural British English episodes with humour and idioms." },
    { skill: "writing", name: "Purdue OWL", url: "https://owl.purdue.edu/owl/purdue_owl.html", desc: "Polish academic style, cohesion and argument." },
    { skill: "all", name: "Official C2 Proficiency exam info + sample papers", url: "https://www.cambridgeenglish.org/exams-and-tests/proficiency/", desc: "The real exam format and free sample tests." }
  ]
};

// Official, free tests you can use to confirm your level.
window.OFFICIAL_TESTS = [
  { name: "EF SET (free, 50 minutes)", url: "https://www.efset.org/", desc: "Standardised reading + listening test with a CEFR score you can share." },
  { name: "Cambridge – Test your English", url: "https://www.cambridgeenglish.org/test-your-english/", desc: "Quick free test from Cambridge that suggests which exam to take." },
  { name: "Write & Improve", url: "https://writeandimprove.com/", desc: "Free CEFR level for your writing from Cambridge." }
];

// Practical tips per skill, shown when that skill is weak.
window.SKILL_TIPS = {
  grammar: "Review every grammar question you got wrong, find the rule, then write 5 of your own sentences using it.",
  vocabulary: "Learn words in groups (collocations like 'make a decision'), not alone. Review them with flashcards every day.",
  reading: "Read the questions first, then the text. Underline the sentence that proves each answer.",
  listening: "Listen once for the general idea, then again for details. Practise with transcripts: listen, read, listen again.",
  writing: "Write one short text every day at this level and get feedback (Write & Improve is free)."
};
