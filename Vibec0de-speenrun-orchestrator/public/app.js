const toolConfigs = [
  {
    key: "workflow",
    formId: "workflow-form",
    resultId: "workflow-result",
    endpoint: "/api/workflow",
    render: renderWorkflow,
    run: runWorkflowRequest,
    sample: {
      url: "https://xmcp.dev/docs",
      productName: "XMCP Launch Episode",
      stack: "Next.js App Router + TypeScript + MCP server over HTTP",
      mainWin: "Shipped a schema-first MCP server with a hero tool in record time.",
      mainPain: "Context-starved demos that ignore what the docs recommend.",
    },
  },
  {
    key: "plan",
    formId: "plan-form",
    resultId: "plan-result",
    endpoint: "/api/speedrun-plan",
    render: renderPlan,
    sample: {
      productName: "Supabase Studio",
      stack: "Next.js App Router + TypeScript + Vercel Preview + Supabase local dev",
    },
  },
  {
    key: "clips",
    formId: "clip-form",
    resultId: "clip-result",
    endpoint: "/api/clip-outline",
    render: renderClips,
    sample: {
      productName: "Vercel Visual Editing",
      mainWin: "Launched multiplayer visual editing in under 30 minutes.",
      mainPain: "Manual content approvals dragging through endless screenshots.",
    },
  },
  {
    key: "docs",
    formId: "docs-form",
    resultId: "docs-result",
    endpoint: "/api/analyze-docs",
    render: renderDocs,
    sample: {
      url: "https://xmcp.dev/docs",
    },
  },
  {
    key: "greet",
    formId: "greet-form",
    resultId: "greet-result",
    endpoint: "/api/greet",
    render: renderGreeting,
  },
];

