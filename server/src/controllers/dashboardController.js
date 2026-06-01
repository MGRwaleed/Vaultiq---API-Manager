import RequestLog from '../models/RequestLog.js';
import ApiKey from '../models/ApiKey.js';

export const getDashboardStats = async (req, res) => {
  try {
    const userId     = req.user._id;
    const todayStart = new Date(new Date().setHours(0, 0, 0, 0));
    const monthStart = new Date(Date.now() - 30 * 86400000);

    const [
      totalApis,
      activeKeys,
      totalRequestsToday,
      costThisMonth,
      requestsOverWeek,
      costOverWeek,
      topApis,
      recentLogs,
      totalErrors,
      totalRequests,
    ] = await Promise.all([

      // Total API keys
      ApiKey.countDocuments({ user: userId }),

      // Active keys
      ApiKey.countDocuments({ user: userId, isActive: true }),

      // Total requests today
      RequestLog.countDocuments({ user: userId, requestedAt: { $gte: todayStart } }),

      // Estimated cost this month
      RequestLog.aggregate([
        { $match: { user: userId, requestedAt: { $gte: monthStart }, costUsd: { $ne: null } } },
        { $group: { _id: null, total: { $sum: '$costUsd' } } },
      ]),

      // Requests over last 7 days (for sparkline)
      RequestLog.aggregate([
        { $match: { user: userId, requestedAt: { $gte: new Date(Date.now() - 7 * 86400000) } } },
        { $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$requestedAt' } },
          count: { $sum: 1 },
        }},
        { $sort: { _id: 1 } },
      ]),

      // Cost over last 7 days (for sparkline)
      RequestLog.aggregate([
        { $match: { user: userId, requestedAt: { $gte: new Date(Date.now() - 7 * 86400000) }, costUsd: { $ne: null } } },
        { $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$requestedAt' } },
          cost: { $sum: '$costUsd' },
        }},
        { $sort: { _id: 1 } },
      ]),

      // Top APIs by requests this month
      RequestLog.aggregate([
        { $match: { user: userId, requestedAt: { $gte: monthStart } } },
        { $group: {
          _id: '$provider',
          requests: { $sum: 1 },
          cost:     { $sum: { $ifNull: ['$costUsd', 0] } },
          errors:   { $sum: { $cond: [{ $gte: ['$statusCode', 400] }, 1, 0] } },
        }},
        { $sort: { requests: -1 } },
        { $limit: 5 },
      ]),

      // Recent 5 logs
      RequestLog.find({ user: userId })
        .sort({ requestedAt: -1 })
        .limit(5)
        .lean(),

      // Total errors this month
      RequestLog.countDocuments({
        user: userId,
        requestedAt: { $gte: monthStart },
        statusCode: { $gte: 400 },
      }),

      // Total requests this month (for error rate)
      RequestLog.countDocuments({ user: userId, requestedAt: { $gte: monthStart } }),
    ]);

    // Fill missing days in sparkline with 0
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(Date.now() - (6 - i) * 86400000);
      return d.toISOString().split('T')[0];
    });

    const requestsSparkline = last7Days.map(date => {
      const found = requestsOverWeek.find(r => r._id === date);
      return found?.count || 0;
    });

    const costSparkline = last7Days.map(date => {
      const found = costOverWeek.find(r => r._id === date);
      return parseFloat((found?.cost || 0).toFixed(4));
    });

    // Format top APIs
    const formattedTopApis = topApis.map(a => ({
      name:     a._id,
      provider: a._id.toLowerCase(),
      requests: a.requests,
      cost:     parseFloat(a.cost.toFixed(4)),
      status:   a.errors / a.requests > 0.1 ? 'warning' : 'healthy',
    }));

    // Format recent logs
    const formattedLogs = recentLogs.map(l => ({
      id:        l._id,
      api:       l.provider,
      endpoint:  l.endpoint,
      status:    l.statusCode,
      latency:   l.latencyMs,
      timestamp: l.requestedAt,
    }));

    const errorRate = totalRequests
      ? parseFloat(((totalErrors / totalRequests) * 100).toFixed(2))
      : 0;

    res.json({
      success: true,
      data: {
        totalApis,
        activeKeys,
        totalRequestsToday,
        estimatedCostThisMonth: parseFloat((costThisMonth[0]?.total || 0).toFixed(4)),
        errorRate,
        requestsOverWeek: requestsSparkline,
        costOverWeek:     costSparkline,
        topApis:          formattedTopApis,
        recentLogs:       formattedLogs,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to fetch dashboard stats.' });
  }
};