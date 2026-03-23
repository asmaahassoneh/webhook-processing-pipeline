import { useEffect, useMemo, useState } from "react";
import {
  createPipeline,
  deletePipeline,
  getJobAttempts,
  getJobs,
  getMetrics,
  getPipelineJobs,
  getPipelines,
  retryJob,
} from "./api";

const defaultMetrics = {
  total_jobs: 0,
  pending_jobs: 0,
  processing_jobs: 0,
  completed_jobs: 0,
  failed_jobs: 0,
};

export default function App() {
  const [tab, setTab] = useState("overview");
  const [pipelines, setPipelines] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [metrics, setMetrics] = useState(defaultMetrics);
  const [selectedPipelineId, setSelectedPipelineId] = useState("");
  const [pipelineJobs, setPipelineJobs] = useState([]);
  const [selectedJob, setSelectedJob] = useState(null);
  const [attempts, setAttempts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    name: "",
    actionType: "uppercase_text",
    field: "text",
    suffix: " - completed",
    webhookSecret: "",
    subscriberUrl: "",
  });

  const selectedPipeline = useMemo(
    () =>
      pipelines.find((pipeline) => pipeline.id === selectedPipelineId) ?? null,
    [pipelines, selectedPipelineId],
  );

  async function loadDashboard() {
    setLoading(true);
    setError("");

    try {
      const [pipelinesData, jobsData, metricsData] = await Promise.all([
        getPipelines(),
        getJobs(),
        getMetrics(),
      ]);

      setPipelines(pipelinesData);
      setJobs(jobsData);
      setMetrics(metricsData);

      if (!selectedPipelineId && pipelinesData.length > 0) {
        setSelectedPipelineId(pipelinesData[0].id);
      }
    } catch (err) {
      setError(err.message || "Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  }

  async function loadPipelineJobs(pipelineId) {
    try {
      const data = await getPipelineJobs(pipelineId);
      setPipelineJobs(data);
    } catch (err) {
      setError(err.message || "Failed to load pipeline jobs");
    }
  }

  async function loadAttempts(job) {
    setSelectedJob(job);

    try {
      const data = await getJobAttempts(job.id);
      setAttempts(data);
    } catch (err) {
      setError(err.message || "Failed to load attempts");
    }
  }

  async function handleCreatePipeline(event) {
    event.preventDefault();
    setError("");

    try {
      const actionConfig =
        form.actionType === "append_suffix"
          ? { field: form.field, suffix: form.suffix }
          : form.actionType === "uppercase_text" ||
              form.actionType === "reverse_text"
            ? { field: form.field }
            : { includeTimestamp: true, includeKeyCount: true };

      await createPipeline({
        name: form.name,
        actionType: form.actionType,
        actionConfig,
        webhookSecret: form.webhookSecret.trim() || null,
        subscribers: form.subscriberUrl.trim()
          ? [{ targetUrl: form.subscriberUrl.trim() }]
          : [],
      });

      setForm({
        name: "",
        actionType: "uppercase_text",
        field: "text",
        suffix: "- completed",
        webhookSecret: "",
        subscriberUrl: "",
      });

      await loadDashboard();
      setTab("pipelines");
    } catch (err) {
      setError(err.message || "Failed to create pipeline");
    }
  }

  async function handleDeletePipeline(id) {
    try {
      await deletePipeline(id);

      if (selectedPipelineId === id) {
        setSelectedPipelineId("");
        setPipelineJobs([]);
      }

      await loadDashboard();
    } catch (err) {
      setError(err.message || "Failed to delete pipeline");
    }
  }

  async function handleRetryJob(id) {
    try {
      await retryJob(id);
      await loadDashboard();

      if (selectedPipelineId) {
        await loadPipelineJobs(selectedPipelineId);
      }
    } catch (err) {
      setError(err.message || "Failed to retry job");
    }
  }

  useEffect(() => {
    loadDashboard();
  }, []);

  useEffect(() => {
    if (selectedPipelineId) {
      loadPipelineJobs(selectedPipelineId);
    }
  }, [selectedPipelineId]);

  return (
    <div className="page">
      <aside className="sidebar">
        <h1>Webhook Dashboard</h1>

        <button
          className={tab === "overview" ? "nav-btn active" : "nav-btn"}
          onClick={() => setTab("overview")}
        >
          Overview
        </button>

        <button
          className={tab === "pipelines" ? "nav-btn active" : "nav-btn"}
          onClick={() => setTab("pipelines")}
        >
          Pipelines
        </button>

        <button
          className={tab === "jobs" ? "nav-btn active" : "nav-btn"}
          onClick={() => setTab("jobs")}
        >
          Jobs
        </button>

        <button className="nav-btn refresh" onClick={loadDashboard}>
          Refresh
        </button>

        <button
          onClick={async () => {
            let payload;

            switch (selectedPipeline.actionType) {
              case "uppercase_text":
                payload = {
                  text: "hello world",
                  user: "Asmaa",
                };
                break;

              case "reverse_text":
                payload = {
                  text: "hello",
                  user: "Asmaa",
                };
                break;

              case "append_suffix":
                payload = {
                  text: "hello world",
                  user: "Asmaa",
                };
                break;

              case "add_metadata":
                payload = {
                  message: "hello world!",
                  user: "Asmaa",
                };
                break;

              default:
                payload = { text: "hello world!" };
            }

            await fetch(
              `http://localhost:3000/webhooks/${selectedPipeline.sourceKey}`,
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify(payload),
              },
            );
          }}
        >
          Test Webhook
        </button>
      </aside>

      <main className="content">
        {error ? <div className="error">{error}</div> : null}
        {loading ? <div className="info">Loading...</div> : null}

        {tab === "overview" && (
          <>
            <section className="grid metrics-grid">
              <MetricCard title="Total Jobs" value={metrics.total_jobs} />
              <MetricCard title="Pending" value={metrics.pending_jobs} />
              <MetricCard title="Processing" value={metrics.processing_jobs} />
              <MetricCard title="Completed" value={metrics.completed_jobs} />
              <MetricCard title="Failed" value={metrics.failed_jobs} />
            </section>

            <section className="card">
              <h2>Recent Jobs</h2>
              <JobTable
                jobs={jobs.slice(0, 8)}
                onViewAttempts={loadAttempts}
                onRetry={handleRetryJob}
              />
            </section>
          </>
        )}

        {tab === "pipelines" && (
          <div className="grid two-col">
            <section className="card">
              <h2>Create Pipeline</h2>

              <form className="form" onSubmit={handleCreatePipeline}>
                <label>
                  Name
                  <input
                    value={form.name}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        name: event.target.value,
                      }))
                    }
                    required
                  />
                </label>

                <label>
                  Action Type
                  <select
                    value={form.actionType}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        actionType: event.target.value,
                      }))
                    }
                  >
                    <option value="uppercase_text">uppercase_text</option>
                    <option value="reverse_text">reverse_text</option>
                    <option value="add_metadata">add_metadata</option>
                    <option value="append_suffix">append_suffix</option>
                  </select>
                </label>

                {form.actionType !== "add_metadata" && (
                  <label>
                    Field
                    <input
                      value={form.field}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          field: event.target.value,
                        }))
                      }
                    />
                  </label>
                )}

                {form.actionType === "append_suffix" && (
                  <label>
                    Suffix
                    <input
                      value={form.suffix}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          suffix: event.target.value,
                        }))
                      }
                    />
                  </label>
                )}

                <label>
                  Webhook Secret
                  <input
                    value={form.webhookSecret}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        webhookSecret: event.target.value,
                      }))
                    }
                    placeholder="optional"
                  />
                </label>

                <label>
                  Subscriber URL
                  <input
                    value={form.subscriberUrl}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        subscriberUrl: event.target.value,
                      }))
                    }
                    placeholder="https://..."
                  />
                </label>

                <button type="submit">Create</button>
              </form>
            </section>

            <section className="card">
              <h2>Pipelines</h2>

              <div className="pipeline-list">
                {pipelines.map((pipeline) => (
                  <div
                    key={pipeline.id}
                    className={
                      selectedPipelineId === pipeline.id
                        ? "pipeline-item selected"
                        : "pipeline-item"
                    }
                  >
                    <div
                      className="pipeline-main"
                      onClick={() => setSelectedPipelineId(pipeline.id)}
                    >
                      <strong>{pipeline.name}</strong>
                      <span>{pipeline.actionType}</span>
                    </div>

                    <button
                      className="danger small"
                      onClick={() => handleDeletePipeline(pipeline.id)}
                    >
                      Delete
                    </button>
                  </div>
                ))}
              </div>

              {selectedPipeline ? (
                <div className="details">
                  <h3>Selected Pipeline</h3>
                  <p>
                    <strong>ID:</strong> {selectedPipeline.id}
                  </p>
                  <p>
                    <strong>Source Key:</strong> {selectedPipeline.sourceKey}
                  </p>
                  <p>
                    <strong>Action:</strong> {selectedPipeline.actionType}
                  </p>
                  <p>
                    <strong>Subscribers:</strong>{" "}
                    {selectedPipeline.subscribers.length}
                  </p>

                  <h3>Recent Jobs</h3>
                  <JobTable
                    jobs={pipelineJobs}
                    onViewAttempts={loadAttempts}
                    onRetry={handleRetryJob}
                  />
                </div>
              ) : null}
            </section>
          </div>
        )}

        {tab === "jobs" && (
          <div className="grid two-col">
            <section className="card">
              <h2>All Jobs</h2>
              <JobTable
                jobs={jobs}
                onViewAttempts={loadAttempts}
                onRetry={handleRetryJob}
              />
            </section>

            <section className="card">
              <h2>Job Details</h2>

              {!selectedJob ? (
                <p>Select a job to view attempts.</p>
              ) : (
                <div className="details">
                  <p>
                    <strong>Job ID:</strong> {selectedJob.id}
                  </p>
                  <p>
                    <strong>Status:</strong> {selectedJob.status}
                  </p>
                  <p>
                    <strong>Pipeline ID:</strong> {selectedJob.pipelineId}
                  </p>
                  <p>
                    <strong>Attempts:</strong> {selectedJob.attemptsCount}/
                    {selectedJob.maxAttempts}
                  </p>
                  <p>
                    <strong>Error:</strong> {selectedJob.errorMessage || "None"}
                  </p>

                  <div className="json-block">
                    <h3>Input Payload</h3>
                    <pre>
                      {JSON.stringify(selectedJob.inputPayload, null, 2)}
                    </pre>
                  </div>

                  <div className="json-block">
                    <h3>Processed Payload</h3>
                    <pre>
                      {JSON.stringify(selectedJob.processedPayload, null, 2)}
                    </pre>
                  </div>

                  <h3>Delivery Attempts</h3>
                  {attempts.length === 0 ? (
                    <p>No attempts found.</p>
                  ) : (
                    <div className="attempt-list">
                      {attempts.map((attempt) => (
                        <div key={attempt.id} className="attempt-item">
                          <div>
                            <strong>Attempt #{attempt.attemptNumber}</strong>
                            <span
                              className={
                                attempt.status === "success"
                                  ? "badge success"
                                  : "badge failed"
                              }
                            >
                              {attempt.status}
                            </span>
                          </div>
                          <p>Status Code: {attempt.responseStatus ?? "N/A"}</p>
                          <p>Error: {attempt.errorMessage || "None"}</p>
                          <p>
                            At: {new Date(attempt.createdAt).toLocaleString()}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </section>
          </div>
        )}
      </main>
    </div>
  );
}

function MetricCard({ title, value }) {
  return (
    <div className="metric-card">
      <span>{title}</span>
      <strong>{value}</strong>
    </div>
  );
}

function JobTable({ jobs, onViewAttempts, onRetry }) {
  if (jobs.length === 0) {
    return <p>No jobs found.</p>;
  }

  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Status</th>
            <th>Job ID</th>
            <th>Pipeline</th>
            <th>Attempts</th>
            <th>Created</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {jobs.map((job) => (
            <tr key={job.id}>
              <td>
                <span className={`badge ${job.status}`}>{job.status}</span>
              </td>
              <td className="mono">{job.id.slice(0, 8)}...</td>
              <td className="mono">{job.pipelineId.slice(0, 8)}...</td>
              <td>
                {job.attemptsCount}/{job.maxAttempts}
              </td>
              <td>{new Date(job.createdAt).toLocaleString()}</td>
              <td className="actions">
                <button onClick={() => onViewAttempts(job)}>Details</button>
                {job.status === "failed" ? (
                  <button onClick={() => onRetry(job.id)}>Retry</button>
                ) : null}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
