// Piano keys and frequencies for sound effects
const PIANO_KEYS = {
    'C3': 130.8128,
    'C#3': 138.5913,
    'D#3': 155.5635,
    'C4': 261.6256,
    'D4': 293.6648,
    'E4': 329.6276,
    'G4': 391.9954
};

// Global users array to store user objects from API
let usersData = [];

// SoundEffects class for playing audio
class SoundEffects {
    constructor(isMuted = false) {
        if (window.AudioContext || window.webkitAudioContext) {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        }
        this.isMuted = isMuted;
    }

    set mute(mute) {
        this.isMuted = mute;
    }

    get mute() {
        return this.isMuted;
    }

    playSound(sound, { type = 'sine', easeOut = true, volume = 0.1 } = {}) {
        const { audioContext } = this;
        if (!audioContext) return;

        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.type = type;
        gainNode.gain.value = volume;

        const { currentTime: audioCurrentTime } = audioContext;

        const totalDuration = sound.reduce((currentNoteTime, { key, duration }) => {
            oscillator.frequency.setValueAtTime(PIANO_KEYS[key], audioCurrentTime + currentNoteTime);
            return currentNoteTime + duration;
        }, 0);

        if (easeOut) {
            gainNode.gain.exponentialRampToValueAtTime(volume, audioCurrentTime + totalDuration - 0.1);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioCurrentTime + totalDuration);
        }

        oscillator.start(audioCurrentTime);
        oscillator.stop(audioCurrentTime + totalDuration);
    }

    win() {
        if (this.isMuted) {
            return Promise.resolve(false);
        }

        const musicNotes = [
            { key: 'C4', duration: 0.175 },
            { key: 'D4', duration: 0.175 },
            { key: 'E4', duration: 0.175 },
            { key: 'G4', duration: 0.275 },
            { key: 'E4', duration: 0.15 },
            { key: 'G4', duration: 0.9 }
        ];
        const totalDuration = musicNotes.reduce((currentNoteTime, { duration }) => currentNoteTime + duration, 0);

        this.playSound(musicNotes, { type: 'triangle', volume: 1, easeOut: true });

        return new Promise((resolve) => {
            setTimeout(() => {
                resolve(true);
            }, totalDuration * 1000);
        });
    }

    spin(durationInSecond) {
        if (this.isMuted) {
            return Promise.resolve(false);
        }

        const musicNotes = [
            { key: 'D#3', duration: 0.1 },
            { key: 'C#3', duration: 0.1 },
            { key: 'C3', duration: 0.1 }
        ];

        const totalDuration = musicNotes.reduce((currentNoteTime, { duration }) => currentNoteTime + duration, 0);

        const duration = Math.floor(durationInSecond * 10);
        this.playSound(
            Array.from(Array(duration), (_, index) => musicNotes[index % 3]),
            { type: 'triangle', easeOut: false, volume: 2 }
        );

        return new Promise((resolve) => {
            setTimeout(() => {
                resolve(true);
            }, totalDuration * 1000);
        });
    }
}

// Slot class for random name picking
class Slot {
    constructor({
        maxReelItems = 30,
        removeWinner = true,
        reelContainerSelector,
        onSpinStart,
        onSpinEnd,
        onNameListChanged
    }) {
        this.nameList = [];
        this.userObjects = []; // Store full user objects
        this.havePreviousWinner = false;
        this.reelContainer = document.querySelector(reelContainerSelector);
        this.maxReelItems = maxReelItems;
        this.shouldRemoveWinner = removeWinner;
        this.onSpinStart = onSpinStart;
        this.onSpinEnd = onSpinEnd;
        this.onNameListChanged = onNameListChanged;
        this.currentWinner = null;

        // Create reel animation
        this.reelAnimation = this.reelContainer?.animate(
            [
                { transform: 'none', filter: 'blur(0)' },
                { filter: 'blur(1px)', offset: 0.5 },
                { transform: `translateY(-${(this.maxReelItems - 1) * (7.5 * 16)}px)`, filter: 'blur(0)' }
            ],
            {
                duration: this.maxReelItems * 100,
                easing: 'ease-in-out',
                iterations: 1
            }
        );

        this.reelAnimation?.cancel();
    }

