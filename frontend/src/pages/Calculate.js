import React, { useMemo, useState } from 'react';
import './Calculate.css';

const operators = ['+', '-', '*', '/', '%'];

function formatResult(value) {
  if (!Number.isFinite(value)) return 'Error';
  if (Math.abs(value) > 999999999 || (Math.abs(value) > 0 && Math.abs(value) < 0.000001)) {
    return value.toExponential(4);
  }
  return parseFloat(value.toFixed(8)).toString();
}

function isExpressionSafe(expr) {
  return /^[0-9+\-*/%.()\s]+$/.test(expr);
}

function tokenizeExpression(expr) {
  const normalized = expr.replace(/\s+/g, '');
  const rawTokens = normalized.match(/\d*\.\d+|\d+\.?\d*|[()+\-*/%]/g);
  if (!rawTokens || rawTokens.join('') !== normalized) {
    return null;
  }

  const tokens = [];
  for (let i = 0; i < rawTokens.length; i += 1) {
    const token = rawTokens[i];
    const prev = tokens[tokens.length - 1];
    const isUnaryMinus = token === '-' && (!prev || operators.includes(prev) || prev === '(');

    if (isUnaryMinus) {
      const nextToken = rawTokens[i + 1];

      if (nextToken && /^\d*\.?\d+$/.test(nextToken)) {
        tokens.push(String(-Number(nextToken)));
        i += 1;
        continue;
      }

      if (nextToken === '(') {
        tokens.push('0');
        tokens.push('-');
        continue;
      }
      return null;
    }

    tokens.push(token);
  }

  return tokens;
}

function toRpn(tokens) {
  const out = [];
  const stack = [];
  const precedence = { '+': 1, '-': 1, '*': 2, '/': 2, '%': 2 };

  tokens.forEach((token) => {
    if (/^-?\d*\.?\d+$/.test(token)) {
      out.push(token);
      return;
    }

    if (operators.includes(token)) {
      while (
        stack.length > 0 &&
        operators.includes(stack[stack.length - 1]) &&
        precedence[stack[stack.length - 1]] >= precedence[token]
      ) {
        out.push(stack.pop());
      }
      stack.push(token);
      return;
    }

    if (token === '(') {
      stack.push(token);
      return;
    }

    if (token === ')') {
      while (stack.length > 0 && stack[stack.length - 1] !== '(') {
        out.push(stack.pop());
      }
      if (stack.pop() !== '(') {
        throw new Error('Unbalanced parentheses');
      }
    }
  });

  while (stack.length > 0) {
    const op = stack.pop();
    if (op === '(' || op === ')') {
      throw new Error('Unbalanced parentheses');
    }
    out.push(op);
  }

  return out;
}

function evaluateRpn(rpnTokens) {
  const stack = [];

  rpnTokens.forEach((token) => {
    if (/^-?\d*\.?\d+$/.test(token)) {
      stack.push(Number(token));
      return;
    }

    const b = stack.pop();
    const a = stack.pop();

    if (a === undefined || b === undefined) {
      throw new Error('Malformed expression');
    }

    switch (token) {
      case '+':
        stack.push(a + b);
        break;
      case '-':
        stack.push(a - b);
        break;
      case '*':
        stack.push(a * b);
        break;
      case '/':
        stack.push(a / b);
        break;
      case '%':
        stack.push(a % b);
        break;
      default:
        throw new Error('Unsupported operator');
    }
  });

  if (stack.length !== 1) {
    throw new Error('Malformed expression');
  }

  return stack[0];
}

function evaluateExpression(expr) {
  if (!expr || !isExpressionSafe(expr)) {
    return 'Error';
  }

  try {
    const tokens = tokenizeExpression(expr);
    if (!tokens) return 'Error';
    const rpn = toRpn(tokens);
    const value = evaluateRpn(rpn);
    if (typeof value !== 'number' || Number.isNaN(value)) {
      return 'Error';
    }
    return formatResult(value);
  } catch {
    return 'Error';
  }
}

