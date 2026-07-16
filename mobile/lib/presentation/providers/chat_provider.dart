import 'dart:convert';
import 'package:flutter/material.dart';
import '../../core/network/api_client.dart';
import '../../data/models/expense_model.dart';

class ChatMessage {
  final String text;
  final bool isUser;
  final String? actionType;
  final String? ctaLabel;
  final String? ctaHref;
  final String? richType;
  final List<ExpenseModel>? richResults;
  final DateTime timestamp;

  ChatMessage({
    required this.text,
    required this.isUser,
    this.actionType,
    this.ctaLabel,
    this.ctaHref,
    this.richType,
    this.richResults,
    DateTime? timestamp,
  }) : timestamp = timestamp ?? DateTime.now();
}

class ChatProvider with ChangeNotifier {
  final ApiClient _apiClient = ApiClient();

  List<ChatMessage> _messages = [];
  bool _isLoading = false;
  String? _error;

  List<ChatMessage> get messages => _messages;
  bool get isLoading => _isLoading;
  String? get error => _error;

  ChatProvider() {
    // Add welcome message from bot on startup
    _messages.add(ChatMessage(
      text: "Hi! I am your MilBantKar assistant. I can help with navigation, transactions, events, and reminders. Ask me anything!",
      isUser: false,
    ));
  }

  Future<void> sendMessage(String text, String userId) async {
    if (text.trim().isEmpty) return;

    // Append user message
    _messages.add(ChatMessage(text: text, isUser: true));
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final response = await _apiClient.post('/api/chat', {
        'userId': userId,
        'message': text,
      });

      final body = jsonDecode(response.body);
      final reply = body['reply'] ?? 'No reply received.';
      final actionType = body['actionType'];
      
      // CTA extraction
      String? ctaLabel;
      String? ctaHref;
      if (body['cta'] != null) {
        ctaLabel = body['cta']['label'];
        ctaHref = body['cta']['href'] ?? body['cta']['route'];
      }

      // Rich data extraction
      String? richType = body['richType'];
      List<ExpenseModel>? richResults;
      if (richType == 'searchResults' && body['richData'] != null && body['richData']['results'] != null) {
        final List<dynamic> list = body['richData']['results'];
        richResults = list.map((item) => ExpenseModel.fromJson(item)).toList();
      }

      _messages.add(ChatMessage(
        text: reply,
        isUser: false,
        actionType: actionType,
        ctaLabel: ctaLabel,
        ctaHref: ctaHref,
        richType: richType,
        richResults: richResults,
      ));

    } catch (e) {
      _error = e.toString().replaceAll('Exception: ', '');
      _messages.add(ChatMessage(
        text: "Sorry, I had trouble connecting. Please try again.",
        isUser: false,
      ));
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  void clearChat() {
    _messages = [
      ChatMessage(
        text: "Hi! I am your MilBantKar assistant. I can help with navigation, transactions, events, and reminders. Ask me anything!",
        isUser: false,
      )
    ];
    notifyListeners();
  }
}
