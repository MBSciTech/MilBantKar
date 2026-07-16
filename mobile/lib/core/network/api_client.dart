import 'dart:convert';
import 'package:http/http.dart' as http;
import '../utils/secure_storage.dart';

class ApiClient {
  static final ApiClient _instance = ApiClient._internal();
  factory ApiClient() => _instance;
  ApiClient._internal();

  final SecureStorage _storage = SecureStorage();

  Future<Map<String, String>> _getHeaders() async {
    final username = await _storage.getUsername();
    final headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };
    if (username != null) {
      // Attach adminUsername header which is expected by backend admin middleware
      headers['adminUsername'] = username;
    }
    return headers;
  }

  Future<http.Response> get(String endpoint) async {
    final baseUrl = await _storage.getServerUrl();
    final url = Uri.parse('$baseUrl$endpoint');
    final headers = await _getHeaders();
    final response = await http.get(url, headers: headers);
    return _handleResponse(response);
  }

  Future<http.Response> post(String endpoint, Map<String, dynamic> body) async {
    final baseUrl = await _storage.getServerUrl();
    final url = Uri.parse('$baseUrl$endpoint');
    final headers = await _getHeaders();
    final response = await http.post(
      url,
      headers: headers,
      body: jsonEncode(body),
    );
    return _handleResponse(response);
  }

  Future<http.Response> put(String endpoint, Map<String, dynamic> body) async {
    final baseUrl = await _storage.getServerUrl();
    final url = Uri.parse('$baseUrl$endpoint');
    final headers = await _getHeaders();
    final response = await http.put(
      url,
      headers: headers,
      body: jsonEncode(body),
    );
    return _handleResponse(response);
  }

  Future<http.Response> delete(String endpoint) async {
    final baseUrl = await _storage.getServerUrl();
    final url = Uri.parse('$baseUrl$endpoint');
    final headers = await _getHeaders();
    final response = await http.delete(url, headers: headers);
    return _handleResponse(response);
  }

  http.Response _handleResponse(http.Response response) {
    if (response.statusCode >= 200 && response.statusCode < 300) {
      return response;
    } else {
      // Parse error message if available
      String message = 'API call failed with status: ${response.statusCode}';
      try {
        final decoded = jsonDecode(response.body);
        message = decoded['message'] ?? decoded['error'] ?? message;
      } catch (_) {}
      throw Exception(message);
    }
  }
}
