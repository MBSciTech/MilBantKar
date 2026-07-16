class SettlementConfirmation {
  final bool paidByConfirmed;
  final bool paidToConfirmed;
  final DateTime? paidByConfirmedAt;
  final DateTime? paidToConfirmedAt;

  SettlementConfirmation({
    this.paidByConfirmed = false,
    this.paidToConfirmed = false,
    this.paidByConfirmedAt,
    this.paidToConfirmedAt,
  });

  factory SettlementConfirmation.fromJson(Map<String, dynamic> json) {
    return SettlementConfirmation(
      paidByConfirmed: json['paidByConfirmed'] ?? false,
      paidToConfirmed: json['paidToConfirmed'] ?? false,
      paidByConfirmedAt: json['paidByConfirmedAt'] != null
          ? DateTime.tryParse(json['paidByConfirmedAt'])
          : null,
      paidToConfirmedAt: json['paidToConfirmedAt'] != null
          ? DateTime.tryParse(json['paidToConfirmedAt'])
          : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'paidByConfirmed': paidByConfirmed,
      'paidToConfirmed': paidToConfirmed,
      'paidByConfirmedAt': paidByConfirmedAt?.toIso8601String(),
      'paidToConfirmedAt': paidToConfirmedAt?.toIso8601String(),
    };
  }
}

class ExpenseModel {
  final String id;
  final String paidById;
  final String paidByUsername;
  final String paidByProfilePic;
  final String paidToId;
  final String paidToUsername;
  final String paidToProfilePic;
  final double amount;
  final String description;
  final DateTime date;
  final bool status;
  final SettlementConfirmation settlementConfirmation;
  final DateTime? deletedAt;

  ExpenseModel({
    required this.id,
    required this.paidById,
    this.paidByUsername = '',
    this.paidByProfilePic = '',
    required this.paidToId,
    this.paidToUsername = '',
    this.paidToProfilePic = '',
    required this.amount,
    required this.description,
    required this.date,
    required this.status,
    required this.settlementConfirmation,
    this.deletedAt,
  });

  factory ExpenseModel.fromJson(Map<String, dynamic> json) {
    // Determine paidBy detail
    String paidById = '';
    String paidByUsername = '';
    String paidByProfilePic = '';
    if (json['paidBy'] is Map) {
      final user = json['paidBy'];
      paidById = user['_id'] ?? user['id'] ?? '';
      paidByUsername = user['username'] ?? '';
      paidByProfilePic = user['profilePic'] ?? '';
    } else if (json['paidBy'] is String) {
      paidById = json['paidBy'];
    }

    // Determine paidTo detail
    String paidToId = '';
    String paidToUsername = '';
    String paidToProfilePic = '';
    if (json['paidTo'] is Map) {
      final user = json['paidTo'];
      paidToId = user['_id'] ?? user['id'] ?? '';
      paidToUsername = user['username'] ?? '';
      paidToProfilePic = user['profilePic'] ?? '';
    } else if (json['paidTo'] is String) {
      paidToId = json['paidTo'];
    }

    return ExpenseModel(
      id: json['_id'] ?? json['id'] ?? '',
      paidById: paidById,
      paidByUsername: paidByUsername,
      paidByProfilePic: paidByProfilePic,
      paidToId: paidToId,
      paidToUsername: paidToUsername,
      paidToProfilePic: paidToProfilePic,
      amount: (json['amount'] ?? 0.0).toDouble(),
      description: json['description'] ?? '',
      date: json['date'] != null ? DateTime.parse(json['date']) : DateTime.now(),
      status: json['status'] ?? false,
      settlementConfirmation: json['settlementConfirmation'] != null
          ? SettlementConfirmation.fromJson(json['settlementConfirmation'])
          : SettlementConfirmation(),
      deletedAt: json['deletedAt'] != null ? DateTime.tryParse(json['deletedAt']) : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      '_id': id,
      'paidBy': {
        '_id': paidById,
        'username': paidByUsername,
        'profilePic': paidByProfilePic,
      },
      'paidTo': {
        '_id': paidToId,
        'username': paidToUsername,
        'profilePic': paidToProfilePic,
      },
      'amount': amount,
      'description': description,
      'date': date.toIso8601String(),
      'status': status,
      'settlementConfirmation': settlementConfirmation.toJson(),
      'deletedAt': deletedAt?.toIso8601String(),
    };
  }
}
