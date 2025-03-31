export const testQueries = [
  // Direct questions (answers explicitly in notes)
  {
    query: 'What are the major perspectives in psychology?',
    relevantDocIds: ['/vault/psychology.md'],
    category: 'direct',
  },
  {
    query: 'What is the difference between natural numbers and integers?',
    relevantDocIds: ['/vault/mathematics.md'],
    category: 'direct',
  },
  {
    query: 'What are the key elements of art composition?',
    relevantDocIds: ['/vault/art/composition.md'],
    category: 'direct',
  },
  {
    query: 'Name three research methods used in psychology.',
    relevantDocIds: ['/vault/psychology.md'],
    category: 'direct',
  },
  {
    query: 'What are the major branches of mathematics?',
    relevantDocIds: ['/vault/mathematics.md'],
    category: 'direct',
  },
  {
    query: 'What is included in the periodic table?',
    relevantDocIds: ['/vault/science/periodic_table.md'],
    category: 'direct',
  },
  {
    query: 'What are the main features of CSS Flexbox?',
    relevantDocIds: ['/vault/code/css_flexbox.md'],
    category: 'direct',
  },
  {
    query: 'What is the purpose of the 4Ps in marketing?',
    relevantDocIds: ['/vault/business/marketing_basics.md'],
    category: 'direct',
  },
  {
    query: 'What are the key concepts of calculus mentioned in the notes?',
    relevantDocIds: ['/vault/mathematics.md'],
    category: 'direct',
  },
  {
    query: 'What are the main art movements described in the XX century?',
    relevantDocIds: ['/vault/art/art_movements.md'],
    category: 'direct',
  },

  // Inferential questions (synthesis across multiple notes)
  {
    query:
      "How might the concept of 'motivation' in psychology relate to project management?",
    relevantDocIds: [
      '/vault/psychology.md',
      '/vault/business/project_management.md',
    ],
    category: 'inferential',
  },
  {
    query:
      'How could observational research in psychology be applied to studying art movements?',
    relevantDocIds: ['/vault/psychology.md', '/vault/art/art_movements.md'],
    category: 'inferential',
  },
  {
    query:
      'What is the relationship between software development methodologies and leadership styles?',
    relevantDocIds: [
      '/vault/business/project_management.md',
      '/vault/business/leadership_styles.md',
    ],
    category: 'inferential',
  },
  {
    query:
      'How might the study of geometry in mathematics inform the understanding of art composition?',
    relevantDocIds: ['/vault/mathematics.md', '/vault/art/composition.md'],
    category: 'inferential',
  },
  {
    query: 'What benefits does IoT provide in healthcare based on the notes?',
    relevantDocIds: ['/vault/IoT.md'],
    category: 'inferential',
  },
  {
    query:
      'What parallels can be drawn between case studies in psychology and historical documentation?',
    relevantDocIds: ['/vault/psychology.md', '/vault/history/world_war_2.md'],
    category: 'inferential',
  },
  {
    query:
      'How might the theory of relativity connect to philosophical concepts of time?',
    relevantDocIds: ['/vault/science/relativity.md', '/vault/philosophy.md'],
    category: 'inferential',
  },
  {
    query: 'How could the study of color theory be applied to digital art?',
    relevantDocIds: ['/vault/art/color_theory.md', '/vault/art/digital_art.md'],
    category: 'inferential',
  },
  {
    query:
      'What are the limitations of using pgvectors according to the notes?',
    relevantDocIds: ['/vault/pg_vectors.md'],
    category: 'inferential',
  },
  {
    query:
      'How might the renaissance period have influenced modern art movements?',
    relevantDocIds: [
      '/vault/history/renaissance.md',
      '/vault/art/art_movements.md',
    ],
    category: 'inferential',
  },

  // Out-of-scope questions (information not in notes)
  {
    query: 'What are the main principles of quantum computing?',
    relevantDocIds: [],
    category: 'out-of-scope',
  },
  {
    query: 'How does blockchain technology work?',
    relevantDocIds: [],
    category: 'out-of-scope',
  },
  {
    query:
      'What are the key differences between Romanticism and Neoclassicism in literature?',
    relevantDocIds: [],
    category: 'out-of-scope',
  },
  {
    query: 'What is the history of the Ottoman Empire?',
    relevantDocIds: [],
    category: 'out-of-scope',
  },
  {
    query: 'How does the lymphatic system work?',
    relevantDocIds: [],
    category: 'out-of-scope',
  },
  {
    query:
      'What are the main components of a transformer architecture in machine learning?',
    relevantDocIds: [],
    category: 'out-of-scope',
  },
  {
    query: 'What is the process of nuclear fusion?',
    relevantDocIds: [],
    category: 'out-of-scope',
  },
  {
    query: 'How does options trading work in financial markets?',
    relevantDocIds: [],
    category: 'out-of-scope',
  },
  {
    query: 'What are the key differences between Baroque and Classical music?',
    relevantDocIds: [],
    category: 'out-of-scope',
  },
  {
    query: 'What is the structure and function of CRISPR-Cas9?',
    relevantDocIds: [],
    category: 'out-of-scope',
  },
];