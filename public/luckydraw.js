// Lucky Draw - Grid Based
let guests = [];
let isDrawing = false;

// Fetch guests from API
async function fetchGuests() {
    try {
        const response = await fetch('/api/guests');
        const data = await response.json();
        guests = data.filter(g => g.name && g.pictureUrl);
        renderGuestCards();
    } catch (error) {
        console.error('Error fetching guests:', error);
        document.getElementById('guests-grid').innerHTML = '<p style="color: #888; text-align: center;">ไม่สามารถโหลดข้อมูลได้</p>';
    }
}

// Render guest cards in grid
function renderGuestCards() {
    const grid = document.getElementById('guests-grid');

    if (guests.length === 0) {
        grid.innerHTML = '<p style="color: #888; text-align: center; grid-column: 1/-1;">ยังไม่มีผู้เข้าร่วม</p>';
        return;
    }

    grid.innerHTML = '';
    guests.forEach((guest, index) => {
        const card = document.createElement('div');
        card.className = 'guest-card';
        card.dataset.index = index;

        const img = document.createElement('img');
        img.src = guest.pictureUrl;
        img.alt = guest.name;
        img.onerror = () => {
            img.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120"><rect fill="%23333" width="120" height="120"/><text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="%23D4AF37" font-size="48">' + guest.name.charAt(0) + '</svg>';
        };

        const name = document.createElement('div');
        name.className = 'name';
        name.textContent = guest.name;

        card.appendChild(img);
        card.appendChild(name);
        grid.appendChild(card);
    });
}

// Random winner selection with animation
async function drawWinner() {
    if (isDrawing || guests.length === 0) return;

    isDrawing = true;
    const btn = document.getElementById('draw-btn');
    btn.disabled = true;
    btn.textContent = '🎲 กำลังสุ่ม...';

    const cards = document.querySelectorAll('.guest-card');
    cards.forEach(card => card.classList.remove('winner'));

    // Shuffle animation
    let iterations = 0;
    const maxIterations = 20;
    const interval = setInterval(() => {
        // Remove previous highlight
        cards.forEach(card => card.classList.remove('winner'));

        // Highlight random card
        const randomIndex = Math.floor(Math.random() * cards.length);
        cards[randomIndex].classList.add('winner');

        iterations++;
        if (iterations >= maxIterations) {
            clearInterval(interval);
            selectFinalWinner(cards);
        }
    }, 100);
}

function selectFinalWinner(cards) {
    // Select final winner
    const winnerIndex = Math.floor(Math.random() * guests.length);
    const winnerCard = cards[winnerIndex];
    const winner = guests[winnerIndex];

    // Remove all highlights
    cards.forEach(card => card.classList.remove('winner'));

    // Highlight winner
    winnerCard.classList.add('winner');

    // Scroll to winner
    winnerCard.scrollIntoView({ behavior: 'smooth', block: 'center' });

    // Trigger confetti
    setTimeout(() => {
        triggerConfetti();

        // Show winner announcement
        setTimeout(() => {
            alert(`🎉 ผู้โชคดี: ${winner.name} 🎉`);

            // Reset button
            const btn = document.getElementById('draw-btn');
            btn.disabled = false;
            btn.textContent = '🎁 ลุ้นรางวัล';
            isDrawing = false;
        }, 500);
    }, 500);
}

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

    const btn = document.getElementById('draw-btn');
    btn.addEventListener('click', drawWinner);
});