    set names(names) {
        this.nameList = names;

        const reelItemsToRemove = this.reelContainer?.children
            ? Array.from(this.reelContainer.children)
            : [];

        reelItemsToRemove.forEach((element) => element.remove());

        this.havePreviousWinner = false;

        if (this.onNameListChanged) {
            this.onNameListChanged();
        }
    }

    get names() {
        return this.nameList;
    }

    // Set users with full objects
    setUsers(users) {
        this.userObjects = users;
        this.nameList = users.map(u => u.name);
    }

    set shouldRemoveWinnerFromNameList(removeWinner) {
        this.shouldRemoveWinner = removeWinner;
    }

    get shouldRemoveWinnerFromNameList() {
        return this.shouldRemoveWinner;
    }

    static shuffleNames(array) {
        const keys = Object.keys(array).map(Number);
        const result = [];
        for (let k = 0, n = keys.length; k < array.length && n > 0; k += 1) {
            const i = Math.floor(Math.random() * n);
            const key = keys[i];
            result.push(array[key]);
            n -= 1;
            const tmp = keys[n];
            keys[n] = key;
            keys[i] = tmp;
        }
        return result;
    }

    async spin() {
        if (!this.nameList.length) {
            console.error('Name List is empty. Cannot start spinning.');
            return false;
        }

        if (this.onSpinStart) {
            this.onSpinStart();
        }

        const { reelContainer, reelAnimation, shouldRemoveWinner } = this;
        if (!reelContainer || !reelAnimation) {
            return false;
        }

        // Shuffle names and create reel items
        let randomNames = Slot.shuffleNames(this.nameList);

        while (randomNames.length && randomNames.length < this.maxReelItems) {
            randomNames = [...randomNames, ...randomNames];
        }

        randomNames = randomNames.slice(0, this.maxReelItems - Number(this.havePreviousWinner));

        const fragment = document.createDocumentFragment();

        randomNames.forEach((name) => {
            const newReelItem = document.createElement('div');
            newReelItem.innerHTML = name;
            fragment.appendChild(newReelItem);
        });

        reelContainer.appendChild(fragment);

        const winnerName = randomNames[randomNames.length - 1];
        console.info('Displayed items: ', randomNames);
        console.info('Winner: ', winnerName);

        // Find winner user object
        this.currentWinner = this.userObjects.find(u => u.name === winnerName) || { name: winnerName, pictureUrl: null };

        // Remove winner from name list if necessary
        if (shouldRemoveWinner) {
            const winnerIndex = this.nameList.findIndex(name => name === winnerName);
            if (winnerIndex !== -1) {
                this.nameList.splice(winnerIndex, 1);
                this.userObjects.splice(winnerIndex, 1);
            }
        }

        console.info('Remaining: ', this.nameList);

        // Play the spin animation
        const animationPromise = new Promise((resolve) => {
            reelAnimation.onfinish = resolve;
        });

        reelAnimation.play();

        await animationPromise;

        // Sets the current playback time to the end of the animation
        reelAnimation.finish();

        Array.from(reelContainer.children)
            .slice(0, reelContainer.children.length - 1)
            .forEach((element) => element.remove());

        this.havePreviousWinner = true;

        if (this.onSpinEnd) {
            await this.onSpinEnd();
        }
        return true;
    }
}

// Load users from API
async function loadUsersFromAPI() {
    try {
        const response = await fetch('/api/guests');
        if (!response.ok) {
            throw new Error('Failed to fetch users');
        }
        const users = await response.json();
        console.log('Loaded users from API:', users);
        return users;
    } catch (error) {
        console.error('Error loading users:', error);
        return [];
    }
}

