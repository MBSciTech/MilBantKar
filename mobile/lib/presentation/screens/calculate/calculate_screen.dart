import 'package:flutter/material.dart';
import 'package:mobile/core/theme/app_theme.dart';

// ── Pure-Dart expression evaluator (mirrors Calculate.js logic) ─────────────

const _operators = ['+', '-', '*', '/', '%'];

final _numRe = RegExp(r'^-?\d*\.?\d+$');

String _formatResult(double value) {
  if (!value.isFinite) return 'Error';
  if (value.abs() > 999999999 ||
      (value.abs() > 0 && value.abs() < 0.000001)) {
    return value.toStringAsExponential(4);
  }
  return double.parse(value.toStringAsFixed(8)).toString();
}

bool _isSafe(String expr) {
  return RegExp(r'^[0-9+\-*/%.()\\s]+$').hasMatch(expr);
}

List<String>? _tokenize(String expr) {
  final normalized = expr.replaceAll(RegExp(r'\s+'), '');
  final rawTokens =
      RegExp(r'\d*\.\d+|\d+\.?\d*|[()+ \-*/%]').allMatches(normalized).map((m) => m.group(0)!).toList();

  if (rawTokens.join('') != normalized) return null;

  final tokens = <String>[];
  for (int i = 0; i < rawTokens.length; i++) {
    final token = rawTokens[i];
    final prev = tokens.isNotEmpty ? tokens.last : null;
    final isUnary = token == '-' &&
        (prev == null || _operators.contains(prev) || prev == '(');

    if (isUnary) {
      if (i + 1 < rawTokens.length && _numRe.hasMatch(rawTokens[i + 1])) {
        tokens.add((-double.parse(rawTokens[i + 1])).toString());
        i++;
        continue;
      }
      if (i + 1 < rawTokens.length && rawTokens[i + 1] == '(') {
        tokens.add('0');
        tokens.add('-');
        continue;
      }
      return null;
    }
    tokens.add(token);
  }
  return tokens;
}

List<String> _toRpn(List<String> tokens) {
  final out = <String>[];
  final stack = <String>[];
  const prec = {'+': 1, '-': 1, '*': 2, '/': 2, '%': 2};

  for (final token in tokens) {
    if (_numRe.hasMatch(token)) {
      out.add(token);
    } else if (_operators.contains(token)) {
      while (stack.isNotEmpty &&
          _operators.contains(stack.last) &&
          prec[stack.last]! >= prec[token]!) {
        out.add(stack.removeLast());
      }
      stack.add(token);
    } else if (token == '(') {
      stack.add(token);
    } else if (token == ')') {
      while (stack.isNotEmpty && stack.last != '(') {
        out.add(stack.removeLast());
      }
      if (stack.isEmpty || stack.removeLast() != '(') {
        throw Exception('Unbalanced parentheses');
      }
    }
  }
  while (stack.isNotEmpty) {
    final op = stack.removeLast();
    if (op == '(' || op == ')') throw Exception('Unbalanced parentheses');
    out.add(op);
  }
  return out;
}

double _evalRpn(List<String> rpn) {
  final stack = <double>[];
  for (final token in rpn) {
    if (_numRe.hasMatch(token)) {
      stack.add(double.parse(token));
    } else {
      final b = stack.removeLast();
      final a = stack.removeLast();
      switch (token) {
        case '+':
          stack.add(a + b);
          break;
        case '-':
          stack.add(a - b);
          break;
        case '*':
          stack.add(a * b);
          break;
        case '/':
          stack.add(a / b);
          break;
        case '%':
          stack.add(a % b);
          break;
        default:
          throw Exception('Unknown operator');
      }
    }
  }
  if (stack.length != 1) throw Exception('Malformed expression');
  return stack.first;
}

String _evaluate(String expr) {
  if (expr.isEmpty || !_isSafe(expr)) return 'Error';
  try {
    final tokens = _tokenize(expr);
    if (tokens == null) return 'Error';
    final rpn = _toRpn(tokens);
    final value = _evalRpn(rpn);
    if (value.isNaN) return 'Error';
    return _formatResult(value);
  } catch (_) {
    return 'Error';
  }
}

// ── Calculate Screen ─────────────────────────────────────────────────────────

class CalculateScreen extends StatefulWidget {
  const CalculateScreen({Key? key}) : super(key: key);

