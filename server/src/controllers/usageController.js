import RequestLog from '../models/RequestLog.js';
import ApiKey from '../models/ApiKey.js';

export const getUsageStats = async (req, res) => {
  try {
    const userId        = req.user._id;
    const now           = new Date();
    const thirtyDaysAgo = new Date(now - 30 * 86400000);
    const todayStart    = new Date(new Date().setHours(0, 0, 0, 0));

    const [
      totalRequestsThisMonth, todayRequests, costAgg, latencyAgg,
      errorAgg, providerShare, dailyRequests, dailyCost,
      latencyByProvider, activeKeys, totalKeys,
    ] = await Promise.all([

      RequestLog.countDocuments({ user: userId, requestedAt: { $gte: thirtyDaysAgo } }),

      RequestLog.countDocuments({ user: userId, requestedAt: { $gte: todayStart } }),

      RequestLog.aggregate([
        { $match: { user: userId, requestedAt: { $gte: thirtyDaysAgo }, costUsd: { $ne: null } } },
        { $group: { _id: null, total: { $sum: '$costUsd' } } },
      ]),

      RequestLog.aggregate([
        { $match: { user: userId, requestedAt: { $gte: thirtyDaysAgo } } },
        { $group: { _id: null, avg: { $avg: '$latencyMs' } } },
      ]),

      RequestLog.aggregate([
        { $match: { user: userId, requestedAt: { $gte: thirtyDaysAgo } } },
        { $group: {
          _id: null,
          total:  { $sum: 1 },
          errors: { $sum: { $cond: [{ $gte: ['$statusCode', 400] }, 1, 0] } },
        }},
      ]),

      RequestLog.aggregate([
        { $match: { user: userId, requestedAt: { $gte: thirtyDaysAgo } } },
        { $group: { _id: '$provider', value: { $sum: 1 } } },
        { $project: { name: '$_id', value: 1, _id: 0 } },
        { $sort: { value: -1 } },
      ]),

      RequestLog.aggregate([
        { $match: { user: userId, requestedAt: { $gte: thirtyDaysAgo } } },
        { $group: {
          _id: {
            date:     { $dateToString: { format: '%b %d', date: '$requestedAt' } },
            provider: '$provider',
          },
          count: { $sum: 1 },
        }},
        { $sort: { '_id.date': 1 } },
      ]),

      RequestLog.aggregate([
        { $match: { user: userId, requestedAt: { $gte: thirtyDaysAgo }, costUsd: { $ne: null } } },
        { $group: {
          _id: {
            date:     { $dateToString: { format: '%b %d', date: '$requestedAt' } },
            provider: '$provider',
          },
          cost: { $sum: '$costUsd' },
        }},
        { $sort: { '_id.date': 1 } },
      ]),

      RequestLog.aggregate([
        { $match: { user: userId, requestedAt: { $gte: thirtyDaysAgo } } },
        { $group: { _id: '$provider', latencies: { $push: '$latencyMs' } } },
      ]),

      ApiKey.countDocuments({ user: userId, isActive: true }),
      ApiKey.countDocuments({ user: userId }),
    ]);

    const allDates  = getLast30Days();
    const providers = [...new Set(dailyRequests.map(d => d._id.provider))];

    const requestsPerDay = allDates.map(date => {
      const row = { date };
      providers.forEach(p => {
        const found = dailyRequests.find(d => d._id.date === date && d._id.provider === p);
        row[p] = found?.count || 0;
      });
      return row;
    });

    const costPerDay = allDates.map(date => {
      const row = { date };
      providers.forEach(p => {
        const found = dailyCost.find(d => d._id.date === date && d._id.provider === p);
        row[p] = parseFloat((found?.cost || 0).toFixed(4));
      });
      return row;
    });

    const dailyErrors = await RequestLog.aggregate([
      { $match: { user: userId, requestedAt: { $gte: thirtyDaysAgo } } },
      { $group: {
        _id:    { $dateToString: { format: '%b %d', date: '$requestedAt' } },
        total:  { $sum: 1 },
        errors: { $sum: { $cond: [{ $gte: ['$statusCode', 400] }, 1, 0] } },
      }},
      { $sort: { _id: 1 } },
    ]);

    const errorRatePerDay = allDates.map(date => {
      const found = dailyErrors.find(d => d._id === date);
      const rate  = found ? parseFloat(((found.errors / found.total) * 100).toFixed(2)) : 0;
      return { date, rate };
    });

    const latencyStats = latencyByProvider.map(({ _id, latencies }) => {
      const sorted = [...latencies].sort((a, b) => a - b);
      const p50 = sorted[Math.floor(sorted.length * 0.50)] || 0;
      const p95 = sorted[Math.floor(sorted.length * 0.95)] || 0;
      return { provider: _id, p50: Math.round(p50), p95: Math.round(p95) };
    });

    const totalCost  = parseFloat((costAgg[0]?.total || 0).toFixed(4));
    const avgLatency = Math.round(latencyAgg[0]?.avg || 0);
    const errorTotal = errorAgg[0]?.total  || 0;
    const errorCount = errorAgg[0]?.errors || 0;
    const errorRate  = errorTotal ? parseFloat(((errorCount / errorTotal) * 100).toFixed(2)) : 0;
    const topProvider   = providerShare[0]?.name || '—';
    const mostExpensive = getMostExpensive(dailyCost);

    res.json({
      success: true,
      data: {
        days: allDates,
        requestsPerDay,
        costPerDay,
        errorRatePerDay,
        latencyByProvider: latencyStats,
        providerShare,
        summary: {
          totalRequestsThisMonth,
          todayRequests,
          totalCostThisMonth: totalCost,
          avgLatencyMs: avgLatency,
          errorRatePercent: errorRate,
          topProvider,
          mostExpensive,
          activeKeys,
          totalKeys,
        },
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to fetch usage stats.' });
  }
};

function getLast30Days() {
  return Array.from({ length: 30 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (29 - i));
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  });
}

function getMostExpensive(dailyCost) {
  const totals = {};
  dailyCost.forEach(({ _id, cost }) => {
    totals[_id.provider] = (totals[_id.provider] || 0) + cost;
  });
  return Object.entries(totals).sort((a, b) => b[1] - a[1])[0]?.[0] || '—';
}