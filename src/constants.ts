export const UI_CONSTANTS = {
  // Modal and Drawer titles
  MODAL_TITLES: {
    EDIT_ITEM: 'Edit Item',
    ADD_ITEM: 'Add New Item',
    ITEM_DETAILS: 'Item Details',
    CONFIRM_DELETION: 'Confirm Deletion',
  },

  // Button texts
  BUTTON_TEXTS: {
    EDIT: 'Edit',
    DELETE: 'Delete',
    CLOSE: 'Close',
    CANCEL: 'Cancel',
    UPDATE: 'Update',
    ADD: 'Add',
    APPLY_FILTERS: 'Apply Filters',
    VIEW_FILE: 'View File',
    SELECT_IMAGE: 'Select Image',
    SELECT_FILE: 'Select File',
    DOWNLOAD_FILE: 'Download File',
  },

  // Modal messages
  MODAL_MESSAGES: {
    DELETE_CONFIRMATION: 'Are you sure you want to delete this item?',
    DELETE_WARNING: 'This action cannot be undone.',
    DELETE_INPUT_PLACEHOLDER: 'Type DELETE to confirm',
    FILE_SELECT_SUCCESS: 'file selected successfully',
    FILE_SELECT_FAILED: 'file selection failed.',
    FILE_SIZE_ERROR: 'File must be smaller than',
  },

  // Form messages
  FORM_MESSAGES: {
    REQUIRED_FIELD: 'is required',
    INVALID_EMAIL: 'Please enter a valid email',
    INVALID_NUMBER: 'Please enter a valid number',
    INVALID_VALUE: 'Invalid value',
  },

  // Status texts
  STATUS_TEXTS: {
    YES: 'Yes',
    NO: 'No',
  },

  // Error messages
  ERROR_MESSAGES: {
    UNKNOWN_ERROR: 'Unknown error occurred',
    ERROR: 'Error',
    FAILED_TO_FETCH_ITEMS: 'Failed to fetch items: ',
    FAILED_TO_FETCH_ITEM: 'Failed to fetch item: ',
    FAILED_TO_SAVE_ITEM: 'Failed to save item: ',
    FAILED_TO_DELETE_ITEM: 'Failed to delete item: ',
    ID_FIELD_NOT_CONFIGURED: 'ID field is not configured',
    ITEM_ID_MISSING: 'Item ID is missing',
  },

  // Success messages
  SUCCESS_MESSAGES: {
    ITEM_UPDATED: 'Item updated successfully',
    ITEM_CREATED: 'Item created successfully',
    ITEM_DELETED: 'Item deleted successfully',
  },

  // ID field configurations
  ID_FIELDS: {
    POSSIBLE_FIELDS: ['id', 'uid', 'uuid', '_id'] as const,
  },

  // URL parameters
  URL_PARAMS: {
    PAGE: 'page',
    PAGE_SIZE: 'pageSize',
    SORT: 'sort',
    ORDER: 'order',
  },

  // Layout dimensions
  LAYOUT: {
    DRAWER_WIDTH: 800,
    MODAL_WIDTH: 600,
    IMAGE_WIDTH_SMALL: 40,
    IMAGE_WIDTH_MEDIUM: 100,
    IMAGE_WIDTH_LARGE: 200,
    TEXTAREA_ROWS: 4,
  },

  // Default values
  DEFAULTS: {
    FIRST_PAGE: 1,
    PAGE_SIZE: 10,
    ALERT_DURATION: 5,
  },

  // File upload
  FILE_UPLOAD: {
    DEFAULT_UID: '-1',
    DEFAULT_STATUS: 'done',
  },
} as const;
