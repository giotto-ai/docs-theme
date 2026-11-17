window.giottoMockData = (() => {
  const categories = [
    {
      id: "cloud",
      name: "Giotto Cloud",
      description: "Use Giotto in the managed European cloud environment.",
      eyebrow: "Product",
    },
    {
      id: "api",
      name: "Giotto API",
      description: "Build with Giotto models, SDKs, and API workflows.",
      eyebrow: "Developers",
    },
    {
      id: "on-prem",
      name: "Giotto on-prem",
      description: "Deploy Giotto on infrastructure you control.",
      eyebrow: "Deployment",
    },
    {
      id: "tutorials",
      name: "Tutorials and Courses",
      description: "Learn the foundations behind LLMs, reasoning, and agents.",
      eyebrow: "Learn",
    },
    {
      id: "troubleshooting",
      name: "Troubleshooting and FAQ",
      description: "Resolve common issues and find answers quickly.",
      eyebrow: "Support",
    },
  ];

  const sectionCatalog = [
    {
      id: "cloud-personalisation",
      categoryId: "cloud",
      name: "Personalisation & Workflows",
      description: "Make Giotto fit the way your team works.",
      titles: ["Memory"],
    },
    {
      id: "cloud-account",
      categoryId: "cloud",
      name: "Account & Administration",
      description: "Manage profiles, access, and account settings.",
      titles: ["Manage Your Profile and Account"],
    },
    {
      id: "cloud-connected-applications",
      categoryId: "cloud",
      name: "Connected Applications",
      description: "Connect the tools and services you use every day.",
      titles: [
        "Connect your mailbox using IMAP and SMTP",
        "Mail",
        "Calendar",
      ],
    },
    {
      id: "api-getting-started",
      categoryId: "api",
      name: "Getting started",
      description: "Make your first request and understand the API surface.",
      titles: ["Giotto API overview", "Make your first API request with Python"],
    },
    {
      id: "api-local-setup",
      categoryId: "api",
      name: "Your local setup",
      description: "Connect Giotto to your terminal, editor, or compatible tool.",
      titles: [
        "Use Giotto in your Terminal with Hermes Agent",
        "Connect Open Code",
        "Connect Visual Studio Code",
        "Connect OpenAI-Compatible Tools to Giotto",
      ],
    },
    {
      id: "api-operations",
      categoryId: "api",
      name: "Operations",
      description: "Handle errors, SDK usage, and production API patterns.",
      titles: [
        "API errors, rate limits, and retries",
        "Giotto Python SDK reference",
        "Giotto API use cases",
      ],
    },
    {
      id: "api-billing",
      categoryId: "api",
      name: "Usage & Billing",
      description: "Understand credits, usage, and API billing.",
      titles: ["API billing, credits, and usage"],
    },
    {
      id: "on-prem-getting-started",
      categoryId: "on-prem",
      name: "Getting started",
      description: "Understand the Giotto platform before you deploy it.",
      titles: [
        "What Is Giotto?",
        "Create a New User (NOT FOR CLOUD)",
        "Create a New Client for an Application (NOT FOR CLOUD)",
        "Core Platform Components",
      ],
    },
    {
      id: "on-prem-prerequisites",
      categoryId: "on-prem",
      name: "Prerequisites",
      description: "Check hardware, software, and supported configurations.",
      titles: ["Technical Specifications and Tested Configurations"],
    },
    {
      id: "on-prem-installation",
      categoryId: "on-prem",
      name: "Installation & Configuration",
      description: "Prepare the host and install Giotto.",
      titles: [
        "Prerequisite: Install Docker and Docker Compose",
        "Prerequisite: Install CUDA, NVIDIA Drivers, and NVIDIA Container Toolkit",
        "Install Giotto",
      ],
    },
    {
      id: "on-prem-operations",
      categoryId: "on-prem",
      name: "Operations",
      description: "Operate, observe, and secure a running deployment.",
      titles: [
        "Check the Tracing of a Chat or API Call",
        "Retrieve the Token for the Giotto Python Client (NOT FOR CLOUD)",
        "Where Can I See Metrics, Logs, and Traces?",
        "How Do I Debug a Failed Run?",
        "How to Use Centralized Logging",
        "How to Read Health Checks and Alerts",
        "Monitor Users, Clients, and Access Activity in Giotto",
        "How to Monitor Metrics in VictoriaMetrics",
        "How to Inspect Streaming Events in Kafka",
        "Authentication via OAuth2 and Keycloak",
        "How to Connect External Identity Providers",
        "Authorization in Authz",
      ],
    },
    {
      id: "on-prem-security",
      categoryId: "on-prem",
      name: "Security",
      description: "Control identity, access, and network exposure.",
      titles: [
        "Microsoft Entra ID Authentication",
        "Restrict Public Network Access With Firewall Rules",
      ],
    },
    {
      id: "tutorials-course",
      categoryId: "tutorials",
      name: "LLMs and Giotto Course",
      description: "Start with the core concepts behind modern language models.",
      titles: [
        "Introduction to LLMs: What They Are and What They Do",
        "Core LLM Jargon You Need to Know",
        "How LLMs Generate Text",
        "How LLMs Are Trained and Adapted",
        "From LLMs to Agentic Systems",
        "Introduction to Giotto",
      ],
    },
    {
      id: "tutorials-deep-dive",
      categoryId: "tutorials",
      name: "Deep dive",
      description: "Explore training, inference, and reasoning-time methods.",
      titles: [
        "Transformer Attention and Modern LLM Architectures",
        "Pre-training, Fine-Tuning, and PEFT",
        "Inference, Decoding, and Test-Time Search",
        "Reasoning-Time Methods: CoT, STaR, ToT, and Self-Consistency",
        "Distillation, Quantization, and Pruning",
        "RLHF, DPO, ORPO, and RL for LLMs",
      ],
    },
    {
      id: "troubleshooting-troubleshooting",
      categoryId: "troubleshooting",
      name: "Troubleshooting",
      description: "Diagnose common service, dashboard, and integration errors.",
      titles: [
        "403 Forbidden",
        "502 Bad Gateway in Ray dashborad",
        "Upstream returned HTTP 500 from http://172.19.0.1:8000/giotto-model",
        "Code app: problem creating a new user for JupyterHub",
      ],
    },
    {
      id: "troubleshooting-faq",
      categoryId: "troubleshooting",
      name: "FAQ",
      description: "Answers to common questions about Giotto.ai.",
      titles: [
        "Who should I contact if I want a custom deployment of Giotto.ai?",
        "Where can I find Giotto.ai's Privacy Policy?",
        "Where can I find Giotto.ai's Data Processing Agreement (DPA)?",
        "Does Giotto.ai possesses security certifications?",
      ],
    },
  ];

  const overrides = {
    "giotto-api-overview": {
      summary: "Understand the Giotto API, authentication, models, and the first steps to build with Giotto.",
      headings: ["Overview", "Authentication", "Your first request", "Next steps"],
      body: `
        <p>The Giotto API gives applications access to Giotto models through an OpenAI-compatible interface hosted in Europe.</p>
        <h2 id="overview">Overview</h2>
        <p>Use the API to build integrations with Giotto models, stream responses, and connect tools to your existing workflows.</p>
        <h2 id="authentication">Authentication</h2>
        <p>Create an API key in the Giotto console and send it as a bearer token with every request.</p>
        <pre><code>curl https://api.giotto.ai/v1/responses \\
  -H "Authorization: Bearer $GIOTTO_API_KEY" \\
  -H "Content-Type: application/json"</code></pre>
        <h2 id="your-first-request">Your first request</h2>
        <p>Start with the Responses API, then move to streaming, tools, or the Python SDK as your integration grows.</p>
        <div class="mock-callout"><strong>Mock content</strong><span>This article is local sample content for the visual preview.</span></div>
        <h2 id="next-steps">Next steps</h2>
        <p>Explore the Python quickstart, error handling, and usage and billing guidance.</p>
      `,
    },
    "make-your-first-api-request-with-python": {
      summary: "Send a first Giotto API request from Python using the OpenAI-compatible client.",
      headings: ["Install the client", "Create a request", "Continue learning"],
      body: `
        <p>This walkthrough shows the smallest useful Python integration.</p>
        <h2 id="install-the-client">Install the client</h2>
        <pre><code>pip install openai</code></pre>
        <h2 id="create-a-request">Create a request</h2>
        <pre><code>from openai import OpenAI

client = OpenAI(
    api_key="&lt;YOUR_GIOTTO_API_KEY&gt;",
    base_url="https://api.giotto.ai/v1",
)

response = client.responses.create(
    model="giotto-model",
    input="Explain sovereign AI in one paragraph.",
)

print(response.output_text)</code></pre>
        <h2 id="continue-learning">Continue learning</h2>
        <p>Once the request works, review retries, rate limits, and the SDK reference before moving to production.</p>
      `,
    },
    "what-is-giotto": {
      summary: "A short introduction to Giotto, its models, and the infrastructure choices behind it.",
      headings: ["What Giotto is", "Where it runs", "What to read next"],
      body: `
        <p>Giotto is a sovereign AI system designed to run in European cloud environments, private deployments, or compatible hardware.</p>
        <h2 id="what-giotto-is">What Giotto is</h2>
        <p>It combines reasoning models with the operating system around them: assistant, documents, code, integrations, agents, and operational visibility.</p>
        <h2 id="where-it-runs">Where it runs</h2>
        <p>Choose managed cloud access, on-premise deployment, or Giotto-ready hardware depending on your data and infrastructure requirements.</p>
        <h2 id="what-to-read-next">What to read next</h2>
        <p>Continue with the platform components overview or review the on-premise prerequisites.</p>
      `,
    },
    "install-giotto": {
      summary: "Install Giotto on a supported host after completing the Docker and GPU prerequisites.",
      headings: ["Before you start", "Install", "Verify the deployment"],
      body: `
        <p>Use this guide after checking the tested configurations and installing the required container and GPU tooling.</p>
        <h2 id="before-you-start">Before you start</h2>
        <ul><li>Confirm the host meets the tested configuration.</li><li>Install Docker Compose and the NVIDIA Container Toolkit.</li><li>Prepare the private network and identity configuration.</li></ul>
        <h2 id="install">Install</h2>
        <pre><code>git clone &lt;giotto-deployment-repository&gt;
cd giotto-deployment
docker compose up -d</code></pre>
        <h2 id="verify-the-deployment">Verify the deployment</h2>
        <p>Check health endpoints, logs, and the monitoring dashboard before connecting clients.</p>
      `,
    },
    "403-forbidden": {
      summary: "Troubleshoot a 403 response when a client or user is not authorized to access Giotto.",
      headings: ["Common causes", "Checks", "Next steps"],
      body: `
        <p>A 403 usually means the request reached Giotto but failed an authorization or network policy check.</p>
        <h2 id="common-causes">Common causes</h2>
        <ul><li>Expired or missing credentials.</li><li>The client is not assigned to the expected user or role.</li><li>Public network access is restricted by policy.</li></ul>
        <h2 id="checks">Checks</h2>
        <p>Review the request token, Authz configuration, identity provider mapping, and the relevant access logs.</p>
        <h2 id="next-steps">Next steps</h2>
        <p>Try the request from an approved network and compare the result with a known working client.</p>
      `,
    },
    "core-llm-jargon-you-need-to-know": {
      summary: "A practical glossary for the concepts used throughout the LLMs and Giotto course.",
      headings: ["Tokens", "Context", "Inference", "Agents"],
      body: `
        <p>This local mock article is intentionally concise: it helps us test headings, lists, code blocks, and long-form reading styles.</p>
        <h2 id="tokens">Tokens</h2><p>Tokens are the units of text a model reads and produces. They influence context size, latency, and cost.</p>
        <h2 id="context">Context</h2><p>Context is the information available to the model during a request, including instructions, conversation, and retrieved content.</p>
        <h2 id="inference">Inference</h2><p>Inference is the process of generating a response from a trained model.</p>
        <h2 id="agents">Agents</h2><p>Agents combine model reasoning with tools, state, and a loop that can complete multi-step work.</p>
      `,
    },
  };

  const slugify = (value) =>
    value
      .toLowerCase()
      .replace(/https?:\/\//g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

  const sections = sectionCatalog.map(({ titles, ...section }) => ({
    ...section,
    articlesCount: titles.length,
  }));

  const articles = sectionCatalog.flatMap((section) =>
    section.titles.map((title, index) => {
      const id = slugify(title);
      const override = overrides[id] || {};
      return {
        id,
        title,
        sectionId: section.id,
        categoryId: section.categoryId,
        summary:
          override.summary ||
          `Local mock content for ${title.toLowerCase()} in ${section.name}.`,
        headings: override.headings || ["Overview", "Next steps"],
        body:
          override.body ||
          `<p>This local mock page represents the ${title} article from the Giotto documentation.</p><h2 id="overview">Overview</h2><p>Use this space to validate layout, typography, navigation, code blocks, and article metadata before connecting the live Zendesk data.</p><h2 id="next-steps">Next steps</h2><p>Continue with the other articles in ${section.name}.</p>`,
        updated: `2026-${String(11 - (index % 3)).padStart(2, "0")}-${String(16 - index).padStart(2, "0")}`,
      };
    }),
  );

  return { categories, sections, articles };
})();