function escapeHtml(value = "") {
  return value
    .toString()
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function renderList(items = [], className = "steps-list") {
  if (!Array.isArray(items) || items.length === 0) {
    return "<p class=\"muted\">No items returned.</p>";
  }

  return `<ul class="${className}">${items
    .map((step) => `<li>${escapeHtml(step)}</li>`)
    .join("")}</ul>`;
}

function renderPlan(data) {
  const stepsMarkup = renderList(data.steps);
  const notesMarkup = data.notes
    ? `<div class="key-value"><strong>Notes</strong><p>${escapeHtml(data.notes)}</p></div>`
    : "";
  return `<div><strong>Steps</strong>${stepsMarkup}${notesMarkup}</div>`;
}

function renderClips(data) {
  const clips = Array.isArray(data.clips) ? data.clips : [];
  if (clips.length === 0) {
    return `<p class="muted">No clips generated.</p>`;
  }

  const cards = clips
    .map(
      (clip) => `
        <article class="clip-card">
          <h3>${escapeHtml(clip.title)}</h3>
          <p><strong>Hook:</strong> ${escapeHtml(clip.hook)}</p>
          <p>${escapeHtml(clip.description)}</p>
        </article>
      `,
    )
    .join("");

  return `<div><strong>Suggested Clips</strong><div class="clips-grid">${cards}</div></div>`;
}

function renderDocs(data) {
  const summary = data.summary
    ? `<p>${escapeHtml(data.summary)}</p>`
    : `<p class="muted">No summary returned.</p>`;

  const keyConcepts = data.keyConcepts
    ? `<div class="key-value"><strong>Key concepts</strong>${renderList(
        data.keyConcepts,
        "simple-list",
      )}</div>`
    : "";

  const focus = data.suggestedFocusAreas
    ? `<div class="key-value"><strong>Focus areas</strong>${renderList(
        data.suggestedFocusAreas,
        "simple-list",
      )}</div>`
    : "";

  return `${summary}${keyConcepts}${focus}`;
}

function renderWorkflow(data = {}) {
  const docsMarkup = data.docs
    ? renderDocs(data.docs)
    : `<p class="muted">Docs step did not run.</p>`;
  const planMarkup = data.plan
    ? renderPlan(data.plan)
    : `<p class="muted">Plan step did not run.</p>`;
  const clipsMarkup = data.clips
    ? renderClips(data.clips)
    : `<p class="muted">Clip step did not run.</p>`;

  return `
    <div class="workflow-stages">
      <article class="workflow-stage">
        <h3>Docs insight</h3>
        ${docsMarkup}
      </article>
      <article class="workflow-stage">
        <h3>Speedrun plan</h3>
        ${planMarkup}
      </article>
      <article class="workflow-stage">
        <h3>Clip hooks</h3>
        ${clipsMarkup}
      </article>
    </div>
  `;
}

function renderGreeting(data) {
  return `<p>${escapeHtml(data.message ?? "No response received.")}</p>`;
}

async function orchestrateClientWorkflow(payload) {
  const docs = await postJson("/api/analyze-docs", { url: payload.url });

  const plan = await postJson("/api/speedrun-plan", {
    productName: payload.productName,
    stack: payload.stack,
    docSummary: docs.summary,
    keyConcepts: docs.keyConcepts,
    suggestedFocusAreas: docs.suggestedFocusAreas,
  });

  const clips = await postJson("/api/clip-outline", {
    productName: payload.productName,
    mainWin: payload.mainWin,
    mainPain: payload.mainPain,
    planSteps: plan.steps,
    docSummary: docs.summary,
  });

  return { docs, plan, clips };
}

async function runWorkflowRequest(payload) {
  try {
    return await postJson("/api/workflow", payload);
  } catch (error) {
    if (error?.status === 404) {
      console.warn("Workflow endpoint missing, falling back to client orchestration.");
      return orchestrateClientWorkflow(payload);
    }
    throw error;
  }
}

function formToJson(form) {
  const data = new FormData(form);
  const result = {};

  for (const [key, value] of data.entries()) {
    if (typeof value === "string") {
      result[key] = value.trim();
    } else {
      result[key] = value;
    }
  }

  return result;
}

async function postJson(endpoint, payload) {
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const contentType = response.headers.get("content-type") ?? "";
  const expectsJson = contentType.includes("application/json");
  let body;

  if (expectsJson) {
    body = await response.json().catch(() => ({}));
  } else {
    body = await response.text().catch(() => "");
  }

  if (!response.ok) {
    const message =
      (body && typeof body === "object" && typeof body.error === "string"
        ? body.error
        : "") ||
      (typeof body === "string" && body.trim().length > 0
        ? body.trim()
        : `Request failed (HTTP ${response.status})`);
    const error = new Error(message);
    error.status = response.status;
    error.body = body;
    throw error;
  }

  return body;
}

function setLoading(button, isLoading) {
  if (!button) {
    return;
  }
  if (isLoading) {
    button.dataset.originalText = button.textContent ?? button.dataset.originalText ?? "";
    button.textContent = "Working…";
    button.disabled = true;
  } else {
    button.textContent = button.dataset.originalText ?? "Submit";
    button.disabled = false;
  }
}

function setStatus(element, message) {
  if (element) {
    element.innerHTML = `<p class="muted">${escapeHtml(message)}</p>`;
  }
}

function setError(element, error) {
  if (element) {
    element.innerHTML = `<p class="error">${escapeHtml(
      error.message ?? "Something went wrong.",
    )}</p>`;
  }
}

toolConfigs.forEach((config) => {
  const form = document.getElementById(config.formId);
  const result = document.getElementById(config.resultId);
  if (!form || !result) {
    return;
  }

  const submitButton = form.querySelector('button[type="submit"]');

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    setStatus(result, "Submitting request…");
    setLoading(submitButton, true);

    try {
      const payload = formToJson(form);
      const runner =
        typeof config.run === "function"
          ? config.run
          : (data) => postJson(config.endpoint, data);
      const response = await runner(payload);
      result.innerHTML = config.render(response);
    } catch (error) {
      setError(result, error);
      console.error(error);
    } finally {
      setLoading(submitButton, false);
    }
  });
});

document.querySelectorAll("button[data-fill]").forEach((button) => {
  button.addEventListener("click", () => {
    const key = button.dataset.fill;
    const config = toolConfigs.find((cfg) => cfg.key === key);
    if (!config?.sample) {
      return;
    }
    const form = document.getElementById(config.formId);
    if (!form) {
      return;
    }

    Object.entries(config.sample).forEach(([field, value]) => {
      const input = form.elements.namedItem(field);
      if (input instanceof HTMLInputElement || input instanceof HTMLTextAreaElement) {
        input.value = value;
      }
    });
  });
});

