// Random Name Picker with Slot Machine Animation
let guests = [];
let isSpinning = false;
let spinInterval = null;
let currentIndex = 0;

// Audio context for sound effects
let audioContext = null;
let isAudioInitialized = false;

// Initialize audio on first user interaction
function initAudio() {
    if (!isAudioInitialized) {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        isAudioInitialized = true;
    }
}

// Play tick sound
function playTick() {
    if (!audioContext) return;

    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.value = 800;
    oscillator.type = 'sine';

    gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.05);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.05);
}

// Play winner sound
function playWinnerSound() {
    if (!audioContext) return;

    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.type = 'sine';
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);

    // Play ascending notes
    const notes = [523.25, 659.25, 783.99, 1046.50]; // C, E, G, C
    notes.forEach((freq, i) => {
        oscillator.frequency.setValueAtTime(freq, audioContext.currentTime + i * 0.15);
    });

    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.8);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.8);
}

// Fetch guests from API
async function fetchGuests() {
    try {
        const response = await fetch('/api/guests');
        const data = await response.json();
        guests = data.filter(g => g.name);

        const countEl = document.getElementById('guest-count');
        countEl.textContent = `จำนวนผู้เข้าร่วม: ${guests.length} คน`;

        if (guests.length === 0) {
            document.getElementById('name-slot').textContent = 'ยังไม่มีผู้เข้าร่วม';
            document.getElementById('pick-btn').disabled = true;
            document.getElementById('winner-image').style.display = 'none';
        } else {
            // Show first guest image on load
            const winnerImage = document.getElementById('winner-image');
            if (guests[0].pictureUrl) {
                winnerImage.src = guests[0].pictureUrl;
                winnerImage.style.display = 'block';
                winnerImage.onerror = () => {
                    winnerImage.style.display = 'none';
                };
            } else {
                winnerImage.style.display = 'none';
            }
        }
    } catch (error) {
        console.error('Error fetching guests:', error);
        document.getElementById('guest-count').textContent = 'ไม่สามารถโหลดข้อมูลได้';
        document.getElementById('pick-btn').disabled = true;
        document.getElementById('winner-image').style.display = 'none';
    }
}

// Start spinning animation
function startSpin() {
    if (isSpinning || guests.length === 0) return;

    initAudio();
    isSpinning = true;

    const btn = document.getElementById('pick-btn');
    const nameSlot = document.getElementById('name-slot');
    const winnerImage = document.getElementById('winner-image');

    btn.disabled = true;
    btn.textContent = '🎲 กำลังสุ่ม...';
    nameSlot.classList.add('spinning');
    nameSlot.classList.remove('winner');
    winnerImage.style.display = 'block';

    let iterations = 0;
    const maxIterations = 30 + Math.floor(Math.random() * 20);
    console.log(`Starting spin. Max iterations: ${maxIterations}`);

    function spin() {
        currentIndex = (currentIndex + 1) % guests.length;
        const currentGuest = guests[currentIndex];

        // Update name
        nameSlot.textContent = currentGuest.name;

        // Update image
        if (currentGuest.pictureUrl) {
            winnerImage.style.display = 'block'; // Ensure visible
            winnerImage.src = currentGuest.pictureUrl;
            winnerImage.onerror = () => {
                winnerImage.style.display = 'none';
            };
        } else {
            winnerImage.style.display = 'none';
        }

        playTick();
        iterations++;

        // Stop spinning
        if (iterations >= maxIterations) {
            console.log('Max iterations reached. Stopping spin.');
            clearInterval(spinInterval);
            stopSpin();
        } else if (iterations > maxIterations * 0.7) {
            // Slow down
            clearInterval(spinInterval);
            const newSpeed = 50 + (iterations - Math.floor(maxIterations * 0.7)) * 20; // Slower deceleration
            spinInterval = setInterval(spin, newSpeed);
        }
    }

    spinInterval = setInterval(spin, 50);
}

// Stop spinning and show winner
function stopSpin() {
    clearInterval(spinInterval);
    isSpinning = false;

    const nameSlot = document.getElementById('name-slot');
    const winnerImage = document.getElementById('winner-image');
    const btn = document.getElementById('pick-btn');
    const winner = guests[currentIndex];

    nameSlot.classList.remove('spinning');
    nameSlot.classList.add('winner');
    nameSlot.textContent = winner.name;

    // Show winner image if available
    if (winner.pictureUrl) {
        winnerImage.src = winner.pictureUrl;
        winnerImage.style.display = 'block';
        winnerImage.onerror = () => {
            winnerImage.style.display = 'none';
        };
    }

    // Play winner sound and confetti
    setTimeout(() => {
        playWinnerSound();
        triggerConfetti();
    }, 200);

    // Reset button
    setTimeout(() => {
        btn.disabled = false;
        btn.textContent = '🎲 สุ่มอีกครั้ง';
    }, 1000);
}

// Trigger confetti
function triggerConfetti() {
    const duration = 3 * 1000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

    function randomInRange(min, max) {
        return Math.random() * (max - min) + min;
    }

    const interval = setInterval(function () {
        const timeLeft = animationEnd - Date.now();

        if (timeLeft <= 0) {
            return clearInterval(interval);
        }

        const particleCount = 50 * (timeLeft / duration);
        confetti(Object.assign({}, defaults, {
            particleCount,
            origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 }
        }));
        confetti(Object.assign({}, defaults, {
            particleCount,
            origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 }
        }));
    }, 250);
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    fetchGuests();

    const btn = document.getElementById('pick-btn');
    btn.addEventListener('click', startSpin);
});