  @override
  State<CalculateScreen> createState() => _CalculateScreenState();
}

class _CalculateScreenState extends State<CalculateScreen> {
  String _display = '0';
  String _expression = '';
  bool _hasEvaluated = false;

  String get _preview {
    if (_expression.isEmpty ||
        _operators.contains(_expression[_expression.length - 1])) {
      return '';
    }
    final result = _evaluate(_expression);
    return result == 'Error' ? '' : result;
  }

  void _appendNumber(String digit) {
    if (_hasEvaluated) {
      setState(() {
        _expression = digit;
        _display = digit;
        _hasEvaluated = false;
      });
      return;
    }
    if (_display == '0' && digit == '0' && !_expression.contains('.')) return;
    final nextDisplay = _display == '0' ? digit : '$_display$digit';
    final nextExpr = _expression.isNotEmpty ? '$_expression$digit' : digit;
    setState(() {
      _display = nextDisplay;
      _expression = nextExpr;
    });
  }

  void _appendDecimal() {
    if (_hasEvaluated) {
      setState(() {
        _display = '0.';
        _expression = '0.';
        _hasEvaluated = false;
      });
      return;
    }
    if (_display.contains('.')) return;
    final nextDisplay = '$_display.';
    final nextExpr = _expression.isNotEmpty ? '$_expression.' : '0.';
    setState(() {
      _display = nextDisplay;
      _expression = nextExpr;
    });
  }

  void _appendOperator(String op) {
    if (_expression.isEmpty && _display != '0') {
      setState(() {
        _expression = '$_display$op';
        _hasEvaluated = false;
      });
      return;
    }
    if (_expression.isEmpty && _display == '0' && op == '-') {
      setState(() {
        _expression = '-';
        _display = '-';
        _hasEvaluated = false;
      });
      return;
    }
    if (_expression.isNotEmpty &&
        _operators.contains(_expression[_expression.length - 1])) {
      setState(() {
        _expression = '${_expression.substring(0, _expression.length - 1)}$op';
      });
      return;
    }
    setState(() {
      _expression = '$_expression$op';
      _hasEvaluated = false;
    });
  }

  void _clearAll() {
    setState(() {
      _display = '0';
      _expression = '';
      _hasEvaluated = false;
    });
  }

  void _deleteLast() {
    if (_hasEvaluated) {
      _clearAll();
      return;
    }
    if (_expression.isEmpty) {
      setState(() => _display = '0');
      return;
    }
    final updated = _expression.substring(0, _expression.length - 1);
    final chunks = updated.split(RegExp(r'[+\-*/%]'));
    final lastChunk = chunks.isNotEmpty ? chunks.last : '';
    setState(() {
      _expression = updated;
      _display = lastChunk.isEmpty ? '0' : lastChunk;
    });
  }

  void _toggleSign() {
    if (_display == '0' || _display == 'Error') return;
    final numeric = double.tryParse(_display);
    if (numeric == null) return;
    final toggled = _formatResult(numeric * -1);
    if (_expression.endsWith(_display)) {
      setState(() {
        _expression =
            '${_expression.substring(0, _expression.length - _display.length)}$toggled';
        _display = toggled;
      });
    }
  }

  void _calculate() {
    final result = _evaluate(_expression.isNotEmpty ? _expression : _display);
    setState(() {
      _display = result;
      _expression = result == 'Error' ? '' : result;
      _hasEvaluated = true;
    });
  }

  void _onKey(String key) {
    final numericKey = double.tryParse(key);
    if (numericKey != null || key == '0') {
      _appendNumber(key);
    } else if (key == '.') {
      _appendDecimal();
    } else if (_operators.contains(key)) {
      _appendOperator(key);
    } else if (key == '=') {
      _calculate();
    } else if (key == 'AC') {
      _clearAll();
    } else if (key == 'DEL') {
      _deleteLast();
    } else if (key == '+/-') {
      _toggleSign();
    }
  }

