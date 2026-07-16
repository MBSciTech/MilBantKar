import 'user_model.dart';
import 'expense_model.dart';

class EventModel {
  final String id;
  final String name;
  final String description;
  final String createdById;
  final String createdByUsername;
  final String code;
  final List<UserModel> participants;
  final List<ExpenseModel> expenses;
  final DateTime startDate;
  final DateTime? endDate;
  final bool isClosed;

  EventModel({
    required this.id,
    required this.name,
    this.description = '',
    required this.createdById,
    this.createdByUsername = '',
    required this.code,
    this.participants = const [],
    this.expenses = const [],
    required this.startDate,
    this.endDate,
    this.isClosed = false,
  });

  factory EventModel.fromJson(Map<String, dynamic> json) {
    // CreatedBy parsing
    String createdById = '';
    String createdByUsername = '';
    if (json['createdBy'] is Map) {
      createdById = json['createdBy']['_id'] ?? json['createdBy']['id'] ?? '';
      createdByUsername = json['createdBy']['username'] ?? '';
    } else if (json['createdBy'] is String) {
      createdById = json['createdBy'];
    }

    // Participants parsing
    List<UserModel> participantsList = [];
    if (json['participants'] is List) {
      for (var p in json['participants']) {
        if (p is Map) {
          participantsList.add(UserModel.fromJson(p.cast<String, dynamic>()));
        } else if (p is String) {
          participantsList.add(UserModel(
            id: p,
            username: '',
            email: '',
            balances: UserBalances(),
          ));
        }
      }
    }

    // Expenses parsing
    List<ExpenseModel> expensesList = [];
    if (json['expenses'] is List) {
      for (var e in json['expenses']) {
        if (e is Map) {
          expensesList.add(ExpenseModel.fromJson(e.cast<String, dynamic>()));
        } else if (e is String) {
          expensesList.add(ExpenseModel(
            id: e,
            paidById: '',
            paidToId: '',
            amount: 0.0,
            description: '',
            date: DateTime.now(),
            status: false,
            settlementConfirmation: SettlementConfirmation(),
          ));
        }
      }
    }

    return EventModel(
      id: json['_id'] ?? json['id'] ?? '',
      name: json['name'] ?? '',
      description: json['description'] ?? '',
      createdById: createdById,
      createdByUsername: createdByUsername,
      code: json['code'] ?? '',
      participants: participantsList,
      expenses: expensesList,
      startDate: json['startDate'] != null 
          ? DateTime.parse(json['startDate']) 
          : DateTime.now(),
      endDate: json['endDate'] != null ? DateTime.tryParse(json['endDate']) : null,
      isClosed: json['isClosed'] ?? false,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      '_id': id,
      'name': name,
      'description': description,
      'createdBy': createdById,
      'code': code,
      'participants': participants.map((p) => p.toJson()).toList(),
      'expenses': expenses.map((e) => e.toJson()).toList(),
      'startDate': startDate.toIso8601String(),
      'endDate': endDate?.toIso8601String(),
      'isClosed': isClosed,
    };
  }
}
