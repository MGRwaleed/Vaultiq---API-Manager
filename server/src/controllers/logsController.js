import RequestLog from '../models/RequestLog.js';

export const getLogs = async (req, res) => {
  try {
    const { provider, status, endpoint, from, to, page = 1, limit = 25 } = req.query;

    const query = { user: req.user._id };

    if (provider && provider !== 'All') query.provider = provider;

    if (status && status !== 'All') {
      const ranges = { '2xx': [200, 299], '4xx': [400, 499], '5xx': [500, 599] };
      const [min, max] = ranges[status] || [];
      if (min) query.statusCode = { $gte: min, $lte: max };
    }

    if (endpoint) query.endpoint = { $regex: endpoint, $options: 'i' };

    if (from || to) {
      query.requestedAt = {};
      if (from) query.requestedAt.$gte = new Date(from);
      if (to) {
        const toDate = new Date(to);
        toDate.setHours(23, 59, 59, 999);
        query.requestedAt.$lte = toDate;
      }
    }

    const pageNum  = parseInt(page);
    const limitNum = parseInt(limit);
    const skip     = (pageNum - 1) * limitNum;

    const [logs, total] = await Promise.all([
      RequestLog.find(query).sort({ requestedAt: -1 }).skip(skip).limit(limitNum).lean(),
      RequestLog.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: logs,
      meta: {
        total,
        page: pageNum,
        limit: limitNum,
        hasMore: skip + logs.length < total,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to fetch logs.' });
  }
};

export const exportLogs = async (req, res) => {
  try {
    const { provider, status, endpoint, from, to } = req.query;
    const query = { user: req.user._id };

    if (provider && provider !== 'All') query.provider = provider;
    if (status && status !== 'All') {
      const ranges = { '2xx': [200, 299], '4xx': [400, 499], '5xx': [500, 599] };
      const [min, max] = ranges[status] || [];
      if (min) query.statusCode = { $gte: min, $lte: max };
    }
    if (endpoint) query.endpoint = { $regex: endpoint, $options: 'i' };
    if (from || to) {
      query.requestedAt = {};
      if (from) query.requestedAt.$gte = new Date(from);
      if (to) {
        const toDate = new Date(to);
        toDate.setHours(23, 59, 59, 999);
        query.requestedAt.$lte = toDate;
      }
    }

    const logs = await RequestLog.find(query).sort({ requestedAt: -1 }).limit(10000).lean();

    const headers = ['Timestamp', 'Provider', 'Key Name', 'Method', 'Endpoint', 'Status', 'Latency (ms)', 'Tokens', 'Cost (USD)', 'Error'];
    const rows = logs.map(l => [
      new Date(l.requestedAt).toISOString(),
      l.provider, l.keyName, l.method, l.endpoint,
      l.statusCode, l.latencyMs,
      l.tokensUsed ?? '', l.costUsd ?? '', l.errorMessage ?? '',
    ]);

    const csv = [headers, ...rows]
      .map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(','))
      .join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="logs-${Date.now()}.csv"`);
    res.send(csv);
  } catch {
    res.status(500).json({ success: false, message: 'Failed to export logs.' });
  }
};