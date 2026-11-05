/**
 * Academic Structure Data for College KTU Notes Hub
 * 
 * Scope: EXACTLY 7 courses and 11 course-semester combinations.
 * Designed for dynamic management via Supabase in future phases.
 * 
 * Initial Programmes:
 * 1. B.Tech AI & DS: S1, S2, S3
 * 2. B.Tech CSE: S1, S2, S3
 * 3. B.Tech CSBS: S1
 * 4. BCA: S1
 * 5. BBA: S1
 * 6. MBA: S1
 * 7. B.Tech ECE: S1
 */

export const INITIAL_PROGRAMMES = [
  {
    id: 'btech-aids',
    code: 'AI & DS',
    name: 'B.Tech AI & DS',
    fullName: 'Artificial Intelligence & Data Science',
    degreeType: 'B.Tech',
    scheme: 'KTU 2024 Scheme',
    iconName: 'Bot',
    description: 'Foundational computing, linear algebra, Python programming, and data engineering fundamentals.',
    isActive: true,
    availableSemesters: [
      {
        id: 'btech-aids-s1',
        semesterNumber: 1,
        title: 'Semester 1',
        phase: 'First Year',
        focus: 'Basic Sciences & Engineering Foundation',
        description: 'Engineering physics, mathematics, basic electrical and computing foundational modules.',
        isActive: true,
      },
      {
        id: 'btech-aids-s2',
        semesterNumber: 2,
        title: 'Semester 2',
        phase: 'First Year',
        focus: 'Engineering Sciences & Programming',
        description: 'Advanced mathematics, algorithmic thinking, Python fundamentals, and engineering mechanics.',
        isActive: true,
      },
      {
        id: 'btech-aids-s3',
        semesterNumber: 3,
        title: 'Semester 3',
        phase: 'Second Year',
        focus: 'AI Fundamentals & Data Structures',
        description: 'Discrete mathematical structures, data structures, object-oriented concepts, and AI basics.',
        isActive: true,
      },
    ],
  },
  {
    id: 'btech-cse',
    code: 'CSE',
    name: 'B.Tech CSE',
    fullName: 'Computer Science & Engineering',
    degreeType: 'B.Tech',
    scheme: 'KTU 2024 Scheme',
    iconName: 'Cpu',
    description: 'Computational thinking, programming methodologies, computer systems, and core software theory.',
    isActive: true,
    availableSemesters: [
      {
        id: 'btech-cse-s1',
        semesterNumber: 1,
        title: 'Semester 1',
        phase: 'First Year',
        focus: 'Basic Sciences & Engineering Foundation',
        description: 'Calculus, engineering physics, introductory computing, and basic engineering workshops.',
        isActive: true,
      },
      {
        id: 'btech-cse-s2',
        semesterNumber: 2,
        title: 'Semester 2',
        phase: 'First Year',
        focus: 'Engineering Sciences & Problem Solving',
        description: 'Differential equations, programming in C/Python, basic electronics, and digital systems.',
        isActive: true,
      },
      {
        id: 'btech-cse-s3',
        semesterNumber: 3,
        title: 'Semester 3',
        phase: 'Second Year',
        focus: 'Core Computing & Data Structures',
        description: 'Discrete mathematics, data structures and algorithms, digital logic design, and system software.',
        isActive: true,
      },
    ],
  },
  {
    id: 'btech-csbs',
    code: 'CSBS',
    name: 'B.Tech CSBS',
    fullName: 'Computer Science & Business Systems',
    degreeType: 'B.Tech',
    scheme: 'KTU 2024 Scheme',
    iconName: 'Binary',
    description: 'Interdisciplinary curriculum blending core computer science with enterprise and business applications.',
    isActive: true,
    availableSemesters: [
      {
        id: 'btech-csbs-s1',
        semesterNumber: 1,
        title: 'Semester 1',
        phase: 'First Year',
        focus: 'Engineering & Business Foundations',
        description: 'Introductory calculus, physics, fundamental computing concepts, and business communication basics.',
        isActive: true,
      },
    ],
  },
  {
    id: 'bca',
    code: 'BCA',
    name: 'BCA',
    fullName: 'Bachelor of Computer Applications',
    degreeType: 'Undergraduate',
    scheme: 'University Curriculum',
    iconName: 'Code2',
    description: 'Software development applications, database concepts, web fundamentals, and practical computing.',
    isActive: true,
    availableSemesters: [
      {
        id: 'bca-s1',
        semesterNumber: 1,
        title: 'Semester 1',
        phase: 'First Year',
        focus: 'Computer Fundamentals & Programming',
        description: 'Mathematical foundations, computer fundamentals, problem solving techniques, and office automation.',
        isActive: true,
      },
    ],
  },
  {
    id: 'bba',
    code: 'BBA',
    name: 'BBA',
    fullName: 'Bachelor of Business Administration',
    degreeType: 'Undergraduate',
    scheme: 'University Curriculum',
    iconName: 'Briefcase',
    description: 'Principles of management, business economics, financial accounting, and organizational dynamics.',
    isActive: true,
    availableSemesters: [
      {
        id: 'bba-s1',
        semesterNumber: 1,
        title: 'Semester 1',
        phase: 'First Year',
        focus: 'Management Principles & Business Environment',
        description: 'Principles of management, business economics, financial accounting fundamentals, and business communication.',
        isActive: true,
      },
    ],
  },
  {
    id: 'mba',
    code: 'MBA',
    name: 'MBA',
    fullName: 'Master of Business Administration',
    degreeType: 'Postgraduate',
    scheme: 'University Curriculum',
    iconName: 'GraduationCap',
    description: 'Advanced managerial economics, organizational behaviour, accounting for managers, and strategic operations.',
    isActive: true,
    availableSemesters: [
      {
        id: 'mba-s1',
        semesterNumber: 1,
        title: 'Semester 1',
        phase: 'First Year',
        focus: 'Managerial Foundations & Business Analytics',
        description: 'Management theory, managerial economics, accounting for managers, quantitative techniques, and business ethics.',
        isActive: true,
      },
    ],
  },
  {
    id: 'btech-ece',
    code: 'ECE',
    name: 'B.Tech ECE',
    fullName: 'Electronics and Communication Engineering',
    degreeType: 'B.Tech',
    scheme: 'KTU 2024 Scheme',
    iconName: 'Radio',
    description: 'Electronic devices, circuit theory, signal analysis, network theory, and basic communication systems.',
    isActive: true,
    availableSemesters: [
      {
        id: 'btech-ece-s1',
        semesterNumber: 1,
        title: 'Semester 1',
        phase: 'First Year',
        focus: 'Basic Sciences & Engineering Foundation',
        description: 'Calculus, engineering physics/chemistry, basic electronics, and engineering graphics.',
        isActive: true,
      },
    ],
  },
];
