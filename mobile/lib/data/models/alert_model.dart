import 'expense_model.dart';

class PollOption {
  final String id;
  final String option;
  final List<String> votesUserIds; // List of user IDs who voted for this option
  final List<String> votesUsernames; // List of usernames who voted for this option

  PollOption({
    required this.id,
    required this.option,
    this.votesUserIds = const [],
    this.votesUsernames = const [],
  });

  factory PollOption.fromJson(Map<String, dynamic> json) {
    List<String> ids = [];
    List<String> names = [];
    if (json['votes'] is List) {
      for (var v in json['votes']) {
        if (v is Map) {
          ids.add(v['_id'] ?? v['id'] ?? '');
          names.add(v['username'] ?? '');
        } else if (v is String) {
          ids.add(v);
        }
      }
    }
    return PollOption(
      id: json['_id'] ?? json['id'] ?? '',
      option: json['option'] ?? '',
      votesUserIds: ids,
      votesUsernames: names,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      '_id': id,
      'option': option,
      'votes': votesUserIds,
    };
  }
}

class AlertModel {
  final String id;
  final String senderId;
  final String senderUsername;
  final String? receiverId;
  final String? receiverUsername;
  final String message;
  final String type; // warning, info, success, poll
  final ExpenseModel? expenseDetails;
  final bool seen;
  final List<PollOption> pollOptions;
  final DateTime createdAt;

  AlertModel({
    required this.id,
    required this.senderId,
    this.senderUsername = '',
    this.receiverId,
    this.receiverUsername,
    required this.message,
    required this.type,
    this.expenseDetails,
    this.seen = false,
    this.pollOptions = const [],
    required this.createdAt,
  });

  factory AlertModel.fromJson(Map<String, dynamic> json) {
    // Sender parsing
    String senderId = '';
    String senderUsername = '';
    if (json['sender'] is Map) {
      senderId = json['sender']['_id'] ?? json['sender']['id'] ?? '';
      senderUsername = json['sender']['username'] ?? '';
    } else if (json['sender'] is String) {
      senderId = json['sender'];
    }

    // Receiver parsing
    String? receiverId;
    String? receiverUsername;
    if (json['receiver'] is Map) {
      receiverId = json['receiver']['_id'] ?? json['receiver']['id'] ?? '';
      receiverUsername = json['receiver']['username'] ?? '';
    } else if (json['receiver'] is String) {
      receiverId = json['receiver'];
    }

    // Expense parsing
    ExpenseModel? expense;
    if (json['expenseDetails'] is Map) {
      expense = ExpenseModel.fromJson(json['expenseDetails'].cast<String, dynamic>());
    }

    // Poll options parsing
    List<PollOption> options = [];
    if (json['pollOptions'] is List) {
      options = (json['pollOptions'] as List)
          .map((item) => PollOption.fromJson(item.cast<String, dynamic>()))
          .toList();
    }

    return AlertModel(
      id: json['_id'] ?? json['id'] ?? '',
      senderId: senderId,
      senderUsername: senderUsername,
      receiverId: receiverId,
      receiverUsername: receiverUsername,
      message: json['message'] ?? '',
      type: json['type'] ?? 'info',
      expenseDetails: expense,
      seen: json['seen'] ?? false,
      pollOptions: options,
      createdAt: json['createdAt'] != null 
          ? DateTime.parse(json['createdAt']) 
          : DateTime.now(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      '_id': id,
      'sender': senderId,
      'receiver': receiverId,
      'message': message,
      'type': type,
      'expenseDetails': expenseDetails?.toJson(),
      'seen': seen,
      'pollOptions': pollOptions.map((o) => o.toJson()).toList(),
      'createdAt': createdAt.toIso8601String(),
    };
  }
}
