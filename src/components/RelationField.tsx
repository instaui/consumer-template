import {Item, RelationFieldProps} from "./types.ts";
import React, {ReactNode, useEffect, useState} from "react";
import {Form, message, Select} from "antd";
import {UI_CONSTANTS} from "../constants.ts";
import type {NamePath} from "antd/es/form/interface";

export const RelationField: React.FC<RelationFieldProps> = ({
	                                                            field,
	                                                            apiClient,
	                                                            rules,
	                                                            isDisabled,
	                                                            form,
                                                            }): ReactNode => {
	const [options, setOptions] = useState<{ label: string; value: string }[]>(
		[]
	);
	const [loading, setLoading] = useState(false);
	
	useEffect(() => {
		const loadRelationOptions = async () => {
			try {
				setLoading(true);
				const response = await apiClient.get(
					`/${field.relation!.entity}?cols=${field.relation!.keyColumns?.join(
						','
					)}`
				);
				const items = response.data.data as [] ?? response.data;
				// TODO: Handle paginated Response, Support server side filtering
				const newOptions = items.map((item: Item) => {
						return field.relation?.dropDownOptions
							? field.relation.dropDownOptions(item)
							: {
								label: field
									.relation!.keyColumns?.map((col) => item[col])
									.filter(Boolean)
									.join(' - ')
									.toString(),
								value: item[field.relation!.idField],
							}
					}
				);
				setOptions(newOptions as { label: string; value: string }[]);
			} catch (error) {
				const {message: errMessage} = error as { message: string };
				message.error(
					errMessage ?? UI_CONSTANTS.MODAL_MESSAGES.FAILED_TO_LOAD_RELATION,
				);
			} finally {
				setLoading(false);
			}
		};
		
		loadRelationOptions().then(() => {
		});
	}, [field.relation, apiClient]);
	
	return (
		<Form.Item name={field.key as NamePath} label={field.label} rules={rules}>
			<Select
				showSearch
				placeholder={field.placeHolder || `Select ${field.label}`}
				disabled={isDisabled || loading}
				loading={loading}
				options={options}
				filterOption={(input, option) =>
					(option?.label ?? '')
						.toString()
						.toLowerCase()
						.includes(input.toLowerCase())
				}
				onChange={(value) => {
					// Ensure we're setting just the uid value
					form.setFieldValue(field.key as NamePath, value);
				}}
			/>
		</Form.Item>
	) as ReactNode;
};