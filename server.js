const express = require('express');
const path = require('path');
const { saveCompletedTasks, getCompletedTasks, deleteCompletedTask, deleteCompletedTasks } = require('./db');

const app = express();
const port = 3000;

app.use(express.json());
app.use(express.static(__dirname));

// Save completed tasks
app.post('/api/tasks/completed', async (req, res) => {
    try {
        const tasks = req.body.tasks;
        console.log('Received tasks to save:', tasks);
        
        if (!tasks || !Array.isArray(tasks)) {
            return res.status(400).json({ error: 'Invalid tasks data' });
        }

        await saveCompletedTasks(tasks);
        res.json({ success: true, message: `Successfully saved ${tasks.length} tasks` });
    } catch (error) {
        console.error('Error saving completed tasks:', error);
        res.status(500).json({ error: 'Failed to save completed tasks' });
    }
});

// Get completed tasks by date range
app.get('/api/tasks/completed', async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        console.log('Received date range:', { startDate, endDate });

        if (!startDate || !endDate) {
            return res.status(400).json({ error: 'Start date and end date are required' });
        }

        const tasks = await getCompletedTasks(startDate, endDate);
        console.log('Retrieved tasks:', tasks);
        res.json(tasks);
    } catch (error) {
        console.error('Error getting completed tasks:', error);
        res.status(500).json({ error: 'Failed to get completed tasks' });
    }
});

// Delete a single completed task
app.delete('/api/tasks/completed/:taskId', async (req, res) => {
    try {
        const taskId = req.params.taskId;
        console.log('Deleting task:', taskId);
        
        await deleteCompletedTask(taskId);
        res.json({ success: true, message: 'Task deleted successfully' });
    } catch (error) {
        console.error('Error deleting completed task:', error);
        res.status(500).json({ error: 'Failed to delete completed task' });
    }
});

// Delete multiple completed tasks
app.delete('/api/tasks/completed', async (req, res) => {
    try {
        const { taskIds } = req.body;
        if (!taskIds || !Array.isArray(taskIds)) {
            return res.status(400).json({ error: 'Invalid task IDs' });
        }
        
        console.log('Deleting tasks:', taskIds);
        await deleteCompletedTasks(taskIds);
        res.json({ success: true, message: `Successfully deleted ${taskIds.length} tasks` });
    } catch (error) {
        console.error('Error deleting completed tasks:', error);
        res.status(500).json({ error: 'Failed to delete completed tasks' });
    }
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
}); 