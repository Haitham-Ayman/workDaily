// Get DOM elements
const taskInput = document.getElementById('taskInput');
const taskDate = document.getElementById('taskDate');
const taskNotes = document.getElementById('taskNotes');
const useCurrentDate = document.getElementById('useCurrentDate');
const dateGroups = document.getElementById('dateGroups');
const taskCount = document.getElementById('taskCount');
const filterButtons = document.querySelectorAll('.filter-btn');
const addButton = document.getElementById('addBtn');
const notificationsBtn = document.getElementById('notificationsBtn');
const notificationsPanel = document.getElementById('notificationsPanel');
const markAllReadBtn = document.getElementById('markAllReadBtn');

// Initialize tasks array from localStorage or empty array
let tasks = JSON.parse(localStorage.getItem('tasks')) || [];

// Current filter
let currentFilter = 'all';

let currentDeletingTaskId = null;

// تعريف المتغيرات العامة
let currentEditingTaskId = null;

// إضافة مستمعي الأحداث للإشعارات
notificationsBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    notificationsPanel.classList.toggle('show');
    renderNotifications();
});

// إغلاق لوحة الإشعارات عند النقر خارجها
document.addEventListener('click', (e) => {
    if (!notificationsPanel.contains(e.target) && !notificationsBtn.contains(e.target)) {
        notificationsPanel.classList.remove('show');
    }
});

// تعيين جميع الإشعارات كمقروءة
markAllReadBtn.addEventListener('click', () => {
    markAllNotificationsAsRead();
});

// Set default date
function setDefaultDate() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    
    if (taskDate) {
        taskDate.value = `${year}-${month}-${day}`;
    }
}

// Format date
function formatDate(date) {
    try {
        const m = moment(date);
        if (!m.isValid()) {
            throw new Error('Invalid date');
        }
        return m.format('DD/MM/YYYY');
    } catch (error) {
        console.error('Error formatting date:', error);
        return moment().format('DD/MM/YYYY');
    }
}

// Group tasks by date
function groupTasksByDate(tasks) {
    const groups = {};
    
    tasks.forEach(task => {
        if (!task.createdAt) return;
        
        const date = moment(task.createdAt).format('YYYY-MM-DD');
        if (!groups[date]) {
            groups[date] = [];
        }
        groups[date].push(task);
    });
    
    return Object.entries(groups)
        .sort(([dateA], [dateB]) => moment(dateB).diff(moment(dateA)))
        .map(([date, tasks]) => ({
            date,
            tasks,
            formattedDate: formatDate(date)
        }));
}

// تحديث عدد المهام اليومية غير المنجزة
function updateDailyTasksNotification() {
    const today = moment().startOf('day');
    const unfinishedTodayTasks = tasks.filter(task => {
        const taskDate = moment(task.createdAt);
        return taskDate.isSame(today, 'day') && !task.completed;
    });

    const count = unfinishedTodayTasks.length;
    if (count > 0) {
        addNotification(
            `لديك ${count} ${count === 1 ? 'مهمة' : 'مهام'} غير منجزة لهذا اليوم`,
            'info'
        );
        document.querySelector('.notifications-count').textContent = count;
        document.querySelector('.notifications-count').style.display = 'block';
    } else {
        document.querySelector('.notifications-count').style.display = 'none';
    }
}

// تحديث وظيفة إضافة المهام
function addTask() {
    if (!taskInput) {
        console.error('Task input not found');
        return;
    }

    const taskText = taskInput.value.trim();
    if (!taskText) {
        showNotification('الرجاء إدخال نص المهمة', 'error');
        return;
    }

    try {
        let taskDateTime;
        if (useCurrentDate.checked) {
            taskDateTime = new Date();
        } else {
            if (!taskDate || !taskDate.value) {
                showNotification('الرجاء اختيار تاريخ المهمة', 'error');
                return;
            }
            taskDateTime = new Date(taskDate.value);
        }

        const task = {
            id: Date.now(),
            text: taskText,
            notes: taskNotes.value.trim(),
            completed: false,
            createdAt: taskDateTime.toISOString()
        };

        tasks.push(task);
        saveTasks();
        renderTasks();
        
        // إضافة إشعار للمهمة الجديدة
        addNotification(`تمت إضافة مهمة جديدة: ${taskText}`, 'success', 'task-add');
        
        // تحديث عدد المهام اليومية
        updateDailyTasksNotification();
        
        // مسح الحقول
        taskInput.value = '';
        taskNotes.value = '';
        if (useCurrentDate.checked) {
            setDefaultDate();
        }
        
        showNotification('تم إضافة المهمة بنجاح', 'success');
    } catch (error) {
        console.error('Error in addTask:', error);
        showNotification('حدث خطأ، الرجاء المحاولة مرة أخرى', 'error');
    }
}

