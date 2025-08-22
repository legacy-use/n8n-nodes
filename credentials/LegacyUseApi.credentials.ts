import {
	IAuthenticateGeneric,
	ICredentialTestRequest,
	ICredentialType,
	INodeProperties,
} from 'n8n-workflow';

export class LegacyUseApi implements ICredentialType {
	name = 'legacyUseApi';
	displayName = 'legacy-use';
	// documentationUrl = 'https://legacy-use.com/docs';

	properties: INodeProperties[] = [
		{
			displayName: 'Subdomain',
			name: 'subdomain',
			type: 'string',
			default: '',
			placeholder: 'acme',
			description: 'Your tenant subdomain, e.g. acme for acme.legacy-use.com',
		},
		{
			displayName: 'API Key',
			name: 'apiKey',
			type: 'string',
			default: '',
			typeOptions: {
				password: true,
			},
			description: 'legacy-use API key. You can [get one for free](https://cloud.legacy-use.com)',
		},
	];

	authenticate: IAuthenticateGeneric = {
		type: 'generic',
		properties: {
			headers: {
				'X-API-Key': '={{$credentials.apiKey}}',
			},
		},
	};

	test: ICredentialTestRequest = {
		request: {
			baseURL: '={{"https://" + $credentials.subdomain + ".legacy-use.com/api"}}',
			url: '/api/definitions',
		},
	};
}


