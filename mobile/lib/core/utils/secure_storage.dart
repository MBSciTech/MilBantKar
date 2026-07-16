import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

class SecureStorage {
  static final SecureStorage _instance = SecureStorage._internal();
  factory SecureStorage() => _instance;
  SecureStorage._internal();

  final _secureStorage = const FlutterSecureStorage();

  static const String _keyUserId = 'user_id';
  static const String _keyUsername = 'username';

  Future<void> saveSession(String userId, String username) async {
    await _secureStorage.write(key: _keyUserId, value: userId);
    await _secureStorage.write(key: _keyUsername, value: username);
  }

  Future<String?> getUserId() async {
    return await _secureStorage.read(key: _keyUserId);
  }

  Future<String?> getUsername() async {
    return await _secureStorage.read(key: _keyUsername);
  }

  Future<void> clearSession() async {
    await _secureStorage.delete(key: _keyUserId);
    await _secureStorage.delete(key: _keyUsername);
  }

  /// Backend base URL from `.env` (`API_BASE_URL`). Not stored in source.
  Future<String> getServerUrl() async {
    final url = dotenv.env['API_BASE_URL']?.trim() ?? '';
    if (url.isEmpty) {
      throw StateError(
        'API_BASE_URL is missing. Copy mobile/.env.example to mobile/.env and set your API URL.',
      );
    }
    return url.endsWith('/') ? url.substring(0, url.length - 1) : url;
  }
}
