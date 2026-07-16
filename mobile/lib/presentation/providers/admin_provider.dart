import 'dart:convert';
import 'package:flutter/material.dart';
import '../../core/network/api_client.dart';
import '../../data/models/event_model.dart';
import '../../data/models/expense_model.dart';
import '../../data/models/user_model.dart';
import '../../data/models/alert_model.dart';

class AdminProvider with ChangeNotifier {
  final ApiClient _apiClient = ApiClient();

  List<EventModel> _adminEvents = [];
  List<ExpenseModel> _adminExpenses = [];
  List<ExpenseModel> _deletedExpenses = [];
  List<UserModel> _usersList = [];
  List<AlertModel> _adminPolls = [];
  bool _isLoading = false;
  String? _error;

  List<EventModel> get adminEvents => _adminEvents;
  List<ExpenseModel> get adminExpenses => _adminExpenses;
  List<ExpenseModel> get deletedExpenses => _deletedExpenses;
  List<UserModel> get usersList => _usersList;
  List<AlertModel> get adminPolls => _adminPolls;
  bool get isLoading => _isLoading;
  String? get error => _error;

  void _clearError() {
    _error = null;
  }

  // Fetch all system users
  Future<void> fetchAllUsers() async {
    _isLoading = true;
    _clearError();
    notifyListeners();

    try {
      final response = await _apiClient.get('/api/users');
      final List<dynamic> list = jsonDecode(response.body);
      _usersList = list.map((item) => UserModel.fromJson(item)).toList();
    } catch (e) {
      _error = e.toString().replaceAll('Exception: ', '');
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  // Fetch admin events
  Future<void> fetchAdminEvents() async {
    _isLoading = true;
    _clearError();
    notifyListeners();

    try {
      final response = await _apiClient.get('/api/admin/events');
      final List<dynamic> list = jsonDecode(response.body);
      _adminEvents = list.map((item) => EventModel.fromJson(item)).toList();
    } catch (e) {
      _error = e.toString().replaceAll('Exception: ', '');
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  // Fetch admin expenses
  Future<void> fetchAdminExpenses() async {
    _isLoading = true;
    _clearError();
    notifyListeners();

    try {
      final response = await _apiClient.get('/api/admin/expenses');
      final List<dynamic> list = jsonDecode(response.body);
      _adminExpenses = list.map((item) => ExpenseModel.fromJson(item)).toList();
    } catch (e) {
      _error = e.toString().replaceAll('Exception: ', '');
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  // Fetch deleted expenses (Recycle Bin)
  Future<void> fetchDeletedExpenses() async {
    _isLoading = true;
    _clearError();
    notifyListeners();

    try {
      final response = await _apiClient.get('/api/admin/expenses/deleted');
      final List<dynamic> list = jsonDecode(response.body);
      _deletedExpenses = list.map((item) => ExpenseModel.fromJson(item)).toList();
    } catch (e) {
      _error = e.toString().replaceAll('Exception: ', '');
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  // Fetch system polls
  Future<void> fetchAdminPolls() async {
    _isLoading = true;
    _clearError();
    notifyListeners();

    try {
      final response = await _apiClient.get('/api/admin/polls');
      final List<dynamic> list = jsonDecode(response.body);
      _adminPolls = list.map((item) => AlertModel.fromJson(item)).toList();
    } catch (e) {
      _error = e.toString().replaceAll('Exception: ', '');
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  // Create User
  Future<bool> adminCreateUser(Map<String, dynamic> userData) async {
    try {
      await _apiClient.post('/api/admin/users', userData);
      await fetchAllUsers();
      return true;
    } catch (e) {
      _error = e.toString();
      return false;
    }
  }

  // Edit User
  Future<bool> adminUpdateUser(String id, Map<String, dynamic> userData) async {
    try {
      await _apiClient.put('/api/admin/users/$id', userData);
      await fetchAllUsers();
      return true;
    } catch (e) {
      _error = e.toString();
      return false;
    }
  }

  // Delete User
  Future<bool> adminDeleteUser(String id) async {
    try {
      await _apiClient.delete('/api/admin/users/$id');
      _usersList.removeWhere((u) => u.id == id);
      notifyListeners();
      return true;
    } catch (e) {
      _error = e.toString();
      return false;
    }
  }

  // Delete Event
  Future<bool> adminDeleteEvent(String id) async {
    try {
      await _apiClient.delete('/api/admin/events/$id');
      _adminEvents.removeWhere((e) => e.id == id);
      notifyListeners();
      return true;
    } catch (e) {
      _error = e.toString();
      return false;
    }
  }

  // Edit Expense
  Future<bool> adminUpdateExpense(String id, Map<String, dynamic> expenseData) async {
    try {
      await _apiClient.put('/api/admin/expenses/$id', expenseData);
      await fetchAdminExpenses();
      return true;
    } catch (e) {
      _error = e.toString();
      return false;
    }
  }

  // Delete Expense (Soft Delete to Recycle Bin)
  Future<bool> adminSoftDeleteExpense(String id) async {
    try {
      await _apiClient.delete('/api/admin/expenses/$id');
      _adminExpenses.removeWhere((e) => e.id == id);
      notifyListeners();
      return true;
    } catch (e) {
      _error = e.toString();
      return false;
    }
  }

  // Restore Expense
  Future<bool> adminRestoreExpense(String id) async {
    try {
      await _apiClient.put('/api/admin/expenses/deleted/$id/restore', {});
      _deletedExpenses.removeWhere((e) => e.id == id);
      notifyListeners();
      return true;
    } catch (e) {
      _error = e.toString();
      return false;
    }
  }

  // Permanent Delete Expense
  Future<bool> adminPermanentDeleteExpense(String id) async {
    try {
      await _apiClient.delete('/api/admin/expenses/deleted/$id/permanent');
      _deletedExpenses.removeWhere((e) => e.id == id);
      notifyListeners();
      return true;
    } catch (e) {
      _error = e.toString();
      return false;
    }
  }

  // Create Poll
  Future<bool> adminCreatePoll(String question, List<String> options) async {
    try {
      await _apiClient.post('/api/admin/polls', {
        'message': question,
        'pollOptions': options,
      });
      await fetchAdminPolls();
      return true;
    } catch (e) {
      _error = e.toString();
      return false;
    }
  }
}
