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
  Table,
  Tag,
  notification,
} from 'antd';
import {
  DeleteOutlined,
  EditOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import { useEffect, useState } from 'react';

import { AxiosInstance } from 'axios';
import type { ColumnsType } from 'antd/es/table';
import { ErrorBoundary } from 'react-error-boundary';
import type { Rule } from 'antd/es/form';

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

  const [api, contextHolder] = notification.useNotification();

  const [deleteInput, setDeleteInput] = useState('');
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);

  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);

  useEffect(() => {
    if (config?.endpoints?.length > 0) {
      setSelectedEndpoint(config.endpoints[0]);
    }
  }, [config.endpoints]);

  useEffect(() => {
    if (selectedEndpoint) {
      fetchItems();
    }
  }, [selectedEndpoint, pagination.current, pagination.pageSize]);

  const fetchItems = async (retry = false) => {
    if (!selectedEndpoint) return;

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

      setItems(itemsData);
      setPagination((prev) => ({
        ...prev,
        total: total,
        current: pagination.current,
        pageSize: pagination.pageSize,
      }));
      setRetryCount(0);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Unknown error occurred';
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
  };

  const handleSubmit = async (values: Record<string, unknown>) => {
    if (!selectedEndpoint) return;

    try {
      setLoading(true);
      setError(null);

      if (editingItem) {
        await apiClient.patch(
          `${selectedEndpoint.url}/${editingItem.id}`,
          values
        );
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

      form.resetFields();
      setEditingItem(null);
      setIsModalVisible(false);
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

  const handleEdit = async (item: Item) => {
    if (!selectedEndpoint) return;

    try {
      setLoading(true);
      const response = await apiClient.get(
        `${selectedEndpoint.url}/${item.id}`
      );
      const itemData = response.data.data || response.data;
      setEditingItem(itemData);

      // Close and reopen modal to ensure form is properly initialized
      setIsModalVisible(false);
      setTimeout(() => {
        form.resetFields();
        form.setFieldsValue(itemData);
        setIsModalVisible(true);
      }, 0);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Unknown error occurred';
      api.error({
        message: 'Error',
        description: `Failed to load item: ${errorMessage}`,
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

  const handleRowClick = (record: Item, event: React.MouseEvent) => {
    // Check if the click was on a button or its children
    const target = event.target as HTMLElement;
    if (target.closest('button')) {
      return;
    }
    setSelectedItem(record);
    setDetailModalVisible(true);
  };

  const renderFormField = (field: FieldConfig) => {
    const rules: Rule[] = [
      { required: !field.isNullable, message: `${field.label} is required` },
    ];

    if (field.validator) {
      if (typeof field.validator === 'string') {
        switch (field.validator) {
          case 'email':
            rules.push({
              type: 'email',
              message: 'Please enter a valid email',
            });
            break;
          case 'url':
            rules.push({ type: 'url', message: 'Please enter a valid URL' });
            break;
          case 'number':
            rules.push({
              type: 'number',
              message: 'Please enter a valid number',
            });
            break;
          default:
            break;
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
            <Input type='checkbox' disabled={isDisabled} />
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
                  <Tag color={value ? 'success' : 'error'}>
                    {value ? 'Active' : 'Inactive'}
                  </Tag>
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
          render: (_: unknown, record: Item) => (
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
                onClick={() => handleDelete(record.id)}>
                Delete
              </Button>
            </Space>
          ),
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
      onCancel={() => {
        setDetailModalVisible(false);
        setSelectedItem(null);
      }}
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
        </div>
      )}
    </Modal>
  );

  const handleAddNew = () => {
    setEditingItem(null);
    form.resetFields();
    setIsModalVisible(true);
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
              onClick={() => setSelectedEndpoint(endpoint)}>
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
                      rowKey='id'
                      onRow={(record) => ({
                        onClick: (event) => handleRowClick(record, event),
                        style: { cursor: 'pointer' },
                      })}
                      pagination={{
                        current: pagination.current,
                        pageSize: pagination.pageSize,
                        total: pagination.total,
                        position: ['bottomCenter'],
                        showSizeChanger: true,
                        showQuickJumper: true,
                        onChange: (page, pageSize) => {
                          setPagination((prev) => ({
                            ...prev,
                            current: page,
                            pageSize: pageSize || prev.pageSize,
                          }));
                        },
                        onShowSizeChange: (current, size) => {
                          setPagination((prev) => ({
                            ...prev,
                            current: 1,
                            pageSize: size,
                          }));
                        },
                      }}
                      style={{ height: '100%' }}
                      scroll={{ y: 'calc(100vh - 200px)' }}
                    />
                  </Spin>
                </Card>

                <Modal
                  title={editingItem ? 'Edit Item' : 'Add New Item'}
                  open={isModalVisible}
                  onCancel={() => {
                    setIsModalVisible(false);
                    form.resetFields();
                    setEditingItem(null);
                  }}
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
                          <Button
                            onClick={() => {
                              setIsModalVisible(false);
                              form.resetFields();
                              setEditingItem(null);
                            }}>
                            Cancel
                          </Button>
                        </Space>
                      </Form.Item>
                    </Form>
                  </Spin>
                </Modal>
              </>
            )}
          </ErrorBoundary>
        </Content>
      </Layout>
    </Layout>
  );
}
