import {
	IAuthenticateGeneric,
	ICredentialTestRequest,
	ICredentialType,
	INodeProperties,
} from 'n8n-workflow';

export class LegacyUseApi implements ICredentialType {
	name = 'legacyUseApi';
	displayName = 'LegacyUse API';
	documentationUrl = 'https://legacy-use.com/docs';

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
			description: 'LegacyUse API key',
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


