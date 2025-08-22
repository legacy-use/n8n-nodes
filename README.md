## n8n-nodes-legacy-use

This is an n8n community node. It lets you use legacy-use in your n8n workflows.

legacy-use turns any desktop application—no API required—into a reliable, scriptable REST API. It lets code and AI agents drive legacy software through its existing UI (RDP, VNC, Citrix, TeamViewer, etc.) with guardrails, logging, and observability.

[Installation](#installation)  
[Operations](#operations)  
[Credentials](#credentials)  
[Compatibility](#compatibility)  
[Usage](#usage)  
[Resources](#resources)  
[Version history](#version-history)

### Installation

Follow the [installation guide](https://docs.n8n.io/integrations/community-nodes/installation/) in the n8n community nodes documentation and install the package `n8n-nodes-legacy-use`.

### Operations

The node exposes two resources: `Job` for running legacy-use jobs and `Generic API` for making authenticated requests to the legacy-use API.

- **Job**
  - **Run**: Start a job and wait until it finishes (success/failed).
  - **Start**: Start a job without waiting (returns a `job_id`).
  - **Wait**: Wait for an existing job by `job_id`.

  Job fields:
  - **Target** (`target_id`): Select a target machine/environment (loaded from `/targets/`).
  - **API** (`api_name`): Select an API definition (loaded from `/api/definitions`).
  - **API Parameters** (`parametersKv`): Key-value parameters for the selected API. Keys are dynamically loaded from the API definition. Missing parameters with defaults are auto-filled; others are required.
  - **Advanced Options**: Polling controls for Run/Wait
    - **Poll Delay (ms)** (`pollDelay`, default `2000`)
    - **Poll Limit** (`pollLimit`, default `300` attempts)
  - **Job ID** (`job_id`): Required for the Wait operation.

  Job responses include:
  - `job_id`: The job identifier
  - `status`: One of `pending`, `queued`, `running`, `success`, `failed`
  - `result` or `error` depending on the terminal status

- **Generic API**
  - **Request**: Make an authenticated request against the legacy-use API or any absolute URL.

  Request fields:
  - **Method**: `GET`, `POST`, `PUT`, `PATCH`, `DELETE`
  - **URL or Path**: Absolute URL or path relative to the base (`https://{subdomain}.legacy-use.com/api`).
  - **Response Format**: `JSON` (default) or `Text`
  - **Query Parameters**: Repeated key/value pairs
  - **Headers**: Repeated key/value pairs
  - **Body (JSON)**: For methods with a body; must be valid JSON

  Request responses include:
  - `body`: Parsed JSON when `Response Format` is `JSON` and the server returns JSON; otherwise text
  - `headers`: Response headers
  - `statusCode`: HTTP status code

### Credentials

Create credentials of type `LegacyUse API` and provide:

- **Subdomain** (`subdomain`): Your legacy-use subdomain (e.g., `acme` for `https://acme.legacy-use.com`).
- **API Key** (`apiKey`): Personal or project API key from legacy-use.

The node uses these credentials to authenticate all operations via `https://{subdomain}.legacy-use.com/api`.

Don't have an account yet? Sign up at [legacy-use Cloud](https://cloud.legacy-use.com) to get a free API key.

### Compatibility

- n8n Nodes API: v1
- Developed and tested against recent n8n versions supporting community nodes.
- Runtime: Node.js ≥ 20.15 (see `engines` in `package.json`).

### Usage

1. Add the `LegacyUse` node to your workflow.
2. Select a **Resource**:
   - For UI automations, choose **Job**.
   - For low-level HTTP access to the service, choose **Generic API**.
3. For **Job**:
   - Choose a **Target** and an **API**. The node will fetch the API definition and expose its parameters.
   - Fill **API Parameters**. Any parameters with defaults will be auto-filled; required parameters without defaults must be provided.
   - Choose **Run** to wait for completion, **Start** to fire-and-forget, or **Wait** to wait on a known `job_id`.
   - Adjust **Advanced Options** (poll delay/limit) if needed.
4. For **Generic API**:
   - Choose a method and provide a path (e.g., `/targets/`) or an absolute URL.
   - Optionally add query params, headers, and a JSON body.

Example outputs

```json
// Job → Run (success)
{
  "job_id": "12345",
  "status": "success",
  "result": { "message": "Completed" }
}
```

```json
// Generic API → GET /targets/
{
  "statusCode": 200,
  "headers": { "content-type": "application/json" },
  "body": [
    { "id": 1, "name": "VM-01" },
    { "id": 2, "name": "VM-02" }
  ]
}
```

### Resources

- [n8n community nodes documentation](https://docs.n8n.io/integrations/#community-nodes)
- [legacy-use website](https://legacy-use.com)
- [Sign up for legacy-use (free API key)](https://cloud.legacy-use.com)

### Version history

- `0.1.0`: Initial release with Job (Run/Start/Wait) and Generic API (Request).

