import {
  Button,
  Drawer,
  Form,
  Image,
  Input,
  InputNumber,
  Layout,
  Menu,
  Modal,
  Row,
  Select,
  Space,
  Spin,
  Switch,
  Table,
  Upload,
  message,
  notification,
} from 'antd';
import {
  DeleteOutlined,
  EditOutlined,
  FileOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  PictureOutlined,
} from '@ant-design/icons';
import type {
  FilterDropdownProps,
  FilterValue,
  SortOrder,
  SorterResult,
  TablePaginationConfig,
} from 'antd/es/table/interface';
import type { FormInstance, Rule } from 'antd/es/form';
import type { UploadChangeParam, UploadFile } from 'antd/es/upload/interface';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';

import type { NamePath } from 'antd/es/form/interface';
import type { ReactNode } from 'react';
import { UI_CONSTANTS } from '../constants';

const { Sider } = Layout;

interface ValidationResult {
  status: boolean;
  message?: string;
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
  relation?: {
    entity: string;
    idField: string;
    keyColumns?: string[];
    dropDownOptions?: (value: unknown) => { label: string; value: string };
  };
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

interface Item {
  [key: string]: unknown;
}

interface BaseResponse {
  status: string;
  message: string;
}

interface ListResponse extends BaseResponse {
  type: 'list';
  data: Item[];
  count?: number;
}

interface ItemResponse extends BaseResponse {
  type: 'item';
  data: Item;
}

type APIResponse = ListResponse | ItemResponse;

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

interface ItemCrudProps {
  apiClient: ApiClient;
  config: {
    alertDuration?: number;
    defaultPagesize?: number;
    endpoints: EndpointConfig[];
  };
  useDrawer?: boolean;
}

interface RelationFieldProps {
  field: FieldConfig;
  apiClient: ApiClient;
  rules: Rule[];
  isDisabled: boolean;
  form: FormInstance;
}

const RelationField: React.FC<RelationFieldProps> = ({
  field,
  apiClient,
  rules,
  isDisabled,
  form,
}): ReactNode => {
  const [options, setOptions] = useState<{ label: string; value: string }[]>(
    []
  );
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadRelationOptions = async () => {
      try {
        setLoading(true);
        const response = await apiClient.get(
          `/${field.relation!.entity}?cols=${field.relation!.keyColumns?.join(
            ','
          )}`
        );
        const items = response.data as [];
        // TODO: Handle paginated Response, Support server side filtering
        const newOptions = items.map((item: Item) =>
          field.relation?.dropDownOptions
            ? field.relation.dropDownOptions(item)
            : {
                label: field
                  .relation!.keyColumns?.map((col) => item[col])
                  .filter(Boolean)
                  .join(' - ')
                  .toString(),
                value: item[field.relation!.idField],
              }
        );
        setOptions(newOptions as { label: string; value: string }[]);
      } catch (error) {
        message.error('Failed to load relation options', error.message);
      } finally {
        setLoading(false);
      }
    };

    loadRelationOptions().then(() => {});
  }, [field.relation, apiClient]);

  return (
    <Form.Item name={field.key as NamePath} label={field.label} rules={rules}>
      <Select
        showSearch
        placeholder={field.placeHolder || `Select ${field.label}`}
        disabled={isDisabled || loading}
        loading={loading}
        options={options}
        filterOption={(input, option) =>
          (option?.label ?? '')
            .toString()
            .toLowerCase()
            .includes(input.toLowerCase())
        }
        onChange={(value) => {
          // Ensure we're setting just the uid value
          form.setFieldValue(field.key as NamePath, value);
        }}
      />
    </Form.Item>
  ) as ReactNode;
};

const FilterRow: React.FC<{
  fields: FieldConfig[];
  onFilterChange: (filters: Record<string, string[]>) => void;
  currentFilters: Record<string, string[]>;
}> = ({ fields, onFilterChange, currentFilters }): React.ReactNode => {
  const [localFilters, setLocalFilters] =
    useState<Record<string, string[]>>(currentFilters);

  // Reset local filters when currentFilters change (e.g., when navigating between pages)
  useEffect(() => {
    setLocalFilters(currentFilters);
  }, [currentFilters]);

  const handleFilterChange = (key: string, value: string | string[] | null) => {
    const newFilters = { ...localFilters };
    if (value === null || (Array.isArray(value) && value.length === 0)) {
      delete newFilters[key];
    } else {
      newFilters[key] = Array.isArray(value) ? value : [value];
    }
    setLocalFilters(newFilters);
  };

  const applyFilters = () => {
    onFilterChange(localFilters);
  };

  // Filter out non-filterable fields
  const filterableFields = fields.filter((field) => field.filterable);

  // If there are no filterable fields, don't render the filter row
  if (filterableFields.length === 0) {
    return null;
  }

  return (
    <Row>
      <div style={{ display: 'flex', flexWrap: 'wrap', flex: 1 }}>
        {filterableFields.map((field) => (
          <div key={field.key} style={{ marginRight: 16, marginBottom: 8 }}>
            <div style={{ marginBottom: 4, fontSize: 12, color: '#666' }}>
              {field.label}
            </div>
            {field.filterType === 'range' ? (
              <Space>
                <InputNumber
                  placeholder='Min'
                  style={{ width: 100 }}
                  value={localFilters[field.key]?.[0]}
                  onChange={(value) =>
                    handleFilterChange(
                      field.key,
                      value
                        ? [String(value), localFilters[field.key]?.[1] || '']
                        : null
                    )
                  }
                />
                <InputNumber
                  placeholder='Max'
                  style={{ width: 100 }}
                  value={localFilters[field.key]?.[1]}
                  onChange={(value) =>
                    handleFilterChange(
                      field.key,
                      value
                        ? [localFilters[field.key]?.[0] || '', String(value)]
                        : null
                    )
                  }
                />
              </Space>
            ) : field.filterType === 'boolean' ? (
              <Select
                allowClear
                placeholder='Select'
                style={{ width: 120 }}
                value={localFilters[field.key]?.[0]}
                onChange={(value) => handleFilterChange(field.key, value)}
                options={[
                  { label: 'Yes', value: 'true' },
                  { label: 'No', value: 'false' },
                ]}
              />
            ) : field.type === 'select' ? (
              <Select
                allowClear
                placeholder='Select'
                style={{ width: 120 }}
                value={localFilters[field.key]?.[0]}
                onChange={(value) => handleFilterChange(field.key, value)}
                options={field.options}
              />
            ) : (
              <Input
                placeholder={`Search ${field.label}`}
                style={{ width: 150 }}
                value={localFilters[field.key]?.[0]}
                onChange={(e) =>
                  handleFilterChange(field.key, e.target.value || null)
                }
                allowClear
              />
            )}
          </div>
        ))}
      </div>
      <div style={{ marginLeft: 16, marginBottom: 8 }}>
        <Button type='primary' onClick={applyFilters}>
          Apply Filters
        </Button>
      </div>
    </Row>
  ) as ReactNode;
};

