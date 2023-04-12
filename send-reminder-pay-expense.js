const SCRIPT_NOTIFY = "SCRIPT_NOTIFY";

const List = Java.type('java.util.List');
const ArrayList = Java.type('java.util.ArrayList');

class Script {
  get id() {
    return "33fb12f0-800e-400d-b83f-5f6cf6c15c22";
  }
  get name() {
    return 'Send reminder expense not paid';
  }
  get description() {
    return `Send a reminder for expenses not paid (email)`;
  }
  get enabled() {
    return true;
  }
  get consumeEvent() {
    return true;
  }
  process(payload) {
    let event = JSON.parse(payload);
    if (event.eventName === 'ExpenseNotPaid') {
      logger.info("receiving expense not paid  event");
      const personalInfo = personalInfoService.get();
      const personalEmail = personalInfo.getOrganizationEmailAddress();
      if (personalEmail) {
        logger.info("Send email with reminder");
        let subject = "Reminder: expense(s) not paid";
        const expenses = feeService.findAll(event.expenseIds);

        if (!expenses.isEmpty()) {
          let body = "Hello,<br><br>The following expenses are not set to paid:<br>";
          const attachments = new ArrayList();
          body += "<ul>";
          for (const expense of expenses) {
            // todo do we want to force user to login to the app to pay?
            const uploads = fileService.findByCorrelationId(false, expense.getId())
              .stream()
              .map(u => fileService.toMockMultipartFile(u))
              .toList();
            attachments.addAll(uploads);
            body += "<li>" + expense.getSubject() + "</li>";

          }
          body += "</ul>";
          body += "<p> Thanks,</p>";
          const to = List.of(personalEmail);
          mailService.sendMail(to, subject, body, false, attachments);
          notificationService.sendEvent("Reminder pay expense sent", SCRIPT_NOTIFY, this.id);
        }

      }
    }
    return "OK";
  }
}