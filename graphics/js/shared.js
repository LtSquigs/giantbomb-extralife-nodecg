'use strict';

import GbGraphicDonation from '../components/donation.js';

const MAX_DONATIONS_TO_LIST = 20;
const data = {
	gameName: '',
	nextGame: '',
	timer: '',
	streamName: '',
	donationLink: '',
	streamTotal: '',
	teamTotal: ''
};

const currentGameRep = nodecg.Replicant('current-game');
const nextGameRep = nodecg.Replicant('next-game');
const timerDisplayValueRep = nodecg.Replicant('timerDisplayValue', {defaultValue: 24 * 60 * 60});
const timerNegativeRep = nodecg.Replicant('timerNegative', {defaultValue: false});
const streamNameRep = nodecg.Replicant('stream-name', {defaultValue: ''});
const donationLinkRep = nodecg.Replicant('donation-link', {defaultValue: ''});
const teamRaisedRep = nodecg.Replicant('team-raised', {defaultValue: 0});
const yourRaisedRep = nodecg.Replicant('your-raised', {defaultValue: 0});
const donationsRep = nodecg.Replicant('donations', {defaultValue: []});
const showDonationCommentsRep = nodecg.Replicant('show-donation-comments', {defaultValue: true});

const donationContainer = document.getElementById('donation-container');

showDonationCommentsRep.on('change', function (newValue) {
	if (newValue === false) {
		donationContainer.classList.add('hide-comments');
	} else {
		donationContainer.classList.remove('hide-comments');
	}
});

if (showDonationCommentsRep.value === false) {
	donationContainer.addClass('hide-comments');
}

streamNameRep.on('change', function (newVal) {
	data.streamName = newVal;
});

donationLinkRep.on('change', function (newVal) {
	data.donationLink = newVal;
});

yourRaisedRep.on('change', function (newVal) {
	data.streamTotal = numeral(newVal).format('$0,0.00');
});

teamRaisedRep.on('change', function (newVal) {
	data.teamTotal = numeral(newVal).format('$0,0.00');
});

currentGameRep.on('change', function (newVal) {
	data.gameName = newVal;
});

nextGameRep.on('change', function (newVal) {
	data.nextGame = newVal;
});

timerDisplayValueRep.on('change', function (newVal) {
	let time = numeral(newVal).format('00:00:00');
	if (timerNegativeRep.value) {
		time = '-' + time;
	}

	data.timer = time;
});

timerNegativeRep.on('change', function (newValue) {
	const tm = data.timer;
	if (newValue && tm.length > 0 && tm[0] !== '-') {
		data.timer = '-' + tm;
	} else if (!newValue && tm.length > 0 && tm[0] === '-') {
		data.timer = tm.slice(1);
	}
});

donationsRep.on('change', function (newValue) {
	parseDonations(newValue);
});

window.addEventListener('load', () => {
	rivets.bind(document.getElementById('container'), {data: data});
});

let initial = true;
const pollInterval = (30 * 10);
function parseDonations(newValue) {
	if (!newValue) {
		return;
	}

	const newArray = newValue.array;
	if (!Array.isArray(newArray)) {
		return;
	}

	if (newArray.length === 0 || newValue.clear) {
		donationContainer.innerHTML = '';
		initial = true;
	}

	let pass = false;
	const mostRecentShowingDonationId = donationContainer.firstElementChild ?
		donationContainer.firstElementChild.donation.id :
		null;
	const temporary = [];
	for (let i = newArray.length - 1; i >= 0; i--) {
		const donation = newArray[i];
		if (donation.id === mostRecentShowingDonationId || pass) {
			pass = true;
			continue;
		} else {
			temporary.unshift(donation);
		}
	}

	let j = 0;
	let bucketCounter = 1;
	const intervals = (temporary.length > 0 && temporary.length <= pollInterval) ?
		Math.floor(pollInterval / temporary.length) : 1;
	const bucket = temporary.length > pollInterval ? Math.ceil(temporary.length / pollInterval) : 1;

	temporary.forEach(function (donation) {
		if (initial) {
			createAndInsertDonationElement(donation);
		} else {
			setTimeout(function () {
				createAndInsertDonationElement(donation);
			}, j * intervals * 100);
		}

		if ((bucketCounter % bucket) === 0) {
			j++;
		}

		bucketCounter++;
	});

	initial = false;
}

function createAndInsertDonationElement(donation) {
	// Create and insert the new donation element.
	const donationElement = new GbGraphicDonation(donation);
	donationElement.classList.add('donation');
	donationContainer.prepend(donationElement);

	// Remove excess donation elements.
	while (donationContainer.childElementCount > MAX_DONATIONS_TO_LIST) {
		donationContainer.lastElementChild.remove();
	}
}
