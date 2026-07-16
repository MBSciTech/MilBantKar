import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:mobile/core/theme/app_theme.dart';
import 'package:mobile/presentation/providers/auth_provider.dart';
import 'package:mobile/presentation/screens/admin/admin_panel_screen.dart';
import '../auth/login_screen.dart';

class ProfileScreen extends StatefulWidget {
  const ProfileScreen({Key? key}) : super(key: key);

  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> {
  final _formKey = GlobalKey<FormState>();
  late TextEditingController _emailController;
  late TextEditingController _phoneController;
  bool _isEditing = false;

  @override
  void initState() {
    super.initState();
    final auth = Provider.of<AuthProvider>(context, listen: false);
    _emailController = TextEditingController(text: auth.currentUser?.email ?? '');
    _phoneController = TextEditingController(text: auth.currentUser?.phone ?? '');
  }

  @override
  void dispose() {
    _emailController.dispose();
    _phoneController.dispose();
    super.dispose();
  }

  void _saveProfile() async {
    if (!_formKey.currentState!.validate()) return;

    final auth = Provider.of<AuthProvider>(context, listen: false);
    final success = await auth.updateProfile(
      username: auth.currentUser?.username ?? '',
      email: _emailController.text.trim(),
      phone: _phoneController.text.trim(),
      profilePic: auth.currentUser?.profilePic ?? '',
    );

    if (success && mounted) {
      setState(() {
        _isEditing = false;
      });
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Profile updated successfully!'), backgroundColor: AppTheme.successColor),
      );
    } else if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(auth.error ?? 'Failed to update profile'), backgroundColor: AppTheme.dangerColor),
      );
    }
  }

  void _logout() async {
    final auth = Provider.of<AuthProvider>(context, listen: false);
    await auth.logout();
    if (mounted) {
      Navigator.pushAndRemoveUntil(
        context,
        MaterialPageRoute(builder: (context) => const LoginScreen()),
        (route) => false,
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final auth = Provider.of<AuthProvider>(context);
    final user = auth.currentUser;

    if (user == null) {
      return const Scaffold(body: Center(child: Text('Please login first')));
    }

    return Scaffold(
      appBar: AppBar(
        title: const Text('My Profile'),
        actions: [
          IconButton(
            icon: Icon(_isEditing ? Icons.cancel_outlined : Icons.edit_outlined),
            onPressed: () {
              setState(() {
                if (_isEditing) {
                  // Cancel reset controllers
                  _emailController.text = user.email;
                  _phoneController.text = user.phone;
                }
                _isEditing = !_isEditing;
              });
            },
          ),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(24.0),
        child: Form(
          key: _formKey,
          child: Column(
            children: [
              // User Avatar & Title
              CircleAvatar(
                radius: 48,
                backgroundColor: AppTheme.primaryLight,
                child: Text(
                  user.username.substring(0, 1).toUpperCase(),
                  style: const TextStyle(fontSize: 40, fontWeight: FontWeight.bold, color: AppTheme.primaryColor),
                ),
              ),
              const SizedBox(height: 16),
              Text(
                user.username,
                style: const TextStyle(fontSize: 22, fontWeight: FontWeight.bold, color: AppTheme.textPrimary),
              ),
              if (user.isAdmin) ...[
                const SizedBox(height: 6),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                  decoration: BoxDecoration(
                    color: AppTheme.warningColor.withOpacity(0.15),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: AppTheme.warningColor.withOpacity(0.3)),
                  ),
                  child: const Text(
                    'SYSTEM ADMIN',
                    style: TextStyle(color: AppTheme.warningColor, fontSize: 10, fontWeight: FontWeight.bold),
                  ),
                ),
              ],
              const SizedBox(height: 32),

              // Info card
              Card(
                child: Padding(
                  padding: const EdgeInsets.all(24.0),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      // Email Address
                      TextFormField(
                        controller: _emailController,
                        enabled: _isEditing,
                        decoration: const InputDecoration(
                          labelText: 'Email Address',
                          prefixIcon: Icon(Icons.mail_outline),
                        ),
                        validator: (val) => val == null || !val.contains('@') ? 'Enter a valid email' : null,
                      ),
                      const SizedBox(height: 16),

                      // Phone Number
                      TextFormField(
                        controller: _phoneController,
                        enabled: _isEditing,
                        decoration: const InputDecoration(
                          labelText: 'Phone Number',
                          prefixIcon: Icon(Icons.phone_outlined),
                        ),
                        validator: (val) => val == null || val.trim().isEmpty ? 'Phone number required' : null,
                      ),
                      
                      if (_isEditing) ...[
                        const SizedBox(height: 24),
                        auth.isLoading
                            ? const Center(child: CircularProgressIndicator(color: AppTheme.primaryColor))
                            : ElevatedButton(
                                onPressed: _saveProfile,
                                style: ElevatedButton.styleFrom(backgroundColor: AppTheme.primaryColor),
                                child: const Text('Save Changes'),
                              ),
                      ]
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 28),

              // Admin Portal Options
              if (user.isAdmin) ...[
                Card(
                  child: ListTile(
                    leading: const Icon(Icons.admin_panel_settings_outlined, color: AppTheme.warningColor),
                    title: const Text('Admin Operations Panel', style: TextStyle(fontWeight: FontWeight.bold)),
                    subtitle: const Text('Manage all events, expenses, and users.'),
                    trailing: const Icon(Icons.chevron_right),
                    onTap: () {
                      Navigator.push(
                        context,
                        MaterialPageRoute(builder: (context) => const AdminPanelScreen()),
                      );
                    },
                  ),
                ),
              ],

              const SizedBox(height: 28),

              // Logout Button
              SizedBox(
                width: double.infinity,
                child: ElevatedButton.icon(
                  onPressed: _logout,
                  icon: const Icon(Icons.logout, color: Colors.white),
                  label: const Text('Log Out', style: TextStyle(color: Colors.white)),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppTheme.dangerColor,
                    padding: const EdgeInsets.symmetric(vertical: 16),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
