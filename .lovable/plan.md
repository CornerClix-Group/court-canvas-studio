
# Plan: Fix Estimate Email + Add CC to estimates@courtproaugusta.com

## Issue Analysis

### Problem 1: Email Failed to Send
The logs show a transient TLS connection error:
```
TypeError: error sending request... connection error: peer closed connection without sending TLS close_notify
```

This occurred when `send-estimate-email` called `generate-estimate-pdf`, which then tried to query the database. This is a **temporary network/infrastructure issue**, not a code bug. These TLS errors happen occasionally in edge function environments.

**Solution**: Retry sending the estimate - it should work on subsequent attempts.

### Problem 2: Missing CC to estimates@courtproaugusta.com
Currently, the estimate email only goes to the customer (line 674-680):

```typescript
const emailResponse = await resend.emails.send({
  from: "CourtPro Augusta <estimates@courtproaugusta.com>",
  to: [customerEmail],  // Only customer
  subject: `Your Estimate ${estimate.estimate_number} from CourtPro Augusta`,
  html: emailHTML,
  attachments: emailAttachments,
});
```

**Solution**: Add `cc: ["estimates@courtproaugusta.com"]` to get a copy of every estimate email sent.

---

## Changes to Make

### File: `supabase/functions/send-estimate-email/index.ts`

**Lines 674-680 - Add CC recipient:**

```typescript
// Current code:
const emailResponse = await resend.emails.send({
  from: "CourtPro Augusta <estimates@courtproaugusta.com>",
  to: [customerEmail],
  subject: `Your Estimate ${estimate.estimate_number} from CourtPro Augusta`,
  html: emailHTML,
  attachments: emailAttachments,
});

// Updated code:
const emailResponse = await resend.emails.send({
  from: "CourtPro Augusta <estimates@courtproaugusta.com>",
  to: [customerEmail],
  cc: ["estimates@courtproaugusta.com"],  // Add CC for internal copy
  subject: `Your Estimate ${estimate.estimate_number} from CourtPro Augusta`,
  html: emailHTML,
  attachments: emailAttachments,
});
```

---

## Summary

| Change | Description |
|--------|-------------|
| Add CC | Include `estimates@courtproaugusta.com` as CC on all estimate emails |
| Retry | The TLS error was temporary - retry sending should work |

## Consistency with Existing Patterns

This matches the existing pattern used in `send-invoice-email` which uses:
```typescript
cc: ["billing@courtproaugusta.com"]
```

---

## Expected Result

1. Every estimate email will be sent to the customer AND CC'd to `estimates@courtproaugusta.com`
2. Internal team will have a copy of all sent estimates for records
3. The immediate failure was a transient network issue - retrying should succeed
