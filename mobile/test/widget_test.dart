import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mobile/main.dart';

void main() {
  setUpAll(() async {
    await dotenv.load(fileName: '.env');
  });

  testWidgets('App launch session check gate test', (WidgetTester tester) async {
    await tester.pumpWidget(const MyApp());

    expect(find.text('MilBantKar'), findsOneWidget);
    expect(find.text('Securing session...'), findsOneWidget);
  });
}
