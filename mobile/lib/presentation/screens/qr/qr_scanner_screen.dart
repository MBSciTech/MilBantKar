import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:mobile_scanner/mobile_scanner.dart';
import 'package:qr_flutter/qr_flutter.dart';
import 'package:mobile/core/theme/app_theme.dart';
import 'package:mobile/presentation/providers/auth_provider.dart';
import 'package:mobile/presentation/providers/event_provider.dart';
import 'package:mobile/presentation/screens/transactions/add_transaction_screen.dart';

class QRScannerScreen extends StatefulWidget {
  final bool isJoinEventScanner;
  
  const QRScannerScreen({
    Key? key,
    this.isJoinEventScanner = false,
  }) : super(key: key);

  @override
  State<QRScannerScreen> createState() => _QRScannerScreenState();
}

class _QRScannerScreenState extends State<QRScannerScreen> with SingleTickerProviderStateMixin {
  late TabController _tabController;
  final MobileScannerController _scannerController = MobileScannerController();
  bool _isScanCompleted = false;

  // Saved UPI details for the user, can default to a mockup handle
  String _userUpiId = '';

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
    
    // Default UPI ID for current user
    final auth = Provider.of<AuthProvider>(context, listen: false);
    final username = auth.currentUser?.username ?? 'user';
    _userUpiId = '$username@okaxis';
  }

  @override
  void dispose() {
    _tabController.dispose();
    _scannerController.dispose();
    super.dispose();
  }

  // Parse UPI deep links (e.g. upi://pay?pa=name@bank&pn=Name&am=100)
  Map<String, String> _parseUpiUrl(String url) {
    final Map<String, String> params = {};
    try {
      final uri = Uri.parse(url);
      if (uri.scheme == 'upi' && uri.host == 'pay') {
        uri.queryParameters.forEach((key, value) {
          params[key] = value;
        });
      }
    } catch (_) {}
    return params;
  }

  void _onDetect(BarcodeCapture capture) async {
    if (_isScanCompleted) return;
    
    final List<Barcode> barcodes = capture.barcodes;
    if (barcodes.isNotEmpty) {
      final barcode = barcodes.first;
      final String codeValue = barcode.rawValue ?? '';
      
      if (codeValue.isNotEmpty) {
        setState(() {
          _isScanCompleted = true;
        });

        // ── Case 1: Scanning to join an event ─────────────────────────
        if (widget.isJoinEventScanner) {
          final auth = Provider.of<AuthProvider>(context, listen: false);
          final eventProv = Provider.of<EventProvider>(context, listen: false);
          final userId = auth.currentUser?.id;

          if (userId != null) {
            final cleanCode = codeValue.trim();
            final success = await eventProv.joinEvent(cleanCode, userId);
            if (success && mounted) {
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(
                  content: Text('Joined event successfully! 🎉'),
                  backgroundColor: AppTheme.successColor,
                ),
              );
              Navigator.pop(context);
              return;
            } else if (mounted) {
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(
                  content: Text(eventProv.error ?? 'Event not found or code invalid'),
                  backgroundColor: AppTheme.dangerColor,
                ),
              );
            }
          }
          setState(() {
            _isScanCompleted = false;
          });
          return;
        }
        
        // ── Case 2: Scanning a UPI Payment code ────────────────────────
        final upiParams = _parseUpiUrl(codeValue);
        
        if (upiParams.containsKey('pa')) {
          final upiId = upiParams['pa'] ?? '';
          final name = upiParams['pn'] ?? 'UPI Recipient';

          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text('Scanned UPI: $upiId ($name)'),
              backgroundColor: AppTheme.successColor,
            ),
          );

          // Route to transaction logger pre-populated with parsed details
          Navigator.pushReplacement(
            context,
            MaterialPageRoute(
              builder: (context) => const AddTransactionScreen(),
            ),
          );
        } else {
          // Standard text scanned
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text('Scanned Code: $codeValue'),
              backgroundColor: AppTheme.primaryColor,
            ),
          );
          
          setState(() {
            _isScanCompleted = false;
          });
        }
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final auth = Provider.of<AuthProvider>(context);
    final username = auth.currentUser?.username ?? 'User';

    // UPI Link for currently logged-in user
    final upiUrl = 'upi://pay?pa=$_userUpiId&pn=$username&cu=INR';

    return Scaffold(
      appBar: AppBar(
        title: Text(widget.isJoinEventScanner ? 'Scan Event QR Code' : 'Settlement QR Code'),
        bottom: widget.isJoinEventScanner 
            ? null 
            : TabBar(
                controller: _tabController,
                indicatorColor: AppTheme.primaryColor,
                tabs: const [
                  Tab(icon: Icon(Icons.qr_code_scanner), text: 'Scan QR'),
                  Tab(icon: Icon(Icons.qr_code), text: 'Receive Payment'),
                ],
              ),
      ),
      body: widget.isJoinEventScanner
          ? _buildCameraScanner()
          : TabBarView(
              controller: _tabController,
              physics: const NeverScrollableScrollPhysics(), // Prevent camera dispose issues
              children: [
                _buildCameraScanner(),
                _buildReceivePaymentTab(username, upiUrl),
              ],
            ),
    );
  }

  Widget _buildCameraScanner() {
    return Stack(
      children: [
        MobileScanner(
          controller: _scannerController,
          onDetect: _onDetect,
        ),
        // Overlay guiding scanning square
        Center(
          child: Container(
            width: 250,
            height: 250,
            decoration: BoxDecoration(
              border: Border.all(color: AppTheme.primaryColor, width: 3),
              borderRadius: BorderRadius.circular(20),
            ),
          ),
        ),
        Positioned(
          bottom: 40,
          left: 20,
          right: 20,
          child: Card(
            color: Colors.black54,
            child: Padding(
              padding: const EdgeInsets.all(12.0),
              child: Text(
                widget.isJoinEventScanner
                    ? 'Align the Event QR code inside the frame to join automatically'
                    : 'Scan any UPI QR Code to log a payment settle-up instantly',
                textAlign: TextAlign.center,
                style: const TextStyle(color: Colors.white70, fontSize: 13),
              ),
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildReceivePaymentTab(String username, String upiUrl) {
    return Container(
      padding: const EdgeInsets.all(32),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Card(
            child: Padding(
              padding: const EdgeInsets.all(28.0),
              child: Column(
                children: [
                  Text(
                    username.toUpperCase(),
                    style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 20),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    'UPI ID: $_userUpiId',
                    style: const TextStyle(color: AppTheme.textSecondary, fontSize: 13),
                  ),
                  const SizedBox(height: 24),
                  
                  // QR Renderer
                  Container(
                    color: Colors.white,
                    padding: const EdgeInsets.all(12),
                    child: QrImageView(
                      data: upiUrl,
                      version: QrVersions.auto,
                      size: 200.0,
                      gapless: false,
                    ),
                  ),
                  const SizedBox(height: 24),
                  const Text(
                    'Scan this QR code with any UPI App to pay this user.',
                    textAlign: TextAlign.center,
                    style: TextStyle(color: AppTheme.textSecondary, fontSize: 12),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}
