import { App as AntApp, ConfigProvider } from 'antd';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';

import type { EndpointConfig } from './components/ItemCrud';
import ItemCrud from './components/ItemCrud';
import axios from 'axios';

function App() {
  const apiClient = axios.create({
    baseURL: 'http://localhost:3000',
    headers: { Authorization: 'Bearer your-token' },
  });

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
            label: 'Emailaaa',
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
                  element={<ItemCrud apiClient={apiClient} config={config} />}
                />
                <Route
                  path='/:entity/:operation/:id'
                  element={<ItemCrud apiClient={apiClient} config={config} />}
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
