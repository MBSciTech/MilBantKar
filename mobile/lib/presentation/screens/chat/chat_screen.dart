import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:mobile/core/theme/app_theme.dart';
import 'package:mobile/presentation/providers/auth_provider.dart';
import 'package:mobile/presentation/providers/chat_provider.dart';
import 'package:mobile/presentation/screens/events/events_screen.dart';
import 'package:mobile/presentation/screens/history/history_screen.dart';
import 'package:mobile/presentation/screens/transactions/add_transaction_screen.dart';
import 'package:mobile/presentation/screens/analytics/visual_analytics_screen.dart';
import 'package:mobile/presentation/screens/qr/qr_scanner_screen.dart';
import 'package:mobile/presentation/screens/profile/profile_screen.dart';
import 'package:mobile/presentation/screens/admin/admin_panel_screen.dart';

class ChatScreen extends StatefulWidget {
  const ChatScreen({Key? key}) : super(key: key);

  @override
  State<ChatScreen> createState() => _ChatScreenState();
}

class _ChatScreenState extends State<ChatScreen> {
  final _messageController = TextEditingController();
  final _scrollController = ScrollController();

  @override
  void dispose() {
    _messageController.dispose();
    _scrollController.dispose();
    super.dispose();
  }

  void _scrollToBottom() {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (_scrollController.hasClients) {
        _scrollController.animateTo(
          _scrollController.position.maxScrollExtent,
          duration: const Duration(milliseconds: 300),
          curve: Curves.easeOut,
        );
      }
    });
  }

  void _sendMessage() async {
    final text = _messageController.text.trim();
    if (text.isEmpty) return;

    _messageController.clear();
    final auth = Provider.of<AuthProvider>(context, listen: false);
    final chatProv = Provider.of<ChatProvider>(context, listen: false);

    if (auth.currentUser != null) {
      await chatProv.sendMessage(text, auth.currentUser!.id);
      _scrollToBottom();
    }
  }

  void _handleCtaAction(String? actionType, String? ctaHref) {
    if (ctaHref == null) return;

    Widget? targetScreen;
    switch (ctaHref) {
      case '/events':
        targetScreen = const EventsScreen();
        break;
      case '/history':
        targetScreen = const HistoryScreen();
        break;
      case '/transaction':
        targetScreen = const AddTransactionScreen();
        break;
      case '/visualise':
        targetScreen = const VisualAnalyticsScreen();
        break;
      case '/scanner':
        targetScreen = const QRScannerScreen();
        break;
      case '/profile':
        targetScreen = const ProfileScreen();
        break;
      case '/admin':
        targetScreen = const AdminPanelScreen();
        break;
    }

    if (targetScreen != null) {
      Navigator.push(
        context,
        MaterialPageRoute(builder: (context) => targetScreen!),
      );
    } else if (actionType == 'start_transaction') {
      Navigator.push(
        context,
        MaterialPageRoute(builder: (context) => const AddTransactionScreen()),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final auth = Provider.of<AuthProvider>(context);
    final chatProv = Provider.of<ChatProvider>(context);
    final currentUserId = auth.currentUser?.id ?? '';

    return Scaffold(
      appBar: AppBar(
        title: const Text('MilBantKar Assistant'),
        actions: [
          IconButton(
            icon: const Icon(Icons.delete_sweep_outlined),
            onPressed: () {
              chatProv.clearChat();
            },
          ),
        ],
      ),
      body: Column(
        children: [
          // Chat history
          Expanded(
            child: ListView.builder(
              controller: _scrollController,
              padding: const EdgeInsets.all(16),
              itemCount: chatProv.messages.length,
              itemBuilder: (context, index) {
                final message = chatProv.messages[index];
                return _buildMessageBubble(message, currentUserId);
              },
            ),
          ),

          // Loading indicator
          if (chatProv.isLoading)
            const Padding(
              padding: EdgeInsets.symmetric(vertical: 8.0),
              child: Center(
                child: SizedBox(
                  height: 20,
                  width: 20,
                  child: CircularProgressIndicator(strokeWidth: 2, color: AppTheme.primaryColor),
                ),
              ),
            ),

          // Message Input Field
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            decoration: BoxDecoration(
              color: AppTheme.surfaceColor,
              border: const Border(
                top: BorderSide(color: AppTheme.borderColor),
              ),
            ),
            child: Row(
              children: [
                Expanded(
                  child: TextFormField(
                    controller: _messageController,
                    decoration: const InputDecoration(
                      hintText: 'Ask me to "go to events", "add expense", or search...',
                      filled: true,
                    ),
                    onFieldSubmitted: (_) => _sendMessage(),
                  ),
                ),
                const SizedBox(width: 12),
                FloatingActionButton.small(
                  backgroundColor: AppTheme.primaryColor,
                  foregroundColor: Colors.white,
                  onPressed: _sendMessage,
                  child: const Icon(Icons.send),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildMessageBubble(ChatMessage msg, String currentUserId) {
    return Align(
      alignment: msg.isUser ? Alignment.centerRight : Alignment.centerLeft,
      child: Container(
        margin: const EdgeInsets.symmetric(vertical: 8),
        constraints: BoxConstraints(
          maxWidth: MediaQuery.of(context).size.width * 0.82,
        ),
        child: Column(
          crossAxisAlignment: msg.isUser ? CrossAxisAlignment.end : CrossAxisAlignment.start,
          children: [
            // Text Bubble
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: msg.isUser 
                    ? AppTheme.primaryColor 
                    : AppTheme.surfaceColor,
                borderRadius: BorderRadius.only(
                  topLeft: const Radius.circular(16),
                  topRight: const Radius.circular(16),
                  bottomLeft: msg.isUser ? const Radius.circular(16) : Radius.zero,
                  bottomRight: msg.isUser ? Radius.zero : const Radius.circular(16),
                ),
                border: msg.isUser 
                    ? null 
                    : Border.all(color: AppTheme.borderColor),
              ),
              child: Text(
                msg.text,
                style: TextStyle(
                  color: msg.isUser ? Colors.white : AppTheme.textPrimary,
                  fontSize: 14,
                  height: 1.4,
                ),
              ),
            ),

            // Rich Search Results Carousel
            if (msg.richType == 'searchResults' && msg.richResults != null && msg.richResults!.isNotEmpty) ...[
              const SizedBox(height: 12),
              SizedBox(
                height: 110,
                child: ListView.builder(
                  scrollDirection: Axis.horizontal,
                  itemCount: msg.richResults!.length,
                  itemBuilder: (context, idx) {
                    final exp = msg.richResults![idx];
                    final isPayer = exp.paidById == currentUserId;
                    return Container(
                      width: 220,
                      margin: const EdgeInsets.only(right: 12),
                      child: Card(
                        child: Padding(
                          padding: const EdgeInsets.all(12.0),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Row(
                                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                children: [
                                  Expanded(
                                    child: Text(
                                      exp.description,
                                      maxLines: 1,
                                      overflow: TextOverflow.ellipsis,
                                      style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
                                    ),
                                  ),
                                  Text(
                                    '₹${exp.amount.toStringAsFixed(0)}',
                                    style: TextStyle(
                                      color: exp.status 
                                          ? AppTheme.textSecondary 
                                          : (isPayer ? AppTheme.successColor : AppTheme.dangerColor),
                                      fontWeight: FontWeight.bold,
                                      fontSize: 14,
                                    ),
                                  ),
                                ],
                              ),
                              Text(
                                isPayer ? 'You paid to ${exp.paidToUsername}' : '${exp.paidByUsername} paid to you',
                                style: const TextStyle(color: AppTheme.textSecondary, fontSize: 10),
                              ),
                              Text(
                                exp.status ? 'Status: Settled' : 'Status: Pending',
                                style: TextStyle(
                                  color: exp.status ? AppTheme.successColor : AppTheme.warningColor,
                                  fontSize: 10,
                                ),
                              )
                            ],
                          ),
                        ),
                      ),
                    );
                  },
                ),
              ),
            ],

            // Action Button CTA
            if (msg.ctaLabel != null) ...[
              const SizedBox(height: 8),
              ElevatedButton.icon(
                onPressed: () => _handleCtaAction(msg.actionType, msg.ctaHref),
                icon: const Icon(Icons.open_in_new, size: 16),
                label: Text(msg.ctaLabel!),
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppTheme.secondaryColor,
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                  textStyle: const TextStyle(fontSize: 13, fontWeight: FontWeight.bold),
                ),
              ),
            ]
          ],
        ),
      ),
    );
  }
}
