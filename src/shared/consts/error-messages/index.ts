import { API_ERROR_MESSAGES } from './api';
import { COMMON_ERROR_MESSAGES } from './common';
import { BUSINESS_ERROR_MESSAGES } from './business';

export const ERROR_MESSAGES = {
	API: API_ERROR_MESSAGES,
	COMMON: COMMON_ERROR_MESSAGES,
	BUSINESS: BUSINESS_ERROR_MESSAGES
} as const;

export type ErrorMessageType = typeof ERROR_MESSAGES;
