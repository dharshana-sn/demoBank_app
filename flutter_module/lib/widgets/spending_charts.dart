import 'package:flutter/material.dart';

class SpendingCharts extends StatelessWidget {
  const SpendingCharts({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        _buildChartToggle(),
        const SizedBox(height: 20),
        SizedBox(
          height: 200,
          width: double.infinity,
          child: CustomPaint(
            painter: _BarChartPainter(),
          ),
        ),
        const SizedBox(height: 20),
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceAround,
          children: [
            _buildLegendItem('Rent', Colors.blue),
            _buildLegendItem('Food', Colors.green),
            _buildLegendItem('Travel', Colors.orange),
            _buildLegendItem('Other', Colors.purple),
          ],
        )
      ],
    );
  }

  Widget _buildChartToggle() {
    return Row(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        ChoiceChip(label: const Text('Bar'), selected: true, onSelected: (_) {}),
        const SizedBox(width: 8),
        ChoiceChip(label: const Text('Pie'), selected: false, onSelected: (_) {}),
        const SizedBox(width: 8),
        ChoiceChip(label: const Text('Line'), selected: false, onSelected: (_) {}),
      ],
    );
  }

  Widget _buildLegendItem(String label, Color color) {
    return Row(
      children: [
        Container(width: 12, height: 12, color: color),
        const SizedBox(width: 4),
        Text(label, style: const TextStyle(fontSize: 12)),
      ],
    );
  }
}

class _BarChartPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()..style = PaintingStyle.fill;
    final double barWidth = size.width / 7;
    final List<double> values = [0.8, 0.6, 0.9, 0.4, 0.7, 0.5, 0.8];
    final List<Color> colors = [Colors.blue, Colors.green, Colors.orange, Colors.purple, Colors.red, Colors.teal, Colors.indigo];

    for (int i = 0; i < values.length; i++) {
      paint.color = colors[i].withOpacity(0.8);
      final double barHeight = size.height * values[i];
      canvas.drawRect(
        Rect.fromLTWH(
          i * barWidth + (barWidth * 0.1),
          size.height - barHeight,
          barWidth * 0.8,
          barHeight,
        ),
        paint,
      );
    }
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}
