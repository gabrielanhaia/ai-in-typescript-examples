-- ch06/threads.sql — how big is each thread, and how stale?
SELECT
  thread_id,
  count(*) AS checkpoints,
  max(checkpoint ->> 'ts') AS last_write
FROM braxby.checkpoints
GROUP BY thread_id
ORDER BY checkpoints DESC
LIMIT 20;
