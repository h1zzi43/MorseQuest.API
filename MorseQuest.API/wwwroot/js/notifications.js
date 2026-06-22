class NotificationSystem {
    constructor() {
        this.container = document.getElementById('notificationsContainer');
        if (!this.container) {
            this.container = document.createElement('div');
            this.container.className = 'notifications-container';
            document.body.appendChild(this.container);
        }
    }

    show(message, type = 'info', duration = 3000) {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;

        const icons = {
            success: 'fa-check-circle',
            error: 'fa-exclamation-circle',
            info: 'fa-info-circle',
            warning: 'fa-exclamation-triangle'
        };

        notification.innerHTML = `<i class="fas ${icons[type] || icons.info}"></i><span>${message}</span>`;
        this.container.appendChild(notification);

        setTimeout(() => {
            notification.classList.add('removing');
            notification.addEventListener('animationend', () => notification.remove());
        }, duration);

        notification.addEventListener('click', () => {
            notification.classList.add('removing');
            notification.addEventListener('animationend', () => notification.remove());
        });

        return notification;
    }

    success(message, duration) { return this.show(message, 'success', duration); }
    error(message, duration) { return this.show(message, 'error', duration); }
    info(message, duration) { return this.show(message, 'info', duration); }
    warning(message, duration) { return this.show(message, 'warning', duration); }
}

const notifications = new NotificationSystem();