// Delete task function
function deleteTask(id) {
    currentDeletingTaskId = id;
    const task = tasks.find(t => t.id === id);
    if (!task) return;

    const deleteModal = document.getElementById('deleteConfirmModal');
    const deleteTitle = deleteModal.querySelector('.delete-title');
    const deleteMessage = deleteModal.querySelector('.delete-message');
    
    // تحديث محتوى نافذة الحذف
    deleteTitle.textContent = `هل أنت متأكد من حذف المهمة "${task.text}"؟`;
    deleteMessage.textContent = task.notes 
        ? `سيتم حذف المهمة وملاحظاتها: "${task.notes}"`
        : 'لا يمكن التراجع عن هذه العملية بعد الحذف';
    
    deleteModal.style.display = 'block';
    setTimeout(() => {
        deleteModal.classList.add('show');
    }, 10);
}

function confirmDelete() {
    if (currentDeletingTaskId !== null) {
        const taskToDelete = tasks.find(task => task.id === currentDeletingTaskId);
        if (taskToDelete) {
            tasks = tasks.filter(task => task.id !== currentDeletingTaskId);
            
            saveTasks();
            renderTasks();
            
            addNotification(`تم حذف المهمة: ${taskToDelete.text}`, 'warning', 'task-delete');
            
            updateDailyTasksNotification();
            closeDeleteModal();
            showNotification('تم حذف المهمة بنجاح', 'success', 'task-delete');
        }
    }
}

function closeDeleteModal() {
    const deleteModal = document.getElementById('deleteConfirmModal');
    deleteModal.classList.remove('show');
    setTimeout(() => {
        deleteModal.style.display = 'none';
        currentDeletingTaskId = null;
    }, 300);
}

// Toggle task completion
function toggleTask(id) {
    const task = tasks.find(t => t.id === id);
    if (task) {
        task.completed = !task.completed;
        addNotification(
            task.completed ? `تم إكمال المهمة: ${task.text}` : `تم إعادة فتح المهمة: ${task.text}`,
            'info',
            task.completed ? 'task-complete' : 'task'
        );
        
        saveTasks();
        renderTasks();
        updateDailyTasksNotification();
    }
}

// Edit task function
function editTask(id) {
    const task = tasks.find(t => t.id === id);
    if (!task) return;
    
    currentEditingTaskId = id;
    
    const editModal = document.getElementById('editModal');
    const editTaskText = document.getElementById('editTaskText');
    const editTaskNotes = document.getElementById('editTaskNotes');
    const editTaskDate = document.getElementById('editTaskDate');
    const editUseCurrentDate = document.getElementById('editUseCurrentDate');
    
    // تهيئة الحقول
    if (editTaskText) editTaskText.value = task.text;
    if (editTaskNotes) editTaskNotes.value = task.notes || '';
    if (editTaskDate) editTaskDate.value = moment(task.createdAt).format('YYYY-MM-DD');
    if (editUseCurrentDate) {
        editUseCurrentDate.checked = false;
        editTaskDate.disabled = false;
    }
    
    // إضافة عداد الأحرف
    const addCharacterCount = (input, maxLength) => {
        const counter = document.createElement('div');
        counter.className = 'character-count';
        input.parentElement.appendChild(counter);
        
        const updateCount = () => {
            const remaining = maxLength - input.value.length;
            counter.textContent = `${remaining} حرف متبقي`;
            counter.style.color = remaining < 20 ? '#e53e3e' : '#718096';
        };
        
        input.addEventListener('input', updateCount);
        updateCount();
    };
    
    // إضافة رسائل التحقق
    const addValidationMessage = (input) => {
        const message = document.createElement('div');
        message.className = 'validation-message';
        input.parentElement.appendChild(message);
        
        return (text) => {
            if (text) {
                message.textContent = text;
                message.classList.add('show');
                input.classList.add('error');
            } else {
                message.classList.remove('show');
                input.classList.remove('error');
            }
        };
    };
    
    if (editTaskText) {
        addCharacterCount(editTaskText, 100);
        const textValidation = addValidationMessage(editTaskText);
        editTaskText.addEventListener('input', () => {
            textValidation(editTaskText.value.trim() ? '' : 'نص المهمة مطلوب');
        });
    }
    
    if (editTaskNotes) {
        addCharacterCount(editTaskNotes, 500);
    }
    
    // تعيين وظائف الأزرار
    const saveEditBtn = document.getElementById('saveEditBtn');
    const cancelEditBtn = document.getElementById('cancelEditBtn');
    const closeBtn = editModal.querySelector('.close');
    
    if (saveEditBtn) saveEditBtn.onclick = saveEdit;
    if (cancelEditBtn) cancelEditBtn.onclick = closeEditModal;
    if (closeBtn) closeBtn.onclick = closeEditModal;
    
    // إضافة مستمع حدث للنقر خارج النافذة
    editModal.onclick = (event) => {
        if (event.target === editModal) {
            closeEditModal();
        }
    };
    
    // عرض النافذة
    editModal.style.display = 'block';
    setTimeout(() => {
        editModal.classList.add('show');
        if (editTaskText) editTaskText.focus();
    }, 10);
}

