const z = require("zod");
const LeadStatusSchema = z.enum(["NEW","CONTACTED","REPLIED","QUALIFIED","HOT","QUOTE_SENT","NEGOTIATING","WON","LOST","FOLLOW_UP"]);
const r = LeadStatusSchema.safeParse("INVALID");
if (!r.success) {
  const issues = JSON.stringify(r.error.issues.map(i=>({code:i.code, path:i.path, message:i.message})));
  console.log("TR32_OK issues=", issues);
} else { console.log("TR32_FAIL_NO_ISSUES"); process.exit(1); }
