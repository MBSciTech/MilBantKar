import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import 'package:mobile/core/theme/app_theme.dart';
import 'package:mobile/presentation/providers/auth_provider.dart';
import 'package:mobile/presentation/providers/event_provider.dart';
import 'package:mobile/presentation/screens/transactions/add_transaction_screen.dart';
import 'package:qr_flutter/qr_flutter.dart';
import 'package:mobile/presentation/widgets/skeleton_loaders.dart';

class EventDetailsScreen extends StatefulWidget {
  final String eventId;
  const EventDetailsScreen({Key? key, required this.eventId}) : super(key: key);

  @override
  State<EventDetailsScreen> createState() => _EventDetailsScreenState();
}

class _EventDetailsScreenState extends State<EventDetailsScreen> with SingleTickerProviderStateMixin {
  late TabController _tabController;
  bool _isIndividualSelected = true;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 3, vsync: this);
    WidgetsBinding.instance.addPostFrameCallback((_) => _loadDetails());
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  Future<void> _loadDetails() async {
    Provider.of<EventProvider>(context, listen: false).fetchEventDetails(widget.eventId);
  }

  void _copyToClipboard(String text) {
    Clipboard.setData(ClipboardData(text: text));
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Event Code copied to clipboard!'), backgroundColor: AppTheme.successColor),
    );
  }

  void _conclude() async {
    final userId = Provider.of<AuthProvider>(context, listen: false).currentUser?.id;
    if (userId == null) return;

    final success = await Provider.of<EventProvider>(context, listen: false).concludeEvent(widget.eventId, userId);
    if (success && mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Event concluded successfully!'), backgroundColor: AppTheme.successColor),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final auth = Provider.of<AuthProvider>(context);
    final eventProv = Provider.of<EventProvider>(context);
    final currentUserId = auth.currentUser?.id ?? '';

    final event = eventProv.selectedEvent;

    return Scaffold(
      appBar: AppBar(
        title: Text(event?.name ?? 'Event Details'),
        actions: [
          if (event != null)
            IconButton(
              icon: const Icon(Icons.qr_code, color: AppTheme.primaryColor),
              tooltip: 'Show QR Code',
              onPressed: () {
                showDialog(
                  context: context,
                  builder: (ctx) => AlertDialog(
                    backgroundColor: AppTheme.surfaceColor,
                    title: const Text('Event QR Code', textAlign: TextAlign.center, style: TextStyle(color: AppTheme.textPrimary)),
                    content: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        SizedBox(
                          width: 232,
                          height: 232,
                          child: Container(
                            padding: const EdgeInsets.all(16),
                            decoration: BoxDecoration(
                              color: Colors.white,
                              borderRadius: BorderRadius.circular(12),
                            ),
                            child: QrImageView(
                              data: event.code,
                              version: QrVersions.auto,
                              size: 200.0,
                            ),
                          ),
                        ),
                        const SizedBox(height: 16),
                        Text(
                          'Event Code: ${event.code}',
                          style: const TextStyle(
                            fontSize: 18,
                            fontWeight: FontWeight.bold,
                            letterSpacing: 2,
                            color: AppTheme.textPrimary,
                          ),
                        ),
                        const SizedBox(height: 8),
                        const Text(
                          'Scan to join this event',
                          style: TextStyle(color: AppTheme.textSecondary, fontSize: 13),
                        ),
                      ],
                    ),
                    actions: [
                      TextButton(
                        onPressed: () => Navigator.pop(ctx),
                        child: const Text('Close'),
                      ),
                    ],
                  ),
                );
              },
            ),
        ],
        bottom: TabBar(
          controller: _tabController,
          indicatorColor: AppTheme.primaryColor,
          labelColor: AppTheme.textPrimary,
          unselectedLabelColor: AppTheme.textSecondary,
          labelStyle: const TextStyle(fontWeight: FontWeight.bold),
          tabs: const [
            Tab(text: 'Overview'),
            Tab(text: 'Expenses'),
            Tab(text: 'Members'),
          ],
        ),
      ),
      body: eventProv.isLoading && event == null
          ? const SkeletonList()
          : event == null
              ? const Center(child: Text('Failed to load event details.'))
              : TabBarView(
                  controller: _tabController,
                  children: [
                    _buildOverviewTab(event, currentUserId),
                    _buildExpensesTab(event, currentUserId),
                    _buildMembersTab(event),
                  ],
                ),
      floatingActionButton: event != null && !event.isClosed
          ? FloatingActionButton.extended(
              onPressed: () => Navigator.push(
                context,
                MaterialPageRoute(
                  builder: (context) => AddTransactionScreen(eventId: event.id),
                ),
              ).then((_) => _loadDetails()),
              backgroundColor: AppTheme.primaryColor,
              icon: const Icon(Icons.add_shopping_cart, color: Colors.white),
              label: const Text('Add Expense', style: TextStyle(color: Colors.white)),
            )
          : null,
    );
  }

  Widget _buildOverviewTab(event, String currentUserId) {
    final isCreator = event.createdById == currentUserId;
    
    // Calculate total event expenses
    double totalSpent = 0.0;
    for (var exp in event.expenses) {
      totalSpent += exp.amount;
    }

    return SingleChildScrollView(
      padding: const EdgeInsets.all(20.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Event Info Card
          Card(
            child: Padding(
              padding: const EdgeInsets.all(20.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            event.name,
                            style: const TextStyle(fontSize: 22, fontWeight: FontWeight.bold, color: AppTheme.textPrimary),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            'Created by ${event.createdByUsername.isEmpty ? "you" : event.createdByUsername}',
                            style: const TextStyle(color: AppTheme.textSecondary, fontSize: 13),
                          ),
                        ],
                      ),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                        decoration: BoxDecoration(
                          color: event.isClosed ? AppTheme.backgroundColor : AppTheme.successLight,
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(color: event.isClosed ? AppTheme.borderColor : AppTheme.successColor),
                        ),
                        child: Text(
                          event.isClosed ? 'Concluded' : 'Active',
                          style: TextStyle(
                            color: event.isClosed ? AppTheme.textSecondary : AppTheme.successColor,
                            fontSize: 11,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ),
                    ],
                  ),
                  const Divider(height: 24, color: AppTheme.borderColor),
                  if (event.description.isNotEmpty) ...[
                    const Text('DESCRIPTION', style: TextStyle(color: AppTheme.textSecondary, fontSize: 11, fontWeight: FontWeight.bold)),
                    const SizedBox(height: 4),
                    Text(event.description, style: const TextStyle(color: AppTheme.textPrimary, fontSize: 14)),
                    const SizedBox(height: 16),
                  ],
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text('INVITATION CODE', style: TextStyle(color: AppTheme.textSecondary, fontSize: 11, fontWeight: FontWeight.bold)),
                          const SizedBox(height: 4),
                          Row(
                            children: [
                              Text(
                                event.code,
                                style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: AppTheme.primaryColor, fontFamily: 'Courier New'),
                              ),
                              IconButton(
                                constraints: const BoxConstraints(),
                                padding: const EdgeInsets.only(left: 8),
                                icon: const Icon(Icons.copy, size: 16, color: AppTheme.primaryColor),
                                onPressed: () => _copyToClipboard(event.code),
                              )
                            ],
                          ),
                        ],
                      ),
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.end,
                        children: [
                          const Text('TOTAL BUDGET SPENT', style: TextStyle(color: AppTheme.textSecondary, fontSize: 11, fontWeight: FontWeight.bold)),
                          const SizedBox(height: 4),
                          Text('₹${totalSpent.toStringAsFixed(2)}', style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: AppTheme.successColor)),
                        ],
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 24),

          // Settle Up Calculation
          const Text(
            'SETTLEMENT GRAPH',
            style: TextStyle(color: AppTheme.textSecondary, fontSize: 12, fontWeight: FontWeight.bold, letterSpacing: 1.2),
          ),
          const SizedBox(height: 12),
          _buildSettleUpCalculationCard(event, currentUserId),
          const SizedBox(height: 24),

          // Conclude Button (Creator only)
          if (isCreator && !event.isClosed) ...[
            SizedBox(
              width: double.infinity,
              child: ElevatedButton.icon(
                onPressed: _conclude,
                icon: const Icon(Icons.check_circle_outline),
                label: const Text('Conclude & Freeze Event'),
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppTheme.secondaryColor,
                  padding: const EdgeInsets.symmetric(vertical: 16),
                ),
              ),
            ),
            const SizedBox(height: 40),
          ]
        ],
      ),
    );
  }

  Widget _buildSettleUpCalculationCard(event, String currentUserId) {
    // Basic settlement logic within event:
    // 1. Calculate net balance for each participant in this event
    // 2. Map participant ID -> net balance
    final balances = <String, double>{};
    final names = <String, String>{};

    for (var p in event.participants) {
      balances[p.id] = 0.0;
      names[p.id] = p.username;
    }

    for (var exp in event.expenses) {
      // exp.paidBy is who paid, exp.paidTo is who received benefit
      final paidBy = exp.paidById;
      final paidTo = exp.paidToId;
      final amt = exp.amount;

      if (balances.containsKey(paidBy)) balances[paidBy] = balances[paidBy]! + amt;
      if (balances.containsKey(paidTo)) balances[paidTo] = balances[paidTo]! - amt;
    }

    // Filter into creditors (who should receive money, balance > 0) and debtors (who owe money, balance < 0)
    final creditors = balances.entries.where((e) => e.value > 0.0).toList();
    final debtors = balances.entries.where((e) => e.value < 0.0).map((e) => MapEntry(e.key, e.value.abs())).toList();

    // Match them up
    final settlements = <Widget>[];

    int cIdx = 0;
    int dIdx = 0;

    while (cIdx < creditors.length && dIdx < debtors.length) {
      final creditor = creditors[cIdx];
      final debtor = debtors[dIdx];

      final credId = creditor.key;
      final credAmt = creditor.value;
      final debtId = debtor.key;
      final debtAmt = debtor.value;

      final minAmt = credAmt < debtAmt ? credAmt : debtAmt;

      final debtorName = names[debtId] ?? 'Someone';
      final creditorName = names[credId] ?? 'Someone';

      final stepIndex = settlements.length + 1;
      settlements.add(
        Container(
          margin: const EdgeInsets.only(bottom: 12),
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
          decoration: BoxDecoration(
            color: AppTheme.backgroundColor,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: AppTheme.borderColor),
          ),
          child: Row(
            children: [
              // Step number
              CircleAvatar(
                radius: 12,
                backgroundColor: AppTheme.primaryLight,
                child: Text(
                  '$stepIndex',
                  style: const TextStyle(
                    color: AppTheme.primaryColor,
                    fontSize: 11,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
              const SizedBox(width: 12),

              // Debtor (PAYS)
              Expanded(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    CircleAvatar(
                      radius: 16,
                      backgroundColor: AppTheme.dangerLight,
                      child: Text(
                        debtorName.substring(0, 1).toUpperCase(),
                        style: const TextStyle(color: AppTheme.dangerColor, fontSize: 11, fontWeight: FontWeight.bold),
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      debtorName,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: AppTheme.textPrimary),
                    ),
                    const Text(
                      'PAYS',
                      style: TextStyle(color: AppTheme.textSecondary, fontSize: 9, fontWeight: FontWeight.bold),
                    ),
                  ],
                ),
              ),

              // Arrow and Amount Chip
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 8.0),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                      decoration: BoxDecoration(
                        color: AppTheme.primaryColor,
                        borderRadius: BorderRadius.circular(20),
                      ),
                      child: Text(
                        '₹${minAmt.toStringAsFixed(2)}',
                        style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 12),
                      ),
                    ),
                    const Icon(Icons.arrow_right_alt, color: AppTheme.primaryColor, size: 20),
                  ],
                ),
              ),

              // Creditor (RECEIVES)
              Expanded(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    CircleAvatar(
                      radius: 16,
                      backgroundColor: AppTheme.successLight,
                      child: Text(
                        creditorName.substring(0, 1).toUpperCase(),
                        style: const TextStyle(color: AppTheme.successColor, fontSize: 11, fontWeight: FontWeight.bold),
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      creditorName,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: AppTheme.textPrimary),
                    ),
                    const Text(
                      'RECEIVES',
                      style: TextStyle(color: AppTheme.textSecondary, fontSize: 9, fontWeight: FontWeight.bold),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      );

      // Update remaining amounts
      if (credAmt < debtAmt) {
        debtors[dIdx] = MapEntry(debtId, debtAmt - minAmt);
        cIdx++;
      } else if (credAmt > debtAmt) {
        creditors[cIdx] = MapEntry(credId, credAmt - minAmt);
        dIdx++;
      } else {
        cIdx++;
        dIdx++;
      }
    }

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(20.0),
        child: settlements.isEmpty
            ? const Center(child: Text('All balances settled up inside this event! 🎉', style: TextStyle(color: AppTheme.successColor)))
            : Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: settlements,
              ),
      ),
    );
  }

  Widget _buildExpensesTab(event, String currentUserId) {
    if (event.expenses.isEmpty) {
      return const Center(
        child: Text('No expenses recorded for this event.', style: TextStyle(color: AppTheme.textSecondary)),
      );
    }

    List expensesToShow = List.from(event.expenses);
    expensesToShow.sort((a, b) => b.date.compareTo(a.date));

    // Grouping logic (simplified: group by payer and description)
    Map<String, List<dynamic>> grouped = {};
    for (var exp in event.expenses) {
      String key = '${exp.paidById}_${exp.description}';
      if (!grouped.containsKey(key)) grouped[key] = [];
      grouped[key]!.add(exp);
    }
    List<List<dynamic>> groupedExpenses = grouped.values.toList();
    groupedExpenses.sort((a, b) => b.first.date.compareTo(a.first.date));

    return Column(
      children: [
        // Toggle Buttons
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
          child: Container(
            decoration: BoxDecoration(
              color: AppTheme.backgroundColor,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: AppTheme.borderColor),
            ),
            child: Row(
              children: [
                Expanded(
                  child: GestureDetector(
                    onTap: () => setState(() => _isIndividualSelected = true),
                    child: Container(
                      padding: const EdgeInsets.symmetric(vertical: 12),
                      decoration: BoxDecoration(
                        color: _isIndividualSelected ? AppTheme.primaryColor : Colors.transparent,
                        borderRadius: BorderRadius.circular(11),
                      ),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(Icons.list, size: 18, color: _isIndividualSelected ? Colors.white : AppTheme.textSecondary),
                          const SizedBox(width: 8),
                          Text(
                            'Individual',
                            style: TextStyle(
                              color: _isIndividualSelected ? Colors.white : AppTheme.textSecondary,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
                Expanded(
                  child: GestureDetector(
                    onTap: () => setState(() => _isIndividualSelected = false),
                    child: Container(
                      padding: const EdgeInsets.symmetric(vertical: 12),
                      decoration: BoxDecoration(
                        color: !_isIndividualSelected ? AppTheme.primaryColor : Colors.transparent,
                        borderRadius: BorderRadius.circular(11),
                      ),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(Icons.layers, size: 18, color: !_isIndividualSelected ? Colors.white : AppTheme.textSecondary),
                          const SizedBox(width: 8),
                          Text(
                            'Grouped',
                            style: TextStyle(
                              color: !_isIndividualSelected ? Colors.white : AppTheme.textSecondary,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
        
        // Expenses List
        Expanded(
          child: _isIndividualSelected
              ? ListView.builder(
                  padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
                  itemCount: expensesToShow.length,
                  itemBuilder: (context, index) {
                    final expense = expensesToShow[index];
                    return _buildIndividualExpenseCard(expense, index == 0);
                  },
                )
              : ListView.builder(
                  padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
                  itemCount: groupedExpenses.length,
                  itemBuilder: (context, index) {
                    final group = groupedExpenses[index];
                    return _buildGroupedExpenseCard(group);
                  },
                ),
        ),
      ],
    );
  }

  Widget _buildIndividualExpenseCard(expense, bool isLatest) {
    return Stack(
      children: [
        Container(
          margin: const EdgeInsets.only(bottom: 16),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: AppTheme.borderColor),
            boxShadow: AppTheme.cardShadow,
          ),
          child: Row(
            children: [
              // Left green/red border indicator
              Container(
                width: 6,
                height: 120, // Approximate height
                decoration: BoxDecoration(
                  color: expense.status ? AppTheme.successColor : AppTheme.primaryColor,
                  borderRadius: const BorderRadius.only(topLeft: Radius.circular(16), bottomLeft: Radius.circular(16)),
                ),
              ),
              Expanded(
                child: Padding(
                  padding: const EdgeInsets.all(16.0),
                  child: Column(
                    children: [
                      // Users Row
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          // Payer
                          Row(
                            children: [
                              CircleAvatar(
                                radius: 22,
                                backgroundColor: AppTheme.successColor,
                                child: Text(
                                  expense.paidByUsername.substring(0, 2).toUpperCase(),
                                  style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
                                ),
                              ),
                              const SizedBox(width: 8),
                              Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(expense.paidByUsername, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
                                  const Text('PAID', style: TextStyle(color: AppTheme.textSecondary, fontSize: 10, letterSpacing: 1)),
                                ],
                              ),
                            ],
                          ),
                          // Arrow
                          const Icon(Icons.arrow_forward, color: AppTheme.textMuted, size: 20),
                          // Receiver
                          Row(
                            children: [
                              Column(
                                crossAxisAlignment: CrossAxisAlignment.end,
                                children: [
                                  Text(expense.paidToUsername, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
                                  const Text('RECEIVED', style: TextStyle(color: AppTheme.textSecondary, fontSize: 10, letterSpacing: 1)),
                                ],
                              ),
                              const SizedBox(width: 8),
                              CircleAvatar(
                                radius: 22,
                                backgroundColor: AppTheme.dangerColor,
                                child: Text(
                                  expense.paidToUsername.substring(0, 2).toUpperCase(),
                                  style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
                                ),
                              ),
                            ],
                          ),
                        ],
                      ),
                      const SizedBox(height: 16),
                      // Details Row
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text(
                            '₹${expense.amount.toStringAsFixed(2)}',
                            style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 20, color: AppTheme.textPrimary),
                          ),
                          Expanded(
                            child: Padding(
                              padding: const EdgeInsets.symmetric(horizontal: 8.0),
                              child: Text(
                                expense.description,
                                maxLines: 2,
                                overflow: TextOverflow.ellipsis,
                                textAlign: TextAlign.center,
                                style: const TextStyle(color: AppTheme.textSecondary, fontSize: 12),
                              ),
                            ),
                          ),
                          Row(
                            children: [
                              Icon(Icons.calendar_today, size: 12, color: AppTheme.textSecondary),
                              const SizedBox(width: 4),
                              Text(
                                '${expense.date.day.toString().padLeft(2, '0')}/${expense.date.month.toString().padLeft(2, '0')}/${expense.date.year}',
                                style: const TextStyle(color: AppTheme.textSecondary, fontSize: 11),
                              ),
                            ],
                          ),
                        ],
                      ),
                      const SizedBox(height: 8),
                      // Status row
                      Align(
                        alignment: Alignment.centerRight,
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Icon(
                              expense.status ? Icons.check_circle : Icons.access_time,
                              size: 14,
                              color: expense.status ? AppTheme.successColor : AppTheme.warningColor,
                            ),
                            const SizedBox(width: 4),
                            Text(
                              expense.status ? 'Settled' : 'Pending',
                              style: TextStyle(
                                color: expense.status ? AppTheme.successColor : AppTheme.warningColor,
                                fontWeight: FontWeight.bold,
                                fontSize: 12,
                              ),
                            ),
                          ],
                        ),
                      )
                    ],
                  ),
                ),
              ),
            ],
          ),
        ),
        if (isLatest)
          Positioned(
            right: 16,
            top: 0,
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
              decoration: BoxDecoration(
                color: AppTheme.successColor,
                borderRadius: BorderRadius.circular(12),
              ),
              child: const Text(
                'Latest',
                style: TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.bold),
              ),
            ),
          ),
      ],
    );
  }

  Widget _buildGroupedExpenseCard(List<dynamic> group) {
    final firstExp = group.first;
    double totalAmount = group.fold(0.0, (sum, exp) => sum + exp.amount);
    int settledCount = group.where((e) => e.status).length;

    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppTheme.borderColor),
        boxShadow: AppTheme.cardShadow,
      ),
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              CircleAvatar(
                radius: 22,
                backgroundColor: AppTheme.primaryLight,
                child: Text(
                  firstExp.paidByUsername.substring(0, 1).toUpperCase(),
                  style: const TextStyle(color: AppTheme.primaryColor, fontWeight: FontWeight.bold),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Text(firstExp.paidByUsername, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                        const SizedBox(width: 8),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                          decoration: BoxDecoration(color: AppTheme.primaryColor, borderRadius: BorderRadius.circular(4)),
                          child: const Text('PAID', style: TextStyle(color: Colors.white, fontSize: 8, fontWeight: FontWeight.bold)),
                        )
                      ],
                    ),
                    const SizedBox(height: 4),
                    Text('${group.length} split${group.length > 1 ? 's' : ''} • ${firstExp.description}', style: const TextStyle(color: AppTheme.textSecondary, fontSize: 12)),
                  ],
                ),
              ),
              Text(
                '₹${totalAmount.toStringAsFixed(2)}',
                style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 18, color: AppTheme.primaryColor),
              ),
            ],
          ),
          const Divider(height: 24, color: AppTheme.borderColor),
          Text('Split Details:', style: TextStyle(color: AppTheme.textSecondary, fontSize: 11, fontWeight: FontWeight.bold)),
          const SizedBox(height: 8),
          ...group.map((exp) {
            return Padding(
              padding: const EdgeInsets.only(bottom: 8.0),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Row(
                    children: [
                      CircleAvatar(
                        radius: 12,
                        backgroundColor: exp.status ? AppTheme.successLight : AppTheme.dangerLight,
                        child: Text(
                          exp.paidToUsername.substring(0, 1).toUpperCase(),
                          style: TextStyle(color: exp.status ? AppTheme.successColor : AppTheme.dangerColor, fontSize: 10, fontWeight: FontWeight.bold),
                        ),
                      ),
                      const SizedBox(width: 8),
                      Text(exp.paidToUsername, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w500)),
                    ],
                  ),
                  Row(
                    children: [
                      Text('₹${exp.amount.toStringAsFixed(2)}', style: const TextStyle(fontSize: 13, fontWeight: FontWeight.bold)),
                      const SizedBox(width: 8),
                      Icon(exp.status ? Icons.check_circle : Icons.access_time, size: 14, color: exp.status ? AppTheme.successColor : AppTheme.warningColor),
                    ],
                  ),
                ],
              ),
            );
          }).toList(),
        ],
      ),
    );
  }

  Widget _buildMembersTab(event) {
    return ListView.builder(
      padding: const EdgeInsets.all(20),
      itemCount: event.participants.length,
      itemBuilder: (context, index) {
        final member = event.participants[index];
        final isCreator = event.createdById == member.id;

        return Card(
          margin: const EdgeInsets.only(bottom: 12),
          child: ListTile(
            leading: CircleAvatar(
              backgroundColor: isCreator ? AppTheme.primaryColor : AppTheme.primaryLight,
              child: Text(
                member.username.substring(0, 1).toUpperCase(),
                style: TextStyle(color: isCreator ? Colors.white : AppTheme.primaryColor, fontWeight: FontWeight.bold),
              ),
            ),
            title: Text(member.username, style: const TextStyle(fontWeight: FontWeight.bold)),
            subtitle: Text(member.email.isEmpty ? 'No email linked' : member.email),
            trailing: isCreator
                ? Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                    decoration: BoxDecoration(
                      color: AppTheme.warningColor.withValues(alpha: 0.15),
                      borderRadius: BorderRadius.circular(10),
                      border: Border.all(color: AppTheme.warningColor.withValues(alpha: 0.3)),
                    ),
                    child: const Text('Admin / Creator', style: TextStyle(color: AppTheme.warningColor, fontSize: 10, fontWeight: FontWeight.bold)),
                  )
                : null,
          ),
        );
      },
    );
  }
}