// Clear completed tasks
function clearCompleted() {
    const completedTasks = tasks.filter(task => task.completed);
    tasks = tasks.filter(task => !task.completed);
    
    completedTasks.forEach(task => {
        addNotification(`تم حذف المهمة المكتملة: ${task.text}`, 'warning', task.id);
    });
    
    saveTasks();
    renderTasks();
}

// Save tasks to localStorage
function saveTasks() {
    try {
        localStorage.setItem('tasks', JSON.stringify(tasks));
    } catch (error) {
        console.error('Error saving tasks:', error);
    }
}

// Filter tasks based on current filter
function filterTasks(tasks) {
    switch(currentFilter) {
        case 'active':
            return tasks.filter(task => !task.completed);
        case 'completed':
            return tasks.filter(task => task.completed);
        case 'today':
            const today = moment().startOf('day');
            return tasks.filter(task => 
                moment(task.createdAt).isSame(today, 'day')
            );
        case 'week':
            const weekStart = moment().startOf('week');
            return tasks.filter(task => 
                moment(task.createdAt).isSameOrAfter(weekStart)
            );
        default:
            return tasks;
    }
}

// Render tasks based on current filter
function renderTasks() {
    const filteredTasks = filterTasks(tasks);
    const groupedTasks = groupTasksByDate(filteredTasks);
    
    dateGroups.innerHTML = '';
    
    groupedTasks.forEach(group => {
        const dateGroup = document.createElement('div');
        dateGroup.className = 'date-group';
        
        const dateHeader = document.createElement('div');
        dateHeader.className = 'date-header';
        dateHeader.innerHTML = `
            <span class="gregorian-date">${group.formattedDate}</span>
        `;
        
        const taskList = document.createElement('ul');
        taskList.className = 'task-list';
        
        group.tasks.forEach(task => {
            const li = document.createElement('li');
            li.className = `task-item ${task.completed ? 'completed' : ''}`;
            
            li.innerHTML = `
                <input type="checkbox" class="task-checkbox" 
                    ${task.completed ? 'checked' : ''}>
                <div class="task-content">
                    <span class="task-text">${task.text}</span>
                    ${task.notes ? `<div class="task-notes-display">${task.notes}</div>` : ''}
                </div>
                <div class="task-actions">
                    <button class="edit-btn">تعديل</button>
                    <button class="delete-btn">حذف</button>
                </div>
            `;

            const checkbox = li.querySelector('.task-checkbox');
            const editBtn = li.querySelector('.edit-btn');
            const deleteBtn = li.querySelector('.delete-btn');

            checkbox.addEventListener('change', () => toggleTask(task.id));
            editBtn.addEventListener('click', () => editTask(task.id));
            deleteBtn.addEventListener('click', () => deleteTask(task.id));

            taskList.appendChild(li);
        });
        
        dateGroup.appendChild(dateHeader);
        dateGroup.appendChild(taskList);
        dateGroups.appendChild(dateGroup);
    });

    // Update task count
    const remainingTasks = tasks.filter(task => !task.completed).length;
    taskCount.textContent = `${remainingTasks} مهام متبقية`;
}

