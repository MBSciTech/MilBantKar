import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

class AppTheme {
  // ── Bootstrap 5 matching palette ──────────────────────────────────────────
  static const Color primaryColor   = Color(0xFF0D6EFD); // bs-primary blue
  static const Color primaryDark    = Color(0xFF0A58CA);
  static const Color primaryLight   = Color(0xFFCFE2FF);
  static const Color secondaryColor = Color(0xFF6C757D); // bs-secondary
  static const Color successColor   = Color(0xFF198754); // bs-success
  static const Color successLight   = Color(0xFFD1E7DD);
  static const Color dangerColor    = Color(0xFFDC3545); // bs-danger
  static const Color dangerLight    = Color(0xFFF8D7DA);
  static const Color warningColor   = Color(0xFFFFC107); // bs-warning
  static const Color infoColor      = Color(0xFF0DCAF0); // bs-info

  // ── Light background / surface ────────────────────────────────────────────
  static const Color backgroundColor = Color(0xFFF8F9FA); // bs-light / bg-light
  static const Color surfaceColor    = Color(0xFFFFFFFF); // white cards
  static const Color cardColor       = Color(0xFFFFFFFF);
  static const Color borderColor     = Color(0xFFDEE2E6); // bs-border-color

  // ── Text ──────────────────────────────────────────────────────────────────
  static const Color textPrimary   = Color(0xFF212529); // bs-dark
  static const Color textSecondary = Color(0xFF6C757D); // bs-secondary
  static const Color textMuted     = Color(0xFFADB5BD);
  static const Color textLight     = Color(0xFFFFFFFF);

  // ── Gradients ─────────────────────────────────────────────────────────────
  static const Gradient primaryGradient = LinearGradient(
    colors: [primaryColor, Color(0xFF0A58CA)],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );

  static const Gradient successGradient = LinearGradient(
    colors: [successColor, Color(0xFF146C43)],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );

  // ── Shared metrics ────────────────────────────────────────────────────────
  static const double borderRadius     = 12.0; // slightly softer than bs (0.375rem~6px, we use 12 for mobile)
  static const double cardBorderRadius = 12.0;

  // ── Shadow ────────────────────────────────────────────────────────────────
  static List<BoxShadow> get cardShadow => [
    BoxShadow(
      color: Colors.black.withValues(alpha: 0.08),
      blurRadius: 8,
      offset: const Offset(0, 2),
    ),
  ];

  static List<BoxShadow> get elevatedShadow => [
    BoxShadow(
      color: primaryColor.withValues(alpha: 0.25),
      blurRadius: 12,
      offset: const Offset(0, 4),
    ),
  ];

