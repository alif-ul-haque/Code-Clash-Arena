import React from 'react';

/**
 * Renders text with LaTeX math notation properly formatted
 * Converts $...$ (inline) and $$...$$ (display) to HTML-friendly format
 */
const MathRenderer = ({ text }) => {
  if (!text) return null;

  // Pre-clean the entire text - remove all $ signs before processing
  const cleanedText = text.replace(/\$+/g, '');

  // Function to convert LaTeX to Unicode/HTML when possible
  const convertLatexToUnicode = (latex) => {
    // First, clean up any stray $ signs
    let cleaned = latex.replace(/\$+/g, '');
    
    const conversions = {
      // Greek letters
      '\\alpha': 'α',
      '\\beta': 'β',
      '\\gamma': 'γ',
      '\\delta': 'δ',
      '\\epsilon': 'ε',
      '\\theta': 'θ',
      '\\lambda': 'λ',
      '\\mu': 'μ',
      '\\pi': 'π',
      '\\sigma': 'σ',
      '\\phi': 'φ',
      '\\omega': 'ω',
      
      // Math operators
      '\\leq': '≤',
      '\\geq': '≥',
      '\\le': '≤',
      '\\ge': '≥',
      '\\neq': '≠',
      '\\approx': '≈',
      '\\times': '×',
      '\\cdot': '·',
      '\\div': '÷',
      '\\pm': '±',
      '\\sum': '∑',
      '\\prod': '∏',
      '\\int': '∫',
      '\\infty': '∞',
      '\\partial': '∂',
      '\\nabla': '∇',
      '\\in': '∈',
      '\\notin': '∉',
      '\\subset': '⊂',
      '\\supset': '⊃',
      '\\cup': '∪',
      '\\cap': '∩',
      '\\emptyset': '∅',
      '\\forall': '∀',
      '\\exists': '∃',
      '\\neg': '¬',
      '\\land': '∧',
      '\\lor': '∨',
      '\\Rightarrow': '⇒',
      '\\Leftarrow': '⇐',
      '\\Leftrightarrow': '⇔',
      '\\rightarrow': '→',
      '\\leftarrow': '←',
      '\\leftrightarrow': '↔',
      
      // Superscripts (common ones)
      '^2': '²',
      '^3': '³',
      '^{2}': '²',
      '^{3}': '³',
      '^{9}': '⁹',
      
      // Common patterns
      '10^9': '10⁹',
      '10^{9}': '10⁹',
    };

    let result = cleaned;
    
    // Replace known symbols
    for (const [latexCmd, unicode] of Object.entries(conversions)) {
      result = result.replace(new RegExp(latexCmd.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), unicode);
    }
    
    // Handle square root: \sqrt{...}
    result = result.replace(/\\sqrt\{([^}]+)\}/g, '√($1)');
    result = result.replace(/\\sqrt\s+(\w+)/g, '√$1');
    
    // Handle fractions: \frac{a}{b} -> a/b
    result = result.replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, '($1)/($2)');
    
    // Remove remaining backslashes for simple cases
    result = result.replace(/\\([a-zA-Z]+)/g, '$1');
    
    // Clean up extra braces
    result = result.replace(/\{([^{}]+)\}/g, '$1');
    
    return result;
  };

  // Since we removed all $ signs, just return the cleaned text with LaTeX converted
  const convertedText = convertLatexToUnicode(cleanedText);

  return (
    <span className="math-content">
      {convertedText}
    </span>
  );
};

export default MathRenderer;