// Filter tasks
filterButtons.forEach(button => {
    button.addEventListener('click', () => {
        filterButtons.forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');
        currentFilter = button.getAttribute('data-filter');
        renderTasks();
    });
});

// تحديث وظيفة تهيئة التطبيق
function initializeApp() {
    if (!taskInput || !taskDate || !dateGroups || !addButton) {
        console.error('Required elements not found');
        return;
    }

    // Set initial date
    setDefaultDate();

    // Set initial date input state
    if (taskDate && useCurrentDate) {
        taskDate.disabled = useCurrentDate.checked;
    }

    // Add event listeners for delete confirmation
    const deleteModal = document.getElementById('deleteConfirmModal');
    const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
    const cancelDeleteBtn = document.getElementById('cancelDeleteBtn');
    const closeDeleteModalBtn = deleteModal.querySelector('.close');

    confirmDeleteBtn.addEventListener('click', confirmDelete);
    cancelDeleteBtn.addEventListener('click', closeDeleteModal);
    closeDeleteModalBtn.addEventListener('click', closeDeleteModal);

    // Add event listeners
    addButton.addEventListener('click', addTask);

    taskInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            addTask();
        }
    });

    useCurrentDate.addEventListener('change', function() {
        if (taskDate) {
            taskDate.disabled = this.checked;
            if (this.checked) {
                setDefaultDate();
            }
        }
    });

    // تحديث عدد المهام اليومية عند بدء التطبيق
    updateDailyTasksNotification();

    // تحديث عدد المهام اليومية كل دقيقة
    setInterval(updateDailyTasksNotification, 60000);

    // إضافة مستمعي الأحداث لنافذة التعديل
    const editModal = document.getElementById('editModal');
    const editUseCurrentDate = document.getElementById('editUseCurrentDate');
    const editTaskDate = document.getElementById('editTaskDate');
    
    if (editUseCurrentDate && editTaskDate) {
        editUseCurrentDate.addEventListener('change', function() {
            editTaskDate.disabled = this.checked;
            if (this.checked) {
                const now = new Date();
                editTaskDate.value = moment(now).format('YYYY-MM-DD');
            }
        });
    }

    // Initial render
    renderTasks();
}

// Start the application when DOM is loaded
document.addEventListener('DOMContentLoaded', initializeApp);

// Modal functionality
function openModal(taskId) {
    const modal = document.getElementById('editModal');
    const task = tasks.find(t => t.id === taskId);
    if (task) {
        document.getElementById('editTaskText').value = task.text;
        document.getElementById('editTaskNotes').value = task.notes || '';
        
        // Set task date
        const editTaskDate = document.getElementById('editTaskDate');
        const editUseCurrentDate = document.getElementById('editUseCurrentDate');
        
        if (task.createdAt) {
            const taskDate = moment(task.createdAt).format('YYYY-MM-DD');
            editTaskDate.value = taskDate;
            editUseCurrentDate.checked = false;
            editTaskDate.disabled = false;
        } else {
            setDefaultDate();
            editUseCurrentDate.checked = true;
            editTaskDate.disabled = true;
        }

        modal.style.display = 'block';
        setTimeout(() => {
            modal.classList.add('show');
            document.getElementById('editTaskText').focus();
        }, 10);
        
        currentEditingTaskId = taskId;
    }
}

function closeEditModal() {
    const modal = document.getElementById('editModal');
    if (!modal) return;

    modal.classList.remove('show');
    modal.classList.remove('loading');
    
    setTimeout(() => {
        modal.style.display = 'none';
        
        // تنظيف العناصر
        const characterCounters = modal.querySelectorAll('.character-count');
        const validationMessages = modal.querySelectorAll('.validation-message');
        characterCounters.forEach(counter => counter.remove());
        validationMessages.forEach(message => message.remove());
        
        // إعادة تعيين الحقول
        const editTaskText = document.getElementById('editTaskText');
        const editTaskNotes = document.getElementById('editTaskNotes');
        const editTaskDate = document.getElementById('editTaskDate');
        const editUseCurrentDate = document.getElementById('editUseCurrentDate');
        
        if (editTaskText) editTaskText.value = '';
        if (editTaskNotes) editTaskNotes.value = '';
        if (editTaskDate) editTaskDate.value = '';
        if (editUseCurrentDate) editUseCurrentDate.checked = false;
        
        currentEditingTaskId = null;
    }, 300);
}

