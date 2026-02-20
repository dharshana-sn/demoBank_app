import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/analytics_provider.dart';
import '../widgets/spending_charts.dart';
import '../widgets/transaction_heatmap.dart';

class AnalyticsScreen extends StatelessWidget {
  const AnalyticsScreen({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Financial Analytics'),
        actions: [
          IconButton(
            icon: const Icon(Icons.download),
            onPressed: () {
              // TODO: Implement Download Statement
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(content: Text('Downloading statement...')),
              );
            },
            tooltip: 'Download Statement',
          ),
        ],
      ),
      body: Consumer<AnalyticsProvider>(
        builder: (context, provider, child) {
          return SingleChildScrollView(
            padding: const EdgeInsets.all(16.0),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                _buildHeader(context, provider),
                const SizedBox(height: 24),
                
                _buildExpandableCard(
                  title: 'Spending Breakdown',
                  icon: Icons.pie_chart,
                  child: const SpendingCharts(),
                ),
                const SizedBox(height: 16),
                
                _buildExpandableCard(
                  title: 'Activity Heatmap',
                  icon: Icons.grid_on,
                  child: const TransactionHeatmap(),
                ),
                const SizedBox(height: 16),
                
                _buildMonthlyBreakdown(provider),
              ],
            ),
          );
        },
      ),
    );
  }

  Widget _buildHeader(BuildContext context, AnalyticsProvider provider) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Total Expenses',
              style: Theme.of(context).textTheme.titleSmall,
            ),
            Text(
              '\$${provider.totalExpenses.toStringAsFixed(2)}',
              style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                    fontWeight: FontWeight.bold,
                    color: Colors.redAccent,
                  ),
            ),
          ],
        ),
        ElevatedButton.icon(
          onPressed: () async {
            final DateTimeRange? picked = await showDateRangePicker(
              context: context,
              initialDateRange: provider.selectedDateRange,
              firstDate: DateTime(2020),
              lastDate: DateTime.now(),
            );
            if (picked != null) {
              provider.updateDateRange(picked);
            }
          },
          icon: const Icon(Icons.calendar_today, size: 16),
          label: const Text('Filter Date'),
        ),
      ],
    );
  }

  Widget _buildExpandableCard({
    required String title,
    required IconData icon,
    required Widget child,
  }) {
    return Card(
      elevation: 2,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      child: ExpansionTile(
        initiallyExpanded: true,
        leading: Icon(icon, color: Colors.blue),
        title: Text(
          title,
          style: const TextStyle(fontWeight: FontWeight.bold),
        ),
        children: [
          Padding(
            padding: const EdgeInsets.all(16.0),
            child: child,
          ),
        ],
      ),
    );
  }

  Widget _buildMonthlyBreakdown(AnalyticsProvider provider) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Padding(
          padding: EdgeInsets.symmetric(vertical: 8.0),
          child: Text(
            'Category Filtering',
            style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
          ),
        ),
        SizedBox(
          height: 50,
          child: ListView(
            scrollDirection: Axis.horizontal,
            children: provider.categories.map((category) {
              final isSelected = provider.selectedCategory == category;
              return Padding(
                padding: const EdgeInsets.only(right: 8.0),
                child: FilterChip(
                  label: Text(category),
                  selected: isSelected,
                  onSelected: (_) => provider.selectCategory(category),
                  selectedColor: Colors.blue.withOpacity(0.2),
                  checkmarkColor: Colors.blue,
                ),
              );
            }).toList(),
          ),
        ),
      ],
    );
  }
}
