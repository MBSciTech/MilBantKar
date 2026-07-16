import 'package:socket_io_client/socket_io_client.dart' as IO;
import '../utils/secure_storage.dart';

class SocketService {
  static final SocketService _instance = SocketService._internal();
  factory SocketService() => _instance;
  SocketService._internal();

  IO.Socket? socket;
  final SecureStorage _storage = SecureStorage();

  // Callbacks for real-time updates
  Function(dynamic)? onExpenseStatusUpdated;
  Function(dynamic)? onSettlementAlert;
  Function(dynamic)? onNewNotification;
  Function(dynamic)? onPollUpdated;

  Future<void> connect(String userId) async {
    if (socket != null && socket!.connected) return;

    final baseUrl = await _storage.getServerUrl();
    
    socket = IO.io(baseUrl, IO.OptionBuilder()
      .setTransports(['websocket']) // Use websocket transport
      .disableAutoConnect()
      .build());

    socket!.onConnect((_) {
      print('⚡ Socket connected to server');
      // Register userId on connection as expected by backend
      socket!.emit('register', userId);
    });

    socket!.onDisconnect((_) {
      print('⚡ Socket disconnected');
    });

    socket!.onConnectError((err) {
      print('⚠️ Socket Connection Error: $err');
    });

    // Register backend listener events
    socket!.on('expense-status-updated', (data) {
      if (onExpenseStatusUpdated != null) onExpenseStatusUpdated!(data);
    });

    socket!.on('settlement-alert', (data) {
      if (onSettlementAlert != null) onSettlementAlert!(data);
    });

    socket!.on('new-notification', (data) {
      if (onNewNotification != null) onNewNotification!(data);
    });

    socket!.on('poll-updated', (data) {
      if (onPollUpdated != null) onPollUpdated!(data);
    });

    socket!.connect();
  }

  void disconnect() {
    if (socket != null) {
      socket!.disconnect();
      socket = null;
    }
  }
}
