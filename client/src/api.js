const API_BASE = "http://localhost:3000";
const API_KEY = "dev-secret-key";

async function request(path, options = {}) {
  try {
    const response = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        "x-api-key": API_KEY,
        ...(options.headers ?? {}),
      },
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`${path} -> ${text || `status ${response.status}`}`);
    }

    if (response.status === 204) {
      return null;
    }

    return response.json();
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`API request failed: ${error.message}`);
    }

    throw new Error(`API request failed: ${path}`);
  }
}

export async function getPipelines() {
  return request("/pipelines");
}

export async function getPipelineJobs(id) {
  return request(`/pipelines/${id}/jobs`);
}

export async function createPipeline(input) {
  return request("/pipelines", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function deletePipeline(id) {
  return request(`/pipelines/${id}`, {
    method: "DELETE",
  });
}

export async function getJobs() {
  return request("/jobs");
}

export async function getJobAttempts(id) {
  return request(`/jobs/${id}/attempts`);
}

export async function retryJob(id) {
  return request(`/jobs/${id}/retry`, {
    method: "POST",
  });
}

export async function getMetrics() {
  return request("/metrics");
}
