import 'dart:convert';
import 'package:flutter/material.dart';
import '../../core/network/api_client.dart';
import '../../core/network/socket_service.dart';
import '../../data/models/expense_model.dart';

class ExpenseProvider with ChangeNotifier {
  final ApiClient _apiClient = ApiClient();
  final SocketService _socketService = SocketService();

  List<ExpenseModel> _expenses = [];
  bool _isLoading = false;
  String? _error;

  List<ExpenseModel> get expenses => _expenses;
  bool get isLoading => _isLoading;
  String? get error => _error;

  ExpenseProvider() {
    _setupSocketListeners();
  }

  void _setupSocketListeners() {
    _socketService.onExpenseStatusUpdated = (data) {
      print('⚡ Socket event: expense-status-updated');
      try {
        final updatedExpense = ExpenseModel.fromJson(data);
        final index = _expenses.indexWhere((e) => e.id == updatedExpense.id);
        if (index != -1) {
          _expenses[index] = updatedExpense;
          notifyListeners();
        }
      } catch (e) {
        print('Error processing socket expense update: $e');
      }
    };
  }

  void _clearError() {
    _error = null;
  }

  Future<void> fetchExpenses() async {
    _isLoading = true;
    _clearError();
    notifyListeners();

    try {
      final response = await _apiClient.get('/api/expense');
      final List<dynamic> list = jsonDecode(response.body);
      _expenses = list.map((item) => ExpenseModel.fromJson(item)).toList();
    } catch (e) {
      _error = e.toString().replaceAll('Exception: ', '');
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<bool> addExpense({
    required String paidBy,
    required String paidTo,
    required double amount,
    required String description,
    required DateTime date,
    String? eventId,
  }) async {
    _isLoading = true;
    _clearError();
    notifyListeners();

    try {
      final response = await _apiClient.post('/api/expense/add', {
        'paidBy': paidBy,
        'paidTo': paidTo,
        'amount': amount,
        'description': description,
        'date': date.toIso8601String(),
        if (eventId != null && eventId.isNotEmpty) 'eventId': eventId,
      });

      final body = jsonDecode(response.body);
      final newExpense = ExpenseModel.fromJson(body['data']);
      _expenses.insert(0, newExpense);
      
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

  Future<bool> updateExpenseStatus(String id, String userId, bool confirmed) async {
    _isLoading = true;
    _clearError();
    notifyListeners();

    try {
      final response = await _apiClient.put('/api/expense/status/$id', {
        'userId': userId,
        'confirmed': confirmed,
      });

      final updatedExpense = ExpenseModel.fromJson(jsonDecode(response.body));
      final index = _expenses.indexWhere((e) => e.id == id);
      if (index != -1) {
        _expenses[index] = updatedExpense;
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

  // Calculate Net Balances for currently logged-in user
  double getNetBalanceForUser(String userId) {
    double balance = 0.0;
    for (var expense in _expenses) {
      if (expense.status) continue; // Already settled
      if (expense.paidById == userId) {
        // You paid to someone, they owe you (positive balance)
        balance += expense.amount;
      } else if (expense.paidToId == userId) {
        // Someone paid you (or rather, they claim they paid you / you owe them)
        // Wait, in MilBantKar:
        // 'paidBy' is who paid the money.
        // 'paidTo' is who received the benefit/who owes.
        // Let's check how the backend models balance:
        // `balances.owedToOthers` (owes others) vs `balances.owedByOthers` (others owe them).
        // If expense.paidBy == UserA and expense.paidTo == UserB, UserA paid the money for UserB.
        // So UserB owes UserA.
        // For UserA (paidBy): they are owed money (positive) -> (+amount)
        // For UserB (paidTo): they owe money (negative) -> (-amount)
        balance -= expense.amount;
      }
    }
    return balance;
  }

  // Calculate how much others owe the user
  double getOwedByOthers(String userId) {
    double balance = 0.0;
    for (var expense in _expenses) {
      if (expense.status) continue;
      if (expense.paidById == userId) {
        balance += expense.amount;
      }
    }
    return balance;
  }

  // Calculate how much the user owes others
  double getOwedToOthers(String userId) {
    double balance = 0.0;
    for (var expense in _expenses) {
      if (expense.status) continue;
      if (expense.paidToId == userId) {
        balance += expense.amount;
      }
    }
    return balance;
  }
}
