import {
  Button,
  Card,
  Drawer,
  Form,
  Image,
  Input,
  InputNumber,
  Layout,
  Menu,
  Modal,
  Result,
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
  ReloadOutlined,
} from '@ant-design/icons';
import type { FormInstance, Rule } from 'antd/es/form';
import type { UploadChangeParam, UploadFile } from 'antd/es/upload/interface';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';

import { AxiosInstance } from 'axios';
import type { ColumnsType } from 'antd/es/table';
import { ErrorBoundary } from 'react-error-boundary';
import type { RcFile } from 'antd/es/upload';
import type { ReactNode } from 'react';

const { Sider, Content } = Layout;

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

  const fetchItems = useCallback(async () => {
    if (!selectedEndpoint) {
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const response = await apiClient.get(selectedEndpoint.url, {
        params: {
          page: pagination.current,
          limit: pagination.pageSize,
        },
      });

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
      setLoading(false);
    }
  }, [
    selectedEndpoint,
    api,
    apiClient,
    pagination.current,
    pagination.pageSize,
  ]);

  const handleRowClick = (record: Item, event: React.MouseEvent) => {
    const target = event.target as HTMLElement;
    // Check if the click is on a button, image, or file link
    if (
      target.closest('button') ||
      target.closest('img') ||
      target.closest('a')
    ) {
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

  // Main effect to handle URL parameters and data fetching
  useEffect(() => {
    let isSubscribed = true;

    const loadData = async () => {
      if (entity) {
        const endpoint = config.endpoints.find((e) => e.key === entity);
        if (endpoint && isSubscribed) {
          // Only reset pagination if the entity has changed
          const prevEntity = selectedEndpoint?.key;
          if (prevEntity !== entity) {
            setPagination({
              current: 1,
              pageSize: 10,
              total: 0,
            });
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

  // Effect to handle URL parameters
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const page = searchParams.get('page');
    const pageSize = searchParams.get('pageSize');

    if (page || pageSize) {
      setPagination((prev) => ({
        ...prev,
        current: page ? parseInt(page, 10) : prev.current,
        pageSize: pageSize ? parseInt(pageSize, 10) : prev.pageSize,
      }));
    }
  }, [location.search]);

  // Effect to update URL when pagination changes
  useEffect(() => {
    if (selectedEndpoint && !operation && !id) {
      const searchParams = new URLSearchParams();
      searchParams.set('page', pagination.current.toString());
      searchParams.set('pageSize', pagination.pageSize.toString());
      navigate(`/${selectedEndpoint.key}?${searchParams.toString()}`, {
        replace: true,
      });
    }
  }, [
    pagination.current,
    pagination.pageSize,
    selectedEndpoint,
    navigate,
    operation,
    id,
  ]);

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
          .map((field) => ({
            title: field.label,
            dataIndex: field.key,
            key: field.key,
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
                      navigate(`/${field.relation!.entity}/view/${idValue}`);
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
                return <Image width={40} src={renderValue(value) as string} />;
              }
              return renderValue(value) as React.ReactNode;
            },
          })),
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
          onClick={() =>
            navigate(`/${field.relation!.entity}/view/${idValue}`)
          }>
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

  const handleTableChange = (newPagination: {
    current?: number;
    pageSize?: number;
    total?: number;
  }) => {
    if (
      newPagination.current !== pagination.current ||
      newPagination.pageSize !== pagination.pageSize
    ) {
      setPagination((prev) => ({
        ...prev,
        current: newPagination.current || prev.current,
        pageSize: newPagination.pageSize || prev.pageSize,
      }));

      fetchItems();
    }
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
      {DeleteConfirmationModal}
      {DetailModal}
      {EditModal}
      <Sider
        width={250}
        theme='light'
        collapsible
        collapsed={collapsed}
        onCollapse={(value) => setCollapsed(value)}
        trigger={
          <div style={{ textAlign: 'center', padding: '8px' }}>
            {collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
          </div>
        }
        style={{
          background: '#fff',
          borderRight: '1px solid #f0f0f0',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
          overflow: 'auto',
          height: '100%',
        }}>
        <Menu
          mode='inline'
          selectedKeys={selectedEndpoint ? [selectedEndpoint.key] : []}
          style={{ height: '100%', borderRight: 0 }}>
          {config.endpoints.map((endpoint) => (
            <Menu.Item
              key={endpoint.key}
              onClick={() => navigate(`/${endpoint.key}`)}>
              {endpoint.label}
            </Menu.Item>
          ))}
        </Menu>
      </Sider>
      <Layout
        style={{
          background: 'transparent',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
        }}>
        <Content
          style={{
            flex: 1,
            overflow: 'auto',
            padding: 0,
          }}>
          <ErrorBoundary
            FallbackComponent={ErrorFallback}
            onReset={() => setError(null)}>
            {error && !loading ? (
              <Card
                style={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  alignItems: 'center',
                }}>
                <div
                  style={{
                    color: 'red',
                    fontSize: '16px',
                    marginBottom: '16px',
                  }}>
                  {error}
                </div>
                <Button
                  type='primary'
                  onClick={() => fetchItems()}
                  icon={<ReloadOutlined />}>
                  Retry
                </Button>
              </Card>
            ) : (
              <>
                <Card
                  title={`${
                    selectedEndpoint?.label || 'Select an endpoint'
                  } Management`}
                  extra={
                    <Button type='primary' onClick={handleAddNew}>
                      Add New Item
                    </Button>
                  }
                  style={{
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                  }}
                  bodyStyle={{
                    flex: 1,
                    padding: 0,
                    overflow: 'hidden',
                  }}>
                  <Spin
                    spinning={loading}
                    tip='Loading...'
                    size='large'
                    style={{
                      maxHeight: '100%',
                      padding: '20px',
                    }}>
                    <Table
                      dataSource={items}
                      columns={columns}
                      rowKey={(record) =>
                        String(record[selectedEndpoint?.idField || 'id'])
                      }
                      onChange={handleTableChange}
                      onRow={(record) => ({
                        onClick: (event) => handleRowClick(record, event),
                        style: { cursor: 'pointer' },
                      })}
                      pagination={{
                        current: pagination.current,
                        pageSize: pagination.pageSize,
                        total: pagination.total,
                        showSizeChanger: true,
                        showQuickJumper: true,
                      }}
                      style={{ height: '100%' }}
                      scroll={{ y: 'calc(100vh - 200px)' }}
                    />
                  </Spin>
                </Card>
              </>
            )}
          </ErrorBoundary>
        </Content>
      </Layout>
    </Layout>
  );
}
