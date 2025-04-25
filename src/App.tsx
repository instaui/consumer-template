import { App as AntApp, ConfigProvider } from 'antd';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';

import { EndpointConfig } from './components/types.ts';
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
  ) as React.ReactNode;
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
          required: true,
          readOnly: true,
          showInList: true,
          filterable: true,
          filterType: 'eq',
        },
        {
          key: 'fname',
          label: 'First Name',
          type: 'text',
          required: true,
          showInList: true,
          patchable: true,
          postable: true,
          filterable: true,
          sortable: true,
          filterType: 'eq',
        },
        {
          key: 'lname',
          label: 'Last Name',
          type: 'text',
          required: true,
          showInList: true,
          patchable: true,
          postable: true,
          filterable: true,
          filterType: 'eq',
        },
        {
          key: 'date',
          label: 'Date',
          type: 'datetime',
          required: true,
          showInList: true,
          patchable: true,
          postable: true,
          filterable: true,
          filterType: 'eq',
        },
        {
          key: 'date2',
          label: 'Date2',
          type: 'datetime',
          required: true,
          showInList: true,
          patchable: true,
          postable: true,
          filterable: true,
          filterType: 'eq',
          keepLocalTime: true,
        },
        {
          key: 'photo',
          label: 'Photo',
          type: 'url',
          required: false,
          showInList: true,
          patchable: true,
          postable: true,
          isImage: true,
        },
        {
          key: 'status',
          label: 'Status',
          type: 'boolean',
          required: true,
          showInList: true,
          patchable: true,
          postable: true,
          filterable: true,
          filterType: 'boolean',
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
          required: true,
          readOnly: true,
          showInList: true,
          filterable: true,
          filterType: 'eq',
        },
        {
          key: 'fname',
          label: 'First Name',
          type: 'text',
          required: true,
          showInList: true,
          patchable: true,
          postable: true,
          filterable: true,
          filterType: 'eq',
        },
        {
          key: 'lname',
          label: 'Last Name',
          type: 'text',
          required: true,
          showInList: true,
          patchable: true,
          postable: true,
          filterable: true,
          filterType: 'eq',
        },
        {
          key: 'name',
          label: 'Name',
          type: 'text',
          required: true,
          showInList: true,
          patchable: true,
          postable: true,
          filterable: true,
          filterType: 'eq',
        },
        {
          key: 'email',
          label: 'Email',
          type: 'email',
          required: true,
          showInList: true,
          patchable: true,
          postable: true,
          filterable: true,
          filterType: 'eq',
        },
        {
          key: 'photo',
          label: 'Photo',
          type: 'url',
          required: false,
          showInList: true,
          patchable: true,
          postable: true,
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
          required: true,
          showInList: true,
          patchable: true,
          postable: true,
          filterable: true,
          filterType: 'eq',
          renderInList: formatStatus,
          renderInDetail: formatStatus,
        },
        {
          key: 'user',
          label: 'User',
          type: 'relation',
          required: false,
          showInList: false,
          patchable: true,
          postable: true,
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
          required: true,
          readOnly: true,
          showInList: true,
          filterable: true,
          filterType: 'eq',
        },
        {
          key: 'name',
          label: 'Name',
          type: 'text',
          required: true,
          showInList: true,
          patchable: true,
          postable: true,
          filterable: true,
          filterType: 'eq',
        },
        {
          key: 'description',
          label: 'Description',
          type: 'textarea',
          required: true,
          showInList: true,
          patchable: true,
          postable: true,
          filterable: true,
          filterType: 'eq',
        },
        {
          key: 'price',
          label: 'Price',
          type: 'number',
          required: true,
          showInList: true,
          patchable: true,
          postable: true,
          renderInList: formatCurrency,
          renderInDetail: formatCurrency,
          filterable: true,
          filterType: 'range',
        },
        {
          key: 'status',
          label: 'Status',
          type: 'boolean',
          required: true,
          showInList: true,
          patchable: true,
          postable: true,
          filterable: true,
          sortable: true,
          filterType: 'boolean',
        },
        {
          key: 'image',
          label: 'Image',
          type: 'url',
          required: false,
          showInList: true,
          patchable: true,
          postable: true,
          isImage: true,
        },
        {
          key: 'file',
          label: 'File',
          type: 'url',
          required: false,
          showInList: true,
          patchable: true,
          postable: true,
          isFile: true,
        },
        {
          key: 'user',
          label: 'User',
          type: 'relation',
          required: false,
          showInList: true,
          patchable: true,
          postable: true,
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
