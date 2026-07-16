import 'dart:convert';
import 'dart:math' as math;
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:fl_chart/fl_chart.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:mobile/core/theme/app_theme.dart';
import 'package:mobile/core/network/api_client.dart';
import 'package:mobile/presentation/providers/expense_provider.dart';
import 'package:mobile/presentation/providers/auth_provider.dart';
import 'package:mobile/data/models/expense_model.dart';

class VisualAnalyticsScreen extends StatefulWidget {
  const VisualAnalyticsScreen({Key? key}) : super(key: key);

  @override
  State<VisualAnalyticsScreen> createState() => _VisualAnalyticsScreenState();
}

class _VisualAnalyticsScreenState extends State<VisualAnalyticsScreen> {
  int touchedIndex = -1;
  bool _isNetworkView = true; // Toggle between Graph (web-app Visualise) and Category Pie Chart
  bool _isLoadingUsers = false;
  List<dynamic> _users = [];
  final ApiClient _apiClient = ApiClient();

  // Selected node (user) for highlighting connections
  String? _selectedNodeId;

  // Track positions of user nodes to enable drag-and-drop reorganizing
  final Map<String, Offset> _nodePositions = {};

  @override
  void initState() {
    super.initState();
    _fetchUsers();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      Provider.of<ExpenseProvider>(context, listen: false).fetchExpenses();
    });
  }

  Future<void> _fetchUsers() async {
    setState(() => _isLoadingUsers = true);
    try {
      final response = await _apiClient.get('/api/users');
      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        if (data is List) {
          setState(() {
            _users = data;
          });
        }
      }
    } catch (_) {}
    setState(() => _isLoadingUsers = false);
  }

  // Helpers to categorize expenses by description keywords
  String _getCategory(String description) {
    final desc = description.toLowerCase();
    if (desc.contains('food') || desc.contains('eat') || desc.contains('dinner') || desc.contains('lunch') || desc.contains('restaurant') || desc.contains('cafe')) {
      return 'Food & Dining';
    }
    if (desc.contains('rent') || desc.contains('flat') || desc.contains('bill') || desc.contains('room') || desc.contains('electricity') || desc.contains('wifi')) {
      return 'Rent & Bills';
    }
    if (desc.contains('trip') || desc.contains('travel') || desc.contains('cab') || desc.contains('uber') || desc.contains('train') || desc.contains('flight') || desc.contains('petrol')) {
      return 'Travel & Fuel';
    }
    if (desc.contains('movie') || desc.contains('game') || desc.contains('party') || desc.contains('fun') || desc.contains('show') || desc.contains('pub')) {
      return 'Entertainment';
    }
    if (desc.contains('shop') || desc.contains('buy') || desc.contains('cloth') || desc.contains('gift') || desc.contains('store')) {
      return 'Shopping';
    }
    return 'Miscellaneous';
  }

  Color _getCategoryColor(String category) {
    switch (category) {
      case 'Food & Dining':
        return AppTheme.primaryColor;
      case 'Rent & Bills':
        return AppTheme.secondaryColor;
      case 'Travel & Fuel':
        return AppTheme.infoColor;
      case 'Entertainment':
        return AppTheme.warningColor;
      case 'Shopping':
        return AppTheme.dangerColor;
      default:
        return AppTheme.successColor;
    }
  }

  @override
  Widget build(BuildContext context) {
    final auth = Provider.of<AuthProvider>(context);
    final expenseProv = Provider.of<ExpenseProvider>(context);
    final currentUserId = auth.currentUser?.id ?? '';

    // Calculate distributions
    final categoryTotals = <String, double>{};
    double totalSpent = 0.0;

    for (var exp in expenseProv.expenses) {
      if (exp.paidById == currentUserId || exp.paidToId == currentUserId) {
        final cat = _getCategory(exp.description);
        categoryTotals[cat] = (categoryTotals[cat] ?? 0.0) + exp.amount;
        totalSpent += exp.amount;
      }
    }

    // Prepare chart sections
    final sections = <PieChartSectionData>[];
    int idx = 0;
    categoryTotals.forEach((cat, value) {
      final isTouched = idx == touchedIndex;
      final fontSize = isTouched ? 16.0 : 12.0;
      final radius = isTouched ? 60.0 : 50.0;
      final double percentage = totalSpent > 0 ? (value / totalSpent) * 100 : 0.0;

      sections.add(
        PieChartSectionData(
          color: _getCategoryColor(cat),
          value: value,
          title: '${percentage.toStringAsFixed(0)}%',
          radius: radius,
          titleStyle: TextStyle(
            fontSize: fontSize,
            fontWeight: FontWeight.bold,
            color: Colors.white,
            shadows: const [Shadow(color: Colors.black45, blurRadius: 2)],
          ),
        ),
      );
      idx++;
    });

    final isLoading = expenseProv.isLoading || _isLoadingUsers;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Flow & Analytics'),
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(48),
          child: Container(
            margin: const EdgeInsets.only(bottom: 8, left: 16, right: 16),
            height: 38,
            decoration: BoxDecoration(
              color: AppTheme.backgroundColor,
              borderRadius: BorderRadius.circular(8),
              border: Border.all(color: AppTheme.borderColor),
            ),
            child: Row(
              children: [
                Expanded(
                  child: InkWell(
                    onTap: () => setState(() => _isNetworkView = true),
                    child: Container(
                      alignment: Alignment.center,
                      decoration: BoxDecoration(
                        color: _isNetworkView ? AppTheme.surfaceColor : Colors.transparent,
                        borderRadius: BorderRadius.circular(6),
                        boxShadow: _isNetworkView ? AppTheme.cardShadow : null,
                      ),
                      child: Text(
                        'Flow Graph',
                        style: TextStyle(
                          fontWeight: FontWeight.bold,
                          fontSize: 13,
                          color: _isNetworkView ? AppTheme.primaryColor : AppTheme.textSecondary,
                        ),
                      ),
                    ),
                  ),
                ),
                Expanded(
                  child: InkWell(
                    onTap: () => setState(() => _isNetworkView = false),
                    child: Container(
                      alignment: Alignment.center,
                      decoration: BoxDecoration(
                        color: !_isNetworkView ? AppTheme.surfaceColor : Colors.transparent,
                        borderRadius: BorderRadius.circular(6),
                        boxShadow: !_isNetworkView ? AppTheme.cardShadow : null,
                      ),
                      child: Text(
                        'Categories',
                        style: TextStyle(
                          fontWeight: FontWeight.bold,
                          fontSize: 13,
                          color: !_isNetworkView ? AppTheme.primaryColor : AppTheme.textSecondary,
                        ),
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
      body: isLoading
          ? const Center(child: CircularProgressIndicator(color: AppTheme.primaryColor))
          : totalSpent == 0.0
              ? const Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(Icons.pie_chart_outline, size: 60, color: AppTheme.textSecondary),
                      SizedBox(height: 16),
                      Text('No transactions to analyze.', style: TextStyle(color: AppTheme.textSecondary, fontSize: 16)),
                    ],
                  ),
                )
              : SingleChildScrollView(
                  padding: const EdgeInsets.all(20.0),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // Total Spent summary card (Fixed overflow bug using Expanded)
                      Card(
                        child: Padding(
                          padding: const EdgeInsets.all(20.0),
                          child: Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: const [
                                    Text(
                                      'TOTAL PORTFOLIO INVOLVED',
                                      style: TextStyle(
                                        color: AppTheme.textSecondary,
                                        fontSize: 10,
                                        fontWeight: FontWeight.bold,
                                        letterSpacing: 1.2,
                                      ),
                                    ),
                                    SizedBox(height: 4),
                                    Text(
                                      'My Share Expenses',
                                      style: TextStyle(color: AppTheme.textSecondary, fontSize: 13),
                                    ),
                                  ],
                                ),
                              ),
                              const SizedBox(width: 12),
                              Text(
                                '₹${totalSpent.toStringAsFixed(2)}',
                                style: const TextStyle(
                                  fontSize: 20,
                                  fontWeight: FontWeight.bold,
                                  color: AppTheme.successColor,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                      const SizedBox(height: 20),

                      if (_isNetworkView) ...[
                        const Text(
                          'RELATIONSHIP FLOW GRAPH',
                          style: TextStyle(color: AppTheme.textSecondary, fontSize: 12, fontWeight: FontWeight.bold, letterSpacing: 1.2),
                        ),
                        const SizedBox(height: 4),
                        const Text(
                          'Click a user node to filter connections. Green arrows represent settled transactions, orange represent pending.',
                          style: TextStyle(color: AppTheme.textSecondary, fontSize: 11),
                        ),
                        const SizedBox(height: 12),
                        Card(
                          child: Padding(
                            padding: const EdgeInsets.symmetric(vertical: 16.0),
                            child: _buildNetworkGraph(expenseProv.expenses, currentUserId),
                          ),
                        ),
                      ] else ...[
                        // Category Chart View
                        const Text('CATEGORY DISTRIBUTION', style: TextStyle(color: AppTheme.textSecondary, fontSize: 12, fontWeight: FontWeight.bold, letterSpacing: 1.2)),
                        const SizedBox(height: 12),
                        Card(
                          child: Padding(
                            padding: const EdgeInsets.symmetric(vertical: 24.0),
                            child: Column(
                              children: [
                                SizedBox(
                                  height: 160,
                                  child: PieChart(
                                    PieChartData(
                                      sectionsSpace: 4,
                                      centerSpaceRadius: 40,
                                      sections: sections,
                                    ),
                                  ),
                                ),
                                const SizedBox(height: 24),
                                // Legends
                                Padding(
                                  padding: const EdgeInsets.symmetric(horizontal: 16),
                                  child: Wrap(
                                    spacing: 16,
                                    runSpacing: 8,
                                    alignment: WrapAlignment.center,
                                    children: categoryTotals.keys.map((cat) {
                                      return Row(
                                        mainAxisSize: MainAxisSize.min,
                                        children: [
                                          Container(
                                            width: 12,
                                            height: 12,
                                            decoration: BoxDecoration(
                                              color: _getCategoryColor(cat),
                                              shape: BoxShape.circle,
                                            ),
                                          ),
                                          const SizedBox(width: 6),
                                          Text(
                                            '$cat (₹${categoryTotals[cat]!.toStringAsFixed(0)})',
                                            style: const TextStyle(color: AppTheme.textPrimary, fontSize: 12),
                                          ),
                                        ],
                                      );
                                    }).toList(),
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),
                        const SizedBox(height: 20),

                        // Expense breakups list
                        const Text('BREAKDOWN BREAKUPS', style: TextStyle(color: AppTheme.textSecondary, fontSize: 12, fontWeight: FontWeight.bold, letterSpacing: 1.2)),
                        const SizedBox(height: 12),
                        ...categoryTotals.entries.map((entry) {
                          final catColor = _getCategoryColor(entry.key);
                          return Card(
                            margin: const EdgeInsets.only(bottom: 8),
                            child: ListTile(
                              leading: CircleAvatar(
                                backgroundColor: catColor.withValues(alpha: 0.15),
                                child: Icon(Icons.label, color: catColor, size: 20),
                              ),
                              title: Text(entry.key, style: const TextStyle(fontWeight: FontWeight.bold)),
                              trailing: Text(
                                '₹${entry.value.toStringAsFixed(2)}',
                                style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
                              ),
                            ),
                          );
                        }).toList(),
                      ],
                    ],
                  ),
                ),
    );
  }

  // ── Network Graph Renderer (Mirrors Vis-Network of web app) ──────────────

  Widget _buildNetworkGraph(List<ExpenseModel> expenses, String currentUserId) {
    if (_users.isEmpty) {
      return const SizedBox(
        height: 320,
        child: Center(child: Text('Loading users for graph...')),
      );
    }

    // Build the visual nodes and edges data
    final nodePositions = <String, Offset>{};
    final nodeNames = <String, String>{};

    for (var u in _users) {
      nodeNames[u['_id']] = u['username'] ?? 'User';
    }

    // Calculate node coordinates in a perfect circle if they haven't been initialized/dragged yet
    if (_nodePositions.isEmpty) {
      const double radius = 100.0;
      const Offset center = Offset(150, 150);
      final double angleStep = 2 * math.pi / _users.length;

      for (int i = 0; i < _users.length; i++) {
        final double angle = i * angleStep - math.pi / 2;
        final double x = center.dx + radius * math.cos(angle);
        final double y = center.dy + radius * math.sin(angle);
        _nodePositions[_users[i]['_id']] = Offset(x, y);
      }
    }

    // Aggregate money flows between users (exactly matching Visualise.js)
    final edges = <String, _MoneyFlow>{};
    double maxAmt = 0.0;

    for (var exp in expenses) {
      final from = exp.paidById;
      final to = exp.paidToId;
      if (from.isEmpty || to.isEmpty) continue;

      final key = '$from->$to';
      if (edges.containsKey(key)) {
        edges[key]!.amount += exp.amount;
        edges[key]!.transactions.add(exp);
        if (!exp.status) edges[key]!.isAllSettled = false;
      } else {
        edges[key] = _MoneyFlow(
          fromId: from,
          toId: to,
          amount: exp.amount,
          isAllSettled: exp.status,
          transactions: [exp],
        );
      }
      if (edges[key]!.amount > maxAmt) {
        maxAmt = edges[key]!.amount;
      }
    }

    return Column(
      children: [
        // Legend Row
        Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            _buildLegendItem('Settled Connection', AppTheme.successColor),
            const SizedBox(width: 16),
            _buildLegendItem('Pending Connection', Colors.orange),
          ],
        ),
        const SizedBox(height: 16),

        // Zoomable / Interactive Canvas Viewport
        SizedBox(
          height: 320,
          width: double.infinity,
          child: InteractiveViewer(
            minScale: 0.8,
            maxScale: 2.5,
            child: Stack(
              clipBehavior: Clip.none,
              children: [
                // Custom Paint for Arrows / Connections
                CustomPaint(
                  size: const Size(300, 300),
                  painter: _GraphPainter(
                    nodePositions: _nodePositions,
                    flows: edges.values.toList(),
                    maxAmount: maxAmt,
                    selectedNodeId: _selectedNodeId,
                    onEdgeTapped: (flow) {
                      _showFlowDetailsBottomSheet(flow, nodeNames);
                    },
                  ),
                ),

                // Interactive Node Avatars
                ..._users.map((u) {
                  final id = u['_id'];
                  final name = u['username'] ?? 'U';
                  final pos = _nodePositions[id] ?? Offset.zero;
                  final isMe = id == currentUserId;
                  final isSelected = _selectedNodeId == id;

                  // Dim node if another node is selected and there's no connection
                  double opacity = 1.0;
                  if (_selectedNodeId != null && !isSelected) {
                    final hasConnection = edges.keys.contains('$_selectedNodeId->$id') ||
                                         edges.keys.contains('$id->$_selectedNodeId');
                    if (!hasConnection) opacity = 0.35;
                  }

                  return Positioned(
                    left: pos.dx - 30,
                    top: pos.dy - 22,
                    child: Opacity(
                      opacity: opacity,
                      child: GestureDetector(
                        onPanUpdate: (details) {
                          setState(() {
                            _nodePositions[id] = pos + details.delta;
                          });
                        },
                        onTap: () {
                          setState(() {
                            if (_selectedNodeId == id) {
                              _selectedNodeId = null;
                            } else {
                              _selectedNodeId = id;
                            }
                          });
                        },
                        child: SizedBox(
                          width: 60,
                          child: Column(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              AnimatedContainer(
                                duration: const Duration(milliseconds: 250),
                                width: 44,
                                height: 44,
                                decoration: BoxDecoration(
                                  shape: BoxShape.circle,
                                  color: isMe ? AppTheme.primaryLight : AppTheme.surfaceColor,
                                  border: Border.all(
                                    color: isSelected 
                                        ? AppTheme.primaryColor 
                                        : (isMe ? AppTheme.primaryColor : AppTheme.borderColor),
                                    width: isSelected ? 3 : (isMe ? 2 : 1),
                                  ),
                                  boxShadow: isSelected ? AppTheme.elevatedShadow : AppTheme.cardShadow,
                                ),
                                alignment: Alignment.center,
                                child: Text(
                                  name.substring(0, 1).toUpperCase(),
                                  style: TextStyle(
                                    color: AppTheme.primaryColor,
                                    fontWeight: FontWeight.bold,
                                    fontSize: isMe ? 15 : 13,
                                  ),
                                ),
                              ),
                              const SizedBox(height: 3),
                              Text(
                                name,
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                                textAlign: TextAlign.center,
                                style: TextStyle(
                                  fontSize: 10,
                                  fontWeight: isSelected ? FontWeight.bold : FontWeight.w500,
                                  color: AppTheme.textPrimary,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                    ),
                  );
                }).toList(),
              ],
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildLegendItem(String label, Color color) {
    return Row(
      children: [
        Container(
          width: 12,
          height: 12,
          decoration: BoxDecoration(
            color: color,
            borderRadius: BorderRadius.circular(3),
          ),
        ),
        const SizedBox(width: 6),
        Text(label, style: const TextStyle(fontSize: 11, color: AppTheme.textSecondary)),
      ],
    );
  }

  // Show bottom sheet listing all transactions inside this user-to-user connection
  void _showFlowDetailsBottomSheet(_MoneyFlow flow, Map<String, String> names) {
    final fromName = names[flow.fromId] ?? 'Sender';
    final toName = names[flow.toId] ?? 'Receiver';

    showModalBottomSheet(
      context: context,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (ctx) {
        return Container(
          padding: const EdgeInsets.all(24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(
                'CONNECTION FLOW DETAILS',
                style: GoogleFonts.inter(
                  fontSize: 10,
                  fontWeight: FontWeight.bold,
                  color: AppTheme.textSecondary,
                  letterSpacing: 1.2,
                ),
              ),
              const SizedBox(height: 6),
              Text(
                '$fromName → $toName',
                style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 18, color: AppTheme.textPrimary),
              ),
              const SizedBox(height: 16),

              // Total Flow Summary
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                decoration: BoxDecoration(
                  color: AppTheme.backgroundColor,
                  borderRadius: BorderRadius.circular(10),
                  border: Border.all(color: AppTheme.borderColor),
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Text('Total Flow', style: TextStyle(color: AppTheme.textSecondary, fontWeight: FontWeight.w500)),
                    Text(
                      '₹${flow.amount.toStringAsFixed(2)}',
                      style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16, color: AppTheme.successColor),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 16),

              const Text('Transactions List', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: AppTheme.textSecondary)),
              const SizedBox(height: 8),

              // Scrollable list of expenses contributing to this connection
              Flexible(
                child: ListView.builder(
                  shrinkWrap: true,
                  itemCount: flow.transactions.length,
                  itemBuilder: (context, idx) {
                    final txn = flow.transactions[idx];
                    return Container(
                      margin: const EdgeInsets.only(bottom: 10),
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: AppTheme.surfaceColor,
                        borderRadius: BorderRadius.circular(8),
                        border: Border.all(color: AppTheme.borderColor),
                      ),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  txn.description.isEmpty ? 'No description' : txn.description,
                                  style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
                                ),
                                const SizedBox(height: 4),
                                Text(
                                  '${txn.date.day}/${txn.date.month}/${txn.date.year}',
                                  style: const TextStyle(color: AppTheme.textSecondary, fontSize: 11),
                                ),
                              ],
                            ),
                          ),
                          Column(
                            crossAxisAlignment: CrossAxisAlignment.end,
                            children: [
                              Text(
                                '₹${txn.amount.toStringAsFixed(2)}',
                                style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
                              ),
                              const SizedBox(height: 4),
                              Text(
                                txn.status ? 'Settled' : 'Pending',
                                style: TextStyle(
                                  color: txn.status ? AppTheme.successColor : Colors.orange,
                                  fontSize: 10,
                                  fontWeight: FontWeight.bold,
                                ),
                              )
                            ],
                          )
                        ],
                      ),
                    );
                  },
                ),
              ),
            ],
          ),
        );
      },
    );
  }
}

// ── Models & Custom Painters for Relationship Graph ───────────────────────

class _MoneyFlow {
  final String fromId;
  final String toId;
  double amount;
  bool isAllSettled;
  final List<ExpenseModel> transactions;

  _MoneyFlow({
    required this.fromId,
    required this.toId,
    required this.amount,
    required this.isAllSettled,
    required this.transactions,
  });
}

class _GraphPainter extends CustomPainter {
  final Map<String, Offset> nodePositions;
  final List<_MoneyFlow> flows;
  final double maxAmount;
  final String? selectedNodeId;
  final Function(_MoneyFlow) onEdgeTapped;

  _GraphPainter({
    required this.nodePositions,
    required this.flows,
    required this.maxAmount,
    required this.selectedNodeId,
    required this.onEdgeTapped,
  });

  @override
  void paint(Canvas canvas, Size size) {
    for (var flow in flows) {
      final pFrom = nodePositions[flow.fromId];
      final pTo = nodePositions[flow.toId];
      if (pFrom == null || pTo == null) continue;

      // Dim flows not connected to the selected node
      bool shouldDim = false;
      if (selectedNodeId != null) {
        if (flow.fromId != selectedNodeId && flow.toId != selectedNodeId) {
          shouldDim = true;
        }
      }

      final color = flow.isAllSettled ? AppTheme.successColor : Colors.orange;
      final paint = Paint()
        ..color = shouldDim ? color.withValues(alpha: 0.15) : color
        ..style = PaintingStyle.stroke
        ..strokeCap = StrokeCap.round
        // Stroke width proportional to flow volume (minimum 1.5, maximum 8)
        ..strokeWidth = maxAmount > 0 
            ? 1.5 + (flow.amount / maxAmount) * 6.5
            : 1.5;

      // Shift line slightly to avoid overlapping bidirectional lines
      final direction = pTo - pFrom;
      final distance = direction.distance;
      final unit = direction / distance;
      final normal = Offset(-unit.dy, unit.dx);
      
      // Shift normal vector out by 8 pixels to prevent line overlaps
      final shift = normal * 8;
      final start = pFrom + shift;
      final end = pTo + shift;

      // Draw connection line
      canvas.drawLine(start, end, paint);

      // Draw a background capsule for text showing the amount on the edge line
      final midpoint = (start + end) / 2;
      final textPainter = TextPainter(
        text: TextSpan(
          text: '₹${flow.amount.toStringAsFixed(0)}',
          style: TextStyle(
            color: shouldDim ? AppTheme.textPrimary.withValues(alpha: 0.15) : AppTheme.textPrimary,
            fontSize: 8,
            fontWeight: FontWeight.bold,
          ),
        ),
        textDirection: TextDirection.ltr,
      )..layout();

      final bgPaint = Paint()..color = AppTheme.surfaceColor.withValues(alpha: shouldDim ? 0.35 : 0.95);
      final rect = Rect.fromCenter(
        center: midpoint,
        width: textPainter.width + 8,
        height: textPainter.height + 4,
      );
      
      canvas.drawRRect(
        RRect.fromRectAndRadius(rect, const Radius.circular(5)),
        bgPaint,
      );

      final borderPaint = Paint()
        ..color = shouldDim ? AppTheme.borderColor.withValues(alpha: 0.15) : AppTheme.borderColor
        ..style = PaintingStyle.stroke
        ..strokeWidth = 0.5;
      canvas.drawRRect(
        RRect.fromRectAndRadius(rect, const Radius.circular(5)),
        borderPaint,
      );

      textPainter.paint(
        canvas,
        midpoint - Offset(textPainter.width / 2, textPainter.height / 2),
      );

      // Draw a neat directional arrowhead close to the target node
      final arrowLength = 9.0;
      final arrowAngle = 25 * math.pi / 180;
      
      // Arrow base position, slightly inset to point to the edge of the circular avatar
      final arrowTarget = end - (unit * 24); 
      
      final arrowDirection = -unit;
      
      final arrowLeft = arrowTarget + Offset(
        arrowDirection.dx * math.cos(arrowAngle) - arrowDirection.dy * math.sin(arrowAngle),
        arrowDirection.dx * math.sin(arrowAngle) + arrowDirection.dy * math.cos(arrowAngle),
      ) * arrowLength;

      final arrowRight = arrowTarget + Offset(
        arrowDirection.dx * math.cos(-arrowAngle) - arrowDirection.dy * math.sin(-arrowAngle),
        arrowDirection.dx * math.sin(-arrowAngle) + arrowDirection.dy * math.cos(-arrowAngle),
      ) * arrowLength;

      final arrowPaint = Paint()
        ..color = shouldDim ? color.withValues(alpha: 0.15) : color
        ..style = PaintingStyle.fill;

      final path = Path()
        ..moveTo(arrowTarget.dx, arrowTarget.dy)
        ..lineTo(arrowLeft.dx, arrowLeft.dy)
        ..lineTo(arrowRight.dx, arrowRight.dy)
        ..close();

      canvas.drawPath(path, arrowPaint);
    }
  }

  @override
  bool hitTest(Offset position) {
    // Check if the user tapped on one of our money flow connection lines
    for (var flow in flows) {
      final pFrom = nodePositions[flow.fromId];
      final pTo = nodePositions[flow.toId];
      if (pFrom == null || pTo == null) continue;

      final direction = pTo - pFrom;
      final distance = direction.distance;
      final unit = direction / distance;
      final normal = Offset(-unit.dy, unit.dx);
      final shift = normal * 8;
      final start = pFrom + shift;
      final end = pTo + shift;

      // Project point onto line to check proximity
      final v = position - start;
      final t = (v.dx * unit.dx + v.dy * unit.dy).clamp(0.0, distance);
      final projection = start + unit * t;
      final distToLine = (position - projection).distance;

      // 18-pixel tap target width
      if (distToLine < 18.0) {
        onEdgeTapped(flow);
        return true;
      }
    }
    return false;
  }

  @override
  bool shouldRepaint(covariant _GraphPainter oldDelegate) {
    return oldDelegate.selectedNodeId != selectedNodeId || 
           oldDelegate.flows.length != flows.length;
  }
}
