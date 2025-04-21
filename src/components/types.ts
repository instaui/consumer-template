import type {FormInstance, Rule} from "antd/es/form";
import type {ReactNode} from "react";

interface ValidationResult {
	status: boolean;
	message?: string;
}

export interface Item {
	[key: string]: unknown;
}

export interface RelationConfig {
	displayField?: string;
	render?: (arg0: Item) => ReactNode;
	entity: string;
	idField: string;
	keyColumns?: string[];
	dropDownOptions?: (value: unknown) => { label: string; value: string };
}

export interface FieldConfig {
	key: string;
	label: string;
	type:
		| 'text'
		| 'textarea'
		| 'number'
		| 'email'
		| 'select'
		| 'date'
		| 'boolean'
		| 'url'
		| 'relation';
	options?: { label: string; value: string }[];
	required?: boolean;
	readOnly?: boolean;
	isFile?: boolean;
	isImage?: boolean;
	uploadUrl?: string;
	maxSize?: number;
	nullable?: boolean;
	patchable?: boolean;
	sortable?: boolean;
	postable?: boolean;
	showInList?: boolean;
	accept?: string;
	placeHolder?: string;
	validator?: (value: unknown) => ValidationResult;
	renderInList?: (value: string | number | boolean | null) => ReactNode;
	renderInDetail?: (value: string | number | boolean | null) => ReactNode;
	hideInDetail?: boolean;
	relation?: RelationConfig;
	filterable?: boolean;
	filterType?: 'eq' | 'range' | 'boolean' | 'time-range' | 'date-range'; //TODO: Support time range and date range
}

export interface EndpointConfig {
	key: string;
	label: string;
	url: string;
	idField?: string;
	fields: FieldConfig[];
	validator: (values: Record<string, unknown>) => Record<string, string>;
	renderDetail?: (...args: unknown[]) => ReactNode;
	renderEdit?: (...args: unknown[]) => ReactNode;
}

interface BaseResponse {
	status: string;
	message: string;
}

export interface ListResponse  {
	data: Item[];
	count?: number;
}

interface ItemResponse {
	data: Item;
}

interface APIResponse extends BaseResponse{
	data: ListResponse | ItemResponse;
}

interface ApiClient {
	get: (url: string, ...args: unknown[]) => Promise<APIResponse>;
	post: (
		url: string,
		data?: unknown,
		...args: unknown[]
	) => Promise<APIResponse>;
	patch: (
		url: string,
		data?: unknown,
		...args: unknown[]
	) => Promise<APIResponse>;
	delete: (url: string, ...args: unknown[]) => Promise<APIResponse>;
}

export interface ItemCrudProps {
	apiClient: ApiClient;
	config: {
		alertDuration?: number;
		defaultPagesize?: number;
		endpoints: EndpointConfig[];
	};
	useDrawer?: boolean;
}

export interface RelationFieldProps {
	field: FieldConfig;
	apiClient: ApiClient;
	rules: Rule[];
	isDisabled: boolean;
	form: FormInstance;
}