
const SCRIPT_NOTIFY = "SCRIPT_NOTIFY";

const List = Java.type('java.util.List');

class Script {
  get id() {
    return "0972510b-70de-4e91-b3d0-b696375474f0";
  }
  get name() {
    return 'Set Tag';
  }
  get description() {
    return `Set Tag automatically if subject starts with the label between brackets.e.g [INTERNET] facture internet`;
  }
  get enabled() {
    return true;
  }
  get consumeEvent() {
    return true;
  }
  process(payload) {
    let event = JSON.parse(payload);
    if (event.eventName === 'ExpenseReceived') {
      logger.info("receiving expense received  with name {}", event.name);
      let expense = feeService.findById(event.expenseId);
      if (expense.isPresent()) {
        expense = expense.get();
        if (expense.getTag()) {
          logger.info("tag already set somehow. do nothing");
          return "OK";
        }
        const labels = labelService.findAll();
        const match = expense.getSubject().match(/\[(.*?)\]/);
        if (match?.length >= 2) {
          const tag = match[1].toUpperCase();
          if (tag?.length) {
            for (const label of labels) {
              if (label.getName().toUpperCase() === tag) {
                logger.info(`set tag ${tag} for expense ${expense.getSubject()}`);
                feeService.updateTag(label.getName(), List.of(expense.getId()));
                return "OK";
              }
            }

          }
        }


      }
    }
    return "OK";
  }
}
