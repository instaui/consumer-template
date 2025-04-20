import {JSX, useEffect, useState} from "react";
import {NamePath} from "antd/es/form/interface";
import { UploadFile} from "antd/es/upload/interface";
import {message, Upload} from "antd";

interface FieldType {
	key: string;
	label: string;
	isFile?: boolean;
	isImage?: boolean;
	uploadUrl?: string;
	accept?: string;
	maxSize?: number;
	allowMultiple?: boolean;
	maxCount?: number;
	rules?: any[];
}

interface UploadFieldProps {
	field: FieldType;
	form: any;
	apiClient: any;
}

const UploadField: React.FC<UploadFieldProps> = ({ field, form, apiClient }) => {
	const isMultiple = !!field.allowMultiple;
	const maxCount = field.maxCount || (isMultiple ? 5 : 1);
	const isUploadUrlPresent = !!field.uploadUrl;
	
	const currentValue = form.getFieldValue(field.key);
	const currentFiles = Array.isArray(currentValue)
		? currentValue
		: currentValue
			? [currentValue]
			: [];
	
	const [fileList, setFileList] = useState<UploadFile[]>([]);
	
	useEffect(() => {
		const initialFileList = currentFiles.map((file: any, index: number) => ({
			uid: `${index}`,
			name: file.name || `file-${index}`,
			status: 'done',
			url: file.url,
			type: file.type,
			thumbUrl: file.url,
		}));
		setFileList(initialFileList);
	}, [currentFiles]);
	
	const handleRemove = (file: UploadFile) => {
		const updatedList = fileList.filter((f) => f.uid !== file.uid);
		setFileList(updatedList);
		const updatedValue = isMultiple
			? updatedList.map((f) => f.originFileObj || f)
			: null;
		form.setFieldValue(field.key, updatedValue);
	};
	
	const customRequest = async ({ file, onSuccess, onError }: any) => {
		if (!isUploadUrlPresent) {
			const updatedList = isMultiple
				? [...fileList, { uid: `${Date.now()}`, status: 'done', name: file.name, originFileObj: file }]
				: [{ uid: `${Date.now()}`, status: 'done', name: file.name, originFileObj: file }];
			
			setFileList(updatedList);
			form.setFieldValue(
				field.key,
				isMultiple ? updatedList.map((f) => f.originFileObj) : file
			);
			onSuccess('ok');
			return;
		}
		
		const formData = new FormData();
		formData.append('file', file);
		
		try {
			const response = await apiClient.post(field.uploadUrl, formData, {
				headers: { 'Content-Type': 'multipart/form-data' },
			});
			
			const result = response.data;
			const uploadedFile = {
				name: file.name,
				url: result.url || '',
				type: file.type,
				size: file.size,
			};
			
			const updatedList = isMultiple
				? [...fileList, { uid: `${Date.now()}`, status: 'done', ...uploadedFile }]
				: [{ uid: `${Date.now()}`, status: 'done', ...uploadedFile }];
			
			setFileList(updatedList);
			form.setFieldValue(
				field.key,
				isMultiple
					? updatedList.map(({ name, url, type, size }) => ({ name, url, type, size }))
					: uploadedFile
			);
			
			onSuccess(result, file);
			message.success(`${file.name} uploaded successfully`);
		} catch (error) {
			onError?.(error);
			message.error(`${file.name} upload failed`);
		}
	};
	
	const uploadProps = {
		name: field.key,
		multiple: isMultiple,
		maxCount,
		listType: field.isImage ? 'picture' : 'text',
		accept: field.accept || (field.isImage ? 'image/*' : undefined),
		fileList,
		onRemove: handleRemove,
		beforeUpload: (file) => {
			if (field.maxSize && file.size / 1024 / 1024 > field.maxSize) {
				message.error(`File must be smaller than ${field.maxSize}MB!`);
				return Upload.LIST_IGNORE;
			}
			return true;
		},
		customRequest,
		showUploadList: false,
	};
	
	return (
		<Form.Item name={field.key} label={field.label} rules={field.rules}>
			<div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
				<Upload.Dragger {...uploadProps} style={{ flex: 1 }}>
					<p className="ant-upload-drag-icon">
						{field.isImage ? <PictureOutlined /> : <FileOutlined />}
					</p>
					<p className="ant-upload-text">
						Click or drag {field.isImage ? 'image(s)' : 'file(s)'} here
					</p>
					<p className="ant-upload-hint">
						{isMultiple ? `Supports up to ${maxCount} files.` : 'Only a single file is allowed.'}
					</p>
				</Upload.Dragger>
				
				<div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
					{fileList.map((file) =>
						field.isImage && (file.url || file.thumbUrl) ? (
							<img
								key={file.uid}
								src={file.url || file.thumbUrl}
								alt={file.name}
								style={{ width: 60, height: 60, objectFit: 'cover', borderRadius: 4 }}
							/>
						) : (
							<div
								key={file.uid}
								style={{
									fontSize: 12,
									padding: '4px 8px',
									background: '#f5f5f5',
									borderRadius: 4,
								}}
							>
								{file.name}
							</div>
						)
					)}
				</div>
			</div>
		</Form.Item>
	);
};

export default UploadField;