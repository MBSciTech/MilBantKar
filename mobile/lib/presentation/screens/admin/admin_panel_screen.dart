import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:mobile/core/theme/app_theme.dart';
import 'package:mobile/presentation/providers/admin_provider.dart';

class AdminPanelScreen extends StatefulWidget {
  const AdminPanelScreen({Key? key}) : super(key: key);

  @override
  State<AdminPanelScreen> createState() => _AdminPanelScreenState();
}

class _AdminPanelScreenState extends State<AdminPanelScreen> with SingleTickerProviderStateMixin {
  late TabController _tabController;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 3, vsync: this);
    WidgetsBinding.instance.addPostFrameCallback((_) => _loadAdminData());
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  void _loadAdminData() {
    final adminProv = Provider.of<AdminProvider>(context, listen: false);
    adminProv.fetchAllUsers();
    adminProv.fetchAdminEvents();
    adminProv.fetchAdminExpenses();
    adminProv.fetchDeletedExpenses();
    adminProv.fetchAdminPolls();
  }

  void _showCreatePollDialog() {
    final qController = TextEditingController();
    final opt1Controller = TextEditingController();
    final opt2Controller = TextEditingController();
    final opt3Controller = TextEditingController();
    final formKey = GlobalKey<FormState>();

    showDialog(
      context: context,
      builder: (ctx) {
        return AlertDialog(
          title: const Text('Create System Poll'),
          content: SingleChildScrollView(
            child: Form(
              key: formKey,
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  TextFormField(
                    controller: qController,
                    decoration: const InputDecoration(labelText: 'Question / Topic'),
                    validator: (val) => val == null || val.trim().isEmpty ? 'Question required' : null,
                  ),
                  const SizedBox(height: 16),
                  TextFormField(
                    controller: opt1Controller,
                    decoration: const InputDecoration(labelText: 'Option 1'),
                    validator: (val) => val == null || val.trim().isEmpty ? 'Required' : null,
                  ),
                  const SizedBox(height: 12),
                  TextFormField(
                    controller: opt2Controller,
                    decoration: const InputDecoration(labelText: 'Option 2'),
                    validator: (val) => val == null || val.trim().isEmpty ? 'Required' : null,
                  ),
                  const SizedBox(height: 12),
                  TextFormField(
                    controller: opt3Controller,
                    decoration: const InputDecoration(labelText: 'Option 3 (Optional)'),
                  ),
                ],
              ),
            ),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(ctx),
              child: const Text('Cancel', style: TextStyle(color: AppTheme.textSecondary)),
            ),
            ElevatedButton(
              onPressed: () async {
                if (!formKey.currentState!.validate()) return;
                
                final opts = [opt1Controller.text.trim(), opt2Controller.text.trim()];
                if (opt3Controller.text.trim().isNotEmpty) {
                  opts.add(opt3Controller.text.trim());
                }

                final adminProv = Provider.of<AdminProvider>(context, listen: false);
                final success = await adminProv.adminCreatePoll(
                  qController.text.trim(),
                  opts,
                );

                if (success && mounted) {
                  Navigator.pop(ctx);
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(content: Text('Poll published successfully!'), backgroundColor: AppTheme.successColor),
                  );
                }
              },
              child: const Text('Publish'),
            ),
          ],
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    final adminProv = Provider.of<AdminProvider>(context);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Admin Dashboard'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: _loadAdminData,
          )
        ],
        bottom: TabBar(
          controller: _tabController,
          indicatorColor: AppTheme.primaryColor,
          tabs: const [
            Tab(text: 'Analytics'),
            Tab(text: 'Events'),
            Tab(text: 'Recycle Bin'),
          ],
        ),
      ),
      body: adminProv.isLoading
          ? const Center(child: CircularProgressIndicator(color: AppTheme.primaryColor))
          : TabBarView(
              controller: _tabController,
              children: [
                _buildAnalyticsTab(adminProv),
                _buildEventsTab(adminProv),
                _buildRecycleBinTab(adminProv),
              ],
            ),
    );
  }

  Widget _buildAnalyticsTab(AdminProvider adminProv) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Stat Cards Grid
          Row(
            children: [
              Expanded(
                child: _buildStatCard('Active Users', adminProv.usersList.length.toString(), Icons.people, AppTheme.infoColor),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: _buildStatCard('Total Events', adminProv.adminEvents.length.toString(), Icons.group_work, AppTheme.primaryColor),
              ),
            ],
          ),
          const SizedBox(height: 16),
          Row(
            children: [
              Expanded(
                child: _buildStatCard('Expenses Log', adminProv.adminExpenses.length.toString(), Icons.receipt, AppTheme.successColor),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: _buildStatCard('Active Polls', adminProv.adminPolls.length.toString(), Icons.poll, AppTheme.warningColor),
              ),
            ],
          ),
          const SizedBox(height: 28),

          // Poll Creator Section
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text(
                'LIVE SYSTEM POLLS',
                style: TextStyle(color: AppTheme.textSecondary, fontSize: 12, fontWeight: FontWeight.bold, letterSpacing: 1.2),
              ),
              ElevatedButton.icon(
                onPressed: _showCreatePollDialog,
                icon: const Icon(Icons.add, size: 16),
                label: const Text('New Poll', style: TextStyle(fontSize: 12)),
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppTheme.primaryColor,
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                  minimumSize: Size.zero,
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          adminProv.adminPolls.isEmpty
              ? const Card(
                  child: Padding(
                    padding: EdgeInsets.all(24.0),
                    child: Center(child: Text('No system polls currently running.', style: TextStyle(color: AppTheme.textSecondary))),
                  ),
                )
              : ListView.builder(
                  shrinkWrap: true,
                  physics: const NeverScrollableScrollPhysics(),
                  itemCount: adminProv.adminPolls.length,
                  itemBuilder: (context, index) {
                    final poll = adminProv.adminPolls[index];
                    return Card(
                      margin: const EdgeInsets.only(bottom: 12),
                      child: Padding(
                        padding: const EdgeInsets.all(16.0),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(poll.message, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
                            const SizedBox(height: 12),
                            ...poll.pollOptions.map((opt) {
                              return Padding(
                                padding: const EdgeInsets.symmetric(vertical: 4.0),
                                child: Text('• ${opt.option} (${opt.votesUserIds.length} votes)', style: const TextStyle(color: AppTheme.textSecondary, fontSize: 12)),
                              );
                            }).toList()
                          ],
                        ),
                      ),
                    );
                  },
                ),
        ],
      ),
    );
  }

  Widget _buildStatCard(String title, String value, IconData icon, Color color) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Icon(icon, color: color, size: 28),
            const SizedBox(height: 12),
            Text(value, style: const TextStyle(fontSize: 24, fontWeight: FontWeight.bold, color: AppTheme.textPrimary)),
            const SizedBox(height: 4),
            Text(title, style: const TextStyle(color: AppTheme.textSecondary, fontSize: 12)),
          ],
        ),
      ),
    );
  }

  Widget _buildEventsTab(AdminProvider adminProv) {
    if (adminProv.adminEvents.isEmpty) {
      return const Center(child: Text('No events found in system.', style: TextStyle(color: AppTheme.textSecondary)));
    }

    return ListView.builder(
      padding: const EdgeInsets.all(20),
      itemCount: adminProv.adminEvents.length,
      itemBuilder: (context, index) {
        final ev = adminProv.adminEvents[index];
        return Card(
          margin: const EdgeInsets.only(bottom: 12),
          child: ListTile(
            title: Text(ev.name, style: const TextStyle(fontWeight: FontWeight.bold)),
            subtitle: Text('Code: ${ev.code} | Participants: ${ev.participants.length}\nCreated by Admin/User ID: ${ev.createdById}'),
            trailing: IconButton(
              icon: const Icon(Icons.delete, color: AppTheme.dangerColor),
              onPressed: () async {
                final success = await adminProv.adminDeleteEvent(ev.id);
                if (success && mounted) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(content: Text('Event deleted successfully!'), backgroundColor: AppTheme.successColor),
                  );
                }
              },
            ),
          ),
        );
      },
    );
  }

  Widget _buildRecycleBinTab(AdminProvider adminProv) {
    if (adminProv.deletedExpenses.isEmpty) {
      return const Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.delete_outline, size: 60, color: AppTheme.textSecondary),
            SizedBox(height: 12),
            Text('Recycle Bin is empty.', style: TextStyle(color: AppTheme.textSecondary)),
          ],
        ),
      );
    }

    return ListView.builder(
      padding: const EdgeInsets.all(20),
      itemCount: adminProv.deletedExpenses.length,
      itemBuilder: (context, index) {
        final exp = adminProv.deletedExpenses[index];
        return Card(
          margin: const EdgeInsets.only(bottom: 12),
          child: Padding(
            padding: const EdgeInsets.all(16.0),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(exp.description, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15)),
                    Text('₹${exp.amount.toStringAsFixed(2)}', style: const TextStyle(color: AppTheme.dangerColor, fontWeight: FontWeight.bold)),
                  ],
                ),
                const SizedBox(height: 6),
                Text('Payer ID: ${exp.paidById} → Debtor ID: ${exp.paidToId}', style: const TextStyle(color: AppTheme.textSecondary, fontSize: 11)),
                const Divider(height: 20, color: AppTheme.borderColor),
                Row(
                  mainAxisAlignment: MainAxisAlignment.end,
                  children: [
                    TextButton.icon(
                      onPressed: () async {
                        final success = await adminProv.adminRestoreExpense(exp.id);
                        if (success && mounted) {
                          ScaffoldMessenger.of(context).showSnackBar(
                            const SnackBar(content: Text('Expense restored successfully!'), backgroundColor: AppTheme.successColor),
                          );
                        }
                      },
                      icon: const Icon(Icons.restore, size: 16),
                      label: const Text('Restore', style: TextStyle(fontSize: 12)),
                      style: TextButton.styleFrom(foregroundColor: AppTheme.successColor),
                    ),
                    const SizedBox(width: 8),
                    TextButton.icon(
                      onPressed: () async {
                        final success = await adminProv.adminPermanentDeleteExpense(exp.id);
                        if (success && mounted) {
                          ScaffoldMessenger.of(context).showSnackBar(
                            const SnackBar(content: Text('Expense permanently deleted!'), backgroundColor: AppTheme.successColor),
                          );
                        }
                      },
                      icon: const Icon(Icons.delete_forever, size: 16),
                      label: const Text('Delete Forever', style: TextStyle(fontSize: 12)),
                      style: TextButton.styleFrom(foregroundColor: AppTheme.dangerColor),
                    ),
                  ],
                ),
              ],
            ),
          ),
        );
      },
    );
  }
}
