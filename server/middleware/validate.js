const validate = (schema, source = "body") => (req, res, next) => {
  const result = schema.safeParse(req[source]);

  if (!result.success) {
    const errors = result.error.issues.map((issue) => ({
      field: issue.path.join(".") || source,
      message: issue.message,
    }));

    return res.status(422).json({
      message: "Validation failed",
      errors,
      fieldErrors: errors.reduce((fields, error) => {
        if (!fields[error.field]) fields[error.field] = error.message;
        return fields;
      }, {}),
    });
  }

  req.validated = req.validated || {};
  req.validated[source] = result.data;
  if (source === "body") req.body = result.data;
  next();
};

module.exports = validate;
