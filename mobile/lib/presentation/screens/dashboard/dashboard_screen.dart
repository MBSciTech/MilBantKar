import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:mobile/core/theme/app_theme.dart';
import 'package:mobile/presentation/providers/auth_provider.dart';
import 'package:mobile/presentation/providers/expense_provider.dart';
import 'package:mobile/presentation/providers/alert_provider.dart';
import 'package:mobile/presentation/screens/transactions/add_transaction_screen.dart';
import 'package:mobile/presentation/screens/events/events_screen.dart';
import 'package:mobile/presentation/screens/qr/qr_scanner_screen.dart';
import 'package:mobile/presentation/screens/analytics/visual_analytics_screen.dart';
import 'package:mobile/presentation/widgets/skeleton_loaders.dart';

class DashboardScreen extends StatefulWidget {
  const DashboardScreen({Key? key}) : super(key: key);

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) => _loadData());
  }

  Future<void> _loadData() async {
    final userId = Provider.of<AuthProvider>(context, listen: false).currentUser?.id;
    if (userId != null) {
      Provider.of<ExpenseProvider>(context, listen: false).fetchExpenses();
      Provider.of<AlertProvider>(context, listen: false).fetchAlerts();
    }
  }

  @override
  Widget build(BuildContext context) {
    final auth = Provider.of<AuthProvider>(context);
    final expenseProv = Provider.of<ExpenseProvider>(context);
    final alertProv = Provider.of<AlertProvider>(context);
    
    final currentUser = auth.currentUser;
    final userId = currentUser?.id ?? '';
    final username = currentUser?.username ?? 'User';

    // Calculate balances
    final netBalance = expenseProv.getNetBalanceForUser(userId);
    final owedTo = expenseProv.getOwedToOthers(userId);
    final owedBy = expenseProv.getOwedByOthers(userId);

    return Scaffold(
      body: RefreshIndicator(
        onRefresh: _loadData,
        color: AppTheme.primaryColor,
        child: CustomScrollView(
          slivers: [
            // Top App Bar/Header
            SliverAppBar(
              floating: true,
              expandedHeight: 70,
              flexibleSpace: FlexibleSpaceBar(
                background: Padding(
                  padding: const EdgeInsets.only(left: 20, right: 20, top: 40),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          const Text(
                            'Welcome back,',
                            style: TextStyle(color: AppTheme.textSecondary, fontSize: 13),
                          ),
                          Text(
                            username,
                            style: const TextStyle(
                              color: AppTheme.textPrimary,
                              fontSize: 20,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ],
                      ),
                      CircleAvatar(
                        radius: 20,
                        backgroundColor: AppTheme.primaryLight,
                        child: Text(
                          username.substring(0, 1).toUpperCase(),
                          style: const TextStyle(color: AppTheme.primaryColor, fontWeight: FontWeight.bold),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),

            // Dashboard Content
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.all(20.0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Net Balance Card
                    Container(
                      decoration: BoxDecoration(
                        gradient: AppTheme.primaryGradient,
                        borderRadius: BorderRadius.circular(AppTheme.borderRadius),
                        boxShadow: [
                          BoxShadow(
                            color: AppTheme.primaryColor.withOpacity(0.3),
                            blurRadius: 15,
                            offset: const Offset(0, 8),
                          )
                        ],
                      ),
                      padding: const EdgeInsets.all(24),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text(
                            'TOTAL NET BALANCE',
                            style: TextStyle(
                              color: Colors.white70,
                              fontSize: 12,
                              fontWeight: FontWeight.bold,
                              letterSpacing: 1.2,
                            ),
                          ),
                          const SizedBox(height: 8),
                          Text(
                            '₹${netBalance.toStringAsFixed(2)}',
                            style: const TextStyle(
                              color: Colors.white,
                              fontSize: 32,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                          const SizedBox(height: 20),
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  const Row(
                                    children: [
                                      Icon(Icons.arrow_downward, color: AppTheme.successColor, size: 16),
                                      SizedBox(width: 4),
                                      Text('You are Owed', style: TextStyle(color: Colors.white70, fontSize: 12)),
                                    ],
                                  ),
                                  const SizedBox(height: 4),
                                  Text(
                                    '₹${owedBy.toStringAsFixed(2)}',
                                    style: const TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.bold),
                                  ),
                                ],
                              ),
                              Container(
                                height: 35,
                                width: 1,
                                color: Colors.white24,
                              ),
                              Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  const Row(
                                    children: [
                                      Icon(Icons.arrow_upward, color: AppTheme.dangerColor, size: 16),
                                      SizedBox(width: 4),
                                      Text('You Owe', style: TextStyle(color: Colors.white70, fontSize: 12)),
                                    ],
                                  ),
                                  const SizedBox(height: 4),
                                  Text(
                                    '₹${owedTo.toStringAsFixed(2)}',
                                    style: const TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.bold),
                                  ),
                                ],
                              ),
                            ],
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 28),

                    // Quick Actions
                    const Text(
                      'QUICK ACTIONS',
                      style: TextStyle(
                        color: AppTheme.textSecondary,
                        fontSize: 12,
                        fontWeight: FontWeight.bold,
                        letterSpacing: 1.2,
                      ),
                    ),
                    const SizedBox(height: 12),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        _buildActionButton(
                          context,
                          icon: Icons.add_card,
                          label: 'Add Expense',
                          onTap: () => Navigator.push(
                            context,
                            MaterialPageRoute(builder: (context) => const AddTransactionScreen()),
                          ).then((_) => _loadData()),
                        ),
                        _buildActionButton(
                          context,
                          icon: Icons.qr_code_scanner,
                          label: 'Scan QR',
                          onTap: () => Navigator.push(
                            context,
                            MaterialPageRoute(builder: (context) => const QRScannerScreen()),
                          ).then((_) => _loadData()),
                        ),
                        _buildActionButton(
                          context,
                          icon: Icons.pie_chart_outline,
                          label: 'Analytics',
                          onTap: () => Navigator.push(
                            context,
                            MaterialPageRoute(builder: (context) => const VisualAnalyticsScreen()),
                          ),
                        ),
                        _buildActionButton(
                          context,
                          icon: Icons.group_add_outlined,
                          label: 'New Event',
                          onTap: () {
                            // Focus tab 1 (Events) or navigate
                            // Let's redirect to events screen
                            Navigator.push(
                              context,
                              MaterialPageRoute(builder: (context) => const EventsScreen()),
                            ).then((_) => _loadData());
                          },
                        ),
                      ],
                    ),
                    const SizedBox(height: 32),

                    // Reminders & Active Polls
                    const Text(
                      'ALERTS & POLLS INBOX',
                      style: TextStyle(
                        color: AppTheme.textSecondary,
                        fontSize: 12,
                        fontWeight: FontWeight.bold,
                        letterSpacing: 1.2,
                      ),
                    ),
                    const SizedBox(height: 12),
                    alertProv.isLoading && alertProv.alerts.isEmpty
                        ? const SkeletonList(itemCount: 2)
                        : alertProv.alerts.isEmpty
                            ? Container(
                                width: double.infinity,
                                padding: const EdgeInsets.all(24),
                                decoration: BoxDecoration(
                                  color: AppTheme.surfaceColor,
                                  borderRadius: BorderRadius.circular(16),
                                  border: Border.all(color: AppTheme.borderColor),
                                ),
                                child: const Column(
                                  children: [
                                    Icon(Icons.notifications_none, size: 40, color: AppTheme.textMuted),
                                    SizedBox(height: 8),
                                    Text('No active notifications or polls.', style: TextStyle(color: AppTheme.textSecondary)),
                                  ],
                                ),
                              )
                            : ListView.builder(
                                shrinkWrap: true,
                                physics: const NeverScrollableScrollPhysics(),
                                itemCount: alertProv.alerts.length,
                                itemBuilder: (context, index) {
                                  final alert = alertProv.alerts[index];
                                  return _buildAlertCard(context, alert, userId);
                                },
                              ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildActionButton(BuildContext context, {required IconData icon, required String label, required VoidCallback onTap}) {
    return GestureDetector(
      onTap: onTap,
      child: Column(
        children: [
          Container(
            height: 56,
            width: 56,
            decoration: BoxDecoration(
              color: AppTheme.surfaceColor,
              borderRadius: BorderRadius.circular(14),
              border: Border.all(color: AppTheme.borderColor),
              boxShadow: AppTheme.cardShadow,
            ),
            child: Icon(icon, color: AppTheme.primaryColor, size: 26),
          ),
          const SizedBox(height: 8),
          Text(
            label,
            style: const TextStyle(color: AppTheme.textPrimary, fontSize: 11, fontWeight: FontWeight.w500),
          ),
        ],
      ),
    );
  }

  Widget _buildAlertCard(BuildContext context, alert, String currentUserId) {
    final alertProv = Provider.of<AlertProvider>(context, listen: false);

    bool isPoll = alert.type == 'poll';
    Color alertColor = AppTheme.primaryColor;
    if (alert.type == 'warning') alertColor = AppTheme.dangerColor;
    if (alert.type == 'success') alertColor = AppTheme.successColor;

    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      child: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Icon(
                  isPoll ? Icons.poll : Icons.notifications,
                  color: alertColor,
                  size: 20,
                ),
                const SizedBox(width: 8),
                Text(
                  isPoll ? 'Group Vote / Poll' : 'Alert / Reminder',
                  style: TextStyle(
                    color: alertColor,
                    fontSize: 12,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const Spacer(),
                Text(
                  'by ${alert.senderUsername}',
                  style: const TextStyle(color: AppTheme.textSecondary, fontSize: 11),
                ),
              ],
            ),
            const SizedBox(height: 8),
            Text(
              alert.message,
              style: const TextStyle(color: AppTheme.textPrimary, fontSize: 14, fontWeight: FontWeight.w500),
            ),
            if (isPoll && alert.pollOptions.isNotEmpty) ...[
              const SizedBox(height: 16),
              ...List.generate(alert.pollOptions.length, (optIdx) {
                final option = alert.pollOptions[optIdx];
                final bool hasVoted = option.votesUserIds.contains(currentUserId);
                final totalVotes = alert.pollOptions.fold(0, (sum, opt) => sum + opt.votesUserIds.length);
                final percentage = totalVotes > 0 ? (option.votesUserIds.length / totalVotes) * 100 : 0.0;

                return GestureDetector(
                  onTap: () {
                    alertProv.castVote(alert.id, currentUserId, optIdx);
                  },
                  child: Container(
                    margin: const EdgeInsets.only(bottom: 8),
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                    decoration: BoxDecoration(
                      color: hasVoted 
                          ? AppTheme.primaryLight
                          : AppTheme.backgroundColor,
                      borderRadius: BorderRadius.circular(10),
                      border: Border.all(
                        color: hasVoted ? AppTheme.primaryColor : AppTheme.borderColor,
                        width: 1,
                      ),
                    ),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(
                          option.option,
                          style: TextStyle(
                            color: hasVoted ? AppTheme.primaryColor : AppTheme.textPrimary,
                            fontWeight: hasVoted ? FontWeight.bold : FontWeight.normal,
                          ),
                        ),
                        Text(
                          '${option.votesUserIds.length} votes (${percentage.toStringAsFixed(0)}%)',
                          style: TextStyle(
                            color: hasVoted ? AppTheme.primaryColor : AppTheme.textSecondary,
                            fontSize: 12,
                          ),
                        ),
                      ],
                    ),
                  ),
                );
              }),
            ],
            if (!isPoll && !alert.seen) ...[
              const SizedBox(height: 12),
              Align(
                alignment: Alignment.centerRight,
                child: TextButton(
                  onPressed: () {
                    alertProv.markAsSeen(alert.id);
                  },
                  child: const Text('Mark as Read', style: TextStyle(color: AppTheme.primaryColor)),
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }
}
