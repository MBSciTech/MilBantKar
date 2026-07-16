import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:mobile/core/theme/app_theme.dart';
import 'package:mobile/presentation/providers/auth_provider.dart';
import 'package:mobile/presentation/providers/expense_provider.dart';
import 'package:mobile/presentation/providers/alert_provider.dart';
import 'package:mobile/presentation/widgets/skeleton_loaders.dart';

class HistoryScreen extends StatefulWidget {
  const HistoryScreen({Key? key}) : super(key: key);

  @override
  State<HistoryScreen> createState() => _HistoryScreenState();
}

class _HistoryScreenState extends State<HistoryScreen> {
  String _filter = 'all'; // all, owed_by_me, owed_to_me, settled

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) => _loadExpenses());
  }

  Future<void> _loadExpenses() async {
    Provider.of<ExpenseProvider>(context, listen: false).fetchExpenses();
  }

  void _sendReminder(expense, String currentUserId) async {
    final otherUserId = expense.paidById == currentUserId ? expense.paidToId : expense.paidById;
    final alertProv = Provider.of<AlertProvider>(context, listen: false);

    final success = await alertProv.createAlert(
      sender: currentUserId,
      receiver: otherUserId,
      message: 'Reminder to settle up ₹${expense.amount.toStringAsFixed(2)} for "${expense.description}"',
      type: 'info',
      expenseDetails: expense.id,
    );

    if (success && mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Settlement reminder notification sent!'), backgroundColor: AppTheme.successColor),
      );
    }
  }

  void _toggleSettlement(expense, String currentUserId) async {
    final expenseProv = Provider.of<ExpenseProvider>(context, listen: false);

    // Determine current user's confirmation status
    bool isPayer = expense.paidById == currentUserId;
    bool alreadyConfirmed = isPayer
        ? expense.settlementConfirmation.paidByConfirmed
        : expense.settlementConfirmation.paidToConfirmed;

    // Toggle status
    final success = await expenseProv.updateExpenseStatus(
      expense.id,
      currentUserId,
      !alreadyConfirmed,
    );

    if (success && mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(!alreadyConfirmed ? 'Receipt confirmed!' : 'Receipt unconfirmed'),
          backgroundColor: AppTheme.successColor,
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final auth = Provider.of<AuthProvider>(context);
    final expenseProv = Provider.of<ExpenseProvider>(context);
    final currentUserId = auth.currentUser?.id ?? '';

    // Apply Filter
    final filteredExpenses = expenseProv.expenses.where((exp) {
      if (_filter == 'settled') return exp.status;
      if (exp.status) return false; // Other filters only show pending/unsettled

      if (_filter == 'owed_by_me') return exp.paidToId == currentUserId;
      if (_filter == 'owed_to_me') return exp.paidById == currentUserId;
      
      return true; // 'all' unsettled
    }).toList();

    return Scaffold(
      appBar: AppBar(
        title: const Text('Transaction Ledger'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: _loadExpenses,
          ),
        ],
      ),
      body: Column(
        children: [
          // Filter Chips Row
          SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            child: Row(
              children: [
                _buildFilterChip('All Unsettled', 'all'),
                const SizedBox(width: 8),
                _buildFilterChip('Owed to Me', 'owed_to_me'),
                const SizedBox(width: 8),
                _buildFilterChip('I Owe', 'owed_by_me'),
                const SizedBox(width: 8),
                _buildFilterChip('All Settled', 'settled'),
              ],
            ),
          ),

          // Transactions List
          Expanded(
            child: RefreshIndicator(
              onRefresh: _loadExpenses,
              color: AppTheme.primaryColor,
              child: expenseProv.isLoading && expenseProv.expenses.isEmpty
                  ? const SkeletonList()
                  : filteredExpenses.isEmpty
                      ? const Center(
                          child: Column(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Icon(Icons.history_toggle_off, size: 60, color: AppTheme.textSecondary),
                              SizedBox(height: 16),
                              Text('No matching expenses found.', style: TextStyle(color: AppTheme.textSecondary, fontSize: 16)),
                            ],
                          ),
                        )
                      : ListView.builder(
                          padding: const EdgeInsets.symmetric(horizontal: 20),
                          itemCount: filteredExpenses.length,
                          itemBuilder: (context, index) {
                            final exp = filteredExpenses[index];
                            final isPayer = exp.paidById == currentUserId;
                            final isReceiver = exp.paidToId == currentUserId;
                            
                            // Determine user confirmation state
                            bool selfConfirmed = isPayer
                                ? exp.settlementConfirmation.paidByConfirmed
                                : exp.settlementConfirmation.paidToConfirmed;
                            bool partnerConfirmed = isPayer
                                ? exp.settlementConfirmation.paidToConfirmed
                                : exp.settlementConfirmation.paidByConfirmed;

                            Color amtColor = AppTheme.textSecondary;
                            if (!exp.status) {
                              amtColor = isPayer ? AppTheme.successColor : AppTheme.dangerColor;
                            }

                            return Card(
                              margin: const EdgeInsets.only(bottom: 16),
                              child: Padding(
                                padding: const EdgeInsets.all(16.0),
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Row(
                                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                      children: [
                                        Expanded(
                                          child: Column(
                                            crossAxisAlignment: CrossAxisAlignment.start,
                                            children: [
                                              Text(
                                                exp.description,
                                                style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: AppTheme.textPrimary),
                                              ),
                                              const SizedBox(height: 4),
                                              Text(
                                                '${exp.date.day}/${exp.date.month}/${exp.date.year}',
                                                style: const TextStyle(color: AppTheme.textSecondary, fontSize: 11),
                                              ),
                                            ],
                                          ),
                                        ),
                                        Text(
                                          '₹${exp.amount.toStringAsFixed(2)}',
                                          style: TextStyle(color: amtColor, fontSize: 18, fontWeight: FontWeight.bold),
                                        ),
                                      ],
                                    ),
                                    const Divider(height: 24, color: AppTheme.borderColor),
                                    Row(
                                      children: [
                                        Icon(
                                          isPayer ? Icons.arrow_outward : Icons.arrow_downward,
                                          size: 14,
                                          color: isPayer ? AppTheme.successColor : AppTheme.dangerColor,
                                        ),
                                        const SizedBox(width: 4),
                                        Expanded(
                                          child: Text(
                                            isPayer
                                                ? 'You lent to ${exp.paidToUsername}'
                                                : 'You borrowed from ${exp.paidByUsername}',
                                            style: const TextStyle(color: AppTheme.textSecondary, fontSize: 13),
                                          ),
                                        ),
                                      ],
                                    ),
                                    if (!exp.status && (isPayer || isReceiver)) ...[
                                      const SizedBox(height: 12),
                                      Row(
                                        mainAxisAlignment: MainAxisAlignment.end,
                                        children: [
                                          // Reminder button
                                          if (isPayer && !partnerConfirmed)
                                            IconButton(
                                              tooltip: 'Send reminder notification',
                                              icon: const Icon(Icons.alarm_on, color: AppTheme.warningColor),
                                              onPressed: () => _sendReminder(exp, currentUserId),
                                            ),
                                          
                                          // Confirm settlement button
                                          ElevatedButton.icon(
                                            onPressed: () => _toggleSettlement(exp, currentUserId),
                                            icon: Icon(
                                              selfConfirmed ? Icons.check_circle : Icons.radio_button_off,
                                              size: 16,
                                              color: Colors.white,
                                            ),
                                            label: Text(
                                              selfConfirmed 
                                                  ? 'Confirmed' 
                                                  : (isPayer ? 'Confirm Paid' : 'Confirm Got It'),
                                              style: const TextStyle(fontSize: 12),
                                            ),
                                            style: ElevatedButton.styleFrom(
                                              backgroundColor: selfConfirmed 
                                                  ? AppTheme.successColor 
                                                  : AppTheme.primaryColor,
                                              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                                              minimumSize: Size.zero,
                                            ),
                                          ),
                                        ],
                                      )
                                    ] else if (exp.status) ...[
                                      const SizedBox(height: 8),
                                      const Row(
                                        mainAxisAlignment: MainAxisAlignment.end,
                                        children: [
                                          Icon(Icons.check_circle, color: AppTheme.successColor, size: 16),
                                          SizedBox(width: 4),
                                          Text('Fully Settled', style: TextStyle(color: AppTheme.successColor, fontSize: 12, fontWeight: FontWeight.bold)),
                                        ],
                                      )
                                    ]
                                  ],
                                ),
                              ),
                            );
                          },
                        ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildFilterChip(String label, String filterValue) {
    bool isSelected = _filter == filterValue;
    return ChoiceChip(
      label: Text(label),
      selected: isSelected,
      selectedColor: AppTheme.primaryColor,
      backgroundColor: AppTheme.surfaceColor,
      side: BorderSide(color: isSelected ? AppTheme.primaryColor : AppTheme.borderColor),
      labelStyle: TextStyle(
        color: isSelected ? Colors.white : AppTheme.textSecondary,
        fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
      ),
      onSelected: (val) {
        if (val) {
          setState(() {
            _filter = filterValue;
          });
        }
      },
    );
  }
}
