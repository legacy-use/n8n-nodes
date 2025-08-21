import type {
	IExecuteFunctions,
	ILoadOptionsFunctions,
	INodeExecutionData,
	INodePropertyOptions,
	INodeType,
	INodeTypeDescription,
	IDataObject,
} from 'n8n-workflow';
import { NodeConnectionType, NodeOperationError } from 'n8n-workflow';

type JobStatus = 'pending' | 'queued' | 'running' | 'success' | 'failed';

export class LegacyUse implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'LegacyUse',
		name: 'legacyUse',
        icon: { light: 'file:legacy_cursor_white_large.png', dark: 'file:legacy_cursor_black_large.png' },
		group: ['transform'],
		version: 1,
		description: 'Interact with LegacyUse API',
		defaults: {
			name: 'LegacyUse',
		},
		inputs: [NodeConnectionType.Main],
		outputs: [NodeConnectionType.Main],
		usableAsTool: true,
		credentials: [
			{
				name: 'legacyUseApi',
				required: true,
			},
		],
		properties: [
			{
				displayName: 'Resource',
				name: 'resource',
				type: 'options',
				noDataExpression: true,
				options: [
					{
						name: 'Job',
						value: 'job',
					},
					{
						name: 'Generic API',
						value: 'generic',
					},
				],
				default: 'job',
			},
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: { resource: ['job'] },
				},
				options: [
					{ name: 'Run', value: 'run', description: 'Start and wait for a job', action: 'Run a job' },
					{ name: 'Start', value: 'start', description: 'Start a job without waiting', action: 'Start a job' },
					{ name: 'Wait', value: 'wait', description: 'Wait for a job by ID', action: 'Wait for a job' },
				],
				default: 'run',
			},
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: { resource: ['generic'] },
				},
				options: [
					{ name: 'Request', value: 'request', description: 'Make a generic API call', action: 'Make a generic API call' },
				],
				default: 'request',
			},
			// Job fields
			{
				displayName: 'Target',
				name: 'target_id',
				type: 'options',
				typeOptions: { loadOptionsMethod: 'getTargets' },
				default: '',
				required: true,
				description: 'LegacyUse target',
				displayOptions: { show: { resource: ['job'], operation: ['run', 'start', 'wait'] } },
			},
			{
				displayName: 'API',
				name: 'api_name',
				type: 'options',
				default: '',
				required: true,
				description: 'API definition (from /api/definitions)',
				typeOptions: { loadOptionsMethod: 'getApis' },
				displayOptions: { show: { resource: ['job'], operation: ['run', 'start'] } },
			},
			{
				displayName: 'Parameters (Key-Value)',
				name: 'parametersKv',
				type: 'fixedCollection',
				default: {},
				displayOptions: { show: { resource: ['job'], operation: ['run', 'start'] } },
				typeOptions: { multipleValues: true },
				options: [
					{
						name: 'pair',
						displayName: 'Pair',
						values: [
							{ displayName: 'Key', name: 'key', type: 'string', default: '', required: true },
							{ displayName: 'Value', name: 'value', type: 'string', default: '' },
						],
					},
				],
			},
			{
				displayName: 'Parameters (JSON)',
				name: 'parametersJson',
				type: 'string',
				default: '',
				placeholder: '{"foo":"bar"}',
				description: 'Optional JSON to merge with key-value parameters',
				displayOptions: { show: { resource: ['job'], operation: ['run', 'start'] } },
			},
			// Polling options for run/wait
			{
				displayName: 'Poll Delay (ms)',
				name: 'pollDelay',
				type: 'number',
				default: 2000,
				displayOptions: { show: { resource: ['job'], operation: ['run', 'wait'] } },
			},
			{
				displayName: 'Poll Limit',
				name: 'pollLimit',
				type: 'number',
				default: 300,
				description: 'Number of polling attempts',
				displayOptions: { show: { resource: ['job'], operation: ['run', 'wait'] } },
			},
			// Wait-specific field
			{
				displayName: 'Job ID',
				name: 'job_id',
				type: 'string',
				default: '',
				required: true,
				displayOptions: { show: { resource: ['job'], operation: ['wait'] } },
			},
			// Generic API fields
			{
				displayName: 'Method',
				name: 'method',
				type: 'options',
				options: [
					{ name: 'GET', value: 'GET' },
					{ name: 'POST', value: 'POST' },
					{ name: 'PUT', value: 'PUT' },
					{ name: 'PATCH', value: 'PATCH' },
					{ name: 'DELETE', value: 'DELETE' },
				],
				default: 'GET',
				displayOptions: { show: { resource: ['generic'], operation: ['request'] } },
			},
			{
				displayName: 'URL or Path',
				name: 'url',
				type: 'string',
				default: '/',
				description: 'Absolute URL or path relative to base',
				displayOptions: { show: { resource: ['generic'], operation: ['request'] } },
				required: true,
			},
			{
				displayName: 'Response Format',
				name: 'responseFormat',
				type: 'options',
				options: [
					{ name: 'JSON', value: 'json' },
					{ name: 'Text', value: 'text' },
				],
				default: 'json',
				displayOptions: { show: { resource: ['generic'], operation: ['request'] } },
			},
			{
				displayName: 'Query Parameters',
				name: 'query',
				type: 'fixedCollection',
				typeOptions: { multipleValues: true },
				default: {},
				displayOptions: { show: { resource: ['generic'], operation: ['request'] } },
				options: [
					{
						name: 'param',
						displayName: 'Param',
						values: [
							{ displayName: 'Key', name: 'key', type: 'string', default: '' },
							{ displayName: 'Value', name: 'value', type: 'string', default: '' },
						],
					},
				],
			},
			{
				displayName: 'Headers',
				name: 'headers',
				type: 'fixedCollection',
				typeOptions: { multipleValues: true },
				default: {},
				displayOptions: { show: { resource: ['generic'], operation: ['request'] } },
				options: [
					{
						name: 'header',
						displayName: 'Header',
						values: [
							{ displayName: 'Key', name: 'key', type: 'string', default: '' },
							{ displayName: 'Value', name: 'value', type: 'string', default: '' },
						],
					},
				],
			},
			{
				displayName: 'Body (JSON)',
				name: 'bodyJson',
				type: 'string',
				default: '',
				displayOptions: { show: { resource: ['generic'], operation: ['request'], method: ['POST', 'PUT', 'PATCH', 'DELETE'] } },
				placeholder: '{"key":"value"}',
				description: 'JSON string to send as request body',
			},
		],
	};

	methods = {
		loadOptions: {
			async getApis(this: ILoadOptionsFunctions) {
				const credentials = (await this.getCredentials('legacyUseApi')) as {
					subdomain: string;
					apiKey: string;
				};
				const baseUrl = `https://${credentials.subdomain}.legacy-use.com/api`;
				const res = (await this.helpers.requestWithAuthentication.call(this, 'legacyUseApi', {
					method: 'GET',
					url: `${baseUrl}/api/definitions`,
					json: true,
				})) as Array<{ name: string }>;

				const options: INodePropertyOptions[] = (res || []).map((r) => ({
					name: r.name,
					value: r.name,
				}));
				return options;
			},
			async getTargets(this: ILoadOptionsFunctions) {
				const credentials = (await this.getCredentials('legacyUseApi')) as {
					subdomain: string;
					apiKey: string;
				};
				const baseUrl = `https://${credentials.subdomain}.legacy-use.com/api`;
				const res = (await this.helpers.requestWithAuthentication.call(this, 'legacyUseApi', {
					method: 'GET',
					url: `${baseUrl}/targets/`,
					json: true,
				})) as Array<{ id: string | number; name: string }>;

				const options: INodePropertyOptions[] = (res || []).map((t) => ({
					name: t.name,
					value: String(t.id),
				}));
				return options;
			},
		},
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];

		for (let i = 0; i < items.length; i++) {
			try {
				const resource = this.getNodeParameter('resource', i) as string;
				const operation = this.getNodeParameter('operation', i) as string;

				const credentials = (await this.getCredentials('legacyUseApi')) as {
					subdomain: string;
					apiKey: string;
				};
				const baseUrl = `https://${credentials.subdomain}.legacy-use.com/api`;

				if (resource === 'job') {
					if (operation !== 'start' && operation !== 'run' && operation !== 'wait') {
						throw new NodeOperationError(this.getNode(), 'Unsupported operation', { itemIndex: i });
					}

					if (operation === 'start' || operation === 'run') {
						const targetId = this.getNodeParameter('target_id', i) as string;
						const apiName = this.getNodeParameter('api_name', i) as string;

						// Merge parameters
						const kv = (this.getNodeParameter('parametersKv', i, {}) as any).pair as
							| Array<{ key: string; value: string }>
							| undefined;
						const jsonStr = (this.getNodeParameter('parametersJson', i, '') as string) || '';
						let params: Record<string, unknown> = {};
						if (Array.isArray(kv)) {
							for (const pair of kv) {
								if (pair.key) params[pair.key] = pair.value;
							}
						}
						if (jsonStr.trim()) {
							try {
								const parsed = JSON.parse(jsonStr);
								if (parsed && typeof parsed === 'object') params = { ...params, ...parsed };
							} catch (e) {
								throw new NodeOperationError(this.getNode(), 'Invalid JSON in Parameters (JSON)', {
									itemIndex: i,
								});
							}
						}

						const startResponse = (await this.helpers.requestWithAuthentication.call(this, 'legacyUseApi', {
							method: 'POST',
							url: `${baseUrl}/targets/${encodeURIComponent(targetId)}/jobs/`,
							json: true,
							body: {
								api_name: apiName,
								parameters: params,
							},
						})) as any;

						const jobId = startResponse?.id as string;
						const status = (startResponse?.status || 'pending') as JobStatus;

						if (operation === 'start') {
							returnData.push({ json: { job_id: jobId, status } });
							continue;
						}

						// run: poll until terminal
						const pollDelay = this.getNodeParameter('pollDelay', i, 2000) as number;
						const pollLimit = this.getNodeParameter('pollLimit', i, 300) as number;

						const result = await pollJob(this, baseUrl, targetId, jobId, pollDelay, pollLimit);
						returnData.push({ json: (result as unknown) as IDataObject });
						continue;
					}

					if (operation === 'wait') {
						const targetId = this.getNodeParameter('target_id', i) as string;
						const jobId = this.getNodeParameter('job_id', i) as string;
						const pollDelay = this.getNodeParameter('pollDelay', i, 2000) as number;
						const pollLimit = this.getNodeParameter('pollLimit', i, 300) as number;

						const result = await pollJob(this, baseUrl, targetId, jobId, pollDelay, pollLimit);
						returnData.push({ json: (result as unknown) as IDataObject });
						continue;
					}
				}

				if (resource === 'generic') {
					if (operation !== 'request') {
						throw new NodeOperationError(this.getNode(), 'Unsupported operation', { itemIndex: i });
					}
					const method = this.getNodeParameter('method', i) as string;
					const urlInput = this.getNodeParameter('url', i) as string;
					const responseFormat = this.getNodeParameter('responseFormat', i, 'json') as string;
					const queryPairs = (this.getNodeParameter('query', i, {}) as any).param as Array<{ key: string; value: string }> | undefined;
					const headerPairs = (this.getNodeParameter('headers', i, {}) as any).header as Array<{ key: string; value: string }> | undefined;
					const bodyJson = this.getNodeParameter('bodyJson', i, '') as string;

					const finalUrl = /^https?:\/\//i.test(urlInput)
						? urlInput
						: `${baseUrl}${urlInput.startsWith('/') ? '' : '/'}${urlInput}`;

					const qs: IDataObject = {};
					if (Array.isArray(queryPairs)) {
						for (const p of queryPairs) if (p.key) qs[p.key] = p.value;
					}
					const headers: IDataObject = {};
					if (Array.isArray(headerPairs)) {
						for (const h of headerPairs) if (h.key) headers[h.key] = h.value;
					}

					const options: IDataObject = {
						method,
						url: finalUrl,
						qs,
						headers,
						resolveWithFullResponse: true,
					};
					if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
						if (bodyJson && bodyJson.trim()) {
							try {
								(options as any).json = true;
								(options as any).body = JSON.parse(bodyJson);
							} catch (e) {
								throw new NodeOperationError(this.getNode(), 'Invalid JSON in Body (JSON)', { itemIndex: i });
							}
						}
					}

					const res = (await this.helpers.requestWithAuthentication.call(this, 'legacyUseApi', options)) as any;
					let body: unknown = res.body;
					if (responseFormat === 'json' && typeof body === 'string') {
						try {
							body = JSON.parse(body);
						} catch {}
					}
					returnData.push({
						json: ({ body, headers: res.headers, statusCode: res.statusCode } as unknown) as IDataObject,
					});
					continue;
				}

				throw new NodeOperationError(this.getNode(), 'Unsupported resource', { itemIndex: i });
			} catch (error) {
				if (this.continueOnFail()) {
					returnData.push({ json: { error: (error as Error).message }, pairedItem: i });
					continue;
				}
				throw new NodeOperationError(this.getNode(), error as Error, { itemIndex: i });
			}
		}

		return [returnData];
	}
}

async function pollJob(
	ctx: IExecuteFunctions,
	baseUrl: string,
	targetId: string,
	jobId: string,
	delayMs: number,
	limit: number,
): Promise<{ job_id: string; status: JobStatus; result?: unknown } | { job_id: string; status: JobStatus; error?: unknown }>
{
	let attempts = 0;
	const nonTerminal: JobStatus[] = ['pending', 'queued', 'running'];
	while (attempts < limit) {
		const res = (await ctx.helpers.requestWithAuthentication.call(ctx, 'legacyUseApi', {
			method: 'GET',
			url: `${baseUrl}/targets/${encodeURIComponent(targetId)}/jobs/${encodeURIComponent(jobId)}`,
			json: true,
		})) as any;

		const status = res?.status as JobStatus;
		if (!nonTerminal.includes(status)) {
			if (status === 'success') {
				return { job_id: res?.id, status, result: res?.result };
			}
			return { job_id: res?.id, status, error: res?.error ?? res };
		}

		await new Promise((resolve) => (globalThis as any).setTimeout(resolve, delayMs));
		attempts += 1;
	}

	return { job_id: jobId, status: 'failed', error: 'Polling limit reached' };
}


