import { App as AntApp, Card, ConfigProvider, Typography } from 'antd';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';

import { EndpointConfig } from './components/types.ts';
import ItemCrud from './components/ItemCrud';
import axios from 'axios';
import React from 'react';
import { createApiClient } from './utils/apiAdapter';

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

// Custom component for the Items endpoint
const CustomItemsComponent: React.FC = () => {
  const { Title, Paragraph, Text } = Typography;

  return (
    <div style={{ padding: '20px' }}>
      <div style={{ marginBottom: '20px' }}>
        <Title level={2}>Custom Items View</Title>
        <Paragraph>
          This is a custom component for the Items endpoint. It demonstrates how to use custom renders.
        </Paragraph>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px' }}>
        <Card
          title="Sample Item"
          style={{ width: 300 }}
          hoverable
        >
          <p><Text strong>Description:</Text> This is a sample item description.</p>
          <p><Text strong>Price:</Text> {formatCurrency(99.99)}</p>
          <p><Text strong>Status:</Text> {formatStatus('active')}</p>
        </Card>
        <Card
          title="Another Item"
          style={{ width: 300 }}
          hoverable
        >
          <p><Text strong>Description:</Text> Another sample item description.</p>
          <p><Text strong>Price:</Text> {formatCurrency(149.99)}</p>
          <p><Text strong>Status:</Text> {formatStatus('pending')}</p>
        </Card>
      </div>
    </div>
  );
};

// Custom header component
const CustomHeader = () => {
  const { Title } = Typography;

  return (
    <div style={{
      padding: '16px',
      background: '#f0f2f5',
      borderRadius: '4px',
      marginBottom: '24px'
    }}>
      <Title level={2} style={{ margin: 0 }}>Custom Header</Title>
      <p>This is a custom header that can be used with any endpoint.</p>
    </div>
  );
};

// Custom footer component
const CustomFooter = () => {
  return (
    <div style={{
      padding: '16px',
      background: '#f0f2f5',
      borderRadius: '4px',
      marginTop: '24px',
      textAlign: 'center'
    }}>
      <p style={{ margin: 0 }}>instaui © {new Date().getFullYear()}</p>
    </div>
  );
};

// Application-level header component
const AppHeader = () => {
  const { Title } = Typography;

  return (
    <div style={{
      padding: '20px',
      background: '#001529',
      color: 'white',
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)'
    }}>
      <Title level={2} style={{ color: 'white', margin: 0 }}>Item CRUD Application</Title>
      <p style={{ color: 'rgba(255, 255, 255, 0.65)', margin: '8px 0 0 0' }}>
        A React-based CRUD application with dynamic form generation
      </p>
    </div>
  );
};

// Application-level footer component
const AppFooter = () => {
  return (
    <div style={{
      padding: '16px',
      background: '#001529',
      color: 'white',
      textAlign: 'center'
    }}>
      <p style={{ margin: 0 }}>
        instaui © {new Date().getFullYear()} | All Rights Reserved
      </p>
    </div>
  );
};

function App() {
  const axiosInstance = axios.create({
    baseURL: 'http://localhost:3000',
    headers: {
      Authorization: 'Bearer your-token',
      'Content-Type': 'application/json',
    },
  });

  const apiClient = createApiClient(axiosInstance);

  // You can toggle this to switch between Modal and Drawer
  const useDrawer = false;

  const endpoints: EndpointConfig[] = [
    {
      key: 'users',
      label: 'Users',
      url: '/users',
      idField: 'uid',
      // Use custom header and footer but keep the default CRUD component
      header: <div style={{ padding: '16px', background: '#e6f7ff', borderRadius: '4px', marginBottom: '24px' }}>
        <Typography.Title level={2} style={{ margin: 0 }}>Users Management</Typography.Title>
        <Typography.Paragraph>
          This endpoint uses the default CRUD component but with a custom header and footer.
        </Typography.Paragraph>
      </div>,
      footer: <div style={{ padding: '16px', background: '#e6f7ff', borderRadius: '4px', marginTop: '24px', textAlign: 'center' }}>
        <Typography.Text>Users data is managed according to our privacy policy.</Typography.Text>
      </div>,
      // Customize action buttons
      actionButtons: {
        edit: {
          text: 'Modify User',
        },
        delete: {
          text: 'Remove User',
        },
      },
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
          type: 'date',
          required: true,
          showInList: true,
          patchable: true,
          postable: true,
          filterable: true,
          filterType: 'range',
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
          filterType: 'range',
          keepLocalTime: false,
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
      // Hide all action buttons
      actionButtons: {
        show: false
      },
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
	          dropDownOptions:(a) => {
		          return  {
			          label: String(a.fname || ''),
			          value: String(a.uid || '')
		          }
	          }
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
      // Use the custom header
      header: <CustomHeader />,
      // Use the custom footer
      footer: <CustomFooter />,
      // Hide only the delete button
      actionButtons: {
        delete: {
          show: false
        }
      },
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
	        maxSize: 0,
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
          accept: 'pdf',
	        maxSize:1,

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
        {
          key: 'agent',
          label: 'Agent',
          type: 'relation',
          required: false,
          showInList: true,
          patchable: true,
          postable: true,
          relation: {
            entity: 'agents',
            idField: 'uid',
            keyColumns: ['email', 'uid'],
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
	  {
		  key: 'cards',
		  label: 'Cards',
		  url: '/cards',
		  idField: 'uid',
		  // Use the custom component for this endpoint
		  customComponent: CustomItemsComponent,
		  // Use the custom header
		  header: <CustomHeader />,
		  // Use the custom footer
		  footer: <CustomFooter />,
		  fields: [],
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
              overflow: 'scroll',
              display: 'flex',
              flexDirection: 'column',
            }}>
            {/* Application Header */}
            <AppHeader />

            {/* Main Content */}
            <div>
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

            {/* Application Footer */}
            <AppFooter />
          </div>
        </BrowserRouter>
      </AntApp>
    </ConfigProvider>
  );
}

export default App;
