// Trabalho Interdisciplinar Back-End. Desenvolvido por: Gabriel Ferreira, Gabriel Carvalho e Kayky Gabriel 

// Desce a pagina quando clica nos links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// Animacao da tela
function animateCounter(element, start, end, duration) {
    let startTimestamp = null;
    const step = (timestamp) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / duration, 1);
        const value = Math.floor(progress * (end - start) + start);
        element.innerHTML = value + (element.dataset.suffix || '');
        if (progress < 1) {
            window.requestAnimationFrame(step);
        }
    };
    window.requestAnimationFrame(step);
}

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.animationPlayState = 'running';

            if (entry.target.classList.contains('stat-number')) {
                const text = entry.target.textContent;
                const number = parseInt(text.replace(/\D/g, ''));
                if (number) {
                    entry.target.dataset.suffix = text.replace(/\d/g, '');
                    animateCounter(entry.target, 0, number, 2000);
                }
            }
        }
    });
}, { threshold: 0.1 });

document.querySelectorAll('.feature-card, .step-card, .stat-number').forEach(el => {
    observer.observe(el);
});

function animateHeartbeat() {
    const heartbeatLine = document.querySelector('.heartbeat-line');
    if (!heartbeatLine) return;

    const length = heartbeatLine.getTotalLength();

    heartbeatLine.style.strokeDasharray = length;
    heartbeatLine.style.strokeDashoffset = length;
    heartbeatLine.style.animation = 'drawLine 2s linear infinite';
}

const style = document.createElement('style');
style.textContent = `
    @keyframes drawLine {
        0% {
            stroke-dashoffset: 100%;
        }
        50% {
            stroke-dashoffset: 0;
        }
        100% {
            stroke-dashoffset: -100%;
        }
    }
`;
document.head.appendChild(style);

document.addEventListener("DOMContentLoaded", animateHeartbeat);