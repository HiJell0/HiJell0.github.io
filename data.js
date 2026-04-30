// Lincoln Law Client Portal — Data Layer
// Production: replace this file with:
//   <script>
//     fetch('/api/portal/me')
//       .then(r => r.json())
//       .then(data => { window.PORTAL_DATA = data; });
//   </script>

/*
 * PORTAL_DATA schema — see API.md for full documentation.
 *
 * Required keys:
 *   client             { id?, firstName, fullName, photoUrl? }
 *   caseStage          string — "Intake"|"Filing"|"Protected"|"Discharge"|"Fresh Start"
 *   retainerAgreement  { status: "pending_signature"|"signed", signedDate?: ISO }
 *   tasks              { id, title, status, type, link?, dueDate?, urgent? }[]
 *   documents          { id, name, status: "unsubmitted"|"needs_resubmission"|"completed",
 *                        instructionsUrl?, note? }[]
 *   billing            { balance, remaining, paid, totalFees, nextPaymentDue,
 *                        nextPaymentAmount, paymentMethod, dateChangesUsed,
 *                        dateChangesAllowed, bounceFee, installments[] }
 *   plaidAccounts      { id, institution, accountName, type, status, lastSync }[]
 *   messageThreads     { id, subject, status, messages[] }[]
 *
 * Optional keys (omit if not applicable):
 *   caseNumber, filingDate, meetingDate, meetingLocation, dischargeDate
 */

(function () {
  const raw = localStorage.getItem('ll_sandbox_payload');
  if (raw) {
    try {
      window.PORTAL_DATA = JSON.parse(raw);
    } catch (e) {
      window.PORTAL_DATA = null;
      window.PORTAL_DATA_MISSING = true;
    }
  } else {
    window.PORTAL_DATA = null;
    window.PORTAL_DATA_MISSING = true;
  }

  window.loadPortalData = function (obj) {
    localStorage.setItem('ll_sandbox_payload', JSON.stringify(obj));
    location.reload();
  };

  window.clearPortalData = function () {
    localStorage.removeItem('ll_sandbox_payload');
    location.reload();
  };
})();