function saveEdit() {
    const editTaskText = document.getElementById('editTaskText');
    const editTaskDate = document.getElementById('editTaskDate');
    const editTaskNotes = document.getElementById('editTaskNotes');
    const editUseCurrentDate = document.getElementById('editUseCurrentDate');
    const editModal = document.getElementById('editModal');
    
    if (!editTaskText || !editTaskText.value.trim()) {
        showNotification('نص المهمة مطلوب', 'error');
        if (editTaskText) editTaskText.focus();
        return;
    }
    
    if (!editTaskDate.value && !editUseCurrentDate.checked) {
        showNotification('التاريخ مطلوب', 'error');
        editTaskDate.focus();
        return;
    }
    
    const task = tasks.find(t => t.id === currentEditingTaskId);
    if (!task) {
        showNotification('حدث خطأ في تحديث المهمة', 'error');
        closeEditModal();
        return;
    }
    
    editModal.classList.add('loading');
    
    setTimeout(() => {
        const newText = editTaskText.value.trim();
        const newNotes = editTaskNotes.value.trim();
        const newDate = editUseCurrentDate.checked ? new Date() : new Date(editTaskDate.value);
        
        task.text = newText;
        task.notes = newNotes;
        task.createdAt = newDate.toISOString();
        
        saveTasks();
        renderTasks();
        updateDailyTasksNotification();
        
        closeEditModal();
        showNotification('تم تحديث المهمة بنجاح', 'success');
    }, 500);
}

// تحسين نظام الإشعارات
function getNotificationIcon(type) {
    switch (type) {
        case 'success': return 'fa-check-circle';
        case 'error': return 'fa-exclamation-circle';
        case 'warning': return 'fa-exclamation-triangle';
        case 'info': return 'fa-info-circle';
        default: return 'fa-bell';
    }
}

