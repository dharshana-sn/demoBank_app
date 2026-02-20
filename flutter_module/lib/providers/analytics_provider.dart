import 'package:flutter/material.dart';

class AnalyticsProvider with ChangeNotifier {
  DateTimeRange _selectedDateRange = DateTimeRange(
    start: DateTime.now().subtract(const Duration(days: 30)),
    end: DateTime.now(),
  );
  
  String _selectedCategory = 'All';
  final List<String> _categories = ['All', 'Shopping', 'Bills', 'Dining', 'Transfers', 'Entertainment'];

  DateTimeRange get selectedDateRange => _selectedDateRange;
  String get selectedCategory => _selectedCategory;
  List<String> get categories => _categories;

  double get totalExpenses => 4250.75; // Mock value

  void updateDateRange(DateTimeRange range) {
    _selectedDateRange = range;
    notifyListeners();
  }

  void selectCategory(String category) {
    _selectedCategory = category;
    notifyListeners();
  }

  // Mock data for charts
  List<Map<String, dynamic>> get monthlySpending => [
    {'month': 'Jan', 'amount': 1200.0},
    {'month': 'Feb', 'amount': 1500.0},
    {'month': 'Mar', 'amount': 1100.0},
    {'month': 'Apr', 'amount': 1800.0},
  ];
}
