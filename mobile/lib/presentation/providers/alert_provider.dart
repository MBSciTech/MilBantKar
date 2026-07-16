import 'dart:convert';
import 'package:flutter/material.dart';
import '../../core/network/api_client.dart';
import '../../core/network/socket_service.dart';
import '../../data/models/alert_model.dart';

class AlertProvider with ChangeNotifier {
  final ApiClient _apiClient = ApiClient();
  final SocketService _socketService = SocketService();

  List<AlertModel> _alerts = [];
  bool _isLoading = false;
  String? _error;

  List<AlertModel> get alerts => _alerts;
  List<AlertModel> get unreadAlerts => _alerts.where((a) => !a.seen).toList();
  bool get isLoading => _isLoading;
  String? get error => _error;

  AlertProvider() {
    _setupSocketListeners();
  }

  void _setupSocketListeners() {
    // Listen for new notifications
    _socketService.onNewNotification = (data) {
      print('⚡ Socket event: new-notification');
      try {
        final newAlert = AlertModel.fromJson(data);
        // Only add if it's not already in list
        if (!_alerts.any((a) => a.id == newAlert.id)) {
          _alerts.insert(0, newAlert);
          notifyListeners();
        }
      } catch (e) {
        print('Error decoding new notification: $e');
      }
    };

    // Listen for poll updates (re-vote or results)
    _socketService.onPollUpdated = (data) {
      print('⚡ Socket event: poll-updated');
      try {
        final updatedPoll = AlertModel.fromJson(data);
        final index = _alerts.indexWhere((a) => a.id == updatedPoll.id);
        if (index != -1) {
          _alerts[index] = updatedPoll;
          notifyListeners();
        }
      } catch (e) {
        print('Error decoding updated poll: $e');
      }
    };

    // Listen for settlement alerts
    _socketService.onSettlementAlert = (data) {
      print('⚡ Socket event: settlement-alert');
      // A message is broadcast. Usually comes as { message, expense, settled }
      // The new-notification event will also be emitted by the backend, which adds the alert to the DB.
      // So fetching or listening to new-notification is sufficient, but we can log or trigger a snackbar.
    };
  }

  void _clearError() {
    _error = null;
  }

  Future<void> fetchAlerts() async {
    _isLoading = true;
    _clearError();
    notifyListeners();

    try {
      final response = await _apiClient.get('/api/alerts');
      final List<dynamic> list = jsonDecode(response.body);
      _alerts = list.map((item) => AlertModel.fromJson(item)).toList();
      // Sort newest first
      _alerts.sort((a, b) => b.createdAt.compareTo(a.createdAt));
    } catch (e) {
      _error = e.toString().replaceAll('Exception: ', '');
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<bool> markAsSeen(String alertId) async {
    try {
      await _apiClient.put('/api/alerts/seen/$alertId', {});
      final index = _alerts.indexWhere((a) => a.id == alertId);
      if (index != -1) {
        // Create updated copy locally
        final old = _alerts[index];
        _alerts[index] = AlertModel(
          id: old.id,
          senderId: old.senderId,
          senderUsername: old.senderUsername,
          receiverId: old.receiverId,
          receiverUsername: old.receiverUsername,
          message: old.message,
          type: old.type,
          expenseDetails: old.expenseDetails,
          seen: true,
          pollOptions: old.pollOptions,
          createdAt: old.createdAt,
        );
        notifyListeners();
      }
      return true;
    } catch (e) {
      print('Error marking alert seen: $e');
      return false;
    }
  }

  Future<bool> castVote(String alertId, String userId, int optionIndex) async {
    try {
      final response = await _apiClient.post('/api/alerts/vote/$alertId', {
        'userId': userId,
        'optionIndex': optionIndex,
      });

      final body = jsonDecode(response.body);
      final updatedAlert = AlertModel.fromJson(body['alert']);

      final index = _alerts.indexWhere((a) => a.id == alertId);
      if (index != -1) {
        _alerts[index] = updatedAlert;
        notifyListeners();
      }
      return true;
    } catch (e) {
      print('Error casting vote: $e');
      return false;
    }
  }

  Future<bool> deleteAlert(String alertId) async {
    try {
      await _apiClient.delete('/api/alerts/$alertId');
      _alerts.removeWhere((a) => a.id == alertId);
      notifyListeners();
      return true;
    } catch (e) {
      print('Error deleting alert: $e');
      return false;
    }
  }

  Future<bool> createAlert({
    required String sender,
    String? receiver,
    required String message,
    required String type, // warning, info, success, poll
    String? expenseDetails,
    List<String>? pollOptions,
  }) async {
    try {
      final body = {
        'sender': sender,
        'message': message,
        'type': type,
        if (receiver != null) 'receiver': receiver,
        if (expenseDetails != null) 'expenseDetails': expenseDetails,
        if (pollOptions != null) 'pollOptions': pollOptions.map((o) => {'option': o, 'votes': []}).toList(),
      };

      final response = await _apiClient.post('/api/alerts/create', body);
      final alertData = AlertModel.fromJson(jsonDecode(response.body)['alert']);
      _alerts.insert(0, alertData);
      notifyListeners();
      return true;
    } catch (e) {
      print('Error creating alert: $e');
      return false;
    }
  }
}
