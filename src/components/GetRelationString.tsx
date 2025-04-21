import {Item, RelationConfig} from "./types.ts";

export const getRelationString = (relation: RelationConfig, value: Item) => {
	if (relation.render) {
		return relation.render(value);
	}
	if (relation.keyColumns) {
		const retVal = relation.keyColumns
			.map((key) => value[key])
			.filter((val) => val)
			.join(', ');
		if (retVal !== '') {
			return retVal;
		}
	}
	if (relation.displayField && value[relation.displayField]) {
		return value[relation.displayField];
	}
	return value.uid || value.id || value.name || value;
}