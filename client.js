window.rawInfo = {};
window.info = {};
/* Compare Countries */
const area1 = document.getElementById('area1');
const area2 = document.getElementById('area2');
const compareBtn = document.getElementById('compare');

const createEl = (type, attr, parent) => {
	const el = document.createElement(type);
	Object.entries(attr).forEach(entry => {
		if (entry[0] === 'text') {
			el.innerText = entry[1];
		} else {
			el.setAttribute(...entry);
		}
	});

	if (parent) {
		parent.appendChild(el);
	}

	return el;
};

const styles = (el, styleObj) => {
	Object.entries(styleObj).forEach(([key, val]) => {
		el.style[key] = val;
	});
};

const stateCodes = {
	'Alabama': 'AL',
	'Alaska': 'AK',
	'arizona': 'AZ',
	'Arkansas': 'AR',
	'California': 'CA',
	'Colorado': 'CO',
	'Connecticut': 'CT',
	'Delaware': 'DE',
	'Florida': 'FL',
	'Georgia': 'GA',
	'Hawaii': 'HI',
	'Idaho': 'ID',
	'Illinois': 'IL',
	'Indiana': 'IN',
	'Iowa': 'IA',
	'Kansas': 'KS',
	'Kentucky': 'KY',
	'Louisiana': 'LA',
	'Maine': 'ME',
	'Maryland': 'MD',
	'Massachusetts': 'MA',
	'Michigan': 'MI',
	'Minnesota': 'MN',
	'Mississippi': 'MS',
	'Missouri': 'MO',
	'Montana': 'MT',
	'Nebraska': 'NE',
	'Nevada': 'NV',
	'New Hampshire': 'NH',
	'New Jersey': 'NJ',
	'New Mexico': 'NM',
	'New York': 'NY',
	'North Carolina': 'NC',
	'North Dakota': 'ND',
	'Ohio': 'OH',
	'Oklahoma': 'OK',
	'Oregon': 'OR',
	'Pennsylvania': 'PA',
	'Rhode Island': 'RI',
	'South Carolina': 'SC',
	'South Dakota': 'SD',
	'Tennessee': 'TN',
	'Texas': 'TX',
	'Utah': 'UT',
	'Vermont': 'VT',
	'Virginia': 'VA',
	'Washington': 'WA',
	'Washington, D.C.': 'D.C.',
	'West Virginia': 'WV',
	'Wisconsin': 'WI',
	'Wyoming': 'WY',
};

const filterData = (data, field, value, partialMatch) => {
	if (!data.columns || data.columns.indexOf(field) === -1) {
		return console.error('invalid field arg:', field);
	}
	let regex = undefined;
	const valStr = value.replace(/[^\w|\d\s]+/g, c => '\\'+c);
	if (partialMatch) {
		regex = new RegExp(valStr, 'i');
	} else {
		regex = new RegExp(`\\b${valStr}`, 'i');
	}
	return data.filter(d => d[field].match(regex));
};

const reduceData = (data, field) => (
	data
		.map(d => d[field])
		.reduce((a, b) =>
			a.indexOf(b) === -1 ? [...a, b] : a,
			[]
		)
);

const correctAreaTotals = (data, field, state) => {
	const lowState = state.toLowerCase();
	const stateWide = filterData(data, field, state)[0];
	const counties = filterData(data, field, `, ${stateCodes[lowState]}`, true);
	data.columns.forEach(col => {
		stateCol = parseInt(stateWide[col]);
		if (col.match(/\d/)) {
			const tally = counties.reduce((a, b) => a + parseInt(b[col]), 0);
			stateWide[col] = stateCol + tally;
		}
	});
	return stateWide;
};


const dataByFieldNoDupes = (data, field) => {
	regions = data.map(d => d[field]);
	return regions.filter((d, i) => regions.indexOf(d) === i);
};

/*
 * Appends a new graph to the container element.
 *
 * @param {Array} data: 		Array of [x, y] pairs.
 * @param {String} title 		Graph title.
 */
const createGraph = (data, title, maxHeight) => {
	const graph = createEl('div', {
		class: 'graph',
		'data-graph': title
	}, document.querySelector('.container'));
	createEl('h3', {
		class: 'graph_title',
		text: title
	}, graph);
	const dataContainer = createEl('div', {
		class: 'graph_data'
	}, graph);

	const allVals = data.map(a => a[1]);
	if (!maxHeight) {
		maxHeight = Math.max(...allVals);
	}
	data.forEach(d => {
		const bar = createEl('div', {
			class: 'graph_bar',
			title: `${d[0]}: ${d[1]}`
		}, dataContainer);
		styles(bar, {
			height: 100*d[1]/maxHeight + '%'
		});
	});
};


// fetch data and do the thing
const fileBase = 'time_series_covid19_';
const conditions = ['confirmed', 'deaths', 'recovered'];
const conditionLen = conditions.length;

let filesComplete = 0;

conditions.forEach(condition => {
	fetch(`${fileBase}${condition}_global.csv`)
		.then(d => d.text())
		.then(d => {
			const data = d3.csvParse(d);
			rawInfo[condition] = data;

			const dataLevel = 'Country/Region';
			info[condition] = {};
			const areas = dataByFieldNoDupes(data, dataLevel);
			areas.forEach(s => {
				info[condition][s] = correctAreaTotals(data, dataLevel, s);
			});

			const conditionEntries = Object.entries(info[condition]);
			// const a = conditionEntries.map(e => e[1])
			// 	.map(e => {
			// 		Object.entries(e).reduce(f => Math.max(f))
			// 	})
			// 	.filter(([k, v]) => k.match(/\d/))
			// 	.map(([k, v]) => parseInt(v));
			// const maxVal = Math.max(...allVals);

			conditionEntries.forEach(([state, sd]) => {
				const timeSeries = Object.entries(sd).filter(([time]) => time.match(/\d/));
				createGraph(timeSeries, `${state}: ${condition}`);// maxVal
			});
			areas.forEach(a => {
				[area1, area2].forEach(areaBtn => {
					const opt = createEl('option', {
						value: a,
						text: a
					});
					areaBtn.appendChild(opt);
				});
			});

			filesComplete++;
			if (filesComplete === conditionLen) {
				console.log('done');
			}
		})
		.catch(console.error);
});

compareBtn.addEventListener('click', () => {
	if (!area1.value || !area2.value) {
		return;
	}
	document.querySelectorAll('.graph').forEach(g => g.style.display = 'none');
	[area1, area2].forEach(a => {
		document.querySelectorAll(`[data-graph^="${a.value}"]`).forEach(el => {
			el.style.display = 'inline-block';
		});
	});
});

