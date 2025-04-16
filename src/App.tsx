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
    }).format(value);
  }
  return String(value);
};

const formatDate = (value: unknown): React.ReactNode => {
  if (typeof value === 'string') {
    try {
      const date = new Date(value);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return String(value);
    }
  }
  return String(value);
};

const formatStatus = (value: unknown): React.ReactNode => {
  if (typeof value === 'string') {
    const statusMap: Record<string, { color: string; text: string }> = {
      active: { color: 'green', text: 'Active' },
      inactive: { color: 'red', text: 'Inactive' },
      pending: { color: 'orange', text: 'Pending' },
    };

    const status = statusMap[value.toLowerCase()] || {
      color: 'default',
      text: String(value),
    };
    return (
      <span style={{ color: status.color, fontWeight: 'bold' }}>
        {status.text}
      </span>
    );
  }
  return String(value);
};

function App() {
  const apiClient = axios.create({
    baseURL: 'http://localhost:3000',
    headers: { Authorization: 'Bearer your-token' },
  });

  // You can toggle this to switch between Modal and Drawer
  const useDrawer = true;

  const config: { endpoints: EndpointConfig[] } = {
    endpoints: [
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
            isNullable: false,
            isPostable: false,
            isPutable: false,
            isPatchable: false,
            shouldShowInListView: true,
          },
          {
            key: 'fname',
            label: 'First Name',
            placeHolder: 'Enter first name',
            type: 'text',
            validator: 'string',
            isNullable: false,
            isPostable: true,
            isPutable: true,
            isPatchable: true,
            shouldShowInListView: true,
          },
          {
            key: 'lname',
            label: 'Last Name',
            placeHolder: 'Enter last name',
            type: 'text',
            validator: 'string',
            isNullable: false,
            isPostable: true,
            isPutable: true,
            isPatchable: false,
            shouldShowInListView: true,
          },
          {
            key: 'email',
            label: 'Email',
            placeHolder: 'Enter email',
            type: 'string',
            validator: 'isEmail',
            isNullable: false,
            isPostable: true,
            isPutable: true,
            isPatchable: true,
            shouldShowInListView: true,
          },
          {
            key: 'photo',
            label: 'Photo URL',
            placeHolder: 'Enter photo URL',
            type: 'url',
            validator: (value: unknown) => {
              if (typeof value === 'string') {
                try {
                  new URL(value);
                  return { status: true };
                } catch {
                  return { status: false, message: 'Please enter a valid URL' };
                }
              }
              return { status: false, message: 'Please enter a valid URL' };
            },
            isNullable: true,
            isPostable: true,
            isPutable: true,
            isPatchable: true,
            shouldShowInListView: false,
          },
          {
            key: 'status',
            label: 'Status',
            type: 'boolean',
            isNullable: true,
            isPostable: false,
            isPutable: true,
            isPatchable: true,
            shouldShowInListView: true,
            renderInList: (value) => formatStatus(value),
            renderInDetail: (value) => formatStatus(value),
          },
        ],
        validator: (formData: Record<string, unknown>) => {
          if (!formData.fname) {
            return { status: false, message: 'First name is required' };
          }
          if (!formData.lname) {
            return { status: false, message: 'Last name is required' };
          }
          if (!formData.email) {
            return { status: false, message: 'Email is required' };
          }
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (
            typeof formData.email === 'string' &&
            !emailRegex.test(formData.email)
          ) {
            return {
              status: false,
              message: 'Please enter a valid email address',
            };
          }
          return { status: true };
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
            isNullable: false,
            isPostable: false,
            isPutable: false,
            isPatchable: false,
            shouldShowInListView: true,
          },
          {
            key: 'fname',
            label: 'First Name',
            placeHolder: 'Enter first name',
            type: 'text',
            validator: 'string',
            isNullable: false,
            isPostable: true,
            isPutable: true,
            isPatchable: true,
            shouldShowInListView: true,
          },
          {
            key: 'lname',
            label: 'Last Name',
            placeHolder: 'Enter last name',
            type: 'text',
            validator: 'string',
            isNullable: false,
            isPostable: true,
            isPutable: true,
            isPatchable: true,
            shouldShowInListView: true,
          },
          {
            key: 'email',
            label: 'Email',
            placeHolder: 'Enter email',
            type: 'email',
            validator: (value: unknown) => {
              const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
              if (typeof value === 'string' && emailRegex.test(value)) {
                return { status: true };
              }
              return {
                status: false,
                message: 'Please enter a valid email address',
              };
            },
            isNullable: false,
            isPostable: true,
            isPutable: true,
            isPatchable: true,
            shouldShowInListView: true,
          },
          {
            key: 'photo',
            label: 'Photo URL',
            placeHolder: 'Enter photo URL',
            type: 'url',
            validator: (value: unknown) => {
              if (typeof value === 'string') {
                try {
                  new URL(value);
                  return { status: true };
                } catch {
                  return { status: false, message: 'Please enter a valid URL' };
                }
              }
              return { status: false, message: 'Please enter a valid URL' };
            },
            isNullable: true,
            isPostable: true,
            isPutable: true,
            isPatchable: true,
            shouldShowInListView: false,
          },
          {
            key: 'status',
            label: 'Status',
            type: 'boolean',
            isNullable: true,
            isPostable: true,
            isPutable: true,
            isPatchable: true,
            shouldShowInListView: true,
            renderInList: (value) => formatStatus(value),
            renderInDetail: (value) => formatStatus(value),
          },
          {
            key: 'user',
            label: 'User',
            type: 'relation',
            isNullable: true,
            isPostable: true,
            isPutable: true,
            isPatchable: true,
            shouldShowInListView: true,
            relation: {
              url: '/users',
              column: 'id',
            },
          },
        ],
        validator: (formData: Record<string, unknown>) => {
          if (!formData.fname) {
            return { status: false, message: 'First name is required' };
          }
          if (!formData.lname) {
            return { status: false, message: 'Last name is required' };
          }
          if (!formData.email) {
            return { status: false, message: 'Email is required' };
          }
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (
            typeof formData.email === 'string' &&
            !emailRegex.test(formData.email)
          ) {
            return {
              status: false,
              message: 'Please enter a valid email address',
            };
          }
          return { status: true };
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
            isNullable: false,
            isPostable: false,
            isPutable: false,
            isPatchable: false,
            shouldShowInListView: true,
          },
          {
            key: 'name',
            label: 'Name',
            placeHolder: 'Enter item name',
            type: 'text',
            validator: 'string',
            isNullable: false,
            isPostable: true,
            isPutable: true,
            isPatchable: true,
            shouldShowInListView: true,
          },
          {
            key: 'price',
            label: 'Price',
            placeHolder: 'Enter price',
            type: 'number',
            validator: (value: unknown) => {
              if (typeof value === 'number' && value >= 0) {
                return { status: true };
              }
              return {
                status: false,
                message: 'Price must be a positive number',
              };
            },
            isNullable: false,
            isPostable: true,
            isPutable: true,
            isPatchable: true,
            shouldShowInListView: true,
            renderInList: (value) => formatCurrency(value),
            renderInDetail: (value) => formatCurrency(value),
          },
          {
            key: 'createdAt',
            label: 'Created At',
            type: 'text',
            isNullable: true,
            isPostable: false,
            isPutable: false,
            isPatchable: false,
            shouldShowInListView: true,
            renderInList: (value) => formatDate(value),
            renderInDetail: (value) => formatDate(value),
          },
          {
            key: 'status',
            label: 'Status',
            type: 'text',
            isNullable: true,
            isPostable: true,
            isPutable: true,
            isPatchable: true,
            shouldShowInListView: true,
            renderInList: (value) => formatStatus(value),
            renderInDetail: (value) => formatStatus(value),
          },
        ],
        validator: (formData: Record<string, unknown>) => {
          if (!formData.name) {
            return { status: false, message: 'Name is required' };
          }
          if (!formData.price) {
            return { status: false, message: 'Price is required' };
          }
          if (typeof formData.price !== 'number' || formData.price < 0) {
            return {
              status: false,
              message: 'Price must be a positive number',
            };
          }
          return { status: true };
        },
      },
    ],
  };

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
                      config={config}
                      useDrawer={useDrawer}
                    />
                  }
                />
                <Route
                  path='/:entity/:operation/:id'
                  element={
                    <ItemCrud
                      apiClient={apiClient}
                      config={config}
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
