import 'dart:convert';
import 'package:flutter/material.dart';
import '../../core/network/api_client.dart';
import '../../core/network/socket_service.dart';
import '../../core/utils/secure_storage.dart';
import '../../data/models/user_model.dart';

class AuthProvider with ChangeNotifier {
  final ApiClient _apiClient = ApiClient();
  final SecureStorage _storage = SecureStorage();
  final SocketService _socketService = SocketService();

  UserModel? _currentUser;
  bool _isLoading = false;
  String? _error;

  UserModel? get currentUser => _currentUser;
  bool get isLoading => _isLoading;
  String? get error => _error;
  bool get isAuthenticated => _currentUser != null;

  AuthProvider() {
    tryAutoLogin();
  }

  void _clearError() {
    _error = null;
  }

  Future<bool> tryAutoLogin() async {
    _isLoading = true;
    _clearError();
    notifyListeners();

    try {
      final username = await _storage.getUsername();
      final userId = await _storage.getUserId();

      if (username != null && userId != null) {
        _currentUser = UserModel(
          id: userId,
          username: username,
          email: '',
          balances: UserBalances(),
        );

        try {
          // Fetch fresh user details when the server is reachable.
          final response = await _apiClient.get('/api/user/$username');
          final List<dynamic> users = jsonDecode(response.body);
          if (users.isNotEmpty) {
            _currentUser = UserModel.fromJson(users.first);
          }
        } catch (e) {
          print('Auto-login profile refresh failed: $e');
        }

        try {
          await _socketService.connect(_currentUser!.id);
        } catch (e) {
          print('Auto-login socket connect failed: $e');
        }
        _isLoading = false;
        notifyListeners();
        return true;
      }
    } catch (e) {
      print('Auto-login failed: $e');
    }

    _isLoading = false;
    notifyListeners();
    return false;
  }

  Future<bool> login(String username, String password) async {
    _isLoading = true;
    _clearError();
    notifyListeners();

    try {
      final response = await _apiClient.post('/api/auth/login', {
        'username': username,
        'password': password,
      });

      final body = jsonDecode(response.body);
      final userId = body['user']['id'];

      _currentUser = UserModel(
        id: userId,
        username: username,
        email: '',
        balances: UserBalances(),
      );

      // Save credentials securely
      await _storage.saveSession(userId, username);

      try {
        // Fetch user profile info when available, but do not fail login if the
        // profile endpoint is unavailable or returns an unexpected payload.
        final profileResponse = await _apiClient.get('/api/user/$username');
        final List<dynamic> users = jsonDecode(profileResponse.body);

        if (users.isNotEmpty) {
          _currentUser = UserModel.fromJson(users.first);
        }
      } catch (e) {
        print('Login profile refresh failed: $e');
      }

      // Connect real-time socket, but keep the login successful even if the
      // websocket is temporarily unavailable.
      try {
        await _socketService.connect(_currentUser!.id);
      } catch (e) {
        print('Login socket connect failed: $e');
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

  Future<bool> signup(
    String username,
    String email,
    String phone,
    String password,
  ) async {
    _isLoading = true;
    _clearError();
    notifyListeners();

    try {
      await _apiClient.post('/api/auth/signup', {
        'username': username,
        'email': email,
        'phone': phone,
        'password': password,
      });

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

  Future<bool> updateProfile({
    required String username,
    required String email,
    required String phone,
    required String profilePic,
  }) async {
    if (_currentUser == null) return false;

    _isLoading = true;
    _clearError();
    notifyListeners();

    try {
      final response = await _apiClient.put('/api/user/${_currentUser!.id}', {
        'username': username,
        'email': email,
        'phone': phone,
        'profilePic': profilePic,
      });

      final updated = UserModel.fromJson(jsonDecode(response.body));
      _currentUser = updated;

      // Update session username if it changed
      await _storage.saveSession(_currentUser!.id, username);

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

  Future<void> logout() async {
    _isLoading = true;
    notifyListeners();

    await _storage.clearSession();
    _socketService.disconnect();
    _currentUser = null;

    _isLoading = false;
    notifyListeners();
  }
}
