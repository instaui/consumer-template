import { App as AntApp, ConfigProvider } from 'antd';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';

import type { EndpointConfig } from './components/ItemCrud';
import ItemCrud from './components/ItemCrud';
import axios from 'axios';

// Helper functions for custom rendering
const formatCurrency = (value: unknown): React.ReactNode => {
  if (typeof value === 'number') {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  }
  return String(value);
};

const formatStatus = (value: unknown): React.ReactNode => {
  const statusMap: Record<string, { color: string; text: string }> = {
    active: { color: 'green', text: 'Active' },
    inactive: { color: 'red', text: 'Inactive' },
    pending: { color: 'orange', text: 'Pending' },
    completed: { color: 'blue', text: 'Completed' },
  };

  const statusValue = String(value).toLowerCase();
  const status = statusMap[statusValue] || statusMap['inactive'];

  return (
    <span style={{ color: status.color, fontWeight: 'bold' }}>
      {status.text}
    </span>
  );
};

function App() {
  const apiClient = axios.create({
    baseURL: 'http://localhost:3000',
    headers: {
      Authorization: 'Bearer your-token',
      'Content-Type': 'application/json',
    },
  });

  // You can toggle this to switch between Modal and Drawer
  const useDrawer = true;

  const endpoints: EndpointConfig[] = [
    {
      key: 'users',
      label: 'Users',
      url: '/users',
      idField: 'uid',
      fields: [
        {
          key: 'uid',
          label: 'ID',
          type: 'text',
          isId: true,
          isRequired: true,
          isReadOnly: true,
          shouldShowInListView: true,
          filterable: true,
          filterType: 'eq',
        },
        {
          key: 'fname',
          label: 'First Name',
          type: 'text',
          isRequired: true,
          shouldShowInListView: true,
          isPatchable: true,
          isPutable: true,
          isPostable: true,
          filterable: true,
          filterType: 'eq',
        },
        {
          key: 'lname',
          label: 'Last Name',
          type: 'text',
          isRequired: true,
          shouldShowInListView: true,
          isPatchable: true,
          isPutable: true,
          isPostable: true,
          filterable: true,
          filterType: 'eq',
        },
        {
          key: 'email',
          label: 'Email',
          type: 'email',
          isRequired: true,
          shouldShowInListView: true,
          isPatchable: true,
          isPutable: true,
          isPostable: true,
          filterable: true,
          filterType: 'eq',
        },
        {
          key: 'photo',
          label: 'Photo',
          type: 'url',
          isRequired: false,
          shouldShowInListView: true,
          isPatchable: true,
          isPutable: true,
          isPostable: true,
          isImage: true,
        },
        {
          key: 'status',
          label: 'Status',
          type: 'boolean',
          isRequired: true,
          shouldShowInListView: true,
          isPatchable: true,
          isPutable: true,
          isPostable: true,
          filterable: true,
          filterType: 'boolean',
          renderInList: (value) => (
            <span
              style={{ color: value ? 'green' : 'red', fontWeight: 'bold' }}>
              {value ? 'Active' : 'Inactive'}
            </span>
          ),
          renderInDetail: (value) => (
            <span
              style={{ color: value ? 'green' : 'red', fontWeight: 'bold' }}>
              {value ? 'Active' : 'Inactive'}
            </span>
          ),
        },
      ],
      validator: (values) => {
        const errors: Record<string, string> = {};
        if (!values.fname) errors.fname = 'First name is required';
        if (!values.lname) errors.lname = 'Last name is required';
        if (!values.email) errors.email = 'Email is required';
        return errors;
      },
    },
    {
      key: 'agents',
      label: 'Agents',
      url: '/agents',
      idField: 'uid',
      fields: [
        {
          key: 'uid',
          label: 'ID',
          type: 'text',
          isId: true,
          isRequired: true,
          isReadOnly: true,
          shouldShowInListView: true,
          filterable: true,
          filterType: 'eq',
        },
        {
          key: 'fname',
          label: 'First Name',
          type: 'text',
          isRequired: true,
          shouldShowInListView: true,
          isPatchable: true,
          isPutable: true,
          isPostable: true,
          filterable: true,
          filterType: 'eq',
        },
        {
          key: 'lname',
          label: 'Last Name',
          type: 'text',
          isRequired: true,
          shouldShowInListView: true,
          isPatchable: true,
          isPutable: true,
          isPostable: true,
          filterable: true,
          filterType: 'eq',
        },
        {
          key: 'name',
          label: 'Name',
          type: 'text',
          isRequired: true,
          shouldShowInListView: true,
          isPatchable: true,
          isPutable: true,
          isPostable: true,
          filterable: true,
          filterType: 'eq',
        },
        {
          key: 'email',
          label: 'Email',
          type: 'email',
          isRequired: true,
          shouldShowInListView: true,
          isPatchable: true,
          isPutable: true,
          isPostable: true,
          filterable: true,
          filterType: 'eq',
        },
        {
          key: 'photo',
          label: 'Photo',
          type: 'url',
          isRequired: false,
          shouldShowInListView: true,
          isPatchable: true,
          isPutable: true,
          isPostable: true,
          isImage: true,
        },
        {
          key: 'status',
          label: 'Status',
          type: 'select',
          options: [
            { label: 'Active', value: 'active' },
            { label: 'Inactive', value: 'inactive' },
          ],
          isRequired: true,
          shouldShowInListView: true,
          isPatchable: true,
          isPutable: true,
          isPostable: true,
          filterable: true,
          filterType: 'eq',
          renderInList: formatStatus,
          renderInDetail: formatStatus,
        },
        {
          key: 'user',
          label: 'User',
          type: 'relation',
          isRequired: false,
          shouldShowInListView: false,
          isPatchable: true,
          isPutable: true,
          isPostable: true,
          relation: {
            entity: 'users',
            idField: 'uid',
            keyColumns: ['fname', 'lname', 'email'],
          },
        },
      ],
      validator: (values) => {
        const errors: Record<string, string> = {};
        if (!values.fname) errors.fname = 'First name is required';
        if (!values.lname) errors.lname = 'Last name is required';
        if (!values.name) errors.name = 'Name is required';
        if (!values.email) errors.email = 'Email is required';
        if (!values.status) errors.status = 'Status is required';
        return errors;
      },
    },
    {
      key: 'items',
      label: 'Items',
      url: '/items',
      idField: 'uid',
      fields: [
        {
          key: 'uid',
          label: 'ID',
          type: 'text',
          isId: true,
          isRequired: true,
          isReadOnly: true,
          shouldShowInListView: true,
          filterable: true,
          filterType: 'eq',
        },
        {
          key: 'name',
          label: 'Name',
          type: 'text',
          isRequired: true,
          shouldShowInListView: true,
          isPatchable: true,
          isPutable: true,
          isPostable: true,
          filterable: true,
          filterType: 'eq',
        },
        {
          key: 'description',
          label: 'Description',
          type: 'textarea',
          isRequired: true,
          shouldShowInListView: true,
          isPatchable: true,
          isPutable: true,
          isPostable: true,
          filterable: true,
          filterType: 'eq',
        },
        {
          key: 'price',
          label: 'Price',
          type: 'number',
          isRequired: true,
          shouldShowInListView: true,
          isPatchable: true,
          isPutable: true,
          isPostable: true,
          renderInList: formatCurrency,
          renderInDetail: formatCurrency,
          filterable: true,
          filterType: 'range',
        },
        {
          key: 'status',
          label: 'Status',
          type: 'boolean',
          isRequired: true,
          shouldShowInListView: true,
          isPatchable: true,
          isPutable: true,
          isPostable: true,
          filterable: true,
          filterType: 'boolean',
          renderInList: (value) => (
            <span
              style={{ color: value ? 'green' : 'red', fontWeight: 'bold' }}>
              {value ? 'Active' : 'Inactive'}
            </span>
          ),
          renderInDetail: (value) => (
            <span
              style={{ color: value ? 'green' : 'red', fontWeight: 'bold' }}>
              {value ? 'Active' : 'Inactive'}
            </span>
          ),
        },
        {
          key: 'image',
          label: 'Image',
          type: 'url',
          isRequired: false,
          shouldShowInListView: true,
          isPatchable: true,
          isPutable: true,
          isPostable: true,
          isImage: true,
        },
        {
          key: 'file',
          label: 'File',
          type: 'url',
          isRequired: false,
          shouldShowInListView: true,
          isPatchable: true,
          isPutable: true,
          isPostable: true,
          isFile: true,
        },
        {
          key: 'user',
          label: 'User',
          type: 'relation',
          isRequired: false,
          shouldShowInListView: true,
          isPatchable: true,
          isPutable: true,
          isPostable: true,
          relation: {
            entity: 'users',
            idField: 'uid',
            keyColumns: ['fname', 'lname', 'email'],
          },
        },
      ],
      validator: (values) => {
        const errors: Record<string, string> = {};
        if (!values.name) errors.name = 'Name is required';
        if (!values.description) errors.description = 'Description is required';
        if (!values.price) errors.price = 'Price is required';
        return errors;
      },
    },
  ];

  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: '#1890ff',
        },
      }}>
      <AntApp notification={{ placement: 'bottomRight', duration: 5 }}>
        <BrowserRouter>
          <div
            style={{
              width: '100vw',
              height: '100vh',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
            }}>
            <div
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
              }}>
              <Routes>
                <Route path='/' element={<Navigate to='/users' replace />} />
                <Route
                  path='/:entity'
                  element={
                    <ItemCrud
                      apiClient={apiClient}
                      config={{ endpoints }}
                      useDrawer={useDrawer}
                    />
                  }
                />
                <Route
                  path='/:entity/:operation/:id'
                  element={
                    <ItemCrud
                      apiClient={apiClient}
                      config={{ endpoints }}
                      useDrawer={useDrawer}
                    />
                  }
                />
              </Routes>
            </div>
          </div>
        </BrowserRouter>
      </AntApp>
    </ConfigProvider>
  );
}

export default App;
