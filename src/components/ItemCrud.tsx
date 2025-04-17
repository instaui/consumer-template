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

import { AxiosInstance } from 'axios';
import type { ColumnsType } from 'antd/es/table';
import { ErrorBoundary } from 'react-error-boundary';
import type { RcFile } from 'antd/es/upload';
import type { ReactNode } from 'react';

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
  isId?: boolean;
  isRequired?: boolean;
  isReadOnly?: boolean;
  isFile?: boolean;
  isImage?: boolean;
  maxSize?: number;
  uploadUrl?: string;
  isNullable?: boolean;
  isPatchable?: boolean;
  isPutable?: boolean;
  isPostable?: boolean;
  shouldShowInListView?: boolean;
  accept?: string;
  placeHolder?: string;
  validator?: (value: unknown) => ValidationResult;
  renderInList?: (value: string | number | boolean | null) => ReactNode;
  renderInDetail?: (value: string | number | boolean | null) => ReactNode;
  relation?: {
    entity: string;
    idField: string;
    keyColumns: string[];
  };
  filterable?: boolean;
  filterType?: 'eq' | 'range' | 'boolean';
}

export interface EndpointConfig {
  key: string;
  label: string;
  url: string;
  idField?: string;
  fields: FieldConfig[];
  validator: (values: Record<string, unknown>) => Record<string, string>;
}

interface Item {
  [key: string]: unknown;
}

interface ItemCrudProps {
  apiClient: AxiosInstance;
  config: {
    endpoints: EndpointConfig[];
  };
  useDrawer?: boolean;
}

interface RelationFieldProps {
  field: FieldConfig;
  apiClient: AxiosInstance;
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
}) => {
  const [options, setOptions] = useState<{ label: string; value: string }[]>(
    []
  );
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadRelationOptions = async () => {
      try {
        setLoading(true);
        const response = await apiClient.get(`/${field.relation!.entity}`);
        const items = response.data.data || response.data;
        const newOptions = items.map((item: Item) => ({
          label: field
            .relation!.keyColumns.map((col) => item[col])
            .filter(Boolean)
            .join(' - '),
          value: item[field.relation!.idField],
        }));
        setOptions(newOptions);
      } catch (error) {
        console.error('Failed to load relation options:', error);
        message.error('Failed to load relation options');
      } finally {
        setLoading(false);
      }
    };

    loadRelationOptions();
  }, [field.relation, apiClient]);

  return (
    <Form.Item name={field.key} label={field.label} rules={rules}>
      <Select
        showSearch
        placeholder={field.placeHolder || `Select ${field.label}`}
        disabled={isDisabled || loading}
        loading={loading}
        options={options}
        filterOption={(input, option) =>
          (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
        }
        onChange={(value) => {
          // Ensure we're setting just the uid value
          form.setFieldValue(field.key, value);
        }}
      />
    </Form.Item>
  );
};

interface FilterState {
  [key: string]: string[];
}

