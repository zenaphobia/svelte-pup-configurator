type Context = {
	name: string;
	description: string;
};

class SelectedItem {
	context: Context | undefined = $state();
}

export const informationText = {
	'Ladder Rack': {
		description:
			'Save space in your truck be by storing your ladders and other light materials above the cab. Easily removable when not in use.'
	},
	'Headache Rack': {
		description:
			'Whether you want added protection for your rear window or to gain overhead storage a headache rack is the perfect add on.',
		options: {
			hex: {
				description:
					'Whether you want added protection for your rear window or to gain overhead storage a headache rack is the perfect add on.'
			},
			post: {
				name: 'Post',
				description: '3rd brakelight camera compatible.'
			}
		}
	},
	Hatch: {
		type: 'multi',
		description: 'Keep the contents of your bed dry and secure with a locking center hatch.',
		options: [
			{
				name: 'Flat Center Hatch',
				description: 'Keep the contents of your bed dry and secure with a locking center hatch.'
			},
			{
				name: 'Domed Center Hatch',
				description: 'Increase interior clearance by 4” with a domed hatch.'
			}
		]
	},
	Gullwing: {
		type: 'multi',
		description:
			'Choose whether to add a Gullwing toolbox, or have your lowside boxes span the length of your truck bed',
		options: [
			{
				name: 'Gullwing Toolbox',
				description:
					'Make it a pickup Pack Pro by adding easy access to cross body storage to your Pickup Pack.'
			},
			{
				name: 'Standard',
				description: 'Lowside toolboxes spanning the total length of your truck bed.'
			}
		]
	},
	Finish: {
		type: 'multi',
		description: 'Choose between four different finishes. Or even fully customize your design',
		options: [
			{
				name: 'Diamond Plate'
			},
			{
				name: 'Black Diamond Plate'
			},
			{
				name: 'Leopard'
			},
			{
				name: 'Gladiator'
			}
		]
	},
	Truckslide: {
		description:
			'Consider upgrading for an experience that allows you to slide the contents of your bed out, and never crawl into your truck bed again.',
		options: [{ name: 'XT1200' }, { name: 'XT2000' }, { name: 'XT4000' }]
	},
	LED: {
		description:
			'Light up your compartment for late night jobs and better visibility. Can be applied to all boxes, and hatches.',
		options: [{ name: 'LED lights' }, { name: 'No lights' }]
	},
	AdditionalTrays: {
		description:
			'Each box comes standard with a single removable tray. Add additional trays to keep your small parts and tools organized.'
	},
	'Truck Color': {
		description: 'Change the color of truck'
	}
} as const;

export const selectedItemContext = new SelectedItem();