  // ══════════════════════════════════════════════════════════════════════════
  // Light Theme
  // ══════════════════════════════════════════════════════════════════════════
  static ThemeData get lightTheme {
    final base = ThemeData.light(useMaterial3: false);
    final textTheme = GoogleFonts.interTextTheme(base.textTheme);

    return base.copyWith(
      primaryColor: primaryColor,
      scaffoldBackgroundColor: backgroundColor,
      cardColor: cardColor,

      colorScheme: const ColorScheme.light(
        primary:   primaryColor,
        secondary: secondaryColor,
        error:     dangerColor,
        surface:   surfaceColor,
        onPrimary: Colors.white,
        onSurface: textPrimary,
      ),

      textTheme: textTheme.copyWith(
        displayLarge:  GoogleFonts.inter(color: textPrimary, fontSize: 32, fontWeight: FontWeight.bold),
        headlineMedium: GoogleFonts.inter(color: textPrimary, fontSize: 22, fontWeight: FontWeight.bold),
        titleLarge:    GoogleFonts.inter(color: textPrimary, fontSize: 18, fontWeight: FontWeight.w600),
        titleMedium:   GoogleFonts.inter(color: textPrimary, fontSize: 16, fontWeight: FontWeight.w600),
        bodyLarge:     GoogleFonts.inter(color: textPrimary, fontSize: 16),
        bodyMedium:    GoogleFonts.inter(color: textSecondary, fontSize: 14),
        bodySmall:     GoogleFonts.inter(color: textMuted, fontSize: 12),
        labelLarge:    GoogleFonts.inter(color: Colors.white, fontSize: 16, fontWeight: FontWeight.w600),
      ),

      appBarTheme: AppBarTheme(
        backgroundColor: surfaceColor,
        elevation: 1,
        shadowColor: Colors.black.withValues(alpha: 0.08),
        centerTitle: true,
        titleTextStyle: GoogleFonts.inter(
          color: textPrimary,
          fontSize: 18,
          fontWeight: FontWeight.bold,
        ),
        iconTheme: const IconThemeData(color: textPrimary),
        actionsIconTheme: const IconThemeData(color: textPrimary),
        surfaceTintColor: Colors.transparent,
      ),

      cardTheme: CardThemeData(
        color: cardColor,
        elevation: 2,
        shadowColor: Colors.black.withValues(alpha: 0.08),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(cardBorderRadius),
          side: const BorderSide(color: borderColor, width: 1),
        ),
        margin: const EdgeInsets.only(bottom: 12),
      ),

      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: primaryColor,
          foregroundColor: Colors.white,
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 14),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(8),
          ),
          textStyle: GoogleFonts.inter(
            fontSize: 15,
            fontWeight: FontWeight.w600,
          ),
          elevation: 2,
        ),
      ),

      outlinedButtonTheme: OutlinedButtonThemeData(
        style: OutlinedButton.styleFrom(
          foregroundColor: primaryColor,
          side: const BorderSide(color: primaryColor, width: 1.5),
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 14),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(8),
          ),
          textStyle: GoogleFonts.inter(
            fontSize: 15,
            fontWeight: FontWeight.w600,
          ),
        ),
      ),

      textButtonTheme: TextButtonThemeData(
        style: TextButton.styleFrom(
          foregroundColor: primaryColor,
          textStyle: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.w500),
        ),
      ),

      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: surfaceColor,
        hintStyle: GoogleFonts.inter(color: textMuted, fontSize: 14),
        labelStyle: GoogleFonts.inter(color: textSecondary, fontSize: 14),
        floatingLabelStyle: GoogleFonts.inter(color: primaryColor, fontSize: 12),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(8),
          borderSide: const BorderSide(color: borderColor),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(8),
          borderSide: const BorderSide(color: borderColor),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(8),
          borderSide: const BorderSide(color: primaryColor, width: 2),
        ),
        errorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(8),
          borderSide: const BorderSide(color: dangerColor, width: 1.5),
        ),
        focusedErrorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(8),
          borderSide: const BorderSide(color: dangerColor, width: 2),
        ),
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        prefixIconColor: textSecondary,
        suffixIconColor: textSecondary,
      ),

      bottomNavigationBarTheme: BottomNavigationBarThemeData(
        backgroundColor: surfaceColor,
        selectedItemColor: primaryColor,
        unselectedItemColor: textMuted,
        elevation: 8,
        type: BottomNavigationBarType.fixed,
        selectedLabelStyle: GoogleFonts.inter(fontSize: 11, fontWeight: FontWeight.w600),
        unselectedLabelStyle: GoogleFonts.inter(fontSize: 11),
      ),

      dividerTheme: const DividerThemeData(
        color: borderColor,
        thickness: 1,
        space: 0,
      ),

      chipTheme: ChipThemeData(
        backgroundColor: backgroundColor,
        side: const BorderSide(color: borderColor),
        labelStyle: GoogleFonts.inter(color: textPrimary, fontSize: 13),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      ),

      listTileTheme: const ListTileThemeData(
        tileColor: Colors.transparent,
        iconColor: textSecondary,
        textColor: textPrimary,
        contentPadding: EdgeInsets.symmetric(horizontal: 16, vertical: 4),
      ),

      snackBarTheme: SnackBarThemeData(
        backgroundColor: textPrimary,
        contentTextStyle: GoogleFonts.inter(color: Colors.white, fontSize: 14),
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
      ),

      progressIndicatorTheme: const ProgressIndicatorThemeData(
        color: primaryColor,
      ),

      floatingActionButtonTheme: FloatingActionButtonThemeData(
        backgroundColor: primaryColor,
        foregroundColor: Colors.white,
        elevation: 4,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      ),
    );
  }

  // Keep old darkTheme accessor so existing references compile, now unused
  static ThemeData get darkTheme => lightTheme;
}
