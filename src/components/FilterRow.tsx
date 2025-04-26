import {FieldConfig} from "./types.ts";
import {type ReactNode, useEffect, useState} from "react";
import {Button, DatePicker, Input, InputNumber, Row, Select, Space, TimePicker} from "antd";
import {UI_CONSTANTS} from "../constants.ts";
import dayjs from 'dayjs';

export const FilterRow: React.FC<{
	fields: FieldConfig[];
	onFilterChange: (filters: Record<string, string[]>) => void;
	currentFilters: Record<string, string[]>;
}> = ({fields, onFilterChange, currentFilters}): React.ReactNode => {
	const [localFilters, setLocalFilters] =
		useState<Record<string, string[]>>(currentFilters);

	// Reset local filters when currentFilters change (e.g., when navigating between pages)
	useEffect(() => {
		setLocalFilters(currentFilters);
	}, [currentFilters]);

	const handleFilterChange = (key: string, value: string | string[] | null) => {
		const newFilters = {...localFilters};
		if (value === null || (Array.isArray(value) && value.length === 0)) {
			delete newFilters[key];
		} else {
			newFilters[key] = Array.isArray(value) ? value : [value];
		}
		setLocalFilters(newFilters);
	};

	const applyFilters = () => {
		onFilterChange(localFilters);
	};

	// Filter out non-filterable fields
	const filterableFields = fields.filter((field) => field.filterable);

	// If there are no filterable fields, don't render the filter row
	if (filterableFields.length === 0) {
		return null;
	}

	return (
		<Row>
			<div style={{display: 'flex', flexWrap: 'wrap', flex: 1}}>
				{filterableFields.map((field) => (
					<div key={field.key} style={{marginRight: 16, marginBottom: 8}}>
						<div style={{marginBottom: 4, fontSize: 12, color: '#666'}}>
							{field.label}
						</div>
						{field.filterType === 'range' && (field.type === 'date' || field.type === 'datetime') ? (
							<Space>
								<DatePicker
									placeholder={UI_CONSTANTS.FILTER_PLACEHOLDERS.MIN}
									style={{width: UI_CONSTANTS.LAYOUT.FILTER_INPUT_WIDTH}}
									value={localFilters[field.key]?.[0] ? dayjs(localFilters[field.key][0]) : null}
									onChange={(date) =>
										handleFilterChange(
											field.key,
											date
												? [field.keepLocalTime ? date.format('YYYY-MM-DD HH:mm:ss') : date.toISOString(), localFilters[field.key]?.[1] || '']
												: null
										)
									}
									showTime={field.type === 'datetime'}
								/>
								<DatePicker
									placeholder={UI_CONSTANTS.FILTER_PLACEHOLDERS.MAX}
									style={{width: UI_CONSTANTS.LAYOUT.FILTER_INPUT_WIDTH}}
									value={localFilters[field.key]?.[1] ? dayjs(localFilters[field.key][1]) : null}
									onChange={(date) =>
										handleFilterChange(
											field.key,
											date
												? [localFilters[field.key]?.[0] || '', field.keepLocalTime ? date.format('YYYY-MM-DD HH:mm:ss') : date.toISOString()]
												: null
										)
									}
									showTime={field.type === 'datetime'}
								/>
							</Space>
						) : field.filterType === 'range' && field.type === 'time' ? (
							<Space>
								<TimePicker
									placeholder={UI_CONSTANTS.FILTER_PLACEHOLDERS.MIN}
									style={{width: UI_CONSTANTS.LAYOUT.FILTER_INPUT_WIDTH}}
									value={localFilters[field.key]?.[0] ? dayjs(localFilters[field.key][0]) : null}
									onChange={(time) =>
										handleFilterChange(
											field.key,
											time
												? [time.format('HH:mm:ss'), localFilters[field.key]?.[1] || '']
												: null
										)
									}
									format="HH:mm:ss"
								/>
								<TimePicker
									placeholder={UI_CONSTANTS.FILTER_PLACEHOLDERS.MAX}
									style={{width: UI_CONSTANTS.LAYOUT.FILTER_INPUT_WIDTH}}
									value={localFilters[field.key]?.[1] ? dayjs(localFilters[field.key][1]) : null}
									onChange={(time) =>
										handleFilterChange(
											field.key,
											time
												? [localFilters[field.key]?.[0] || '', time.format('HH:mm:ss')]
												: null
										)
									}
									format="HH:mm:ss"
								/>
							</Space>
						) : field.filterType === 'range' ? (
							<Space>
								<InputNumber
									placeholder={UI_CONSTANTS.FILTER_PLACEHOLDERS.MIN}
									style={{width: UI_CONSTANTS.LAYOUT.FILTER_INPUT_WIDTH}}
									value={localFilters[field.key]?.[0]}
									onChange={(value) =>
										handleFilterChange(
											field.key,
											value
												? [String(value), localFilters[field.key]?.[1] || '']
												: null
										)
									}
								/>
								<InputNumber
									placeholder={UI_CONSTANTS.FILTER_PLACEHOLDERS.MAX}
									style={{width: UI_CONSTANTS.LAYOUT.FILTER_INPUT_WIDTH}}
									value={localFilters[field.key]?.[1]}
									onChange={(value) =>
										handleFilterChange(
											field.key,
											value
												? [localFilters[field.key]?.[0] || '', String(value)]
												: null
										)
									}
								/>
							</Space>
						) : field.filterType === 'boolean' ? (
							<Select
								allowClear
								placeholder={UI_CONSTANTS.FILTER_PLACEHOLDERS.SELECT}
								style={{width: UI_CONSTANTS.LAYOUT.FILTER_SELECT_WIDTH}}
								value={localFilters[field.key]?.[0]}
								onChange={(value) => handleFilterChange(field.key, value)}
								options={[
									{label: 'Yes', value: 'true'},
									{label: 'No', value: 'false'},
								]}
							/>
						) : field.type === 'select' ? (
							<Select
								allowClear
								placeholder={UI_CONSTANTS.FILTER_PLACEHOLDERS.SELECT}
								style={{width: UI_CONSTANTS.LAYOUT.FILTER_SELECT_WIDTH}}
								value={localFilters[field.key]?.[0]}
								onChange={(value) => handleFilterChange(field.key, value)}
								options={field.options}
							/>
						) : field.type === 'date' || field.type === 'datetime' ? (
							<DatePicker
								placeholder={UI_CONSTANTS.FILTER_PLACEHOLDERS.SELECT}
								style={{width: UI_CONSTANTS.LAYOUT.FILTER_TEXT_WIDTH}}
								value={localFilters[field.key]?.[0] ? dayjs(localFilters[field.key][0]) : null}
								onChange={(date) =>
									handleFilterChange(
										field.key,
										date ? (field.keepLocalTime ? date.format('YYYY-MM-DD HH:mm:ss') : date.toISOString()) : null
									)
								}
								showTime={field.type === 'datetime'}
							/>
						) : field.type === 'time' ? (
							<TimePicker
								placeholder={UI_CONSTANTS.FILTER_PLACEHOLDERS.SELECT}
								style={{width: UI_CONSTANTS.LAYOUT.FILTER_TEXT_WIDTH}}
								value={localFilters[field.key]?.[0] ? dayjs(localFilters[field.key][0]) : null}
								onChange={(time) =>
									handleFilterChange(
										field.key,
										time ? time.format('HH:mm:ss') : null
									)
								}
								format="HH:mm:ss"
							/>
						) : (
							<Input
								placeholder={`${UI_CONSTANTS.FILTER_PLACEHOLDERS.SEARCH} ${field.label}`}
								style={{width: UI_CONSTANTS.LAYOUT.FILTER_TEXT_WIDTH}}
								value={localFilters[field.key]?.[0]}
								onChange={(e) =>
									handleFilterChange(field.key, e.target.value || null)
								}
								allowClear
							/>
						)}
					</div>
				))}
			</div>
			<div
				style={{
					marginLeft: UI_CONSTANTS.STYLES.MARGIN.LEFT,
					marginBottom: UI_CONSTANTS.STYLES.MARGIN.BOTTOM,
				}}>
				<Button type='primary' onClick={applyFilters}>
					Apply Filters
				</Button>
			</div>
		</Row>
	) as ReactNode;
};