// Show winner popup
function showWinnerPopup(winner) {
    const popup = document.getElementById('winner-popup');
    const winnerImage = document.getElementById('winner-image');
    const winnerName = document.getElementById('winner-name');

    if (!popup || !winnerImage || !winnerName) return;

    // Set winner data
    winnerName.textContent = winner.name;
    if (winner.pictureUrl) {
        winnerImage.src = winner.pictureUrl;
    } else {
        // Use default avatar SVG
        winnerImage.src = 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22%3E%3Ccircle cx=%2250%22 cy=%2250%22 r=%2250%22 fill=%22%23ddd%22/%3E%3Ctext x=%2250%22 y=%2260%22 font-size=%2240%22 text-anchor=%22middle%22 fill=%22%23666%22%3E👤%3C/text%3E%3C/svg%3E';
    }

    // Show popup
    popup.classList.add('show');
}

// Hide winner popup
function hideWinnerPopup() {
    const popup = document.getElementById('winner-popup');
    if (popup) {
        popup.classList.remove('show');
    }
}

// Initialize the application
(async () => {
    const drawButton = document.getElementById('draw-button');
    const fullscreenButton = document.getElementById('fullscreen-button');
    const settingsButton = document.getElementById('settings-button');
    const settingsWrapper = document.getElementById('settings');
    const settingsContent = document.getElementById('settings-panel');
    const settingsSaveButton = document.getElementById('settings-save');
    const settingsCloseButton = document.getElementById('settings-close');
    const sunburstSvg = document.getElementById('sunburst');
    const confettiCanvas = document.getElementById('confetti-canvas');
    const nameListTextArea = document.getElementById('name-list');
    const removeNameFromListCheckbox = document.getElementById('remove-from-list');
    const enableSoundCheckbox = document.getElementById('enable-sound');
    const winnerPopupClose = document.getElementById('winner-popup-close');
    const winnerPopup = document.getElementById('winner-popup');

    // Graceful exit if necessary elements are not found
    if (!(
        drawButton &&
        fullscreenButton &&
        settingsButton &&
        settingsWrapper &&
        settingsContent &&
        settingsSaveButton &&
        settingsCloseButton &&
        sunburstSvg &&
        confettiCanvas &&
        nameListTextArea &&
        removeNameFromListCheckbox &&
        enableSoundCheckbox
    )) {
        console.error('One or more Element ID is invalid. This is possibly a bug.');
        return;
    }

    if (!(confettiCanvas instanceof HTMLCanvasElement)) {
        console.error('Confetti canvas is not an instance of Canvas. This is possibly a bug.');
        return;
    }

    const soundEffects = new SoundEffects();
    const MAX_REEL_ITEMS = 100; // Increased for 10 second spin
    const CONFETTI_COLORS = ['#26ccff', '#a25afd', '#ff5e7e', '#88ff5a', '#fcff42', '#ffa62d', '#ff36ff'];
    let confettiAnimationId;

    // Load confetti library
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/canvas-confetti@1.9.2/dist/confetti.browser.min.js';
    script.onload = () => {
        // Confetti animation instance
        const customConfetti = confetti.create(confettiCanvas, {
            resize: true,
            useWorker: true
        });

        window.customConfetti = customConfetti;
    };
    document.head.appendChild(script);

    // Confetti animation
    const confettiAnimation = () => {
        if (!window.customConfetti) return;

        const windowWidth = window.innerWidth || document.documentElement.clientWidth || document.getElementsByTagName('body')[0].clientWidth;
        const confettiScale = Math.max(0.5, Math.min(1, windowWidth / 1100));

        window.customConfetti({
            particleCount: 1,
            gravity: 0.8,
            spread: 90,
            origin: { y: 0.6 },
            colors: [CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)]],
            scalar: confettiScale
        });

        confettiAnimationId = window.requestAnimationFrame(confettiAnimation);
    };

    // Function to stop the winning animation
    const stopWinningAnimation = () => {
        if (confettiAnimationId) {
            window.cancelAnimationFrame(confettiAnimationId);
        }
        sunburstSvg.style.display = 'none';
        hideWinnerPopup();
    };

    // Function to be triggered before spinning
    const onSpinStart = () => {
        stopWinningAnimation();
        drawButton.disabled = true;
        settingsButton.disabled = true;
        soundEffects.spin(10); // 10 second spin duration
    };

    // Functions to be triggered after spinning
    const onSpinEnd = async () => {
        confettiAnimation();
        sunburstSvg.style.display = 'block';

        // Show winner popup if we have user data
        if (slot.currentWinner) {
            setTimeout(() => {
                showWinnerPopup(slot.currentWinner);
            }, 500); // Small delay for effect
        }

        await soundEffects.win();
        drawButton.disabled = false;
        settingsButton.disabled = false;
    };

    // Slot instance
    const slot = new Slot({
        reelContainerSelector: '#reel',
        maxReelItems: MAX_REEL_ITEMS,
        onSpinStart,
        onSpinEnd,
        onNameListChanged: stopWinningAnimation
    });

    // Load users from API on page load
    const users = await loadUsersFromAPI();
    if (users && users.length > 0) {
        usersData = users;
        slot.setUsers(users);
        console.log(`Loaded ${users.length} users from Google Sheets`);
    }

    // To open the setting page
    const onSettingsOpen = () => {
        nameListTextArea.value = slot.names.length ? slot.names.join('\n') : '';
        removeNameFromListCheckbox.checked = slot.shouldRemoveWinnerFromNameList;
        enableSoundCheckbox.checked = !soundEffects.mute;
        settingsWrapper.style.display = 'block';
    };

    // To close the setting page
    const onSettingsClose = () => {
        settingsContent.scrollTop = 0;
        settingsWrapper.style.display = 'none';
    };

    // Click handler for "Draw" button
    drawButton.addEventListener('click', async () => {
        if (!slot.names.length) {
            onSettingsOpen();
            return;
        }

        // Reload users from Google Sheets before each draw
        try {
            const freshUsers = await loadUsersFromAPI();
            if (freshUsers && freshUsers.length > 0) {
                usersData = freshUsers;
                slot.setUsers(freshUsers);
                console.log(`Refreshed ${freshUsers.length} users from Google Sheets before draw`);
            }
        } catch (error) {
            console.error('Failed to refresh users, using cached data:', error);
        }

        slot.spin();
    });

    // Hide fullscreen button when it is not supported
    if (!(document.documentElement.requestFullscreen && document.exitFullscreen)) {
        fullscreenButton.remove();
    }

    // Click handler for "Fullscreen" button
    fullscreenButton.addEventListener('click', () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen();
            return;
        }

        if (document.exitFullscreen) {
            document.exitFullscreen();
        }
    });

    // Click handler for "Settings" button
    settingsButton.addEventListener('click', onSettingsOpen);

    // Click handler for "Save" button for setting page
    settingsSaveButton.addEventListener('click', () => {
        const manualNames = nameListTextArea.value
            ? nameListTextArea.value.split(/\n/).filter((name) => Boolean(name.trim()))
            : [];

        if (manualNames.length > 0) {
            // Manual entry mode - create simple user objects
            slot.setUsers(manualNames.map(name => ({ name, pictureUrl: null })));
        } else if (usersData.length > 0) {
            // Restore from API data
            slot.setUsers(usersData);
        }

        slot.shouldRemoveWinnerFromNameList = removeNameFromListCheckbox.checked;
        soundEffects.mute = !enableSoundCheckbox.checked;
        onSettingsClose();
    });

    // Click handler for "Discard and close" button for setting page
    settingsCloseButton.addEventListener('click', onSettingsClose);

    // Click handler for winner popup close button
    if (winnerPopupClose) {
        winnerPopupClose.addEventListener('click', hideWinnerPopup);
    }

    // Click outside popup to close
    if (winnerPopup) {
        winnerPopup.addEventListener('click', (e) => {
            if (e.target === winnerPopup || e.target.classList.contains('winner-popup__overlay')) {
                hideWinnerPopup();
            }
        });
    }
})();
