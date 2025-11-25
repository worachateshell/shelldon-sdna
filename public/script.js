let guests = [];
let isSpinning = false;

function init() {
    fetchQR();
    fetchGuests();
    // Poll for new guests every 5 seconds
    setInterval(fetchGuests, 5000);

    // Click on slot machine to spin
    // document.querySelector('.slot-machine-container').addEventListener('click', () => {
    //     if (!isSpinning) spin();
    // });

    // Also allow spacebar to spin
    document.addEventListener('keydown', (e) => {
        if (e.code === 'Space' && !isSpinning) {
            e.preventDefault();
            spin();
        }
    });
}

async function fetchQR() {
    try {
        const res = await fetch('/api/qr');
        const data = await res.json();
        const qrImage = document.getElementById('qr-code');
        if (qrImage) {
            qrImage.src = data.qrImage;
        }
    } catch (e) {
        console.error("Failed to load QR", e);
    }
}

async function fetchGuests() {
    if (isSpinning) return;

    try {
        const res = await fetch('/api/guests');
        const newGuests = await res.json();

        const processedGuests = newGuests.map(g => {
            if (typeof g === 'string') return { name: g, pictureUrl: null };
            return g;
        });

        if (processedGuests.length !== guests.length) {
            guests = processedGuests;
            if (guests.length > 0) {
                // initializeReels();
            }
        }
    } catch (e) {
        console.error("Failed to load guests", e);
    }
}

function initializeReels() {
    const reels = ['reel1'];

    reels.forEach(reelId => {
        const reel = document.getElementById(reelId);
        reel.innerHTML = '';

        const strip = document.createElement('div');
        strip.className = 'reel-strip';

        // Create multiple copies for smooth scrolling
        const copies = 5;
        for (let c = 0; c < copies; c++) {
            guests.forEach(guest => {
                const item = createReelItem(guest);
                strip.appendChild(item);
            });
        }

        reel.appendChild(strip);
    });
}

function createReelItem(guest) {
    const item = document.createElement('div');
    item.className = 'reel-item';

    if (guest.pictureUrl) {
        const img = document.createElement('img');
        img.src = guest.pictureUrl;
        img.alt = guest.name;
        item.appendChild(img);
    } else {
        // Placeholder if no image
        const placeholder = document.createElement('div');
        placeholder.style.width = '80px';
        placeholder.style.height = '80px';
        placeholder.style.borderRadius = '50%';
        placeholder.style.background = 'linear-gradient(145deg, #333, #1a1a1a)';
        placeholder.style.border = '2px solid #D4AF37';
        placeholder.style.display = 'flex';
        placeholder.style.alignItems = 'center';
        placeholder.style.justifyContent = 'center';
        placeholder.style.fontSize = '32px';
        placeholder.style.color = '#D4AF37';
        placeholder.textContent = guest.name.charAt(0).toUpperCase();
        item.appendChild(placeholder);
    }

    const nameDiv = document.createElement('div');
    nameDiv.className = 'name';
    nameDiv.textContent = guest.name;
    item.appendChild(nameDiv);

    return item;
}

function spin() {
    if (guests.length === 0) {
        alert("No guests registered yet!");
        return;
    }

    if (isSpinning) return;

    isSpinning = true;

    const reels = ['reel1'];
    const spinDurations = [3000]; // Duration for the single reel
    const itemWidth = 150; // Fixed width per item

    const winnerIndex = Math.floor(Math.random() * guests.length);
    const winner = guests[winnerIndex];

    // Calculate center offset to align winner in the middle
    const reelWidth = document.querySelector('.reel').offsetWidth;
    const centerOffset = (reelWidth / 2) - (itemWidth / 2);

    reels.forEach((reelId, index) => {
        const reel = document.getElementById(reelId);
        const strip = reel.querySelector('.reel-strip');

        // Calculate random spins
        const baseSpins = 5 + Math.random() * 3; // More spins for single reel excitement
        const oneCycleWidth = guests.length * itemWidth;
        const finalPosition = -((baseSpins * oneCycleWidth) + (winnerIndex * itemWidth)) + centerOffset;

        // Animate
        strip.style.transition = `left ${spinDurations[index]}ms cubic-bezier(0.25, 0.1, 0.25, 1)`;
        strip.style.left = `${finalPosition}px`;

        // Reset to initial position after spin
        setTimeout(() => {
            if (index === reels.length - 1) {
                // Last reel finished
                setTimeout(() => {
                    displayWinner(winner);
                    isSpinning = false;
                    triggerConfetti();

                    // Reset reels
                    reels.forEach(rid => {
                        const r = document.getElementById(rid);
                        const s = r.querySelector('.reel-strip');
                        s.style.transition = 'none';
                        s.style.left = '0px';
                    });
                }, 500);
            }
        }, spinDurations[index]);
    });
}

function displayWinner(winner) {
    // Find the winner element in the reel
    // We know the winner is centered.
    // The reel strip has moved to finalPosition.
    // We can just highlight the center item visually or add a class to the specific item.

    // Since we have multiple copies, we need to find the one that is currently visible.
    // However, simpler approach for now:
    // Just trigger confetti and maybe flash the slot frame.

    const slotFrame = document.querySelector('.slot-frame');
    slotFrame.classList.add('winner-glow');

    setTimeout(() => {
        slotFrame.classList.remove('winner-glow');
    }, 3000);

    // Optional: Play a sound if we had one
}

function triggerConfetti() {
    const duration = 3000;
    const end = Date.now() + duration;

    (function frame() {
        confetti({
            particleCount: 7,
            angle: 60,
            spread: 55,
            origin: { x: 0 },
            colors: ['#D4AF37', '#FFFFFF', '#333333']
        });
        confetti({
            particleCount: 7,
            angle: 120,
            spread: 55,
            origin: { x: 1 },
            colors: ['#D4AF37', '#FFFFFF', '#333333']
        });

        if (Date.now() < end) {
            requestAnimationFrame(frame);
        }
    }());
}

init();
