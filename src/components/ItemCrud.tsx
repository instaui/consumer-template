import {
  Button,
  Card,
  Form,
  Image,
  Input,
  Layout,
  Menu,
  Modal,
  Result,
  Space,
  Spin,
  Switch,
  Table,
  notification,
} from 'antd';
import {
  DeleteOutlined,
  EditOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';

import { AxiosInstance } from 'axios';
import type { ColumnsType } from 'antd/es/table';
import { ErrorBoundary } from 'react-error-boundary';
import type { Rule } from 'antd/es/form';
import validator from 'validator';

const { Sider, Content } = Layout;

export interface FieldConfig {
  key: string;
  label: string;
  type: string;
  isNullable: boolean;
  isPostable: boolean;
  isPutable: boolean;
  isPatchable: boolean;
  shouldShowInListView: boolean;
  placeHolder?: string;
  validator?:
    | string
    | ((value: unknown) => { status: boolean; message?: string });
  relation?: {
    url: string;
    column: string;
  };
}

export interface EndpointConfig {
  key: string;
  label: string;
  url: string;
  idField?: string;
  fields: FieldConfig[];
  validator?: (formData: Record<string, unknown>) => {
    status: boolean;
    message?: string;
  };
}

interface Item {
  id: string;
  [key: string]: unknown;
}

interface ItemCrudProps {
  apiClient: AxiosInstance;
  config: {
    endpoints: EndpointConfig[];
  };
}

export default function ItemCrud({ apiClient, config }: ItemCrudProps) {
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
  const [retryCount, setRetryCount] = useState(0);
  const MAX_RETRIES = 3;
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

  const fetchItems = useCallback(
    async (retry = false) => {
      console.log('Fetching items:', { selectedEndpoint, operation, id });
      if (!selectedEndpoint) {
        console.log('No selected endpoint');
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const response = await apiClient.get(selectedEndpoint.url, {
          params: {
            page: paginationRef.current.current,
            limit: paginationRef.current.pageSize,
          },
        });

        // Handle both array and paginated response formats
        const itemsData = response.data.data || response.data;
        const total =
          response.data.count || response.data.total || itemsData.length;

        console.log('Fetched items:', itemsData);
        setItems(itemsData);
        setPagination((prev) => ({
          ...prev,
          total: total,
          current: paginationRef.current.current,
          pageSize: paginationRef.current.pageSize,
        }));
        setRetryCount(0);

        // After fetching items, check if we need to show a modal
        if (operation && id) {
          console.log('Checking for modal after fetch:', { operation, id });
          const item = itemsData.find(
            (item: Item) =>
              String(item[selectedEndpoint.idField || 'id']) === id
          );
          if (item) {
            console.log('Found item in fetched data:', item);
            setModalState({ type: operation, item });
          } else {
            console.log(
              'Item not found in fetched data, fetching individually'
            );
            fetchItemById(id);
          }
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Unknown error occurred';
        console.error('Error fetching items:', errorMessage);
        setError(errorMessage);

        if (retry && retryCount < MAX_RETRIES) {
          setRetryCount((prev) => prev + 1);
          setTimeout(() => fetchItems(true), 1000 * retryCount);
        } else {
          api.error({
            message: 'Error',
            description: `Failed to fetch items: ${errorMessage}`,
            duration: 5,
            placement: 'topRight',
          });
        }
      } finally {
        setLoading(false);
      }
    },
    [selectedEndpoint, retryCount, api, apiClient, operation, id]
  );

  const handleRowClick = (record: Item, event: React.MouseEvent) => {
    const target = event.target as HTMLElement;
    if (target.closest('button')) {
      return;
    }
    const idField = selectedEndpoint?.idField || 'id';
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
    console.log('Navigating to view:', itemId);
    navigate(`/${entity}/view/${itemId}`, { replace: true });
  };

  const handleEdit = async (item: Item) => {
    if (!selectedEndpoint) return;
    const idField = selectedEndpoint.idField || 'id';
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
    console.log('Navigating to edit:', itemId);
    navigate(`/${entity}/edit/${itemId}`, { replace: true });
  };

  const handleModalClose = () => {
    console.log('Closing modal');
    setModalState({ type: null, item: null });
    navigate(`/${entity}`, { replace: true });
  };

  const handleDetailModalClose = () => {
    console.log('Closing detail modal');
    setModalState({ type: null, item: null });
    navigate(`/${entity}`, { replace: true });
  };

  // Main effect to handle URL parameters and data fetching
  useEffect(() => {
    let isSubscribed = true;

    const loadData = async () => {
      console.log('URL params effect triggered:', { entity, operation, id });

      if (entity) {
        const endpoint = config.endpoints.find((e) => e.key === entity);
        if (endpoint && isSubscribed) {
          console.log('Setting endpoint:', endpoint.key);
          setSelectedEndpoint(endpoint);

          try {
            setLoading(true);
            const response = await apiClient.get(endpoint.url, {
              params: {
                page: pagination.current,
                limit: pagination.pageSize,
              },
            });

            if (!isSubscribed) return;

            const itemsData = response.data.data || response.data;
            const total =
              response.data.count || response.data.total || itemsData.length;

            setItems(itemsData);
            setPagination((prev) => ({
              ...prev,
              total,
            }));

            // Handle operation and ID after data is loaded
            if (operation && id) {
              console.log('Checking for item:', { operation, id });
              const item = itemsData.find(
                (item: Item) => String(item[endpoint.idField || 'id']) === id
              );

              if (item && isSubscribed) {
                console.log('Found item:', item);
                setModalState({ type: operation, item });
              } else if (isSubscribed) {
                console.log('Item not found, fetching individually');
                const itemResponse = await apiClient.get(
                  `${endpoint.url}/${id}`
                );
                const itemData = itemResponse.data.data || itemResponse.data;
                if (isSubscribed) {
                  setModalState({ type: operation, item: itemData });
                }
              }
            }
          } catch (err) {
            if (!isSubscribed) return;
            const errorMessage =
              err instanceof Error ? err.message : 'Unknown error occurred';
            console.error('Error loading data:', errorMessage);
            setError(errorMessage);
            api.error({
              message: 'Error',
              description: `Failed to load data: ${errorMessage}`,
              duration: 5,
              placement: 'topRight',
            });
          } finally {
            if (isSubscribed) {
              setLoading(false);
            }
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
  }, [entity, operation, id, pagination.current, pagination.pageSize]);

  // Effect to handle modal visibility based on modalState
  useEffect(() => {
    console.log('Modal state changed:', modalState);
    if (modalState.type && modalState.item) {
      if (modalState.type === 'view') {
        console.log('Setting view modal');
        setSelectedItem(modalState.item);
        setDetailModalVisible(true);
      } else if (modalState.type === 'edit') {
        console.log('Setting edit modal');
        setEditingItem(modalState.item);
        form.setFieldsValue(modalState.item);
        setIsModalVisible(true);
      }
    } else if (!operation || !id) {
      // Only clear modals if we're not supposed to show one
      console.log('Clearing modals');
      setDetailModalVisible(false);
      setSelectedItem(null);
      setIsModalVisible(false);
      setEditingItem(null);
    }
  }, [modalState, form, operation, id]);

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

  useEffect(() => {
    if (selectedEndpoint) {
      const searchParams = new URLSearchParams();
      searchParams.set('page', pagination.current.toString());
      searchParams.set('pageSize', pagination.pageSize.toString());
      navigate(`/${selectedEndpoint.key}?${searchParams.toString()}`, {
        replace: true,
      });
    }
  }, [pagination.current, pagination.pageSize, selectedEndpoint, navigate]);

  const fetchItemById = async (itemId: string) => {
    console.log('Fetching item by ID:', itemId);
    if (!selectedEndpoint || !operation) {
      console.log('Missing required params for fetchItemById:', {
        selectedEndpoint,
        operation,
      });
      return;
    }
    try {
      setLoading(true);
      const response = await apiClient.get(`${selectedEndpoint.url}/${itemId}`);
      const itemData = response.data.data || response.data;
      console.log('Fetched item data:', itemData);
      setModalState({ type: operation, item: itemData });
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Unknown error occurred';
      console.error('Error fetching item:', errorMessage);
      api.error({
        message: 'Error',
        description: `Failed to fetch item: ${errorMessage}`,
        duration: 5,
        placement: 'topRight',
      });
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

      if (editingItem) {
        const idField = selectedEndpoint.idField || 'id';
        const itemId = editingItem[idField];
        if (!itemId) {
          throw new Error('Item ID is missing');
        }
        await apiClient.patch(`${selectedEndpoint.url}/${itemId}`, values);
        api.success({
          message: 'Success',
          description: 'Item updated successfully',
          duration: 5,
          placement: 'topRight',
        });
      } else {
        await apiClient.post(selectedEndpoint.url, values);
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

  const renderFormField = (field: FieldConfig) => {
    const rules: Rule[] = [
      { required: !field.isNullable, message: `${field.label} is required` },
    ];

    if (field.validator) {
      if (typeof field.validator === 'string') {
        const validatorFn =
          validator[field.validator as keyof typeof validator];
        if (typeof validatorFn === 'function') {
          rules.push({
            validator: async (_: unknown, value: unknown) => {
              if (typeof value !== 'string') {
                throw new Error('Value must be a string');
              }
              const isValid = (validatorFn as (str: string) => boolean)(value);
              if (!isValid) {
                const errorMessage =
                  validator[
                    `${field.validator}Message` as keyof typeof validator
                  ];
                if (typeof errorMessage === 'string') {
                  throw new Error(errorMessage);
                }
                throw new Error(`Invalid ${field.label}`);
              }
            },
          });
        }
      } else {
        const validatorFn = field.validator;
        rules.push({
          validator: async (_: unknown, value: unknown) => {
            const result = validatorFn(value);
            if (!result.status) {
              throw new Error(result.message || 'Invalid value');
            }
          },
        });
      }
    }

    const isDisabled = Boolean(editingItem) && !field.isPatchable;

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
            <Input
              type='number'
              placeholder={field.placeHolder}
              disabled={isDisabled}
            />
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
              if (field.type === 'boolean') {
                return (
                  <Switch
                    checked={Boolean(value)}
                    checkedChildren='Yes'
                    unCheckedChildren='No'
                    disabled
                  />
                );
              }
              if (field.type === 'url' && value) {
                return <Image width={40} src={value as string} />;
              }
              return value as React.ReactNode;
            },
          })),
        {
          title: 'Actions',
          key: 'actions',
          render: (_: unknown, record: Item) => {
            const idField = selectedEndpoint.idField || 'id';
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

  const DetailModal = (
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
            let displayValue: React.ReactNode = '';

            if (field.type === 'boolean') {
              displayValue = value ? 'Yes' : 'No';
            } else if (field.type === 'url' && value) {
              displayValue = <Image width={100} src={String(value)} />;
            } else if (value !== null && value !== undefined) {
              displayValue = String(value);
            }

            return (
              <div key={field.key} style={{ marginBottom: '16px' }}>
                <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
                  {field.label}:
                </div>
                <div>{displayValue}</div>
              </div>
            );
          })}
          <div style={{ marginTop: '16px', textAlign: 'right' }}>
            <Space>
              <Button onClick={handleDetailModalClose}>Close</Button>
              <Button
                type='primary'
                onClick={() => {
                  const idField = selectedEndpoint.idField || 'id';
                  navigate(`/${entity}/edit/${selectedItem[idField]}`);
                }}>
                Edit
              </Button>
            </Space>
          </div>
        </div>
      )}
    </Modal>
  );

  const EditModal = (
    <Modal
      title={editingItem ? 'Edit Item' : 'Add New Item'}
      open={isModalVisible}
      onCancel={handleModalClose}
      footer={null}
      width={600}>
      <Spin spinning={loading}>
        <Form form={form} layout='vertical' onFinish={handleSubmit}>
          {selectedEndpoint?.fields
            .filter((field) =>
              editingItem
                ? field.isPutable || field.isPatchable
                : field.isPostable
            )
            .map((field) => (
              <div key={field.key}>{renderFormField(field)}</div>
            ))}
          <Form.Item>
            <Space>
              <Button type='primary' htmlType='submit'>
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
    setPagination((prev) => ({
      ...prev,
      ...newPagination,
    }));
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
                  onClick={() => fetchItems(true)}
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
