import { Item, RelationFieldProps } from "./types.ts";
import React, { ReactNode, useCallback, useEffect, useState } from "react";
import { Form, message, Select, Spin } from "antd";
import { UI_CONSTANTS } from "../constants.ts";
import type { NamePath } from "antd/es/form/interface";
import debounce from 'lodash/debounce';

/**
 * RelationField component for selecting related entities
 *
 * This component provides a searchable dropdown that fetches options from an API
 * based on the search text. It supports pagination, loading states, and error handling.
 */
export const RelationField: React.FC<RelationFieldProps> = ({
  field,
  apiClient,
  rules,
  isDisabled,
  form,
}): ReactNode => {
  // Core state for the component
  const [options, setOptions] = useState<{ label: string; value: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const [open, setOpen] = useState(false);

  // Pagination state
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: UI_CONSTANTS.DEFAULTS.PAGE_SIZE,
    total: 0
  });

  /**
   * Fetch options from the API
   * @param page - Page number to fetch
   * @param search - Search text to filter results
   */
  const fetchOptions = useCallback(async (page = 1, search = '') => {
    if (!field.relation) return;

    try {
      setLoading(true);

      // Build query parameters
      const queryParams: Record<string, string> = {
        [UI_CONSTANTS.URL_PARAMS.PAGE]: page.toString(),
        [UI_CONSTANTS.URL_PARAMS.PAGE_SIZE]: pagination.pageSize.toString(),
      };

      // Add columns to fetch
      if (field.relation.keyColumns?.length) {
        queryParams['cols'] = field.relation.keyColumns.join(',');
      }

      // Add search filter if provided
      if (search && field.relation.keyColumns?.length) {
        queryParams['search'] = search;
      }

      // Construct query string
      const queryString = Object.entries(queryParams)
        .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
        .join('&');

      // Make API request
      const response = await apiClient.get(`/${field.relation.entity}?${queryString}`);

      // Process response data
      const responseData = response.data;
      const items = responseData.data as [] ?? [];
      const total = responseData.count ?? items.length;

      // Map items to options
      const newOptions = items.map((item: Item) => {
        if (field.relation?.dropDownOptions) {
          return field.relation.dropDownOptions(item);
        }

        return {
          label: field.relation.keyColumns
            ?.map((col) => item[col])
            .filter(Boolean)
            .join(' - ')
            .toString(),
          value: item[field.relation.idField],
        };
      });

      // Update options - replace on first page, append on subsequent pages
      setOptions(prev =>
        page === 1 ? newOptions : [...prev, ...newOptions]
      );

      // Update pagination
      setPagination(prev => ({
        ...prev,
        current: page,
        total,
      }));
    } catch (error) {
      const { message: errMessage } = error as { message: string };
      message.error(errMessage ?? UI_CONSTANTS.MODAL_MESSAGES.FAILED_TO_LOAD_RELATION);
    } finally {
      setLoading(false);
    }
  }, [field.relation, apiClient, pagination.pageSize]);

  // Create debounced search function
  const debouncedFetchOptions = useCallback(
    debounce((value: string) => {
      fetchOptions(1, value);
    }, 300),
    [fetchOptions]
  );

  // Handle search input change
  const handleSearch = useCallback((value: string) => {
    setSearchValue(value);
    debouncedFetchOptions(value);
  }, [debouncedFetchOptions]);

  // Handle dropdown scroll for pagination
  const handlePopupScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const target = e.target as HTMLDivElement;
    if (
      !loading &&
      target.scrollTop + target.offsetHeight >= target.scrollHeight - 20 &&
      options.length < pagination.total
    ) {
      fetchOptions(pagination.current + 1, searchValue);
    }
  }, [loading, options.length, pagination, fetchOptions, searchValue]);

  // Handle dropdown visibility change
  const handleDropdownVisibleChange = useCallback((visible: boolean) => {
    setOpen(visible);

    // Load initial options when opening dropdown if no options exist
    if (visible && options.length === 0 && !loading) {
      fetchOptions(1, searchValue);
    }
  }, [options.length, loading, fetchOptions, searchValue]);

  // Load initial options on mount
  useEffect(() => {
    fetchOptions(1, '');
  }, [fetchOptions]);

  // Get current value from form
  const currentValue = form.getFieldValue(field.key as NamePath);

  return (
    <Form.Item name={field.key as NamePath} label={field.label} rules={rules}>
      <Select
        showSearch
        placeholder={field.placeHolder || `Select ${field.label}`}
        disabled={isDisabled}
        loading={loading}
        options={options}
        value={currentValue}
        searchValue={searchValue}
        filterOption={false}
        onSearch={handleSearch}
        onPopupScroll={handlePopupScroll}
        onChange={(value) => form.setFieldValue(field.key as NamePath, value)}
        onDropdownVisibleChange={handleDropdownVisibleChange}
        notFoundContent={loading ? <Spin size="small" /> : null}
        allowClear
        defaultActiveFirstOption={false}
        autoClearSearchValue={false}
        popupMatchSelectWidth={false}
        listHeight={256}
        getPopupContainer={(triggerNode) => triggerNode.parentNode as HTMLElement}
      />
    </Form.Item>
  ) as ReactNode;
};