  // Key layout — mirrors the web app exactly
  static const _keys = [
    ['AC', 'DEL', '%', '/'],
    ['7', '8', '9', '*'],
    ['4', '5', '6', '-'],
    ['1', '2', '3', '+'],
    ['+/-', '0', '.', '='],
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.backgroundColor,
      appBar: AppBar(
        title: const Text('Calculator'),
        backgroundColor: AppTheme.surfaceColor,
        elevation: 1,
      ),
      body: SafeArea(
        child: Column(
          children: [
            // ── Display section ──────────────────────────────────────
            Expanded(
              flex: 3,
              child: Container(
                width: double.infinity,
                margin: const EdgeInsets.all(16),
                padding: const EdgeInsets.all(24),
                decoration: BoxDecoration(
                  color: AppTheme.surfaceColor,
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: AppTheme.borderColor),
                  boxShadow: AppTheme.cardShadow,
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.end,
                  mainAxisAlignment: MainAxisAlignment.end,
                  children: [
                    // Category badge
                    Align(
                      alignment: Alignment.topLeft,
                      child: Container(
                        padding: const EdgeInsets.symmetric(
                            horizontal: 10, vertical: 4),
                        decoration: BoxDecoration(
                          color: AppTheme.primaryLight,
                          borderRadius: BorderRadius.circular(20),
                        ),
                        child: const Text(
                          'Tools',
                          style: TextStyle(
                              color: AppTheme.primaryColor,
                              fontSize: 11,
                              fontWeight: FontWeight.w600),
                        ),
                      ),
                    ),
                    const Spacer(),

                    // Expression
                    if (_expression.isNotEmpty)
                      Text(
                        _expression,
                        textAlign: TextAlign.end,
                        style: const TextStyle(
                          color: AppTheme.textSecondary,
                          fontSize: 16,
                        ),
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                      ),
                    const SizedBox(height: 4),

                    // Main display
                    Text(
                      _display,
                      textAlign: TextAlign.end,
                      style: TextStyle(
                        color: _display == 'Error'
                            ? AppTheme.dangerColor
                            : AppTheme.textPrimary,
                        fontSize: _display.length > 10 ? 28 : 40,
                        fontWeight: FontWeight.bold,
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),

                    // Preview
                    if (_preview.isNotEmpty) ...[
                      const SizedBox(height: 4),
                      Text(
                        '= $_preview',
                        textAlign: TextAlign.end,
                        style: const TextStyle(
                          color: AppTheme.primaryColor,
                          fontSize: 16,
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                    ],
                  ],
                ),
              ),
            ),

            // ── Button grid ──────────────────────────────────────────
            Expanded(
              flex: 5,
              child: Padding(
                padding: const EdgeInsets.fromLTRB(12, 0, 12, 12),
                child: Column(
                  children: _keys.map((row) {
                    return Expanded(
                      child: Row(
                        children: row.map((key) {
                          final isEquals = key == '=';
                          final isOperator = _operators.contains(key);
                          final isUtility = key == 'AC' || key == 'DEL';

                          Color bgColor;
                          Color fgColor;
                          if (isEquals) {
                            bgColor = AppTheme.primaryColor;
                            fgColor = Colors.white;
                          } else if (isOperator) {
                            bgColor = AppTheme.primaryLight;
                            fgColor = AppTheme.primaryColor;
                          } else if (isUtility) {
                            bgColor = const Color(0xFFFFE4E4);
                            fgColor = AppTheme.dangerColor;
                          } else {
                            bgColor = AppTheme.surfaceColor;
                            fgColor = AppTheme.textPrimary;
                          }

                          return Expanded(
                            child: Padding(
                              padding: const EdgeInsets.all(4),
                              child: Material(
                                color: bgColor,
                                borderRadius: BorderRadius.circular(12),
                                elevation: isEquals ? 3 : 1,
                                child: InkWell(
                                  borderRadius: BorderRadius.circular(12),
                                  onTap: () => _onKey(key),
                                  child: Container(
                                    alignment: Alignment.center,
                                    decoration: BoxDecoration(
                                      borderRadius: BorderRadius.circular(12),
                                      border: isEquals || isOperator
                                          ? null
                                          : Border.all(
                                              color: AppTheme.borderColor),
                                    ),
                                    child: Text(
                                      key,
                                      style: TextStyle(
                                        color: fgColor,
                                        fontSize: 20,
                                        fontWeight: FontWeight.w600,
                                      ),
                                    ),
                                  ),
                                ),
                              ),
                            ),
                          );
                        }).toList(),
                      ),
                    );
                  }).toList(),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
