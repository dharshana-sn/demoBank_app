class TransactionData {
  final String id;
  final DateTime date;
  final String description;
  final String category;
  final double amount;
  final TransactionType type;

  TransactionData({
    required this.id,
    required this.date,
    required this.description,
    required this.category,
    required this.amount,
    required this.type,
  });
}

enum TransactionType { credit, debit }

class CategorySpending {
  final String category;
  final double amount;
  final double percentage;

  CategorySpending({
    required this.category,
    required this.amount,
    required this.percentage,
  });
}
