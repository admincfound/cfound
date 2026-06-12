const html = template
  .replace('{{title}}', job.title)
  .replace('{{company}}', job.companyName)
  .replace('{{location}}', job.city)
  .replace('{{description}}', job.description)