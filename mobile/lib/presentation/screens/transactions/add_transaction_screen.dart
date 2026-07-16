import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:mobile/core/theme/app_theme.dart';
import 'package:mobile/core/network/api_client.dart';
import 'package:mobile/presentation/providers/auth_provider.dart';
import 'package:mobile/presentation/providers/expense_provider.dart';
import 'package:mobile/presentation/providers/event_provider.dart';

class AddTransactionScreen extends StatefulWidget {
  final String? eventId;
  const AddTransactionScreen({Key? key, this.eventId}) : super(key: key);

  @override
  State<AddTransactionScreen> createState() => _AddTransactionScreenState();
}

class _AddTransactionScreenState extends State<AddTransactionScreen> {
  final _formKey = GlobalKey<FormState>();
  final _amountController = TextEditingController();
  final _descController = TextEditingController();
  DateTime _selectedDate = DateTime.now();

  String? _paidByUserId;
  String? _paidToUserId;
  String? _selectedEventId;

  List<dynamic> _users = [];
  bool _loadingDependencies = false;

  // Quick amount chips – mirroring the web app
  final List<int> _quickAmounts = [5, 10, 20, 25, 50, 100];

  @override
  void initState() {
    super.initState();
    _selectedEventId = widget.eventId;
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final currentUserId =
          Provider.of<AuthProvider>(context, listen: false).currentUser?.id;
      _paidByUserId = currentUserId;
      _loadDependencies();
    });
  }

  @override
  void dispose() {
    _amountController.dispose();
    _descController.dispose();
    super.dispose();
  }

  Future<void> _loadDependencies() async {
    setState(() => _loadingDependencies = true);
    try {
      final client = ApiClient();
      final usersResponse = await client.get('/api/users');
      final List<dynamic> usersData = jsonDecode(usersResponse.body);

      final currentUserId =
          Provider.of<AuthProvider>(context, listen: false).currentUser?.id;
      if (currentUserId != null) {
        await Provider.of<EventProvider>(context, listen: false)
            .fetchUserEvents(currentUserId);
      }

      setState(() {
        _users = usersData;
        _loadingDependencies = false;
      });
    } catch (e) {
      print('Error loading transaction dependencies: $e');
      setState(() => _loadingDependencies = false);
    }
  }

  void _presentDatePicker() {
    showDatePicker(
      context: context,
      initialDate: _selectedDate,
      firstDate: DateTime(2020),
      lastDate: DateTime.now(),
      builder: (context, child) => Theme(
        data: Theme.of(context).copyWith(
          colorScheme: const ColorScheme.light(
            primary: AppTheme.primaryColor,
            onPrimary: Colors.white,
            surface: Colors.white,
            onSurface: AppTheme.textPrimary,
          ),
        ),
        child: child!,
      ),
    ).then((pickedDate) {
      if (pickedDate == null) return;
      setState(() => _selectedDate = pickedDate);
    });
  }

  void _submitForm() async {
    if (!_formKey.currentState!.validate()) return;
    if (_paidByUserId == null || _paidToUserId == null) {
      _showSnack('Please select both payer and receiver', isError: true);
      return;
    }
    if (_paidByUserId == _paidToUserId) {
      _showSnack('Payer and Receiver cannot be the same user', isError: true);
      return;
    }

    final double amount = double.tryParse(_amountController.text) ?? 0.0;
    if (amount <= 0.0) {
      _showSnack('Amount must be positive', isError: true);
      return;
    }

    final expenseProv = Provider.of<ExpenseProvider>(context, listen: false);
    final success = await expenseProv.addExpense(
      paidBy: _paidByUserId!,
      paidTo: _paidToUserId!,
      amount: amount,
      description: _descController.text.trim(),
      date: _selectedDate,
      eventId: _selectedEventId,
    );

    if (success && mounted) {
      _showSnack('Expense added successfully!', isError: false);
      Navigator.pop(context);
    } else if (mounted) {
      _showSnack(expenseProv.error ?? 'Failed to add expense', isError: true);
    }
  }

  void _showSnack(String msg, {required bool isError}) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(msg),
        backgroundColor: isError ? AppTheme.dangerColor : AppTheme.successColor,
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final eventProv = Provider.of<EventProvider>(context);
    final expenseProv = Provider.of<ExpenseProvider>(context);
    final activeEvents = eventProv.events.where((e) => !e.isClosed).toList();

    return Scaffold(
      backgroundColor: AppTheme.backgroundColor,
      appBar: AppBar(
        title: const Text('⚡ Quick Transaction'),
        backgroundColor: AppTheme.surfaceColor,
        elevation: 1,
      ),
      body: _loadingDependencies
          ? const Center(
              child: CircularProgressIndicator(color: AppTheme.primaryColor))
          : SingleChildScrollView(
              padding: const EdgeInsets.all(16),
              child: Form(
                key: _formKey,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    // ── Header card ───────────────────────────────────
                    Container(
                      padding: const EdgeInsets.all(20),
                      decoration: BoxDecoration(
                        color: AppTheme.surfaceColor,
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: AppTheme.borderColor),
                        boxShadow: AppTheme.cardShadow,
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          // Title
                          Row(
                            children: [
                              Container(
                                padding: const EdgeInsets.all(8),
                                decoration: BoxDecoration(
                                  color: AppTheme.primaryLight,
                                  borderRadius: BorderRadius.circular(8),
                                ),
                                child: const Icon(Icons.bolt,
                                    color: AppTheme.primaryColor, size: 20),
                              ),
                              const SizedBox(width: 12),
                              const Text(
                                'Add Expense Transaction',
                                style: TextStyle(
                                  fontSize: 17,
                                  fontWeight: FontWeight.bold,
                                  color: AppTheme.textPrimary,
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 4),
                          const Padding(
                            padding: EdgeInsets.only(left: 44),
                            child: Text(
                              'Add expense transactions fast and easy',
                              style: TextStyle(
                                  fontSize: 12, color: AppTheme.textSecondary),
                            ),
                          ),
                          const SizedBox(height: 20),
                          const Divider(color: AppTheme.borderColor),
                          const SizedBox(height: 16),

                          // ── Amount ────────────────────────────────
                          Text(
                            '💰 Amount *',
                            style: TextStyle(
                              fontWeight: FontWeight.w600,
                              color: AppTheme.primaryColor,
                              fontSize: 15,
                            ),
                          ),
                          const SizedBox(height: 8),
                          TextFormField(
                            controller: _amountController,
                            keyboardType: const TextInputType.numberWithOptions(
                                decimal: true),
                            style: const TextStyle(
                              fontSize: 28,
                              fontWeight: FontWeight.bold,
                              color: AppTheme.textPrimary,
                            ),
                            decoration: const InputDecoration(
                              prefixIcon: Icon(Icons.currency_rupee,
                                  color: AppTheme.primaryColor, size: 22),
                              hintText: 'Enter amount',
                              hintStyle: TextStyle(
                                  color: AppTheme.textMuted, fontSize: 20),
                            ),
                            validator: (val) => (val == null || val.trim().isEmpty)
                                ? 'Enter amount'
                                : null,
                          ),
                          const SizedBox(height: 10),

                          // Quick amount chips
                          Text(
                            'Quick amounts:',
                            style: const TextStyle(
                                fontSize: 12, color: AppTheme.textSecondary),
                          ),
                          const SizedBox(height: 6),
                          Wrap(
                            spacing: 8,
                            children: _quickAmounts
                                .map((amt) => ActionChip(
                                      label: Text('₹$amt'),
                                      backgroundColor: AppTheme.primaryLight,
                                      side: const BorderSide(
                                          color: AppTheme.primaryColor),
                                      labelStyle: const TextStyle(
                                          color: AppTheme.primaryColor,
                                          fontWeight: FontWeight.w600),
                                      onPressed: () {
                                        _amountController.text =
                                            amt.toString();
                                      },
                                    ))
                                .toList(),
                          ),
                          const SizedBox(height: 20),

                          // ── Paid By ───────────────────────────────
                          Text(
                            '👤 Paid By *',
                            style: const TextStyle(
                                fontWeight: FontWeight.w600,
                                color: AppTheme.textPrimary,
                                fontSize: 14),
                          ),
                          const SizedBox(height: 6),
                          DropdownButtonFormField<String>(
                            value: _paidByUserId,
                            isExpanded: true,
                            decoration: const InputDecoration(
                              prefixIcon: Icon(Icons.arrow_outward,
                                  color: AppTheme.textSecondary),
                              hintText: 'Select who paid',
                            ),
                            items: _users
                                .map((user) => DropdownMenuItem<String>(
                                      value: user['_id'],
                                      child: Text(user['username'],
                                          overflow: TextOverflow.ellipsis),
                                    ))
                                .toList(),
                            onChanged: (val) =>
                                setState(() => _paidByUserId = val),
                          ),
                          const SizedBox(height: 16),

                          // ── Paid To ───────────────────────────────
                          const Text(
                            '🎯 Paid To *',
                            style: TextStyle(
                                fontWeight: FontWeight.w600,
                                color: AppTheme.textPrimary,
                                fontSize: 14),
                          ),
                          const SizedBox(height: 6),
                          DropdownButtonFormField<String>(
                            value: _paidToUserId,
                            isExpanded: true,
                            decoration: const InputDecoration(
                              prefixIcon: Icon(Icons.arrow_downward,
                                  color: AppTheme.textSecondary),
                              hintText: 'Select who received',
                            ),
                            items: _users
                                .where((u) => u['_id'] != _paidByUserId)
                                .map((user) => DropdownMenuItem<String>(
                                      value: user['_id'],
                                      child: Text(user['username'],
                                          overflow: TextOverflow.ellipsis),
                                    ))
                                .toList(),
                            onChanged: (val) =>
                                setState(() => _paidToUserId = val),
                          ),
                          const SizedBox(height: 16),

                          // ── Description ───────────────────────────
                          const Text(
                            '📝 Description',
                            style: TextStyle(
                                fontWeight: FontWeight.w600,
                                color: AppTheme.textPrimary,
                                fontSize: 14),
                          ),
                          const SizedBox(height: 6),
                          TextFormField(
                            controller: _descController,
                            decoration: const InputDecoration(
                              prefixIcon: Icon(Icons.description_outlined,
                                  color: AppTheme.textSecondary),
                              hintText: 'What was this for? (optional)',
                            ),
                          ),
                          const SizedBox(height: 16),

                          // ── Event link ────────────────────────────
                          const Text(
                            '🎪 Link to Event',
                            style: TextStyle(
                                fontWeight: FontWeight.w600,
                                color: AppTheme.textPrimary,
                                fontSize: 14),
                          ),
                          const SizedBox(height: 6),
                          DropdownButtonFormField<String>(
                            value: _selectedEventId,
                            isExpanded: true,
                            decoration: const InputDecoration(
                              prefixIcon: Icon(Icons.group_work_outlined,
                                  color: AppTheme.textSecondary),
                              hintText: 'Personal / No Event',
                            ),
                            items: [
                              const DropdownMenuItem<String>(
                                value: null,
                                child: Text('Personal / No Event'),
                              ),
                              ...activeEvents.map((e) => DropdownMenuItem<String>(
                                    value: e.id,
                                    child: Text(e.name,
                                        overflow: TextOverflow.ellipsis),
                                  )),
                            ],
                            onChanged: (val) =>
                                setState(() => _selectedEventId = val),
                          ),
                          const SizedBox(height: 20),

                          // ── Date picker ───────────────────────────
                          Row(
                            children: [
                              const Icon(Icons.calendar_today_outlined,
                                  color: AppTheme.textSecondary, size: 20),
                              const SizedBox(width: 10),
                              Expanded(
                                child: Text(
                                  '📅  ${_selectedDate.day}/${_selectedDate.month}/${_selectedDate.year}',
                                  style: const TextStyle(
                                    color: AppTheme.textPrimary,
                                    fontSize: 15,
                                    fontWeight: FontWeight.w500,
                                  ),
                                ),
                              ),
                              TextButton(
                                onPressed: _presentDatePicker,
                                child: const Text('Change Date',
                                    style: TextStyle(
                                        color: AppTheme.primaryColor,
                                        fontWeight: FontWeight.bold)),
                              ),
                            ],
                          ),
                          const SizedBox(height: 20),

                          // ── Submit button ─────────────────────────
                          expenseProv.isLoading
                              ? const Center(
                                  child: CircularProgressIndicator(
                                      color: AppTheme.primaryColor))
                              : SizedBox(
                                  width: double.infinity,
                                  height: 50,
                                  child: ElevatedButton.icon(
                                    onPressed: _submitForm,
                                    icon: const Icon(Icons.check_circle_outline,
                                        size: 20),
                                    label: const Text('Add Transaction',
                                        style: TextStyle(fontSize: 16)),
                                    style: ElevatedButton.styleFrom(
                                      backgroundColor: AppTheme.successColor,
                                      foregroundColor: Colors.white,
                                      shape: RoundedRectangleBorder(
                                          borderRadius:
                                              BorderRadius.circular(8)),
                                    ),
                                  ),
                                ),
                        ],
                      ),
                    ),

                    // ── Quick Tips ────────────────────────────────────────
                    const SizedBox(height: 16),
                    Container(
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: const Color(0xFFF0F4FF),
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: AppTheme.primaryLight),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: const [
                          Text('💡 Quick Tips',
                              style: TextStyle(
                                  fontWeight: FontWeight.bold,
                                  color: AppTheme.primaryColor)),
                          SizedBox(height: 8),
                          Text(
                            '• Use quick amount buttons for common expenses\n'
                            '• The form filters out the payer from receiver list\n'
                            '• Description is optional but helpful for tracking\n'
                            '• Link to an event to track group expenses separately',
                            style: TextStyle(
                                fontSize: 12, color: AppTheme.textSecondary),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 24),
                  ],
                ),
              ),
            ),
    );
  }
}
