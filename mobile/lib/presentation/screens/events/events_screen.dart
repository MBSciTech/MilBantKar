import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:mobile/core/theme/app_theme.dart';
import 'package:mobile/presentation/providers/auth_provider.dart';
import 'package:mobile/presentation/providers/event_provider.dart';
import 'package:mobile/presentation/screens/events/event_details_screen.dart';
import 'package:mobile/presentation/screens/qr/qr_scanner_screen.dart';
import 'package:mobile/presentation/widgets/skeleton_loaders.dart';

class EventsScreen extends StatefulWidget {
  const EventsScreen({Key? key}) : super(key: key);

  @override
  State<EventsScreen> createState() => _EventsScreenState();
}

class _EventsScreenState extends State<EventsScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) => _loadEvents());
  }

  Future<void> _loadEvents() async {
    final userId = Provider.of<AuthProvider>(context, listen: false).currentUser?.id;
    if (userId != null) {
      Provider.of<EventProvider>(context, listen: false).fetchUserEvents(userId);
    }
  }

  void _showCreateEventDialog() {
    final nameController = TextEditingController();
    final descController = TextEditingController();
    final formKey = GlobalKey<FormState>();

    showDialog(
      context: context,
      builder: (ctx) {
        return AlertDialog(
          title: const Text('Create New Event'),
          content: Form(
            key: formKey,
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                TextFormField(
                  controller: nameController,
                  decoration: const InputDecoration(labelText: 'Event Name'),
                  validator: (val) => val == null || val.trim().isEmpty ? 'Name is required' : null,
                ),
                const SizedBox(height: 16),
                TextFormField(
                  controller: descController,
                  decoration: const InputDecoration(labelText: 'Description (Optional)'),
                  maxLines: 2,
                ),
              ],
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
                final userId = Provider.of<AuthProvider>(context, listen: false).currentUser?.id;
                if (userId != null) {
                  final success = await Provider.of<EventProvider>(context, listen: false).createEvent(
                    nameController.text.trim(),
                    descController.text.trim(),
                    userId,
                  );
                  if (success && mounted) {
                    Navigator.pop(ctx);
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(content: Text('Event created successfully!'), backgroundColor: AppTheme.successColor),
                    );
                  }
                }
              },
              child: const Text('Create'),
            ),
          ],
        );
      },
    );
  }

  void _showJoinEventDialog() {
    final codeController = TextEditingController();
    final formKey = GlobalKey<FormState>();

    showDialog(
      context: context,
      builder: (ctx) {
        return AlertDialog(
          title: const Text('Join Event'),
          content: Form(
            key: formKey,
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                TextFormField(
                  controller: codeController,
                  decoration: const InputDecoration(labelText: '8-Digit Event Code', hintText: 'e.g., ABCD1234'),
                  textCapitalization: TextCapitalization.characters,
                  validator: (val) => val == null || val.trim().isEmpty ? 'Enter valid code' : null,
                ),
                const SizedBox(height: 16),
                const Text('OR', style: TextStyle(color: AppTheme.textSecondary, fontWeight: FontWeight.bold, fontSize: 11)),
                const SizedBox(height: 12),
                OutlinedButton.icon(
                  onPressed: () {
                    Navigator.pop(ctx);
                    Navigator.push(
                      context,
                      MaterialPageRoute(
                        builder: (_) => const QRScannerScreen(isJoinEventScanner: true),
                      ),
                    ).then((_) => _loadEvents());
                  },
                  icon: const Icon(Icons.qr_code_scanner),
                  label: const Text('Scan QR Code'),
                ),
              ],
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
                final userId = Provider.of<AuthProvider>(context, listen: false).currentUser?.id;
                if (userId != null) {
                  final success = await Provider.of<EventProvider>(context, listen: false).joinEvent(
                    codeController.text.trim(),
                    userId,
                  );
                  if (success && mounted) {
                    Navigator.pop(ctx);
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(content: Text('Joined event successfully!'), backgroundColor: AppTheme.successColor),
                    );
                  } else if (mounted) {
                    final err = Provider.of<EventProvider>(context, listen: false).error;
                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(content: Text(err ?? 'Event not found'), backgroundColor: AppTheme.dangerColor),
                    );
                  }
                }
              },
              child: const Text('Join'),
            ),
          ],
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    final eventProv = Provider.of<EventProvider>(context);

    return Scaffold(
      appBar: AppBar(
        title: const Text('My Groups & Events'),
      ),
      body: RefreshIndicator(
        onRefresh: _loadEvents,
        color: AppTheme.primaryColor,
        child: eventProv.isLoading && eventProv.events.isEmpty
            ? const SkeletonList()
            : eventProv.events.isEmpty
                ? const Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(Icons.group_work_outlined, size: 60, color: AppTheme.textSecondary),
                        SizedBox(height: 16),
                        Text('You have no active events.', style: TextStyle(color: AppTheme.textSecondary, fontSize: 16)),
                      ],
                    ),
                  )
                : ListView.builder(
                    padding: const EdgeInsets.all(20),
                    itemCount: eventProv.events.length,
                    itemBuilder: (context, index) {
                      final event = eventProv.events[index];
                      return Card(
                        margin: const EdgeInsets.only(bottom: 16),
                        child: InkWell(
                          onTap: () {
                            Navigator.push(
                              context,
                              MaterialPageRoute(
                                builder: (context) => EventDetailsScreen(eventId: event.id),
                              ),
                            ).then((_) => _loadEvents());
                          },
                          borderRadius: BorderRadius.circular(AppTheme.borderRadius),
                          child: Padding(
                            padding: const EdgeInsets.all(20.0),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Row(
                                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                  children: [
                                    Expanded(
                                      child: Text(
                                        event.name,
                                        style: const TextStyle(
                                          color: AppTheme.textPrimary,
                                          fontSize: 18,
                                          fontWeight: FontWeight.bold,
                                        ),
                                      ),
                                    ),
                                    Container(
                                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                                      decoration: BoxDecoration(
                                        color: event.isClosed
                                            ? AppTheme.backgroundColor
                                            : AppTheme.successLight,
                                        borderRadius: BorderRadius.circular(12),
                                        border: Border.all(
                                          color: event.isClosed
                                              ? AppTheme.borderColor
                                              : AppTheme.successColor,
                                        ),
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
                                if (event.description.isNotEmpty) ...[
                                  const SizedBox(height: 8),
                                  Text(
                                    event.description,
                                    maxLines: 2,
                                    overflow: TextOverflow.ellipsis,
                                    style: const TextStyle(color: AppTheme.textSecondary, fontSize: 13),
                                  ),
                                ],
                                const SizedBox(height: 16),
                                Row(
                                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                  children: [
                                    Row(
                                      children: [
                                        const Icon(Icons.qr_code, size: 16, color: AppTheme.primaryColor),
                                        const SizedBox(width: 4),
                                        Text(
                                          event.code,
                                          style: const TextStyle(
                                            color: AppTheme.primaryColor,
                                            fontSize: 13,
                                            fontWeight: FontWeight.bold,
                                            fontFamily: 'Courier New',
                                          ),
                                        ),
                                      ],
                                    ),
                                    Text(
                                      '${event.participants.length} Participant${event.participants.length == 1 ? '' : 's'}',
                                      style: const TextStyle(color: AppTheme.textSecondary, fontSize: 12),
                                    ),
                                  ],
                                ),
                              ],
                            ),
                          ),
                        ),
                      );
                    },
                  ),
      ),
      floatingActionButton: Column(
        mainAxisAlignment: MainAxisAlignment.end,
        children: [
          FloatingActionButton.small(
            heroTag: 'joinBtn',
            backgroundColor: AppTheme.secondaryColor,
            foregroundColor: Colors.white,
            onPressed: _showJoinEventDialog,
            child: const Icon(Icons.group_add),
          ),
          const SizedBox(height: 12),
          FloatingActionButton(
            heroTag: 'createBtn',
            backgroundColor: AppTheme.primaryColor,
            foregroundColor: Colors.white,
            onPressed: _showCreateEventDialog,
            child: const Icon(Icons.add),
          ),
        ],
      ),
    );
  }
}