function showNotification(message, type = 'info', soundType = null) {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <i class="fas ${getNotificationIcon(type)}"></i>
            <span>${message}</span>
        </div>
        <button class="notification-close">
            <i class="fas fa-times"></i>
        </button>
    `;
    
    document.body.appendChild(notification);
    
    // إضافة زر الإغلاق
    const closeBtn = notification.querySelector('.notification-close');
    closeBtn.addEventListener('click', () => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    });
    
    // عرض الإشعار
    setTimeout(() => notification.classList.add('show'), 10);
    
    // إغلاق تلقائي بعد 5 ثواني
    setTimeout(() => {
        if (document.body.contains(notification)) {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }
    }, 5000);
}

function updateNotificationCount() {
    const unreadCount = notifications.filter(n => !n.read).length;
    const countElement = document.querySelector('.notifications-count');
    if (countElement) {
        countElement.textContent = unreadCount;
        countElement.style.display = unreadCount > 0 ? 'block' : 'none';
        
        // تحديث لون الأيقونة
        const bellIcon = document.querySelector('.notifications-btn i');
        if (bellIcon) {
            bellIcon.style.color = unreadCount > 0 ? '#ff416c' : 'white';
        }
    }
}

function renderNotifications() {
    const notificationsList = document.getElementById('notificationsList');
    if (!notificationsList) return;
    
    notificationsList.innerHTML = '';
    
    if (notifications.length === 0) {
        notificationsList.innerHTML = '<div class="no-notifications">لا توجد إشعارات</div>';
        return;
    }
    
    const groups = groupNotifications(notifications);
    
    Object.values(groups).forEach(group => {
        const latestNotification = group[0];
        const timeAgo = moment(latestNotification.timestamp).fromNow();
        
        const notificationElement = document.createElement('div');
        notificationElement.className = `notification-item ${latestNotification.read ? '' : 'unread'}`;
        
        let message = latestNotification.message;
        if (group.length > 1) {
            message += ` (+${group.length - 1} ${group.length === 2 ? 'أخرى' : 'أخرى'})`;
        }
        
        notificationElement.innerHTML = `
            <div class="notification-icon">
                <i class="fas ${getNotificationIcon(latestNotification.type)}"></i>
            </div>
            <div class="notification-content">
                <div class="notification-title">${message}</div>
                <div class="notification-time">${timeAgo}</div>
            </div>
            ${!latestNotification.read ? '<div class="notification-unread-indicator"></div>' : ''}
        `;
        
        notificationsList.appendChild(notificationElement);
        
        // تحديد الإشعارات كمقروءة عند النقر
        notificationElement.addEventListener('click', () => {
            group.forEach(n => markNotificationAsRead(n.id));
        });
    });
    
    // تحديث العداد
    updateNotificationCount();
}

// Notification System
let notifications = JSON.parse(localStorage.getItem('notifications')) || [];
const MAX_NOTIFICATIONS = 50;
const NOTIFICATION_EXPIRY_DAYS = 7;

function addNotification(message, type = 'info', taskId = null) {
    const notification = {
        id: Date.now(),
        message,
        type,
        taskId,
        timestamp: new Date().toISOString(),
        read: false
    };
    
    notifications.unshift(notification);
    
    // حذف الإشعارات القديمة
    if (notifications.length > MAX_NOTIFICATIONS) {
        notifications = notifications.slice(0, MAX_NOTIFICATIONS);
    }
    
    // حذف الإشعارات المنتهية
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() - NOTIFICATION_EXPIRY_DAYS);
    notifications = notifications.filter(n => new Date(n.timestamp) > expiryDate);
    
    // حفظ في localStorage
    localStorage.setItem('notifications', JSON.stringify(notifications));
    
    // تحديث واجهة المستخدم
    updateNotificationCount();
    renderNotifications();
    
    // عرض إشعار منبثق
    showNotification(message, type);
}

function markNotificationAsRead(notificationId) {
    notifications = notifications.map(n => 
        n.id === notificationId ? { ...n, read: true } : n
    );
    localStorage.setItem('notifications', JSON.stringify(notifications));
    updateNotificationCount();
    renderNotifications();
}

function markAllNotificationsAsRead() {
    notifications = notifications.map(n => ({ ...n, read: true }));
    localStorage.setItem('notifications', JSON.stringify(notifications));
    updateNotificationCount();
    renderNotifications();
    showNotification('تم تعيين جميع الإشعارات كمقروءة', 'success');
}

function groupNotifications(notifications) {
    const groups = {};
    
    notifications.forEach(notification => {
        const key = `${notification.type}_${notification.taskId}`;
        if (!groups[key]) {
            groups[key] = [];
        }
        groups[key].push(notification);
    });
    
    // Sort notifications within each group by timestamp
    Object.values(groups).forEach(group => {
        group.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    });
    
    return groups;
}

// Filter and display archived tasks
async function filterArchivedTasks() {
    const startDate = document.getElementById('startDate').value;
    const endDate = document.getElementById('endDate').value;
    const tasksList = document.getElementById('archivedTasksList');
    
    if (!startDate || !endDate) {
        showNotification('الرجاء تحديد نطاق التاريخ', 'warning');
        return;
    }

    try {
        // Add one day to endDate to include the entire day
        const endDateObj = new Date(endDate);
        endDateObj.setDate(endDateObj.getDate() + 1);
        const adjustedEndDate = endDateObj.toISOString().split('T')[0];

        console.log('Fetching tasks with date range:', {
            startDate: startDate + 'T00:00:00.000Z',
            endDate: adjustedEndDate + 'T00:00:00.000Z'
        });

        const response = await fetch(`http://localhost:3000/api/tasks/completed?startDate=${startDate + 'T00:00:00.000Z'}&endDate=${adjustedEndDate + 'T00:00:00.000Z'}`);
        
        if (!response.ok) {
            throw new Error('Failed to fetch archived tasks');
        }

        const archivedTasks = await response.json();
        console.log('Received archived tasks:', archivedTasks);
        
        if (archivedTasks.length === 0) {
            tasksList.innerHTML = '<p class="no-tasks">لا توجد مهام محفوظة في هذا النطاق الزمني</p>';
            return;
        }

        // Group tasks by date
        const groupedTasks = groupTasksByDate(archivedTasks.map(task => ({
            ...task,
            createdAt: task.created_at // Map the database field name to match our frontend
        })));
        
        // Render grouped tasks
        let html = '';
        groupedTasks.forEach(group => {
            html += `
                <div class="archived-date-group">
                    <h3 class="date-header">${group.formattedDate}</h3>
                    <div class="archived-tasks">
                        ${group.tasks.map(task => `
                            <div class="archived-task" data-task-id="${task.id}">
                                <div class="task-content">
                                    <span class="task-text">${task.text}</span>
                                    ${task.notes ? `<p class="task-notes">${task.notes}</p>` : ''}
                                </div>
                                <div class="task-meta">
                                    <span class="completed-at">تم الحفظ: ${formatDate(task.completed_at)}</span>
                                    <button class="delete-archived-task" onclick="deleteArchivedTask(${task.id})">
                                        <i class="fas fa-trash-alt"></i> حذف
                                    </button>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        });
        
        tasksList.innerHTML = html;
    } catch (error) {
        console.error('Error fetching archived tasks:', error);
        showNotification('حدث خطأ أثناء جلب المهام المحفوظة', 'error');
    }
}

