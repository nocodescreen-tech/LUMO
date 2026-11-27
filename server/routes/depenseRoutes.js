const router=require('express').Router();
const {protect,authorize}=require('../middleware/authMiddleware');
const controller=require('../controllers/depenseController');
router.use(protect,authorize('admin','superadmin'));
router.get('/',controller.list);router.post('/',controller.create);router.post('/:id/reverse',controller.reverse);
module.exports=router;
