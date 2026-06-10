const router = require("express").Router();
const validate = require("../middleware/validate");
const { placesAutocompleteSchema, placeDetailsSchema } = require("../validation/schemas");
const { autocomplete, details } = require("../controllers/placeController");

router.get("/autocomplete", validate(placesAutocompleteSchema, "query"), autocomplete);
router.get("/details", validate(placeDetailsSchema, "query"), details);

module.exports = router;
