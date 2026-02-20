import 'package:flutter/material.dart';

class TransactionHeatmap extends StatelessWidget {
  const TransactionHeatmap({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Daily Activity',
          style: TextStyle(fontSize: 14, color: Colors.grey),
        ),
        const SizedBox(height: 12),
        GridView.builder(
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
            crossAxisCount: 7,
            mainAxisSpacing: 4,
            crossAxisSpacing: 4,
          ),
          itemCount: 28, // Last 4 weeks
          itemBuilder: (context, index) {
            // Mocking intensity of transactions
            final intensity = (index * 31) % 5; 
            return Container(
              decoration: BoxDecoration(
                color: _getHeatmapColor(intensity),
                borderRadius: BorderRadius.circular(4),
              ),
            );
          },
        ),
        const SizedBox(height: 8),
        Row(
          mainAxisAlignment: MainAxisAlignment.end,
          children: [
            const Text('Less', style: TextStyle(fontSize: 10)),
            const SizedBox(width: 4),
            ...List.generate(5, (i) => Container(
              width: 10,
              height: 10,
              margin: const EdgeInsets.symmetric(horizontal: 1),
              color: _getHeatmapColor(i),
            )),
            const SizedBox(width: 4),
            const Text('More', style: TextStyle(fontSize: 10)),
          ],
        )
      ],
    );
  }

  Color _getHeatmapColor(int intensity) {
    switch (intensity) {
      case 0: return Colors.grey.shade100;
      case 1: return Colors.blue.shade100;
      case 2: return Colors.blue.shade300;
      case 3: return Colors.blue.shade600;
      case 4: return Colors.blue.shade900;
      default: return Colors.grey.shade100;
    }
  }
}
