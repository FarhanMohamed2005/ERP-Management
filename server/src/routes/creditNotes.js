const router = require('express').Router();
const {
  getCreditNotes,
  getCreditNote,
  createCreditNote,
  updateCreditNote,
  deleteCreditNote,
} = require('../controllers/creditNoteController');
const auth = require('../middleware/auth');
const authorize = require('../middleware/authorize');

router.use(auth);

router
  .route('/')
  .get(authorize('Admin', 'Sales'), getCreditNotes)
  .post(authorize('Admin', 'Sales'), createCreditNote);

router
  .route('/:id')
  .get(getCreditNote)
  .put(authorize('Admin', 'Sales'), updateCreditNote)
  .delete(authorize('Admin'), deleteCreditNote);

module.exports = router;