export default function Calculate() {
  const [display, setDisplay] = useState('0');
  const [expression, setExpression] = useState('');
  const [hasEvaluated, setHasEvaluated] = useState(false);

  const preview = useMemo(() => {
    if (!expression || operators.includes(expression.slice(-1))) {
      return '';
    }
    const result = evaluateExpression(expression);
    return result === 'Error' ? '' : result;
  }, [expression]);

  const appendNumber = (digit) => {
    if (hasEvaluated) {
      setExpression(digit);
      setDisplay(digit);
      setHasEvaluated(false);
      return;
    }

    if (display === '0' && digit === '0' && !expression.includes('.')) return;

    const nextDisplay = display === '0' ? digit : `${display}${digit}`;
    const nextExpression = expression ? `${expression}${digit}` : digit;

    setDisplay(nextDisplay);
    setExpression(nextExpression);
  };

  const appendDecimal = () => {
    if (hasEvaluated) {
      setDisplay('0.');
      setExpression('0.');
      setHasEvaluated(false);
      return;
    }

    if (display.includes('.')) return;

    const nextDisplay = `${display}.`;
    const nextExpression = expression ? `${expression}.` : '0.';

    setDisplay(nextDisplay);
    setExpression(nextExpression);
  };

  const appendOperator = (operator) => {
    if (!expression && display !== '0') {
      setExpression(`${display}${operator}`);
      setHasEvaluated(false);
      return;
    }

    if (!expression && display === '0' && operator === '-') {
      setExpression('-');
      setDisplay('-');
      setHasEvaluated(false);
      return;
    }

    const lastChar = expression.slice(-1);
    if (operators.includes(lastChar)) {
      const updated = `${expression.slice(0, -1)}${operator}`;
      setExpression(updated);
      return;
    }

    setExpression(`${expression}${operator}`);
    setHasEvaluated(false);
  };

  const clearAll = () => {
    setDisplay('0');
    setExpression('');
    setHasEvaluated(false);
  };

  const deleteLast = () => {
    if (hasEvaluated) {
      clearAll();
      return;
    }

    if (!expression) {
      setDisplay('0');
      return;
    }

    const updated = expression.slice(0, -1);
    setExpression(updated);

    const lastChunk = updated.split(/[+\-*/%]/).pop();
    setDisplay(lastChunk || '0');
  };

  const toggleSign = () => {
    if (display === '0' || display === 'Error') return;

    const numeric = Number(display);
    if (Number.isNaN(numeric)) return;

    const toggled = formatResult(numeric * -1);
    setDisplay(toggled);

    if (!expression) {
      setExpression(toggled);
      return;
    }

    const lastChunk = display;
    if (expression.endsWith(lastChunk)) {
      setExpression(`${expression.slice(0, -lastChunk.length)}${toggled}`);
    }
  };

  const calculateResult = () => {
    const result = evaluateExpression(expression || display);
    setDisplay(result);
    setExpression(result === 'Error' ? '' : result);
    setHasEvaluated(true);
  };

  const onButtonClick = (value) => {
    if (!Number.isNaN(Number(value))) {
      appendNumber(value);
      return;
    }

    if (value === '.') {
      appendDecimal();
      return;
    }

    if (operators.includes(value)) {
      appendOperator(value);
      return;
    }

    if (value === '=') {
      calculateResult();
      return;
    }

    if (value === 'AC') {
      clearAll();
      return;
    }

    if (value === 'DEL') {
      deleteLast();
      return;
    }

    if (value === '+/-') {
      toggleSign();
    }
  };

  const keys = [
    ['AC', 'DEL', '%', '/'],
    ['7', '8', '9', '*'],
    ['4', '5', '6', '-'],
    ['1', '2', '3', '+'],
    ['+/-', '0', '.', '=']
  ];

  return (
    <div className="calculate-page">
      <div className="calculate-glow calculate-glow-left" />
      <div className="calculate-glow calculate-glow-right" />

      <section className="calculator-shell">
        <header className="calculator-header">
          <p className="calculator-tag">Tools</p>
          <h1>Calculator</h1>
          <p className="calculator-subtitle">Fast and simple arithmetic on the go</p>
        </header>

        <div className="calculator-display-wrap">
          <div className="calculator-expression">{expression || '0'}</div>
          <div className="calculator-display">{display}</div>
          {preview && <div className="calculator-preview">= {preview}</div>}
        </div>

        <div className="calculator-grid">
          {keys.flat().map((key) => (
            <button
              key={key}
              className={`calc-btn ${
                key === '=' ? 'calc-btn-equals' : operators.includes(key) ? 'calc-btn-operator' : ''
              } ${key === 'AC' || key === 'DEL' ? 'calc-btn-utility' : ''}`}
              onClick={() => onButtonClick(key)}
              type="button"
            >
              {key}
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
