import 'dart:convert';
import 'package:flutter/material.dart';
import '../../core/network/api_client.dart';
import '../../data/models/event_model.dart';

class EventProvider with ChangeNotifier {
  final ApiClient _apiClient = ApiClient();

  List<EventModel> _events = [];
  EventModel? _selectedEvent;
  bool _isLoading = false;
  String? _error;

  List<EventModel> get events => _events;
  EventModel? get selectedEvent => _selectedEvent;
  bool get isLoading => _isLoading;
  String? get error => _error;

  void _clearError() {
    _error = null;
  }

  Future<void> fetchUserEvents(String userId) async {
    _isLoading = true;
    _clearError();
    notifyListeners();

    try {
      final response = await _apiClient.get('/api/events/user/$userId');
      final List<dynamic> list = jsonDecode(response.body);
      _events = list.map((item) => EventModel.fromJson(item)).toList();
    } catch (e) {
      _error = e.toString().replaceAll('Exception: ', '');
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<bool> createEvent(String name, String description, String userId) async {
    _isLoading = true;
    _clearError();
    notifyListeners();

    try {
      final response = await _apiClient.post('/api/events/create', {
        'name': name,
        'description': description,
        'createdBy': userId,
      });

      final body = jsonDecode(response.body);
      final newEvent = EventModel.fromJson(body['event']);
      _events.insert(0, newEvent);
      _isLoading = false;
      notifyListeners();
      return true;
    } catch (e) {
      _error = e.toString().replaceAll('Exception: ', '');
      _isLoading = false;
      notifyListeners();
      return false;
    }
  }

  Future<bool> joinEvent(String code, String userId) async {
    _isLoading = true;
    _clearError();
    notifyListeners();

    try {
      final response = await _apiClient.post('/api/events/join/${code.trim().toUpperCase()}', {
        'userId': userId,
      });

      final body = jsonDecode(response.body);
      final joinedEvent = EventModel.fromJson(body['event']);
      
      // Add if not already in user's list
      if (!_events.any((e) => e.id == joinedEvent.id)) {
        _events.add(joinedEvent);
      }
      
      _isLoading = false;
      notifyListeners();
      return true;
    } catch (e) {
      _error = e.toString().replaceAll('Exception: ', '');
      _isLoading = false;
      notifyListeners();
      return false;
    }
  }

  Future<void> fetchEventDetails(String eventId) async {
    _isLoading = true;
    _clearError();
    notifyListeners();

    try {
      final response = await _apiClient.get('/api/events/$eventId');
      _selectedEvent = EventModel.fromJson(jsonDecode(response.body));
    } catch (e) {
      _error = e.toString().replaceAll('Exception: ', '');
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<bool> concludeEvent(String eventId, String userId) async {
    _isLoading = true;
    _clearError();
    notifyListeners();

    try {
      final response = await _apiClient.put('/api/events/$eventId/conclude', {
        'userId': userId,
      });

      final body = jsonDecode(response.body);
      final updatedEvent = EventModel.fromJson(body['event']);
      
      // Update selected event detail
      if (_selectedEvent?.id == eventId) {
        _selectedEvent = updatedEvent;
      }
      
      // Update in lists
      final index = _events.indexWhere((e) => e.id == eventId);
      if (index != -1) {
        _events[index] = updatedEvent;
      }

      _isLoading = false;
      notifyListeners();
      return true;
    } catch (e) {
      _error = e.toString().replaceAll('Exception: ', '');
      _isLoading = false;
      notifyListeners();
      return false;
    }
  }
}
