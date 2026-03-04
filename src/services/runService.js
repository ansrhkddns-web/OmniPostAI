export function createRunService(runRepository) {
  function listRunRecords() {
    return runRepository
      .list()
      .map((id) => runRepository.getById(id))
      .filter(Boolean)
      .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  }

  function getRecentRuns(limit = 5) {
    const safeLimit = Number.isFinite(limit) ? Math.max(0, Math.floor(limit)) : 5;
    return listRunRecords().slice(0, safeLimit);
  }

  return {
    listRuns() {
      return runRepository.list();
    },

    listRunRecords,

    getRecentRuns,

    getRun(runId) {
      return runRepository.getById(runId);
    },

    recordRun({ pipelineId, summary, order, reportPath, warnings = [] }) {
      const runId = `run_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      const record = {
        runId,
        pipelineId,
        summary,
        order,
        reportPath,
        warnings,
        createdAt: new Date().toISOString(),
      };
      return runRepository.save(record);
    },

    getStats() {
      const records = listRunRecords();
      const totalRuns = records.length;
      if (totalRuns === 0) {
        return {
          totalRuns: 0,
          avgSuccessRate: 0,
          avgLatency: 0,
          totalTokens: 0,
          totalEstimatedCost: 0,
          byPipeline: {},
          failureReasons: {},
          totalRetries: 0,
        };
      }

      const totalTokens = records.reduce((sum, r) => sum + (r.summary?.totalTokens ?? 0), 0);
      const totalEstimatedCost = Number(records.reduce((sum, r) => sum + (r.summary?.estimatedCost ?? 0), 0).toFixed(5));
      const avgSuccessRate = Number(
        (records.reduce((sum, r) => sum + (r.summary?.successRate ?? 0), 0) / totalRuns).toFixed(2),
      );
      const avgLatency = Number(
        (records.reduce((sum, r) => sum + (r.summary?.avgLatency ?? 0), 0) / totalRuns).toFixed(2),
      );

      const byPipeline = {};
      const failureReasons = {};
      let totalRetries = 0;
      for (const record of records) {
        const key = record.pipelineId || 'unknown';
        byPipeline[key] = (byPipeline[key] ?? 0) + 1;

        totalRetries += record.summary?.totalRetries ?? 0;

        const reasons = record.summary?.failureReasons || {};
        for (const [reason, count] of Object.entries(reasons)) {
          failureReasons[reason] = (failureReasons[reason] ?? 0) + count;
        }
      }

      return {
        totalRuns,
        avgSuccessRate,
        avgLatency,
        totalTokens,
        totalEstimatedCost,
        byPipeline,
        failureReasons,
        totalRetries,
      };
    },
  };
}
