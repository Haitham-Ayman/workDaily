const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Create database connection
const db = new sqlite3.Database(path.join(__dirname, 'tasks.db'), (err) => {
    if (err) {
        console.error('Error connecting to database:', err);
    } else {
        console.log('Connected to SQLite database');
        // Create completed tasks table
        db.run(`CREATE TABLE IF NOT EXISTS completed_tasks (
            id INTEGER PRIMARY KEY,
            text TEXT NOT NULL,
            notes TEXT,
            completed_at TEXT NOT NULL,
            created_at TEXT NOT NULL
        )`);
    }
});

// Function to save completed tasks
function saveCompletedTasks(tasks) {
    return new Promise((resolve, reject) => {
        const stmt = db.prepare(`INSERT INTO completed_tasks (id, text, notes, completed_at, created_at) 
                               VALUES (?, ?, ?, ?, ?)`);
        
        db.serialize(() => {
            db.run('BEGIN TRANSACTION');
            
            tasks.forEach(task => {
                stmt.run([
                    task.id,
                    task.text,
                    task.notes || '',
                    new Date().toISOString(),
                    task.createdAt
                ]);
            });
            
            stmt.finalize();
            
            db.run('COMMIT', (err) => {
                if (err) reject(err);
                else resolve();
            });
        });
    });
}

// Function to get completed tasks by date range
function getCompletedTasks(startDate, endDate) {
    return new Promise((resolve, reject) => {
        const query = `
            SELECT * FROM completed_tasks 
            WHERE completed_at BETWEEN ? AND ?
            ORDER BY completed_at DESC
        `;
        
        db.all(query, [startDate, endDate], (err, rows) => {
            if (err) reject(err);
            else resolve(rows);
        });
    });
}

// Function to delete a completed task by ID
function deleteCompletedTask(taskId) {
    return new Promise((resolve, reject) => {
        const query = 'DELETE FROM completed_tasks WHERE id = ?';
        
        db.run(query, [taskId], (err) => {
            if (err) reject(err);
            else resolve();
        });
    });
}

// Function to delete multiple completed tasks
function deleteCompletedTasks(taskIds) {
    return new Promise((resolve, reject) => {
        const placeholders = taskIds.map(() => '?').join(',');
        const query = `DELETE FROM completed_tasks WHERE id IN (${placeholders})`;
        
        db.run(query, taskIds, (err) => {
            if (err) reject(err);
            else resolve();
        });
    });
}

module.exports = {
    saveCompletedTasks,
    getCompletedTasks,
    deleteCompletedTask,
    deleteCompletedTasks
}; 