// Delete archived task
async function deleteArchivedTask(taskId) {
    try {
        const response = await fetch(`http://localhost:3000/api/tasks/completed/${taskId}`, {
            method: 'DELETE'
        });

        if (!response.ok) {
            throw new Error('Failed to delete task');
        }

        // Remove task from UI
        const taskElement = document.querySelector(`.archived-task[data-task-id="${taskId}"]`);
        if (taskElement) {
            taskElement.style.animation = 'fadeOut 0.3s ease';
            setTimeout(() => {
                taskElement.remove();
                // Check if there are no more tasks in the group
                const group = taskElement.closest('.archived-date-group');
                if (group && !group.querySelector('.archived-task')) {
                    group.remove();
                }
                // Check if there are no more tasks at all
                const tasksList = document.getElementById('archivedTasksList');
                if (!tasksList.querySelector('.archived-task')) {
                    tasksList.innerHTML = '<p class="no-tasks">لا توجد مهام محفوظة في هذا النطاق الزمني</p>';
                }
            }, 300);
        }

        showNotification('تم حذف المهمة بنجاح', 'success');
    } catch (error) {
        console.error('Error deleting archived task:', error);
        showNotification('حدث خطأ أثناء حذف المهمة', 'error');
    }
}

// Save completed tasks to database
async function saveCompletedTasks() {
    const completedTasks = tasks.filter(task => task.completed);
    
    if (completedTasks.length === 0) {
        showNotification('لا توجد مهام مكتملة للحفظ', 'warning');
        return;
    }

    try {
        console.log('Saving completed tasks:', completedTasks);

        const response = await fetch('http://localhost:3000/api/tasks/completed', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ tasks: completedTasks })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to save completed tasks');
        }

        // Remove completed tasks from current list
        const previousLength = tasks.length;
        tasks = tasks.filter(task => !task.completed);
        const removedCount = previousLength - tasks.length;
        
        saveTasks();
        renderTasks();
        showNotification(`تم حفظ ${removedCount} ${removedCount === 1 ? 'مهمة' : 'مهام'} بنجاح`, 'success');
        updateDailyTasksNotification();
    } catch (error) {
        console.error('Error saving completed tasks:', error);
        showNotification('حدث خطأ أثناء حفظ المهام المكتملة', 'error');
    }
}

// Show archived tasks modal
function showArchivedTasks() {
    const modal = document.getElementById('archivedTasksModal');
    const startDate = document.getElementById('startDate');
    const endDate = document.getElementById('endDate');
    
    // Set default date range (last 30 days)
    const today = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(today.getDate() - 30);
    
    startDate.value = thirtyDaysAgo.toISOString().split('T')[0];
    endDate.value = today.toISOString().split('T')[0];
    
    modal.style.display = 'block';
    setTimeout(() => {
        modal.classList.add('show');
    }, 10);
    
    filterArchivedTasks();
    
    // Close modal when clicking on X or outside
    const closeBtn = modal.querySelector('.close');
    closeBtn.onclick = () => {
        modal.classList.remove('show');
        setTimeout(() => {
            modal.style.display = 'none';
        }, 300);
    };
    window.onclick = (event) => {
        if (event.target === modal) {
            modal.classList.remove('show');
            setTimeout(() => {
                modal.style.display = 'none';
            }, 300);
        }
    };
}