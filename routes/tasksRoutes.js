
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const tasks = require('../controllers/tasksController');

router.get('/user', auth, tasks.list);
router.get("/", tasks.getAllTasks);
router.post("/", tasks.createTask);
router.put("/:id", tasks.updateTask);
router.put("/:id/toggle", tasks.toggleActive);
router.delete("/:id", tasks.deleteTask);
router.post('/complete/:taskId', auth, tasks.completeTask);

module.exports = router;
