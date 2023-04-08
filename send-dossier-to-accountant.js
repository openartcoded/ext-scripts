class Script {
  get id() {
    return "db4ba05f-d56a-43fb-a860-013c98d1c834";
  }
  get name() {
    return 'Send Dossier to accountant';
  }
  get description() {
    return `A script to send closed dossier to accountant`;
  }
  get enabled() {
    return true;
  }
  get consumeEvent() {
    return true;
  }
  process(payload) {
    const List = Java.type('java.util.List');
    const ArrayList = Java.type('java.util.ArrayList');
    const SCRIPT_NOTIFY = "SCRIPT_NOTIFY";
    let event = JSON.parse(payload);
    if (event.eventName === 'DossierClosed') {
      logger.info("receiving dossier closed event");
      const personalInfo = personalInfoService.get();
      const accountantsEmail = personalInfo.getAccountants().stream()
        .map(a => a.getEmail())
        .filter(a => a.length > 0).toList();
      const personalEmail = personalInfo.getOrganizationEmailAddress();
      if (!accountantsEmail.isEmpty()) {
        logger.info("Send email to accountant");
        let subject = event.name + ": Factures";
        let body = "Bonjour,<br>" +
          "Vous trouverez ci-joint les factures pour le trimestre.<br>" +
          "En cas d'erreur, n'hésitez pas à m'en faire part.<br>" +
          "Bien à vous,<br>" +
          "Nordine Bittich";
        let dossierZip = fileService.findOneById(event.uploadId);
        if (dossierZip.isPresent()) {
          dossierZip = dossierZip.get();
          const dossierPart = fileService.toMockMultipartFile(dossierZip);
          const attachments = List.of(dossierPart);
          const tos = new ArrayList();

          for (const accountant of accountantsEmail) {
            tos.add(accountant);
          }
          if (personalEmail) {
            tos.add(personalEmail);
          }

          mailService.sendMail(tos, subject, body, false, attachments);
          notificationService.sendEvent("Dossier sent to accountant", SCRIPT_NOTIFY, this.id);
        }

      }
    }
    return "OK";
  }
}
