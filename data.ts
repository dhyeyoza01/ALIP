export const QUESTION_BANKS: Record<string, any[]> = {
  "Python Programming": [
    { concept: 'Variables', question: 'Which of the following is a valid variable name in Python?', options: ['1_variable', 'variable-name', 'variable_name', 'var name'], correct: 2, explanation: 'Python variables can only contain letters, numbers, and underscores, and cannot start with a number.' },
    { concept: 'Loops', question: 'What keyword is used to skip the rest of the current iteration in a loop?', options: ['break', 'continue', 'pass', 'skip'], correct: 1, explanation: 'The "continue" statement stops the current iteration and goes back to the top of the loop.' },
    { concept: 'Data Types', question: 'Which data type is immutable in Python?', options: ['List', 'Dictionary', 'Set', 'Tuple'], correct: 3, explanation: 'Tuples are immutable, meaning their elements cannot be changed after they are created.' },
    { concept: 'Functions', question: 'How do you define a function in Python?', options: ['function myFunc():', 'def myFunc():', 'create myFunc():', 'func myFunc():'], correct: 1, explanation: 'The "def" keyword is used to define functions in Python.' },
    { concept: 'OOP', question: 'Which keyword refers to the current instance of a class?', options: ['this', 'self', 'me', 'instance'], correct: 1, explanation: 'In Python, "self" is conventionally used to refer to the instance of the class in method definitions.' },
  ],
  "Data Structures & Algorithms": [
    { concept: 'Arrays', question: 'What is the time complexity of accessing an element in an array by its index?', options: ['O(1)', 'O(n)', 'O(log n)', 'O(n^2)'], correct: 0, explanation: 'Array elements can be accessed directly in constant time O(1) using their index.' },
    { concept: 'Linked Lists', question: 'Which of the following is an advantage of Linked Lists over Arrays?', options: ['Random access', 'Less memory usage', 'Dynamic size', 'Cache friendliness'], correct: 2, explanation: 'Linked lists can grow or shrink dynamically, whereas static arrays have a fixed size.' },
    { concept: 'Trees', question: 'In a Binary Search Tree, where are smaller elements placed relative to a node?', options: ['Right child', 'Left child', 'Root', 'Anywhere'], correct: 1, explanation: 'In a BST, all nodes in the left subtree have values less than the parent node.' },
    { concept: 'Sorting', question: 'Which sorting algorithm uses a divide and conquer approach?', options: ['Bubble Sort', 'Insertion Sort', 'Merge Sort', 'Selection Sort'], correct: 2, explanation: 'Merge sort divides the array in half, sorts each half, and merges them back together.' },
    { concept: 'Big O', question: 'What does O(n) represent?', options: ['Constant time', 'Linear time', 'Quadratic time', 'Logarithmic time'], correct: 1, explanation: 'O(n) means the execution time grows linearly with the size of the input.' },
  ],
  "Calculus I": [
    { concept: 'Limits', question: 'What is the limit of (sin x)/x as x approaches 0?', options: ['0', '1', 'Infinity', 'Does not exist'], correct: 1, explanation: 'This is a fundamental limit in calculus. L\'Hôpital\'s rule or the squeeze theorem confirms it equals 1.' },
    { concept: 'Derivatives', question: 'What is the derivative of x³?', options: ['x²', '3x', '3x²', '2x³'], correct: 2, explanation: 'Using the power rule, d/dx(xⁿ) = nxⁿ⁻¹, so d/dx(x³) = 3x².' },
    { concept: 'Integration', question: 'What is the integral of 2x dx?', options: ['x²', 'x² + C', '2x² + C', 'x + C'], correct: 1, explanation: 'The integral of 2x is x² + C, where C is the constant of integration.' },
    { concept: 'Chain Rule', question: 'What is the derivative of sin(2x)?', options: ['cos(2x)', '2cos(2x)', '-cos(2x)', '2sin(2x)'], correct: 1, explanation: 'By the chain rule, the derivative of sin(u) is cos(u)·u\', so sin(2x)\' = cos(2x)·2 = 2cos(2x).' },
    { concept: 'Continuity', question: 'A function is continuous at a point if:', options: ['It is defined there', 'The limit exists there', 'The limit equals the function value', 'All of the above'], correct: 3, explanation: 'A function is continuous at x=a if f(a) is defined, lim f(x) exists as x→a, and lim f(x) = f(a).' },
  ],
  "Classical Physics": [
    { concept: 'Newton\'s Laws', question: 'Which of Newton\'s laws states that F = ma?', options: ['First Law', 'Second Law', 'Third Law', 'Law of Gravitation'], correct: 1, explanation: 'Newton\'s Second Law states that force equals mass times acceleration (F = ma).' },
    { concept: 'Energy', question: 'What is the formula for kinetic energy?', options: ['mgh', '½mv²', 'Fd', 'mv'], correct: 1, explanation: 'Kinetic energy is given by KE = ½mv², where m is mass and v is velocity.' },
    { concept: 'Waves', question: 'What is the speed of sound approximately at sea level?', options: ['3 × 10⁸ m/s', '343 m/s', '1500 m/s', '1000 m/s'], correct: 1, explanation: 'The speed of sound in air at sea level and room temperature is approximately 343 m/s.' },
    { concept: 'Thermodynamics', question: 'The First Law of Thermodynamics is essentially a statement of:', options: ['Conservation of momentum', 'Conservation of energy', 'Entropy always increases', 'Equal and opposite reaction'], correct: 1, explanation: 'The First Law states that energy cannot be created or destroyed, only transferred or converted.' },
    { concept: 'Optics', question: 'What type of mirror can produce both real and virtual images?', options: ['Plane mirror', 'Convex mirror', 'Concave mirror', 'None of these'], correct: 2, explanation: 'Concave mirrors can produce real images (when object is beyond focal point) and virtual images (when object is within focal point).' },
  ],
  "Cell Biology": [
    { concept: 'Cell Structure', question: 'Which organelle is known as the "powerhouse of the cell"?', options: ['Nucleus', 'Ribosome', 'Mitochondria', 'Golgi apparatus'], correct: 2, explanation: 'Mitochondria generate most of the cell\'s ATP through cellular respiration.' },
    { concept: 'DNA', question: 'Which base pairs with Adenine in DNA?', options: ['Cytosine', 'Guanine', 'Thymine', 'Uracil'], correct: 2, explanation: 'In DNA, Adenine (A) always pairs with Thymine (T), and Cytosine (C) pairs with Guanine (G).' },
    { concept: 'Mitosis', question: 'During which phase of mitosis do chromosomes line up at the cell equator?', options: ['Prophase', 'Metaphase', 'Anaphase', 'Telophase'], correct: 1, explanation: 'During metaphase, chromosomes align along the metaphase plate (cell equator) before separation.' },
    { concept: 'Membrane', question: 'The cell membrane is best described by which model?', options: ['Lock and key', 'Fluid mosaic', 'Central dogma', 'Induced fit'], correct: 1, explanation: 'The fluid mosaic model describes the cell membrane as a flexible structure with proteins embedded in a phospholipid bilayer.' },
    { concept: 'Enzymes', question: 'What happens to an enzyme at very high temperatures?', options: ['It speeds up', 'It denatures', 'It replicates', 'Nothing changes'], correct: 1, explanation: 'High temperatures disrupt the hydrogen bonds in enzymes, causing them to denature and lose their shape and function.' },
  ],
  "World History": [
    { concept: 'Ancient', question: 'Which ancient civilization built the pyramids at Giza?', options: ['Romans', 'Greeks', 'Egyptians', 'Mesopotamians'], correct: 2, explanation: 'The Great Pyramids of Giza were built by the ancient Egyptians as tombs for their pharaohs.' },
    { concept: 'Renaissance', question: 'The Renaissance period began in which country?', options: ['France', 'England', 'Italy', 'Spain'], correct: 2, explanation: 'The Renaissance originated in Italy in the 14th century, particularly in Florence.' },
    { concept: 'Revolutions', question: 'The French Revolution began in which year?', options: ['1776', '1789', '1804', '1815'], correct: 1, explanation: 'The French Revolution began in 1789 with the storming of the Bastille on July 14th.' },
    { concept: 'World Wars', question: 'Which event directly triggered World War I?', options: ['Invasion of Poland', 'Assassination of Archduke Franz Ferdinand', 'Sinking of the Lusitania', 'Treaty of Versailles'], correct: 1, explanation: 'The assassination of Archduke Franz Ferdinand of Austria in Sarajevo on June 28, 1914, was the immediate trigger for World War I.' },
    { concept: 'Cold War', question: 'The Berlin Wall fell in which year?', options: ['1985', '1987', '1989', '1991'], correct: 2, explanation: 'The Berlin Wall fell on November 9, 1989, symbolizing the end of the Cold War division of Europe.' },
  ],
  "Organic Chemistry": [
    { concept: 'Bonding', question: 'How many bonds can a carbon atom typically form?', options: ['2', '3', '4', '6'], correct: 2, explanation: 'Carbon has 4 valence electrons and can form 4 covalent bonds, which is why it\'s so versatile in organic molecules.' },
    { concept: 'Hydrocarbons', question: 'Which of the following is an alkene?', options: ['Methane (CH₄)', 'Ethene (C₂H₄)', 'Ethane (C₂H₆)', 'Benzene (C₆H₆)'], correct: 1, explanation: 'Alkenes contain at least one carbon-carbon double bond. Ethene (C₂H₄) has a C=C double bond.' },
    { concept: 'Functional Groups', question: 'Which functional group defines an alcohol?', options: ['-COOH', '-OH', '-NH₂', '-CHO'], correct: 1, explanation: 'Alcohols are characterized by the hydroxyl (-OH) functional group attached to a carbon atom.' },
    { concept: 'Isomerism', question: 'Structural isomers have the same:', options: ['Structure', 'Molecular formula', 'Boiling point', 'Physical properties'], correct: 1, explanation: 'Structural isomers share the same molecular formula but differ in the arrangement of atoms.' },
    { concept: 'Reactions', question: 'What type of reaction adds H₂ across a double bond?', options: ['Oxidation', 'Elimination', 'Hydrogenation', 'Hydrolysis'], correct: 2, explanation: 'Hydrogenation is the addition of hydrogen (H₂) across a double or triple bond, typically using a catalyst like Pd or Pt.' },
  ],
  "Microeconomics": [
    { concept: 'Supply & Demand', question: 'When the price of a good increases, what generally happens to the quantity demanded?', options: ['Increases', 'Decreases', 'Stays the same', 'Becomes zero'], correct: 1, explanation: 'According to the Law of Demand, there is an inverse relationship between price and quantity demanded.' },
    { concept: 'Elasticity', question: 'If a 10% price increase leads to a 20% decrease in quantity demanded, the demand is:', options: ['Inelastic', 'Elastic', 'Unit elastic', 'Perfectly inelastic'], correct: 1, explanation: 'Price elasticity = %ΔQd / %ΔP = 20%/10% = 2. Since |E| > 1, demand is elastic.' },
    { concept: 'Market Structure', question: 'A market with many sellers selling identical products is called:', options: ['Monopoly', 'Oligopoly', 'Perfect competition', 'Monopolistic competition'], correct: 2, explanation: 'Perfect competition features many firms selling identical (homogeneous) products with free entry and exit.' },
    { concept: 'Costs', question: 'Which cost does NOT change with the level of output?', options: ['Variable cost', 'Marginal cost', 'Fixed cost', 'Total cost'], correct: 2, explanation: 'Fixed costs (like rent and salaries) remain constant regardless of how much a firm produces.' },
    { concept: 'Utility', question: 'The additional satisfaction from consuming one more unit of a good is called:', options: ['Total utility', 'Marginal utility', 'Average utility', 'Cardinal utility'], correct: 1, explanation: 'Marginal utility is the extra satisfaction (utility) gained from consuming one additional unit of a good or service.' },
  ],
};

export const SUBJECTS = [
  "Python Programming",
  "Calculus I",
  "Data Structures & Algorithms",
  "Classical Physics",
  "Cell Biology",
  "World History",
  "Organic Chemistry",
  "Microeconomics"
];