const FilterRow: React.FC<{
  fields: FieldConfig[];
  onFilterChange: (filters: Record<string, string[]>) => void;
  currentFilters: Record<string, string[]>;
}> = ({ fields, onFilterChange, currentFilters }) => {
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
    <Row
      style={{
        padding: '12px 24px',
        background: '#fafafa',
        borderBottom: '1px solid #f0f0f0',
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'flex-end',
      }}>
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
  );
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
  const [error, setError] = useState<string | null>(null);
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [form] = Form.useForm();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedEndpoint, setSelectedEndpoint] =
    useState<EndpointConfig | null>(null);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
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
  const [isFetching, setIsFetching] = useState(false);
  const fetchTimeoutRef = useRef<number | null>(null);
  const isMountedRef = useRef<boolean>(true);
  const requestLockRef = useRef<boolean>(false);
  const lastRequestTimeRef = useRef<number>(0);
  const MIN_REQUEST_INTERVAL = 1000; // 1 second minimum between requests

  // Cleanup function to prevent memory leaks and state updates after unmount
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (fetchTimeoutRef.current) {
        window.clearTimeout(fetchTimeoutRef.current);
        fetchTimeoutRef.current = null;
      }
      requestLockRef.current = false;
    };
  }, []);

  // Parse filters from URL on component mount and URL changes
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const newFilters: Record<string, string[]> = {};

    // Extract filter parameters from URL
    searchParams.forEach((value, key) => {
      // Skip pagination and sorting parameters
      if (
        key === 'page' ||
        key === 'pageSize' ||
        key === 'sort' ||
        key === 'order'
      ) {
        return;
      }

      // Handle range filters (min/max)
      if (key.endsWith('[min]') || key.endsWith('[max]')) {
        const baseKey = key.replace(/\[min\]$|\[max\]$/, '');
        if (!newFilters[baseKey]) {
          newFilters[baseKey] = [];
        }

        if (key.endsWith('[min]')) {
          newFilters[baseKey][0] = value;
        } else {
          newFilters[baseKey][1] = value;
        }
      } else {
        // Handle regular filters
        newFilters[key] = value.split(',');
      }
    });

    setFilters(newFilters);
  }, [location.search]);

  const fetchItems = useCallback(async () => {
    if (!selectedEndpoint || isFetching || requestLockRef.current) {
      return;
    }

    // Check if we've made a request recently
    const now = Date.now();
    const timeSinceLastRequest = now - lastRequestTimeRef.current;

    if (timeSinceLastRequest < MIN_REQUEST_INTERVAL) {
      // If we've made a request recently, schedule a new one
      if (fetchTimeoutRef.current) {
        window.clearTimeout(fetchTimeoutRef.current);
        fetchTimeoutRef.current = null;
      }

      fetchTimeoutRef.current = window.setTimeout(() => {
        fetchItems();
      }, MIN_REQUEST_INTERVAL - timeSinceLastRequest);

      return;
    }

    // Clear any existing timeout
    if (fetchTimeoutRef.current) {
      window.clearTimeout(fetchTimeoutRef.current);
      fetchTimeoutRef.current = null;
    }

    // Set request lock
    requestLockRef.current = true;
    lastRequestTimeRef.current = now;

    try {
      setIsFetching(true);
      setLoading(true);
      setError(null);

      // Use the current URL parameters directly
      const params = new URLSearchParams(location.search);

      // Ensure pagination parameters are set
      if (!params.has('page')) {
        params.set('page', String(pagination.current));
      }
      if (!params.has('pageSize')) {
        params.set('pageSize', String(pagination.pageSize));
      }

      // Ensure sorting parameters are set
      if (sorting.field && !params.has('sort')) {
        params.set('sort', sorting.field);
        params.set('order', sorting.order === 'ascend' ? 'asc' : 'desc');
      }

      console.log('Request params:', params.toString());

      const response = await apiClient.get(selectedEndpoint.url, {
        params,
      });

      if (!isMountedRef.current) return;

      // Handle both array and paginated response formats
      const itemsData = response.data.data || response.data;
      const total =
        response.data.count || response.data.total || itemsData.length;

      // Ensure each item has the ID field properly mapped
      const processedItems = itemsData.map((item: Item) => {
        const idField = selectedEndpoint.idField;
        if (idField && !item[idField]) {
          // If the ID field is configured but missing in the item, try to find it
          const possibleIdFields = ['id', 'uid', '_id'];
          for (const field of possibleIdFields) {
            if (item[field]) {
              item[idField] = item[field];
              break;
            }
          }
        }
        return item;
      });

      setItems(processedItems);
      setPagination((prev) => ({
        ...prev,
        total: total,
      }));
    } catch (err) {
      if (!isMountedRef.current) return;

      const errorMessage =
        err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      api.error({
        message: 'Error',
        description: `Failed to fetch items: ${errorMessage}`,
        duration: 5,
        placement: 'topRight',
      });
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
        setIsFetching(false);

        // Release the request lock after a delay
        setTimeout(() => {
          requestLockRef.current = false;
        }, MIN_REQUEST_INTERVAL);
      }
    }
  }, [
    selectedEndpoint,
    api,
    apiClient,
    pagination.current,
    pagination.pageSize,
    sorting,
    location.search,
    isFetching,
  ]);

  // Effect to handle URL parameters and data fetching
  useEffect(() => {
    let isSubscribed = true;

    const loadData = async () => {
      if (entity) {
        const endpoint = config.endpoints.find((e) => e.key === entity);
        if (endpoint && isSubscribed) {
          // Only reset pagination and filters if the entity has changed
          const prevEntity = selectedEndpoint?.key;
          if (prevEntity !== entity) {
            // Reset all state
            setPagination({
              current: 1,
              pageSize: 10,
              total: 0,
            });
            setFilters({});
            setSorting({
              field: null,
              order: 'ascend',
            });

            // Reset URL to base state
            navigate(`/${entity}`, { replace: true });
          }

          setSelectedEndpoint(endpoint);

          // If we're viewing or editing a specific item, fetch it directly
          if (operation && id) {
            fetchItemById(id);
          } else {
            // Otherwise fetch the list of items
            fetchItems();
          }
        }
      } else if (config.endpoints.length > 0) {
        navigate(`/${config.endpoints[0].key}`, { replace: true });
      }
    };

    loadData();

    return () => {
      isSubscribed = false;
    };
  }, [entity, operation, id, fetchItems, selectedEndpoint]);

  // Update the main effect to handle URL parameters and data fetching
  useEffect(() => {
    let isSubscribed = true;

    const loadData = async () => {
      if (entity) {
        const endpoint = config.endpoints.find((e) => e.key === entity);
        if (endpoint && isSubscribed) {
          // Only reset pagination and filters if the entity has changed
          const prevEntity = selectedEndpoint?.key;
          if (prevEntity !== entity) {
            // Reset all state
            setPagination({
              current: 1,
              pageSize: 10,
              total: 0,
            });
            setFilters({});
            setSorting({
              field: null,
              order: 'ascend',
            });

            // Reset URL to base state
            navigate(`/${entity}`, { replace: true });
          }

          setSelectedEndpoint(endpoint);

          // If we're viewing or editing a specific item, fetch it directly
          if (operation && id) {
            fetchItemById(id);
          } else {
            // Otherwise fetch the list of items
            fetchItems();
          }
        }
      } else if (config.endpoints.length > 0) {
        navigate(`/${config.endpoints[0].key}`, { replace: true });
      }
    };

    loadData();

    return () => {
      isSubscribed = false;
    };
  }, [entity, operation, id, fetchItems, selectedEndpoint]);

  // Update the FilterRow component to use URL parameters
  const handleFilterChange = (newFilters: Record<string, string[]>) => {
    // Create a new URLSearchParams from the current URL
    const searchParams = new URLSearchParams();

    // Set pagination parameters
    searchParams.set('page', '1');
    searchParams.set('pageSize', String(pagination.pageSize));

    // Set sorting parameters if they exist
    if (sorting.field) {
      searchParams.set('sort', sorting.field);
      searchParams.set('order', sorting.order === 'ascend' ? 'asc' : 'desc');
    }

    // Add new filter parameters
    Object.entries(newFilters).forEach(([key, value]) => {
      if (value && value.length > 0) {
        if (Array.isArray(value)) {
          if (value.length === 2) {
            searchParams.set(`${key}[min]`, String(value[0]));
            searchParams.set(`${key}[max]`, String(value[1]));
          } else {
            searchParams.set(key, value.map(String).join(','));
          }
        } else {
          searchParams.set(key, String(value));
        }
      }
    });

    // Update the URL
    navigate(`${location.pathname}?${searchParams.toString()}`);
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
        duration: 5,
        placement: 'topRight',
      });
      return;
    }
    const itemId = record[idField];
    if (!itemId) {
      api.error({
        message: 'Error',
        description: 'Item ID is missing',
        duration: 5,
        placement: 'topRight',
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
        duration: 5,
        placement: 'topRight',
      });
      return;
    }
    const itemId = item[idField];
    if (!itemId) {
      api.error({
        message: 'Error',
        description: 'Item ID is missing',
        duration: 5,
        placement: 'topRight',
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
        duration: 5,
        placement: 'topRight',
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

  // Fix the URL parameter handling in the useEffect
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const page = searchParams.get('page');
    const pageSize = searchParams.get('pageSize');
    // Remove unused variables

    if (page || pageSize) {
      setPagination((prev) => ({
        ...prev,
        current: page ? parseInt(page, 10) : prev.current,
        pageSize: pageSize ? parseInt(pageSize, 10) : prev.pageSize,
      }));
    }
  }, [location.search]);

  const fetchItemById = async (itemId: string) => {
    if (!selectedEndpoint || !operation) {
      return;
    }
    try {
      setLoading(true);
      setError(null);

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
      const itemData = response.data.data || response.data;

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
        err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      api.error({
        message: 'Error',
        description: `Failed to fetch item: ${errorMessage}`,
        duration: 5,
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
      setError(null);

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
          duration: 5,
          placement: 'topRight',
        });
      } else {
        await apiClient.post(selectedEndpoint.url, requestData, {
          headers,
        });
        api.success({
          message: 'Success',
          description: 'Item created successfully',
          duration: 5,
          placement: 'topRight',
        });
      }

      handleModalClose();
      fetchItems();
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      api.error({
        message: 'Error',
        description: `Failed to save item: ${errorMessage}`,
        duration: 5,
        placement: 'topRight',
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
      setError(null);
      await apiClient.delete(`${selectedEndpoint.url}/${itemToDelete}`);
      api.success({
        message: 'Success',
        description: 'Item deleted successfully',
        duration: 5,
        placement: 'topRight',
      });
      fetchItems();
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      api.error({
        message: 'Error',
        description: `Failed to delete item: ${errorMessage}`,
        duration: 5,
        placement: 'topRight',
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
    if (
      typeof value === 'string' ||
      typeof value === 'number' ||
      typeof value === 'boolean'
    ) {
      return value;
    }
    return String(value);
  };

  const renderFormField = (field: FieldConfig) => {
    const rules: Rule[] = [
      { required: field.isRequired, message: `${field.label} is required` },
    ];

    if (field.validator) {
      const validatorFn = field.validator;
      rules.push({
        validator: async (_: unknown, value: unknown) => {
          const validationResult = validatorFn(value);
          if (!validationResult.status) {
            throw new Error(validationResult.message || 'Invalid value');
          }
        },
      });
    }

    // Only disable fields that are explicitly marked as read-only
    const isDisabled = field.isReadOnly === true;

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

    // Handle file and image uploads
    if (field.isFile || field.isImage) {
      const currentValue = form.getFieldValue(field.key);
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
            form.setFieldValue(field.key, info.file.originFileObj);
          } else if (info.file.status === 'done') {
            message.success(`${info.file.name} file selected successfully`);
            // Set the file in the form
            form.setFieldValue(field.key, info.file.originFileObj);
          } else if (info.file.status === 'error') {
            message.error(`${info.file.name} file selection failed.`);
          }
        },
        beforeUpload(file: RcFile) {
          // Check file size
          if (field.maxSize && file.size / 1024 / 1024 > field.maxSize) {
            message.error(`File must be smaller than ${field.maxSize}MB!`);
            return false;
          }
          // Prevent automatic upload
          return false;
        },
        accept: field.accept || (field.isImage ? 'image/*' : undefined),
        maxCount: 1,
        fileList: uploadFileList,
        // Remove customRequest to prevent automatic upload
      };

      return (
        <Form.Item name={field.key} label={field.label} rules={rules}>
          <Upload {...uploadProps}>
            <Button
              icon={field.isImage ? <PictureOutlined /> : <FileOutlined />}>
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
            name={field.key}
            label={field.label}
            valuePropName='checked'
            rules={rules}>
            <Switch
              checkedChildren='Yes'
              unCheckedChildren='No'
              disabled={isDisabled}
            />
          </Form.Item>
        );
      case 'url':
        return (
          <Form.Item name={field.key} label={field.label} rules={rules}>
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
            name={field.key}
            label={field.label}
            rules={[
              ...rules,
              { type: 'email', message: 'Please enter a valid email' },
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
            name={field.key}
            label={field.label}
            rules={[
              ...rules,
              { type: 'number', message: 'Please enter a valid number' },
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
          <Form.Item name={field.key} label={field.label} rules={rules}>
            <Input.TextArea
              placeholder={field.placeHolder}
              disabled={isDisabled}
              rows={4}
            />
          </Form.Item>
        );
      case 'select':
        return (
          <Form.Item name={field.key} label={field.label} rules={rules}>
            <Select
              placeholder={field.placeHolder || `Select ${field.label}`}
              disabled={isDisabled}
              allowClear>
              {field.options?.map((option) => (
                <Select.Option key={option.value} value={option.value}>
                  {option.label}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
        );
      default:
        return (
          <Form.Item name={field.key} label={field.label} rules={rules}>
            <Input placeholder={field.placeHolder} disabled={isDisabled} />
          </Form.Item>
        );
    }
  };

  const columns: ColumnsType<Item> = selectedEndpoint
    ? [
        ...selectedEndpoint.fields
          .filter((field) => field.shouldShowInListView)
          .map((field) => {
            // Get current sort from URL
            const searchParams = new URLSearchParams(location.search);
            const currentSort = searchParams.get('sort');
            const currentOrder = searchParams.get('order');

            // Determine the sort order for this column
            let sortOrder: SortOrder | undefined = undefined;
            if (currentSort === field.key) {
              sortOrder = currentOrder === 'asc' ? 'ascend' : 'descend';
            }

            return {
              title: field.label,
              dataIndex: field.key,
              key: field.key,
              sorter: true,
              sortOrder: sortOrder,
              filters: field.filterable
                ? field.filterType === 'boolean'
                  ? [
                      { text: 'Yes', value: true },
                      { text: 'No', value: false },
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
                                ? [e.target.value, selectedKeys[1]]
                                : []
                            )
                          }
                          style={{ width: 100, marginRight: 8 }}
                        />
                        <Input
                          placeholder='Max'
                          value={selectedKeys[1] as string}
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
                          <Button onClick={() => clearFilters()} size='small'>
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
                    typeof value === 'object' && 'uid' in value
                      ? value.uid
                      : renderValue(value);
                  return (
                    <Button
                      type='link'
                      onClick={(e) => {
                        e.stopPropagation();
                        // Use window.location.href to navigate without triggering React Router effects
                        window.location.href = `/${
                          field.relation!.entity
                        }/view/${idValue}`;
                      }}>
                      View {field.label}
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
                      icon={<FileOutlined />}
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
                      checked={Boolean(renderValue(value))}
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
            const idField = selectedEndpoint.idField;
            if (!idField) {
              return null;
            }
            return (
              <Space>
                <Button
                  type='primary'
                  icon={<EditOutlined />}
                  onClick={() => handleEdit(record)}>
                  Edit
                </Button>
                <Button
                  danger
                  icon={<DeleteOutlined />}
                  onClick={() => handleDelete(record[idField] as string)}>
                  Delete
                </Button>
              </Space>
            );
          },
        },
      ]
    : [];

  const ErrorFallback = ({
    error,
    resetErrorBoundary,
  }: {
    error: Error;
    resetErrorBoundary: () => void;
  }) => (
    <Result
      status='error'
      title='Something went wrong'
      subTitle={error.message}
      extra={[
        <Button type='primary' key='retry' onClick={resetErrorBoundary}>
          Try Again
        </Button>,
      ]}
    />
  );

  const DeleteConfirmationModal = (
    <Modal
      title='Confirm Deletion'
      open={deleteModalVisible}
      onOk={handleDeleteConfirm}
      onCancel={() => {
        setDeleteModalVisible(false);
        setItemToDelete(null);
        setDeleteInput('');
      }}
      okText='Delete'
      okType='danger'
      okButtonProps={{
        disabled: deleteInput !== 'DELETE',
      }}
      cancelText='Cancel'>
      <div>
        <p>Are you sure you want to delete this item?</p>
        <p>This action cannot be undone.</p>
        <p>Type "DELETE" to confirm:</p>
        <Input
          value={deleteInput}
          onChange={(e) => setDeleteInput(e.target.value)}
          placeholder='Type DELETE to confirm'
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
          icon={<FileOutlined />}
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
      title='Item Details'
      open={detailModalVisible}
      onClose={handleDetailModalClose}
      width={800}
      placement='right'
      footer={
        <div style={{ textAlign: 'right' }}>
          <Space>
            <Button onClick={handleDetailModalClose}>Close</Button>
            {selectedItem && selectedEndpoint && (
              <Button type='primary' onClick={handleEditFromDetail}>
                Edit
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
      title='Item Details'
      open={detailModalVisible}
      onCancel={handleDetailModalClose}
      footer={null}
      width={800}>
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
          <div style={{ marginTop: '16px', textAlign: 'right' }}>
            <Space>
              <Button onClick={handleDetailModalClose}>Close</Button>
              <Button type='primary' onClick={handleEditFromDetail}>
                Edit
              </Button>
            </Space>
          </div>
        </div>
      )}
    </Modal>
  );

  const EditModal = useDrawer ? (
    <Drawer
      title={editingItem ? 'Edit Item' : 'Add New Item'}
      open={isModalVisible}
      onClose={handleModalClose}
      width={600}
      placement='right'
      footer={
        <div style={{ textAlign: 'right' }}>
          <Space>
            <Button
              type='primary'
              onClick={() => form.submit()}
              loading={loading}>
              {editingItem ? 'Update' : 'Add'} Item
            </Button>
            <Button onClick={handleModalClose}>Cancel</Button>
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
                ? field.isPutable || field.isPatchable || !field.isReadOnly
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
      title={editingItem ? 'Edit Item' : 'Add New Item'}
      open={isModalVisible}
      onCancel={handleModalClose}
      footer={null}
      width={600}>
      <Spin spinning={loading}>
        <Form
          form={form}
          layout='vertical'
          onFinish={handleSubmit}
          initialValues={editingItem || {}}>
          {selectedEndpoint?.fields
            .filter((field) =>
              editingItem
                ? field.isPutable || field.isPatchable || !field.isReadOnly
                : field.isPostable || !field.isReadOnly
            )
            .map((field) => (
              <div key={field.key}>{renderFormField(field)}</div>
            ))}
          <Form.Item>
            <Space>
              <Button type='primary' htmlType='submit' loading={loading}>
                {editingItem ? 'Update' : 'Add'} Item
              </Button>
              <Button onClick={handleModalClose}>Cancel</Button>
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

  const handleTableChange = (
    pagination: TablePaginationConfig,
    filters: Record<string, FilterValue | null>,
    sorter: SorterResult<Item> | SorterResult<Item>[]
  ) => {
    // Update pagination state
    setPagination({
      current: pagination.current ?? 1,
      pageSize: pagination.pageSize ?? 10,
      total: pagination.total ?? 0,
    });

    // Create new URL parameters
    const searchParams = new URLSearchParams(location.search);

    // Update pagination parameters
    searchParams.set('page', String(pagination.current));
    searchParams.set('pageSize', String(pagination.pageSize));

    // Handle sorting
    if (Array.isArray(sorter)) {
      if (sorter.length > 0 && sorter[0].column) {
        const field = sorter[0].field as string;
        const order = sorter[0].order;

        if (order) {
          searchParams.set('sort', field);
          searchParams.set('order', order === 'ascend' ? 'asc' : 'desc');
        } else {
          searchParams.delete('sort');
          searchParams.delete('order');
        }
      }
    } else if (sorter.column) {
      const field = sorter.field as string;
      const order = sorter.order;

      if (order) {
        searchParams.set('sort', field);
        searchParams.set('order', order === 'ascend' ? 'asc' : 'desc');
      } else {
        searchParams.delete('sort');
        searchParams.delete('order');
      }
    } else {
      searchParams.delete('sort');
      searchParams.delete('order');
    }

    // Update URL with new parameters
    navigate(`${location.pathname}?${searchParams.toString()}`);
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
          icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
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
      <Layout style={{ background: '#fff', padding: '24px', flex: 1 }}>
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

        <Table
          dataSource={items}
          columns={columns}
          rowKey={(record) =>
            record[selectedEndpoint?.idField || 'id'] as string
          }
          pagination={pagination}
          loading={loading}
          onChange={handleTableChange}
          onRow={(record) => ({
            onClick: (event) => handleRowClick(record, event),
            style: { cursor: 'pointer' },
          })}
        />

        {EditModal}
        {DetailModal}
        {DeleteConfirmationModal}
      </Layout>
    </Layout>
  );
}
