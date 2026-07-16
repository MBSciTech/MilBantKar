class UserBalances {
  final double owedToOthers;
  final double owedByOthers;

  UserBalances({
    this.owedToOthers = 0.0,
    this.owedByOthers = 0.0,
  });

  factory UserBalances.fromJson(Map<String, dynamic> json) {
    return UserBalances(
      owedToOthers: (json['owedToOthers'] ?? 0.0).toDouble(),
      owedByOthers: (json['owedByOthers'] ?? 0.0).toDouble(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'owedToOthers': owedToOthers,
      'owedByOthers': owedByOthers,
    };
  }
}

class UserModel {
  final String id;
  final bool isAdmin;
  final String username;
  final String email;
  final String phone;
  final String profilePic;
  final UserBalances balances;

  UserModel({
    required this.id,
    this.isAdmin = false,
    required this.username,
    required this.email,
    this.phone = '',
    this.profilePic = '',
    required this.balances,
  });

  factory UserModel.fromJson(Map<String, dynamic> json) {
    return UserModel(
      id: json['_id'] ?? json['id'] ?? '',
      isAdmin: json['isAdmin'] ?? false,
      username: json['username'] ?? '',
      email: json['email'] ?? '',
      phone: json['phone'] ?? '',
      profilePic: json['profilePic'] ?? '',
      balances: json['balances'] != null
          ? UserBalances.fromJson(json['balances'])
          : UserBalances(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      '_id': id,
      'isAdmin': isAdmin,
      'username': username,
      'email': email,
      'phone': phone,
      'profilePic': profilePic,
      'balances': balances.toJson(),
    };
  }
}
