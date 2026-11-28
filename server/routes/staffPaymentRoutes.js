const router=require('express').Router();
const {protect,authorize}=require('../middleware/authMiddleware');
const {createPayment,getStaffPayments,deletePayment}=require('../controllers/staffPaymentController');
router.use(protect,authorize('admin','superadmin'));
router.post('/',createPayment);router.get('/',getStaffPayments);router.delete('/:id',deletePayment);
module.exports=router;