export default function ItemCrud({
  apiClient,
  config,
  useDrawer = false,
}: ItemCrudProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { entity, operation, id } = useParams<{
    entity: string;
    operation?: 'view' | 'edit';
    id?: string;
  }>();
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [form] = Form.useForm();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedEndpoint, setSelectedEndpoint] =
    useState<EndpointConfig | null>(null);
  const [pagination, setPagination] = useState({
    current: UI_CONSTANTS.DEFAULTS.FIRST_PAGE,
    pageSize: UI_CONSTANTS.DEFAULTS.PAGE_SIZE,
    total: 0,
  });
  const paginationRef = useRef(pagination);
  paginationRef.current = pagination;

  const [api, contextHolder] = notification.useNotification();

  const [deleteInput, setDeleteInput] = useState('');
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);

  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);

  const [modalState, setModalState] = useState<{
    type: 'view' | 'edit' | null;
    item: Item | null;
  }>({ type: null, item: null });

  const [collapsed, setCollapsed] = useState(false);

  const [sorting, setSorting] = useState<{
    field: string | null;
    order: SortOrder;
  }>({
    field: null,
    order: 'ascend',
  });
  const [filters, setFilters] = useState<Record<string, string[]>>({});
  const isMountedRef = useRef<boolean>(true);

  // Request tracking
  const requestIdRef = useRef<number>(0);
  const alertDuration =
    config.alertDuration ?? UI_CONSTANTS.DEFAULTS.ALERT_DURATION;

  // Cleanup function to prevent memory leaks and state updates after unmount
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const fetchItems = useCallback(async () => {
    if (!selectedEndpoint) {
      return;
    }

    const currentRequestId = ++requestIdRef.current;

    try {
      setLoading(true);

      const searchParams = new URLSearchParams(location.search);
      const response = (await apiClient.get(selectedEndpoint.url, {
        params: searchParams,
      })) as ListResponse;

      if (!isMountedRef.current || currentRequestId !== requestIdRef.current) {
        return;
      }

      const { count, data } = response.data;
      const total = count ?? data.length ?? 0;

      setPagination({
        current: parseInt(
          searchParams.get(UI_CONSTANTS.URL_PARAMS.PAGE) || '1',
          10
        ),
        pageSize: parseInt(
          searchParams.get(UI_CONSTANTS.URL_PARAMS.PAGE_SIZE) ||
            config.defaultPagesize?.toString() ||
            UI_CONSTANTS.DEFAULTS.PAGE_SIZE.toString(),
          10
        ),
        total: total,
      });

      const processedItems = data.map((item: Item) => {
        const idField = selectedEndpoint.idField;
        if (idField && !item[idField]) {
          for (const field of UI_CONSTANTS.ID_FIELDS.POSSIBLE_FIELDS) {
            if (item[field]) {
              item[idField] = item[field];
              break;
            }
          }
        }
        return item;
      });

      setItems(processedItems);
    } catch (err) {
      if (!isMountedRef.current || currentRequestId !== requestIdRef.current) {
        return;
      }

      const errorMessage =
        err instanceof Error
          ? err.message
          : UI_CONSTANTS.ERROR_MESSAGES.UNKNOWN_ERROR;
      api.error({
        message: UI_CONSTANTS.ERROR_MESSAGES.ERROR,
        description: `${UI_CONSTANTS.ERROR_MESSAGES.FAILED_TO_FETCH_ITEMS} ${errorMessage}`,
        duration: config.alertDuration || UI_CONSTANTS.DEFAULTS.ALERT_DURATION,
      });
    } finally {
      if (isMountedRef.current && currentRequestId === requestIdRef.current) {
        setLoading(false);
      }
    }
  }, [selectedEndpoint, api, apiClient, location.search]);

  // Effect to sync initial URL parameters
  useEffect(() => {
    if (!selectedEndpoint) {
      return;
    }

    const searchParams = new URLSearchParams(location.search);

    // Sync pagination
    const page = searchParams.get(UI_CONSTANTS.URL_PARAMS.PAGE);
    const pageSize = searchParams.get(UI_CONSTANTS.URL_PARAMS.PAGE_SIZE);
    if (page || pageSize) {
      setPagination({
        current: page ? parseInt(page, 10) : UI_CONSTANTS.DEFAULTS.FIRST_PAGE,
        pageSize: pageSize
          ? parseInt(pageSize, 10)
          : UI_CONSTANTS.DEFAULTS.PAGE_SIZE,
        total: pagination.total,
      });
    }

    // Sync sorting
    const sort = searchParams.get(UI_CONSTANTS.URL_PARAMS.SORT);
    const order = searchParams.get(UI_CONSTANTS.URL_PARAMS.ORDER);
    if (sort) {
      setSorting({
        field: sort,
        order: order === 'desc' ? 'descend' : 'ascend',
      });
    }

    // Sync filters
    const newFilters: Record<string, string[]> = {};
    searchParams.forEach((value, key) => {
      if (
        ![
          UI_CONSTANTS.URL_PARAMS.PAGE,
          UI_CONSTANTS.URL_PARAMS.PAGE_SIZE,
          UI_CONSTANTS.URL_PARAMS.SORT,
          UI_CONSTANTS.URL_PARAMS.ORDER,
        ].includes(key)
      ) {
        newFilters[key] = value.split(',');
      }
    });
    setFilters(newFilters);
  }, [selectedEndpoint, location.search]);

  // Single effect to handle all data fetching
  useEffect(() => {
    let isSubscribed = true;

    const loadData = async () => {
      if (!entity || !isSubscribed) {
        return;
      }

      const endpoint = config.endpoints.find((e) => e.key === entity);
      if (!endpoint) {
        return;
      }

      // Handle entity change
      if (selectedEndpoint?.key !== entity) {
        setSelectedEndpoint(endpoint);
        return;
      }

      // Handle specific item view/edit
      if (operation && id) {
        fetchItemById(id);
        return;
      }

      // Handle list view
      fetchItems();
    };

    loadData();

    return () => {
      isSubscribed = false;
    };
  }, [entity, operation, id, selectedEndpoint, fetchItems]);

  // Effect to handle URL changes
  useEffect(() => {
    if (!selectedEndpoint || operation || id) {
      return;
    }

    const searchParams = new URLSearchParams(location.search);
    const page = searchParams.get(UI_CONSTANTS.URL_PARAMS.PAGE);
    const pageSize = searchParams.get(UI_CONSTANTS.URL_PARAMS.PAGE_SIZE);

    if (page || pageSize) {
      const newPage = page
        ? parseInt(page, 10)
        : UI_CONSTANTS.DEFAULTS.FIRST_PAGE;
      const newPageSize = pageSize
        ? parseInt(pageSize, 10)
        : UI_CONSTANTS.DEFAULTS.PAGE_SIZE;

      if (
        newPage !== pagination.current ||
        newPageSize !== pagination.pageSize
      ) {
        fetchItems();
      }
    }
  }, [
    location.search,
    selectedEndpoint,
    operation,
    id,
    pagination.current,
    pagination.pageSize,
    fetchItems,
  ]);

  const handleTableChange = (
    pagination: TablePaginationConfig,
    filters: Record<string, FilterValue | null>,
    sorter: SorterResult<Item> | SorterResult<Item>[]
  ) => {
    const searchParams = new URLSearchParams(location.search);

    // Preserve existing filters
    Object.entries(filters).forEach(([key, value]) => {
      if (value) {
        if (Array.isArray(value)) {
          searchParams.set(key, value.join(','));
        } else {
          searchParams.set(key, String(value));
        }
      } else {
        searchParams.delete(key);
      }
    });

    // Update pagination
    const { current, pageSize } = pagination;
    searchParams.set(UI_CONSTANTS.URL_PARAMS.PAGE, String(current));
    searchParams.set(UI_CONSTANTS.URL_PARAMS.PAGE_SIZE, String(pageSize));

    // Handle sorting
    if (Array.isArray(sorter)) {
      if (sorter.length > 0 && sorter[0].column) {
        const field = sorter[0].field as string;
        const order = sorter[0].order;

        if (order) {
          searchParams.set(UI_CONSTANTS.URL_PARAMS.SORT, field);
          searchParams.set(
            UI_CONSTANTS.URL_PARAMS.ORDER,
            order === 'ascend' ? 'asc' : 'desc'
          );
        } else {
          searchParams.delete(UI_CONSTANTS.URL_PARAMS.SORT);
          searchParams.delete(UI_CONSTANTS.URL_PARAMS.ORDER);
        }
      }
    } else if (sorter.column) {
      const field = sorter.field as string;
      const order = sorter.order;

      if (order) {
        searchParams.set(UI_CONSTANTS.URL_PARAMS.SORT, field);
        searchParams.set(
          UI_CONSTANTS.URL_PARAMS.ORDER,
          order === 'ascend' ? 'asc' : 'desc'
        );
      } else {
        searchParams.delete(UI_CONSTANTS.URL_PARAMS.SORT);
        searchParams.delete(UI_CONSTANTS.URL_PARAMS.ORDER);
      }
    } else {
      searchParams.delete(UI_CONSTANTS.URL_PARAMS.SORT);
      searchParams.delete(UI_CONSTANTS.URL_PARAMS.ORDER);
    }

    navigate(`${location.pathname}?${searchParams.toString()}`, {
      replace: true,
    });
  };

  const handleRowClick = (record: Item, event: React.MouseEvent) => {
    const target = event.target as HTMLElement;

    // Check if the click is on any interactive element
    const isInteractiveElement =
      target.closest('button') ||
      target.closest('img') ||
      target.closest('a') ||
      target.closest('.ant-btn-link') || // Relation field buttons
      target.closest('.ant-select') || // Select dropdowns
      target.closest('.ant-switch') || // Switch components
      target.closest('.ant-upload'); // Upload components

    if (isInteractiveElement) {
      return;
    }

    const idField = selectedEndpoint?.idField;
    if (!idField) {
      api.error({
        message: 'Error',
        description: 'ID field is not configured',
        duration: alertDuration,
      });
      return;
    }
    const itemId = record[idField];
    if (!itemId) {
      api.error({
        message: 'Error',
        description: 'Item ID is missing',
        duration: alertDuration,
      });
      return;
    }
    navigate(`/${entity}/view/${itemId}`, { replace: true });
  };

  const handleEdit = async (item: Item) => {
    if (!selectedEndpoint) return;
    const idField = selectedEndpoint.idField;
    if (!idField) {
      api.error({
        message: 'Error',
        description: 'ID field is not configured',
        duration: alertDuration,
      });
      return;
    }
    const itemId = item[idField];
    if (!itemId) {
      api.error({
        message: 'Error',
        description: 'Item ID is missing',
        duration: alertDuration,
      });
      return;
    }
    navigate(`/${entity}/edit/${itemId}`, { replace: true });
  };

  const handleModalClose = () => {
    setModalState({ type: null, item: null });
    navigate(`/${entity}`, { replace: true });
  };

  const handleDetailModalClose = () => {
    setModalState({ type: null, item: null });
    setSelectedItem(null);
    setDetailModalVisible(false);
    navigate(`/${entity}`, { replace: true });
  };

  const handleEditFromDetail = () => {
    setDetailModalVisible(false);
    setSelectedItem(null);

    const idField = selectedEndpoint?.idField;
    if (!idField) {
      api.error({
        message: 'Error',
        description: 'ID field is not configured',
        duration: alertDuration,
      });
      return;
    }
    if (modalState.item && modalState.item[idField]) {
      navigate(`/${entity}/edit/${modalState.item[idField]}`, {
        replace: true,
      });
    }
  };

  // Effect to handle modal visibility based on modalState
  useEffect(() => {
    if (modalState.type && modalState.item) {
      if (modalState.type === 'view') {
        setSelectedItem(modalState.item);
        setDetailModalVisible(true);
        setIsModalVisible(false); // Ensure edit modal is closed
        setEditingItem(null); // Clear any editing state
        form.resetFields(); // Clear form state
      } else if (modalState.type === 'edit') {
        setEditingItem(modalState.item);
        form.setFieldsValue(modalState.item);
        setIsModalVisible(true);
        setDetailModalVisible(false); // Ensure detail modal is closed
        setSelectedItem(null); // Clear detail view state
      }
    } else if (!operation || !id) {
      // Only clear modals if we're not supposed to show one
      setDetailModalVisible(false);
      setSelectedItem(null);
      setIsModalVisible(false);
      setEditingItem(null);
      form.resetFields();
    }
  }, [modalState, form, operation, id]);

  const fetchItemById = async (itemId: string) => {
    if (!selectedEndpoint || !operation) {
      return;
    }
    try {
      setLoading(true);

      // Clear existing state
      if (operation === 'edit') {
        setDetailModalVisible(false);
        setSelectedItem(null);
      } else {
        setIsModalVisible(false);
        setEditingItem(null);
        form.resetFields();
      }

      const response = await apiClient.get(`${selectedEndpoint.url}/${itemId}`);
      const { data } = response.data;
      const itemData = data || response.data;

      // Set the modal state based on the operation type
      setModalState({ type: operation, item: itemData });

      // Additional state updates based on operation
      if (operation === 'edit') {
        setEditingItem(itemData);
        form.setFieldsValue(itemData);
      } else if (operation === 'view') {
        setSelectedItem(itemData);
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : UI_CONSTANTS.ERROR_MESSAGES.UNKNOWN_ERROR;
      api.error({
        message: 'Error',
        description: `Failed to fetch item: ${errorMessage}`,
        duration: alertDuration,
        placement: 'topRight',
      });
      // Navigate back to the list view on error
      navigate(`/${entity}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (values: Record<string, unknown>) => {
    if (!selectedEndpoint) return;

    try {
      setLoading(true);

      // Check if there are any file fields
      const hasFileFields = selectedEndpoint.fields.some(
        (field) =>
          (field.isFile || field.isImage) && values[field.key] instanceof File
      );

      // Format relation fields
      const formattedValues = { ...values };
      selectedEndpoint.fields.forEach((field) => {
        if (field.type === 'relation' && field.relation && values[field.key]) {
          formattedValues[field.key] = {
            [field.relation.idField]: values[field.key],
          };
        }
      });

      let requestData;
      let headers = {};

      if (hasFileFields) {
        // Create FormData for file uploads
        const formData = new FormData();

        // Add all form values to FormData
        Object.entries(formattedValues).forEach(([key, value]) => {
          if (value instanceof File) {
            // Handle File objects
            formData.append(key, value);
          } else if (typeof value === 'object' && value !== null) {
            // Handle objects (convert to JSON string)
            formData.append(key, JSON.stringify(value));
          } else {
            // Find the field configuration to check its type
            const field = selectedEndpoint.fields.find((f) => f.key === key);
            if (field?.type === 'number') {
              // For number fields, convert to number before appending
              formData.append(key, String(Number(value)));
            } else {
              // For other primitive values
              formData.append(key, String(value));
            }
          }
        });

        requestData = formData;
        // Let the browser set the correct Content-Type with boundary for FormData
      } else {
        // For non-file submissions, use JSON
        requestData = formattedValues;
        headers = {
          'Content-Type': 'application/json',
        };
      }

      if (editingItem) {
        const idField = selectedEndpoint.idField;
        if (!idField) {
          throw new Error('ID field is not configured');
        }
        const itemId = editingItem[idField];
        if (!itemId) {
          throw new Error('Item ID is missing');
        }
        await apiClient.patch(
          `${selectedEndpoint.url}/${itemId}`,
          requestData,
          { headers }
        );
        api.success({
          message: 'Success',
          description: 'Item updated successfully',
          duration: alertDuration,
        });
      } else {
        await apiClient.post(selectedEndpoint.url, requestData, {
          headers,
        });
        api.success({
          message: 'Success',
          description: 'Item created successfully',
          duration: alertDuration,
        });
      }

      handleModalClose();
      fetchItems();
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : UI_CONSTANTS.ERROR_MESSAGES.UNKNOWN_ERROR;
      api.error({
        message: 'Error',
        description: `Failed to save item: ${errorMessage}`,
        duration: alertDuration,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!selectedEndpoint) return;
    setDeleteInput('');
    setItemToDelete(id);
    setDeleteModalVisible(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedEndpoint || !itemToDelete || deleteInput !== 'DELETE') return;

    try {
      setLoading(true);
      await apiClient.delete(`${selectedEndpoint.url}/${itemToDelete}`);
      api.success({
        message: 'Success',
        description: 'Item deleted successfully',
        duration: alertDuration,
      });
      fetchItems();
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : UI_CONSTANTS.ERROR_MESSAGES.UNKNOWN_ERROR;
      api.error({
        message: 'Error',
        description: `Failed to delete item: ${errorMessage}`,
        duration: alertDuration,
      });
    } finally {
      setLoading(false);
      setDeleteModalVisible(false);
      setItemToDelete(null);
      setDeleteInput('');
    }
  };

  const renderValue = (value: unknown): string | number | boolean | null => {
    if (value === null || value === undefined) {
      return null;
    }

    if (typeof value === 'object') {
      // Handle relation objects that have an idField
      if ('uid' in value) {
        return (value as { uid: string }).uid;
      }
      return String(value);
    }

    if (typeof value === 'string') {
      // Handle string "true" / "false" and "1" / "0" as booleans
      if (value === 'true' || value === '1') {
        return true;
      }
      if (value === 'false' || value === '0') {
        return false;
      }
      return value; // Return the string itself if it's not a boolean string
    }

    if (typeof value === 'number') {
      // Handle number 1 / 0 as booleans
      if (value === 1) {
        return true;
      }
      if (value === 0) {
        return false;
      }
      return value; // Return the number itself if it's not a boolean representation
    }

    if (typeof value === 'boolean') {
      return value; // Return the boolean value itself
    }

    return String(value); // Fallback for other types (like Date, Symbol, etc.)
  };

  const renderFormField = (field: FieldConfig) => {
    const rules: Rule[] = [
      {
        required: field.required,
        message: `${field.label} ${UI_CONSTANTS.FORM_MESSAGES.REQUIRED_FIELD}`,
      },
    ];

    if (field.validator) {
      const validatorFn = field.validator;
      rules.push({
        validator: async (_: unknown, value: unknown) => {
          const validationResult = validatorFn(value);
          if (!validationResult.status) {
            throw new Error(
              validationResult.message ||
                UI_CONSTANTS.FORM_MESSAGES.INVALID_VALUE
            );
          }
        },
      });
    }

    // Only disable fields that are explicitly marked as read-only
    const isDisabled = field.readOnly === true;

    // Handle relations
    if (field.type === 'relation' && field.relation) {
      return (
        <RelationField
          field={field}
          apiClient={apiClient}
          rules={rules}
          isDisabled={isDisabled}
          form={form}
        />
      );
    }

    // Handle file and image uploads // TODO: Fix file management, support both upload to url and post as Formdata
    if (field.isFile || field.isImage) {
      const currentValue = form.getFieldValue(field.key as NamePath);
      const uploadFileList: UploadFile[] = currentValue
        ? [
            {
              uid: '-1',
              name: field.key,
              status: 'done',
              url: currentValue,
            },
          ]
        : [];

      const uploadProps = {
        name: field.key,
        action: field.uploadUrl || `${selectedEndpoint?.url}/upload`,
        headers: {
          authorization: 'Bearer your-token',
        },
        onChange(info: UploadChangeParam) {
          if (info.file.status === 'uploading') {
            // Just store the file in the form state without uploading
            form.setFieldValue(field.key as NamePath, info.file.originFileObj);
          } else if (info.file.status === 'done') {
            message.success(`${info.file.name} file selected successfully`);
            // Set the file in the form
            form.setFieldValue(field.key as NamePath, info.file.originFileObj);
          } else if (info.file.status === 'error') {
            message.error(`${info.file.name} file selection failed.`);
          }
          if (info.file.size / 1024 / 1024 > 0) {
            message.error(`File must be smaller than ${field.maxSize}MB!`);
            return false;
          }
        },
        accept: field.accept || (field.isImage ? 'image/*' : undefined),
        maxCount: UI_CONSTANTS.DEFAULTS.FIRST_PAGE,
        fileList: uploadFileList,
        // Remove customRequest to prevent automatic upload
      };

      return (
        <Form.Item
          name={field.key as NamePath}
          label={field.label}
          rules={rules}>
          <Upload {...uploadProps}>
            <Button
              icon={
                (field.isImage ? (
                  <PictureOutlined />
                ) : (
                  <FileOutlined />
                )) as ReactNode
              }>
              {field.isImage ? 'Select Image' : 'Select File'}
            </Button>
          </Upload>
        </Form.Item>
      );
    }

    switch (field.type) {
      case 'boolean':
        return (
          <Form.Item
            name={field.key as NamePath}
            label={field.label}
            valuePropName='checked'
            rules={rules}>
            <Switch
              checkedChildren={UI_CONSTANTS.STATUS_TEXTS.YES}
              unCheckedChildren={UI_CONSTANTS.STATUS_TEXTS.NO}
              disabled={isDisabled}
            />
          </Form.Item>
        );
      case 'url':
        return (
          <Form.Item
            name={field.key as NamePath}
            label={field.label}
            rules={rules}>
            <Input
              type='url'
              placeholder={field.placeHolder}
              disabled={isDisabled}
            />
          </Form.Item>
        );
      case 'email':
        return (
          <Form.Item
            name={field.key as NamePath}
            label={field.label}
            rules={[
              ...rules,
              {
                type: 'email',
                message: UI_CONSTANTS.FORM_MESSAGES.INVALID_EMAIL,
              },
            ]}>
            <Input
              type='email'
              placeholder={field.placeHolder}
              disabled={isDisabled}
            />
          </Form.Item>
        );
      case 'number':
        return (
          <Form.Item
            name={field.key as NamePath}
            label={field.label}
            rules={[
              ...rules,
              {
                type: 'number',
                message: UI_CONSTANTS.FORM_MESSAGES.INVALID_NUMBER,
              },
            ]}>
            <InputNumber
              placeholder={field.placeHolder}
              disabled={isDisabled}
              style={{ width: '100%' }}
              min={0}
            />
          </Form.Item>
        );
      case 'textarea':
        return (
          <Form.Item
            name={field.key as NamePath}
            label={field.label}
            rules={rules}>
            <Input.TextArea
              placeholder={field.placeHolder}
              disabled={isDisabled}
              rows={4}
            />
          </Form.Item>
        );
      case 'select':
        return (
          <Form.Item
            name={field.key as NamePath}
            label={field.label}
            rules={rules}>
            <Select
              placeholder={field.placeHolder || `Select ${field.label}`}
              disabled={isDisabled}
              allowClear>
              {field.options?.map(
                (option) =>
                  (
                    <Select.Option key={option.value} value={option.value}>
                      {option.label}
                    </Select.Option>
                  ) as ReactNode
              )}
            </Select>
          </Form.Item>
        );
      default:
        return (
          <Form.Item
            name={field.key as NamePath}
            label={field.label}
            rules={rules}>
            <Input placeholder={field.placeHolder} disabled={isDisabled} />
          </Form.Item>
        );
    }
  };

  const columns = selectedEndpoint
    ? [
        ...selectedEndpoint.fields
          .filter((field) => field.showInList)
          .map((field) => {
            // Get current sort from URL
            const searchParams = new URLSearchParams(location.search);
            const currentSort = searchParams.get(UI_CONSTANTS.URL_PARAMS.SORT);
            const currentOrder = searchParams.get(
              UI_CONSTANTS.URL_PARAMS.ORDER
            );

            // Determine the sort order for this column
            let sortOrder: SortOrder | undefined = undefined;
            if (currentSort === field.key) {
              sortOrder = currentOrder === 'asc' ? 'ascend' : 'descend';
            }

            return {
              title: field.label,
              dataIndex: field.key,
              key: field.key,
              sorter: !!field.sortable,
              sortOrder: sortOrder,
              filters: field.filterable
                ? field.filterType === 'boolean'
                  ? [
                      { text: 'True', value: true },
                      { text: 'False', value: false },
                    ]
                  : undefined
                : undefined,
              filterMode:
                field.filterable && field.filterType === 'eq'
                  ? ('tree' as const)
                  : undefined,
              filterSearch: field.filterable && field.filterType === 'eq',
              filterDropdown:
                field.filterable && field.filterType === 'range'
                  ? ({
                      setSelectedKeys,
                      selectedKeys,
                      confirm,
                      clearFilters,
                    }: FilterDropdownProps) => (
                      <div style={{ padding: 8 }}>
                        <Input
                          placeholder='Min'
                          value={selectedKeys[0] as string}
                          onChange={(e) =>
                            setSelectedKeys(
                              e.target.value
                                ? [
                                    e.target.value,
                                    selectedKeys[
                                      UI_CONSTANTS.DEFAULTS.FIRST_PAGE
                                    ],
                                  ]
                                : []
                            )
                          }
                          style={{ width: 100, marginRight: 8 }}
                        />
                        <Input
                          placeholder='Max'
                          value={
                            selectedKeys[
                              UI_CONSTANTS.DEFAULTS.FIRST_PAGE
                            ] as string
                          }
                          onChange={(e) =>
                            setSelectedKeys([selectedKeys[0], e.target.value])
                          }
                          style={{ width: 100 }}
                        />
                        <Button
                          type='primary'
                          onClick={() => confirm()}
                          size='small'
                          style={{ width: 90, marginRight: 8 }}>
                          Filter
                        </Button>
                        {clearFilters && (
                          <Button
                            onClick={() =>
                              clearFilters ? clearFilters() : () => {}
                            }
                            size='small'>
                            Reset
                          </Button>
                        )}
                      </div>
                    )
                  : undefined,
              render: (value: unknown) => {
                if (field.renderInList) {
                  return field.renderInList(
                    renderValue(value) as string | number | boolean | null
                  );
                }

                if (field.type === 'relation' && field.relation && value) {
                  const idValue =
                    typeof value === 'object' && field.relation.idField in value
                      ? value.uid
                      : renderValue(value);
                  return (
                    <Button
                      type='link'
                      onClick={() => {
                        // e.stopPropagation();
                        // Use window.location.href to navigate without triggering React Router effects
                        window.location.href = `/${
                          field.relation!.entity
                        }/view/${idValue}`;
                      }}>
                      View {field.label} {/* TODO: Introduce a render*/}
                    </Button>
                  );
                }

                if (field.isImage && value) {
                  return (
                    <div onClick={(e) => e.stopPropagation()}>
                      <Image width={40} src={renderValue(value) as string} />
                    </div>
                  );
                }

                if (field.isFile && value) {
                  return (
                    <Button
                      icon={(<FileOutlined />) as ReactNode}
                      size='small'
                      onClick={(e) => {
                        e.stopPropagation();
                        window.open(renderValue(value) as string, '_blank');
                      }}>
                      View File
                    </Button>
                  );
                }

                if (field.type === 'boolean') {
                  return (
                    <Switch
                      checked={!!renderValue(value)}
                      checkedChildren='Yes'
                      unCheckedChildren='No'
                      disabled
                    />
                  );
                }
                if (field.type === 'url' && value) {
                  return (
                    <Image width={40} src={renderValue(value) as string} />
                  );
                }
                return renderValue(value) as React.ReactNode;
              },
            };
          }),
        {
          title: 'Actions',
          key: 'actions',
          render: (_: unknown, record: Item) => {
            const { idField } = selectedEndpoint;
            if (!idField) {
              return null;
            }
            return (
              <Space>
                <Button
                  type='primary'
                  icon={(<EditOutlined />) as ReactNode}
                  onClick={() => handleEdit(record)}>
                  Edit
                </Button>
                <Button
                  danger
                  icon={(<DeleteOutlined />) as ReactNode}
                  onClick={() => handleDelete(record[idField] as string)}>
                  Delete
                </Button>
              </Space>
            );
          },
        },
      ]
    : [];

  const DeleteConfirmationModal = (
    <Modal
      title={UI_CONSTANTS.MODAL_TITLES.CONFIRM_DELETION}
      open={deleteModalVisible}
      onOk={handleDeleteConfirm}
      onCancel={() => {
        setDeleteModalVisible(false);
        setItemToDelete(null);
        setDeleteInput('');
      }}
      okText={UI_CONSTANTS.BUTTON_TEXTS.DELETE}
      okType='danger'
      okButtonProps={{
        disabled: deleteInput !== 'DELETE',
      }}
      cancelText={UI_CONSTANTS.BUTTON_TEXTS.CANCEL}>
      <div>
        <p>{UI_CONSTANTS.MODAL_MESSAGES.DELETE_CONFIRMATION}</p>
        <p>{UI_CONSTANTS.MODAL_MESSAGES.DELETE_WARNING}</p>
        <p>{UI_CONSTANTS.MODAL_MESSAGES.DELETE_INPUT_PLACEHOLDER}</p>
        <Input
          value={deleteInput}
          onChange={(e) => setDeleteInput(e.target.value)}
          placeholder={UI_CONSTANTS.MODAL_MESSAGES.DELETE_INPUT_PLACEHOLDER}
        />
      </div>
    </Modal>
  );

  const renderDetailValue = (field: FieldConfig, value: unknown) => {
    if (field.renderInDetail) {
      return field.renderInDetail(renderValue(value));
    }

    if (field.type === 'relation' && field.relation && value) {
      const idValue =
        typeof value === 'object' && 'uid' in value
          ? value.uid
          : renderValue(value);
      return (
        <Button
          type='link'
          onClick={() => {
            // Use window.location.href to navigate without triggering React Router effects
            window.location.href = `/${field.relation!.entity}/view/${idValue}`;
          }}>
          View {field.label}
        </Button>
      );
    }

    if (field.isImage && value) {
      return <Image width={200} src={String(value)} />;
    }

    if (field.isFile && value) {
      return (
        <Button
          icon={(<FileOutlined />) as ReactNode}
          onClick={() => window.open(String(value), '_blank')}>
          Download File
        </Button>
      );
    }

    if (field.type === 'boolean') {
      return value ? 'Yes' : 'No';
    }

    if (field.type === 'url' && value) {
      return <Image width={100} src={String(value)} />;
    }

    if (value !== null && value !== undefined) {
      return String(value);
    }

    return null;
  };

  const DetailModal = useDrawer ? (
    <Drawer
      title={UI_CONSTANTS.MODAL_TITLES.ITEM_DETAILS}
      open={detailModalVisible}
      onClose={handleDetailModalClose}
      width={UI_CONSTANTS.LAYOUT.DRAWER_WIDTH}
      placement='right'
      footer={
        <div style={{ textAlign: 'right' }}>
          <Space>
            <Button onClick={handleDetailModalClose}>
              {UI_CONSTANTS.BUTTON_TEXTS.CLOSE}
            </Button>
            {selectedItem && selectedEndpoint && (
              <Button type='primary' onClick={handleEditFromDetail}>
                {UI_CONSTANTS.BUTTON_TEXTS.EDIT}
              </Button>
            )}
          </Space>
        </div>
      }>
      {selectedItem && selectedEndpoint && (
        <div>
          {selectedEndpoint.fields.map((field) => {
            const value = selectedItem[field.key];
            return (
              <div key={field.key} style={{ marginBottom: '16px' }}>
                <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
                  {field.label}:
                </div>
                <div>{renderDetailValue(field, value)}</div>
              </div>
            );
          })}
        </div>
      )}
    </Drawer>
  ) : (
    <Modal
      title={UI_CONSTANTS.MODAL_TITLES.ITEM_DETAILS}
      open={detailModalVisible}
      onCancel={handleDetailModalClose}
      footer={null}
      width={UI_CONSTANTS.LAYOUT.MODAL_WIDTH}>
      {selectedItem &&
        selectedEndpoint &&
        ((
          <div>
            {selectedEndpoint.fields.map((field) => {
              const value = selectedItem[field.key];
              return (
                <div key={field.key} style={{ marginBottom: '16px' }}>
                  <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
                    {field.label}:
                  </div>
                  <div>{renderDetailValue(field, value)}</div>
                </div>
              );
            })}
            <div style={{ marginTop: '16px', textAlign: 'right' }}>
              <Space>
                <Button onClick={handleDetailModalClose}>
                  {UI_CONSTANTS.BUTTON_TEXTS.CLOSE}
                </Button>
                <Button type='primary' onClick={handleEditFromDetail}>
                  {UI_CONSTANTS.BUTTON_TEXTS.EDIT}
                </Button>
              </Space>
            </div>
          </div>
        ) as ReactNode)}
    </Modal>
  );

  const EditModal = useDrawer ? (
    <Drawer
      title={
        editingItem
          ? UI_CONSTANTS.MODAL_TITLES.EDIT_ITEM
          : UI_CONSTANTS.MODAL_TITLES.ADD_ITEM
      }
      open={isModalVisible}
      onClose={handleModalClose}
      width={UI_CONSTANTS.LAYOUT.DRAWER_WIDTH}
      placement='right'
      footer={
        <div style={{ textAlign: 'right' }}>
          <Space>
            <Button
              type='primary'
              onClick={() => form.submit()}
              loading={loading}>
              {editingItem
                ? UI_CONSTANTS.BUTTON_TEXTS.UPDATE
                : UI_CONSTANTS.BUTTON_TEXTS.ADD}{' '}
              Item
            </Button>
            <Button onClick={handleModalClose}>
              {UI_CONSTANTS.BUTTON_TEXTS.CANCEL}
            </Button>
          </Space>
        </div>
      }>
      <Spin spinning={loading}>
        <Form
          form={form}
          layout='vertical'
          onFinish={handleSubmit}
          initialValues={editingItem || {}}>
          {selectedEndpoint?.fields
            .filter((field) =>
              editingItem
                ? field.isPatchable || !field.isReadOnly
                : field.isPostable || !field.isReadOnly
            )
            .map((field) => (
              <div key={field.key}>{renderFormField(field)}</div>
            ))}
        </Form>
      </Spin>
    </Drawer>
  ) : (
    <Modal
      title={
        editingItem
          ? UI_CONSTANTS.MODAL_TITLES.EDIT_ITEM
          : UI_CONSTANTS.MODAL_TITLES.ADD_ITEM
      }
      open={isModalVisible}
      onCancel={handleModalClose}
      footer={null}
      width={UI_CONSTANTS.LAYOUT.MODAL_WIDTH}>
      <Spin spinning={loading}>
        <Form
          form={form}
          layout='vertical'
          onFinish={handleSubmit}
          initialValues={editingItem || {}}>
          {selectedEndpoint?.fields
            .filter((field) =>
              editingItem
                ? field.isPatchable || !field.isReadOnly
                : field.isPostable || !field.isReadOnly
            )
            .map((field) => (
              <div key={field.key}>{renderFormField(field)}</div>
            ))}
          <Form.Item>
            <Space>
              <Button type='primary' htmlType='submit' loading={loading}>
                {editingItem
                  ? UI_CONSTANTS.BUTTON_TEXTS.UPDATE
                  : UI_CONSTANTS.BUTTON_TEXTS.ADD}{' '}
                Item
              </Button>
              <Button onClick={handleModalClose}>
                {UI_CONSTANTS.BUTTON_TEXTS.CANCEL}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Spin>
    </Modal>
  );

  const handleAddNew = () => {
    setEditingItem(null);
    form.resetFields();
    setIsModalVisible(true);
  };

  // Add handleFilterChange function
  const handleFilterChange = (newFilters: Record<string, string[]>) => {
    // Create a new URLSearchParams from the current URL
    const searchParams = new URLSearchParams(location.search);

    // Set pagination parameters
    searchParams.set(UI_CONSTANTS.URL_PARAMS.PAGE, '1');
    searchParams.set(
      UI_CONSTANTS.URL_PARAMS.PAGE_SIZE,
      String(pagination.pageSize)
    );

    // Set sorting parameters if they exist
    if (sorting.field) {
      searchParams.set(UI_CONSTANTS.URL_PARAMS.SORT, sorting.field);
      searchParams.set(
        UI_CONSTANTS.URL_PARAMS.ORDER,
        sorting.order === 'ascend' ? 'asc' : 'desc'
      );
    }

    // Add new filter parameters
    Object.entries(newFilters).forEach(([key, value]) => {
      if (value && value.length > 0) {
        if (Array.isArray(value)) {
          if (value.length === 2) {
            searchParams.set(`${key}[min]`, String(value[0]));
            searchParams.set(
              `${key}[max]`,
              String(value[UI_CONSTANTS.DEFAULTS.FIRST_PAGE])
            );
          } else {
            searchParams.set(key, value.map(String).join(','));
          }
        } else {
          searchParams.set(key, String(value));
        }
      }
    });

    // Update the URL
    navigate(`${location.pathname}?${searchParams.toString()}`, {
      replace: true,
    });
  };

  return (
    <Layout
      style={{
        minHeight: '100%',
        background: 'transparent',
        display: 'flex',
        flexDirection: 'row',
        height: '100%',
      }}>
      {contextHolder}
      <Sider
        trigger={null}
        collapsible
        collapsed={collapsed}
        style={{ background: '#fff' }}>
        <Menu
          mode='inline'
          selectedKeys={[entity || '']}
          items={config.endpoints.map((endpoint) => ({
            key: endpoint.key,
            label: endpoint.label,
            onClick: () => navigate(`/${endpoint.key}`),
          }))}
        />
        <Button
          type='text'
          icon={
            (collapsed ? (
              <MenuUnfoldOutlined />
            ) : (
              <MenuFoldOutlined />
            )) as ReactNode
          }
          onClick={() => setCollapsed(!collapsed)}
          style={{
            width: '100%',
            borderRadius: 0,
            position: 'absolute',
            bottom: 0,
            left: 0,
            borderTop: '1px solid #f0f0f0',
          }}
        />
      </Sider>
      <Layout
        style={{
          background: '#fff',
          padding: '24px',
          flex: UI_CONSTANTS.DEFAULTS.FIRST_PAGE,
          display: 'flex',
          flexDirection: 'column',
        }}>
        <div
          style={{ marginBottom: 16, display: 'flex', alignItems: 'center' }}>
          <h1 style={{ margin: 0 }}>{selectedEndpoint?.label}</h1>
          <Button
            type='primary'
            onClick={() => handleAddNew()}
            style={{ marginLeft: 'auto' }}>
            Add New {selectedEndpoint?.label}
          </Button>
        </div>

        <FilterRow
          fields={selectedEndpoint?.fields || []}
          onFilterChange={handleFilterChange}
          currentFilters={filters}
        />

        <div
          style={{
            flex: UI_CONSTANTS.DEFAULTS.FIRST_PAGE,
            display: 'flex',
            flexDirection: 'column',
            minHeight: 0,
          }}>
          <Table
            dataSource={items}
            columns={columns}
            rowKey={(record) =>
              record[selectedEndpoint?.idField || 'id'] as string
            }
            pagination={{
              ...pagination,
              position: ['bottomCenter'],
              style: { marginBottom: 0 },
            }}
            loading={loading}
            onChange={handleTableChange}
            onRow={(record) => ({
              onClick: (event) => handleRowClick(record, event),
              style: { cursor: 'pointer' },
            })}
            scroll={{ x: 'max-content', y: 'calc(100vh - 400px)' }}
            style={{ flex: UI_CONSTANTS.DEFAULTS.FIRST_PAGE, minHeight: 0 }}
          />
        </div>

        {EditModal as ReactNode}
        {DetailModal as ReactNode}
        {DeleteConfirmationModal as ReactNode}
      </Layout>
    </Layout>
  );
}
